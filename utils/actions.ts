"use server";

import db, { withDbRetry } from "@/utils/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { hash } from "bcryptjs";
import {
  cartItemAmountSchema,
  deleteProductInputSchema,
  deleteReviewInputSchema,
  entityIdSchema,
  favoriteInputSchema,
  paginationSchema,
  productListInputSchema,
  imageSchema,
  productSchema,
  registerSchema,
  reviewSchema,
  shippingSchema,
  validateWithZodSchema,
  ValidationError,
} from "./schemas";
import { DEFAULT_SHIPPING_FEE, DEFAULT_TAX_RATE } from "./config";
import { deleteImage, uploadImage } from "./blob";
import { revalidatePath } from "next/cache";
import { Cart } from "@prisma/client";
import type { ActionState } from "./types";
import { calculateMoneyTotals } from "./money";
import { isAdminRole } from "./authorization";

/**
 * Get authenticated user from NextAuth session
 * Redirects to home if not authenticated
 */
const getAuthUser = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  return session.user as typeof session.user & { id: string };
};

/**
 * Get authenticated admin user
 * Redirects if user is not an admin, checking DB for role truth
 */
const getAdminUser = async () => {
  const user = await getAuthUser();
  const dbUser = await withDbRetry(() =>
    db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
  );
  if (!dbUser || !isAdminRole(dbUser.role)) {
    redirect("/");
  }
  return user;
};

export const requireAdminUser = async () => getAdminUser();

/**
 * Handle and log errors safely without leaking internal DB stack traces
 */
const renderError = (error: unknown): { message: string } => {
  console.error("Action error:", error);
  if (error instanceof ValidationError) return { message: error.message };
  return { message: "An unexpected error occurred. Please try again." };
};

const sanitizeImageFilename = (file: File): string => {
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const base = file.name.replace(/\\/g, "/").split("/").pop() || "image";
  const slug = base.replace(/\.[^.]+$/, "").toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "image";
  return `${slug}.${extension}`;
};

// ============================================================================
// Auth Actions
// ============================================================================

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Create a new user account with email + password.
 * Always created with role "USER".
 */
export const registerUserAction = async (
  input: RegisterInput,
): Promise<{ message: string }> => {
  try {
    const validated = validateWithZodSchema(registerSchema, input);
    const emailNormalized = validated.email.trim().toLowerCase();

    const existing = await withDbRetry(() =>
      db.user.findUnique({
        where: { email: emailNormalized },
        select: { id: true },
      }),
    );
    if (existing) {
      return { message: "An account with this email already exists." };
    }

    const hashedPassword = await hash(validated.password, 10);

    await withDbRetry(() =>
      db.user.create({
        data: {
          name: validated.name,
          email: emailNormalized,
          password: hashedPassword,
          role: "USER",
          emailVerified: null,
        },
      }),
    );

    return { message: "success" };
  } catch (error) {
    const prismaError =
      typeof error === "object" && error !== null
        ? (error as { code?: unknown; errorCode?: unknown })
        : undefined;
    const prismaCode = prismaError?.code ?? prismaError?.errorCode;

    if (prismaCode === "P2002") {
      return { message: "An account with this email already exists." };
    }

    if (prismaCode === "P2021" || prismaCode === "P2022") {
      console.error("Sign-up failed because the database schema is out of date.", error);
      return {
        message: "Sign-up is not ready yet. Apply the latest database migrations and try again.",
      };
    }

    if (
      typeof prismaCode === "string" &&
      ["P1000", "P1001", "P1002", "P1003", "P1017"].includes(prismaCode)
    ) {
      console.error("Sign-up could not connect to the database.", error);
      return {
        message: "Sign-up is temporarily unavailable. Check the database connection and try again.",
      };
    }

    return renderError(error);
  }
};

// ============================================================================
// Product Actions
// ============================================================================

export const fetchFeaturedProducts = async () => {
  const products = await withDbRetry(() =>
    db.product.findMany({
      where: {
        featured: true,
      },
    }),
  );
  return products;
};

export const fetchAllProducts = async (input: {
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { search: safeSearch, page, pageSize } = validateWithZodSchema(productListInputSchema, input);
  const pageNum = page ?? 1;
  const safePageSize = pageSize ?? 12;
  const skip = (pageNum - 1) * safePageSize;
  const where = safeSearch
    ? {
        OR: [
          { name: { contains: safeSearch, mode: "insensitive" as const } },
          { company: { contains: safeSearch, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    withDbRetry(() =>
      db.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
      })
    ),
    withDbRetry(() => db.product.count({ where })),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  return { products, total, totalPages, page: pageNum };
};

export const fetchSingleProduct = async (productId: string) => {
  const validProductId = validateWithZodSchema(entityIdSchema, productId);
  const product = await withDbRetry(() =>
    db.product.findUnique({
      where: {
        id: validProductId,
      },
    }),
  );
  if (!product) {
    notFound();
  }
  return product;
};

export const createProductAction = async (
  prevState: ActionState,
  formData: FormData,
): Promise<{ message: string }> => {
  const user = await getAdminUser();
  try {
    const rawData = Object.fromEntries(formData);
    const file = formData.get("image") as File;
    const validatedFields = validateWithZodSchema(productSchema, rawData);
    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
    validatedFile.image = new File([validatedFile.image], sanitizeImageFilename(validatedFile.image), { type: validatedFile.image.type });
    const fullPath = await uploadImage(validatedFile.image);

    await db.product.create({
      data: {
        ...validatedFields,
        image: fullPath,
        userId: user.id,
      },
    });
  } catch (error) {
    return renderError(error);
  }
  redirect("/admin/products");
};

export const fetchAdminProducts = async (page = 1) => {
  await getAdminUser();
  const pageNum = validateWithZodSchema(paginationSchema, { page }).page ?? 1;
  const [products, total] = await Promise.all([
    withDbRetry(() => db.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: (pageNum - 1) * 12,
      take: 12,
    })),
    withDbRetry(() => db.product.count()),
  ]);
  return { products, total, totalPages: Math.max(1, Math.ceil(total / 12)), page: pageNum };
};

export const deleteProductAction = async (prevState: { productId: string }) => {
  const { productId } = validateWithZodSchema(deleteProductInputSchema, prevState);
  await getAdminUser();
  try {
    const product = await withDbRetry(() => db.product.findUnique({
      where: { id: productId },
    }));
    if (!product) return { message: "Product not found" };

    await db.product.delete({
      where: { id: productId },
    });
    await deleteImage(product.image);
    revalidatePath("/admin/products");
    return { message: "product removed" };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchAdminProductDetails = async (productId: string) => {
  await getAdminUser();
  const validProductId = validateWithZodSchema(entityIdSchema, productId);
  const product = await withDbRetry(() => db.product.findUnique({
    where: {
      id: validProductId,
    },
  }));
  if (!product) redirect("/admin/products");
  return product;
};

export const updateProductAction = async (
  prevState: ActionState,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const productId = formData.get("id") as string;
    validateWithZodSchema(entityIdSchema, productId);
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(productSchema, rawData);

    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        ...validatedFields,
      },
    });
    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: "Product updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};

export const updateProductImageAction = async (
  prevState: ActionState,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const image = formData.get("image") as File;
    const productId = formData.get("id") as string;
    validateWithZodSchema(entityIdSchema, productId);

    const product = await withDbRetry(() => db.product.findUnique({
      where: { id: productId },
    }));
    if (!product) return { message: "Product not found" };

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    const safeFile = new File([validatedFile.image], sanitizeImageFilename(validatedFile.image), { type: validatedFile.image.type });
    const fullPath = await uploadImage(safeFile);

    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        image: fullPath,
      },
    });

    await deleteImage(product.image);

    revalidatePath(`/admin/products/${productId}/edit`);
    return { message: "Product Image updated successfully" };
  } catch (error) {
    return renderError(error);
  }
};

// ============================================================================
// Favorites Actions
// ============================================================================

export const fetchFavoriteId = async ({ productId }: { productId: string }) => {
  validateWithZodSchema(entityIdSchema, productId);
  const session = await auth();
  if (!session?.user?.id) return null;

  const favorite = await withDbRetry(() => db.favorite.findFirst({
    where: {
      productId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  }));
  return favorite?.id || null;
};

export const toggleFavoriteAction = async (prevState: {
  productId: string;
  favoriteId: string | null;
}) => {
  const user = await getAuthUser();
  const { productId, favoriteId } = validateWithZodSchema(favoriteInputSchema, prevState);

  try {
    if (favoriteId) {
      await db.favorite.deleteMany({
        where: {
          id: favoriteId,
          userId: user.id,
        },
      });
    } else {
      await db.favorite.create({
        data: {
          productId,
          userId: user.id,
        },
      });
    }
    revalidatePath("/favorites");
    revalidatePath(`/products/${productId}`);
    return { message: favoriteId ? "removed from faves" : "added to faves" };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchUserFavorites = async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  const favorites = await withDbRetry(() => db.favorite.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      product: true,
    },
  }));
  return favorites;
};

export const fetchFavoritesCount = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) return 0;

    const count = await withDbRetry(() => db.favorite.count({
      where: {
        userId: session.user.id,
      },
    }));
    return count;
  } catch {
    return 0;
  }
};

// ============================================================================
// Reviews Actions
// ============================================================================

export const createReviewAction = async (
  prevState: ActionState,
  formData: FormData,
) => {
  const user = await getAuthUser();
  try {
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(reviewSchema, rawData);

    await db.review.create({
      data: {
        ...validatedFields,
        userId: user.id,
        authorName: user.name || "User",
        authorImageUrl: user.image || "",
      },
    });
    revalidatePath(`/products/${validatedFields.productId}`);
    return { message: "review submitted successfully" };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { message: "You have already reviewed this product" };
    }
    return renderError(error);
  }
};

export const fetchProductReviews = async (productId: string) => {
  validateWithZodSchema(entityIdSchema, productId);
  const reviews = await withDbRetry(() => db.review.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
  }));
  return reviews;
};

export const fetchProductRating = async (productId: string) => {
  validateWithZodSchema(entityIdSchema, productId);
  const result = await withDbRetry(() => db.review.groupBy({
    by: ["productId"],
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
    where: { productId },
  }));
  return {
    rating: Number(result[0]?._avg.rating?.toFixed(1) ?? 0),
    count: result[0]?._count.rating ?? 0,
  };
};

export const findExistingReview = async (productId: string) => {
  const validProductId = validateWithZodSchema(entityIdSchema, productId);
  const session = await auth();
  if (!session?.user?.id) return null;
  return withDbRetry(() => db.review.findFirst({
    where: { userId: session.user.id, productId: validProductId },
    select: { id: true },
  }));
};

export const fetchProductReviewsByUser = async (page = 1) => {
  const user = await getAuthUser();
  const pageNum = validateWithZodSchema(paginationSchema, { page }).page ?? 1;
  const [reviews, total] = await Promise.all([
    withDbRetry(() => db.review.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      product: {
        select: {
          image: true,
          name: true,
        },
      },
    },
      skip: (pageNum - 1) * 12,
      take: 12,
    })),
    withDbRetry(() => db.review.count({ where: { userId: user.id } })),
  ]);
  return { reviews, total, totalPages: Math.max(1, Math.ceil(total / 12)), page: pageNum };
};

export const deleteReviewAction = async (prevState: { reviewId: string }) => {
  const { reviewId } = validateWithZodSchema(deleteReviewInputSchema, prevState);
  const user = await getAuthUser();
  try {
    await db.review.delete({
      where: {
        id: reviewId,
        userId: user.id,
      },
    });
    revalidatePath("/reviews");
    return { message: "review deleted successfully" };
  } catch (error) {
    return renderError(error);
  }
};

// ============================================================================
// Cart Actions
// ============================================================================

export const fetchCartItems = async () => {
  try {
    const session = await auth();
    // إرجاع 0 فوراً في حال عدم وجود جلسة لتجنب الاستعلام الباطل
    if (!session?.user?.id) return 0;

    const cart = await withDbRetry(() => db.cart.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        numItemsInCart: true,
      },
    }));
    return cart?.numItemsInCart || 0;
  } catch {
    return 0;
  }
};

const fetchProduct = async (productId: string) => {
  const product = await withDbRetry(() => db.product.findUnique({
    where: {
      id: productId,
    },
  }));
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
};

const includeProductClause = {
  cartItems: {
    include: {
      product: true,
    },
  },
};

export const fetchUserCart = async () => {
  const user = await getAuthUser();
  const cart = await withDbRetry(() => db.cart.findUnique({
    where: { userId: user.id },
    include: includeProductClause,
  }));
  if (!cart) return null;
  const cartTotal = cart.cartItems.reduce((total, item) => total + item.amount * item.product.price, 0);
  const numItemsInCart = cart.cartItems.reduce((total, item) => total + item.amount, 0);
  const totals = calculateMoneyTotals(cartTotal, DEFAULT_TAX_RATE, DEFAULT_SHIPPING_FEE);
  return { currentCart: { ...cart, ...totals, taxRate: DEFAULT_TAX_RATE, numItemsInCart }, cartItems: cart.cartItems };
};

const fetchOrCreateCart = async ({
  userId,
  errorOnFailure = false,
}: {
  userId: string;
  errorOnFailure?: boolean;
}) => {
  let cart = await withDbRetry(() => db.cart.findUnique({
    where: { userId },
    include: includeProductClause,
  }));
  if (!cart && errorOnFailure) {
    throw new Error("Cart not found");
  }
  if (!cart) {
    cart = await db.cart.upsert({
      where: { userId },
      create: {
        userId,
        shipping: DEFAULT_SHIPPING_FEE,
        taxRate: DEFAULT_TAX_RATE,
      },
      update: {},
      include: includeProductClause,
    });
  }
  return cart;
};

const updateOrCreateCartItem = async ({
  productId,
  cartId,
  amount,
}: {
  productId: string;
  cartId: string;
  amount: number;
}) => {
  const existing = await withDbRetry(() => db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  }));
  validateWithZodSchema(cartItemAmountSchema, (existing?.amount ?? 0) + amount);
  await db.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
    update: {
      amount: {
        increment: amount,
      },
    },
    create: {
      cartId,
      productId,
      amount,
    },
  });
};

const updateCart = async (cart: Cart) => {
  const cartItems = await withDbRetry(() => db.cartItem.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  }));
  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    const validatedAmount = validateWithZodSchema(cartItemAmountSchema, item.amount);
    numItemsInCart += validatedAmount;
    cartTotal += validatedAmount * item.product.price;
  }
  const totals = calculateMoneyTotals(cartTotal, DEFAULT_TAX_RATE, DEFAULT_SHIPPING_FEE);

  const currentCart = await db.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      numItemsInCart,
      taxRate: DEFAULT_TAX_RATE,
      ...totals,
    },
    include: includeProductClause,
  });
  return { cartItems, currentCart };
};

export const addToCartAction = async (prevState: ActionState, formData: FormData) => {
  const user = await getAuthUser();
  try {
    const productId = formData.get("productId") as string;
    validateWithZodSchema(entityIdSchema, productId);
    const rawAmount = formData.get("amount");
    const amount = validateWithZodSchema(cartItemAmountSchema, rawAmount);

    await fetchProduct(productId);
    const cart = await fetchOrCreateCart({ userId: user.id });
    await updateOrCreateCartItem({ productId, cartId: cart.id, amount });
    await updateCart(cart);
  } catch (error) {
    return renderError(error);
  }
  redirect("/cart");
};

export const removeCartItemAction = async (
  prevState: ActionState,
  formData: FormData,
) => {
  const user = await getAuthUser();
  try {
    const cartItemId = formData.get("id") as string;
    validateWithZodSchema(entityIdSchema, cartItemId);
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });
    await db.cartItem.delete({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });
    await updateCart(cart);
    revalidatePath("/cart");
    return { message: "Item removed from cart" };
  } catch (error) {
    return renderError(error);
  }
};

export const updateCartItemAction = async ({
  amount,
  cartItemId,
}: {
  amount: number;
  cartItemId: string;
}) => {
  const user = await getAuthUser();
  try {
    const validatedAmount = validateWithZodSchema(cartItemAmountSchema, amount);
    validateWithZodSchema(entityIdSchema, cartItemId);
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });

    await db.cartItem.update({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
      data: {
        amount: validatedAmount,
      },
    });
    await updateCart(cart);
    revalidatePath("/cart");
    return { message: "cart updated" };
  } catch (error) {
    return renderError(error);
  }
};

// ============================================================================
// Order Actions
// ============================================================================

export const createOrderAction = async (prevState: ActionState, formData: FormData) => {
  const user = await getAuthUser();
  let orderId: null | string = null;

  try {
    const rawShippingData = Object.fromEntries(formData);
    const validatedShipping = validateWithZodSchema(shippingSchema, rawShippingData);

    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return { message: "Cart is empty" };
    }

    // Recompute order totals from current product prices on the server
    let numItemsInCart = 0;
    let cartTotal = 0;
    const itemSnapshots = [];

    for (const item of cart.cartItems) {
      const product = await withDbRetry(() => db.product.findUnique({
        where: { id: item.productId },
      }));
      if (!product) continue;

      const safeAmount = validateWithZodSchema(cartItemAmountSchema, item.amount);
      numItemsInCart += safeAmount;
      cartTotal += safeAmount * product.price;

      itemSnapshots.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        amount: safeAmount,
        image: product.image,
      });
    }

    if (itemSnapshots.length === 0 || cartTotal <= 0) {
      return { message: "Cart contains invalid items or total is non-positive" };
    }

    const totals = calculateMoneyTotals(cartTotal, DEFAULT_TAX_RATE, DEFAULT_SHIPPING_FEE);
    if (totals.orderTotal <= 0) return { message: "Order total must be greater than zero" };

    // Clean up stale unpaid orders (older than 24h)
    const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.order.deleteMany({
      where: {
        userId: user.id,
        isPaid: false,
        createdAt: { lt: staleCutoff },
      },
    });

    // Reuse existing unpaid order if present
    const existingOrder = await withDbRetry(() => db.order.findFirst({
      where: {
        userId: user.id,
        isPaid: false,
      },
      orderBy: { createdAt: "desc" },
    }));

    if (existingOrder) {
      await db.orderItem.deleteMany({
        where: { orderId: existingOrder.id },
      });

      const updated = await db.order.update({
        where: { id: existingOrder.id },
        data: {
          products: numItemsInCart,
          orderTotal: totals.orderTotal,
          tax: totals.tax,
          shipping: totals.shipping,
          email: user.email || "",
          shippingName: validatedShipping.shippingName,
          shippingPhone: validatedShipping.shippingPhone,
          shippingAddress: validatedShipping.shippingAddress,
          city: validatedShipping.city,
          orderItems: {
            create: itemSnapshots,
          },
        },
      });
      orderId = updated.id;
    } else {
      const newOrder = await db.order.create({
        data: {
          userId: user.id,
          products: numItemsInCart,
          orderTotal: totals.orderTotal,
          tax: totals.tax,
          shipping: totals.shipping,
          email: user.email || "",
          shippingName: validatedShipping.shippingName,
          shippingPhone: validatedShipping.shippingPhone,
          shippingAddress: validatedShipping.shippingAddress,
          city: validatedShipping.city,
          orderItems: {
            create: itemSnapshots,
          },
        },
      });
      orderId = newOrder.id;
    }
  } catch (error) {
    return renderError(error);
  }

  redirect(`/checkout?orderId=${orderId}`);
};

export const fetchUserOrders = async () => {
  const user = await getAuthUser();
  const orders = await withDbRetry(() => db.order.findMany({
    where: {
      userId: user.id,
      isPaid: true,
    },
    include: {
      orderItems: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  }));
  return orders;
};

export const fetchAdminOrders = async (page = 1) => {
  await getAdminUser();
  const pageNum = validateWithZodSchema(paginationSchema, { page }).page ?? 1;

  const [orders, total, revenue] = await Promise.all([
    withDbRetry(() => db.order.findMany({
    where: {
      isPaid: true,
    },
    include: {
      orderItems: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
      skip: (pageNum - 1) * 12,
      take: 12,
    })),
    withDbRetry(() => db.order.count({ where: { isPaid: true } })),
    withDbRetry(() => db.order.aggregate({ where: { isPaid: true }, _sum: { orderTotal: true } })),
  ]);
  return { orders, total, revenue: revenue._sum.orderTotal ?? 0, totalPages: Math.max(1, Math.ceil(total / 12)), page: pageNum };
};
