"use server";

import db, { withDbRetry } from "@/utils/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import {
  imageSchema,
  productSchema,
  registerSchema,
  reviewSchema,
  validateWithZodSchema,
} from "./schemas";
import { deleteImage, uploadImage } from "./supabase";
import { revalidatePath } from "next/cache";
import { Cart } from "@prisma/client";

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
 * Get admin IDs from environment variables
 */
const getAdminIds = (): string[] => {
  const ids = [
    process.env.ADMIN_USER_ID,
    process.env.ADMIN_TEST_USER_ID,
  ].filter(Boolean) as string[];
  return ids;
};

/**
 * Get authenticated admin user
 * Redirects if user is not an admin
 */
const getAdminUser = async () => {
  const user = await getAuthUser();
  const adminIds = getAdminIds();
  // A user is an admin either via the role set on their account
  // (e.g. through "sign up as admin") OR via the legacy env-var whitelist.
  const isAdmin =
    (user as { role?: string }).role === "ADMIN" || adminIds.includes(user.id);
  if (!isAdmin) {
    redirect("/");
  }
  return user;
};

/**
 * Handle and log errors
 */
const renderError = (error: unknown): { message: string } => {
  console.log(error);
  return {
    message: error instanceof Error ? error.message : "an error occurred",
  };
};

// ============================================================================
// Auth Actions
// ============================================================================

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: "USER" | "ADMIN";
};

/**
 * Create a new account (user or admin) with email + password.
 *
 * After this succeeds, the client signs the user in with the credentials
 * provider and redirects them to the appropriate page (/admin for admins).
 * Returns `{ message: "success" }` on success or an error message otherwise.
 */
export const registerUserAction = async (
  input: RegisterInput,
): Promise<{ message: string }> => {
  try {
    const validated = validateWithZodSchema(registerSchema, {
      ...input,
      role: input.role || "USER",
    });

    const existing = await withDbRetry(() =>
      db.user.findUnique({
        where: { email: validated.email },
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
          email: validated.email,
          password: hashedPassword,
          role: validated.role,
          emailVerified: new Date(),
        },
      }),
    );

    return { message: "success" };
  } catch (error) {
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

export const fetchAllProducts = ({
  search = "",
}: {
  search: string;
}) => {
  return withDbRetry(() =>
    db.product.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  );
};

export const fetchSingleProduct = async (productId: string) => {
  const product = await withDbRetry(() =>
    db.product.findUnique({
      where: {
        id: productId,
      },
    }),
  );
  if (!product) {
    redirect("/products");
  }
  return product;
};

export const createProductAction = async (
  prevState: any,
  formData: FormData,
): Promise<{ message: string }> => {
  const user = await getAuthUser();
  try {
    const rawData = Object.fromEntries(formData);
    const file = formData.get("image") as File;
    const validatedFields = validateWithZodSchema(productSchema, rawData);
    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
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

export const fetchAdminProducts = async () => {
  await getAdminUser();
  const products = await withDbRetry(() =>
    db.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  );
  return products;
};

export const deleteProductAction = async (prevState: { productId: string }) => {
  const { productId } = prevState;
  await getAdminUser();
  try {
    const product = await db.product.delete({
      where: {
        id: productId,
      },
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
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product) redirect("/admin/products");
  return product;
};

export const updateProductAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const productId = formData.get("id") as string;
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
  prevState: any,
  formData: FormData,
) => {
  // 1. التحقق من صلاحيات الأدمن
  await getAdminUser();
  try {
    const image = formData.get("image") as File;
    const productId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    const fullPath = await uploadImage(validatedFile.image);

    // 2. تحديث قاعدة البيانات أولاً لضمان عدم فقدان الصورة القديمة إذا فشل الاستعلام
    await db.product.update({
      where: {
        id: productId,
      },
      data: {
        image: fullPath,
      },
    });

    // 3. حذف الصورة القديمة بعد نجاح التحديث
    await deleteImage(oldImageUrl);

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
  // التحقق من الجلسة بدون توجيه إجباري لمنع طرد الزوار غير المسجلين
  const session = await auth();
  if (!session?.user?.id) return null;

  const favorite = await db.favorite.findFirst({
    where: {
      productId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });
  return favorite?.id || null;
};

export const toggleFavoriteAction = async (prevState: {
  productId: string;
  favoriteId: string | null;
  pathname: string;
}) => {
  const user = await getAuthUser();
  const { productId, favoriteId, pathname } = prevState;

  try {
    if (favoriteId) {
      await db.favorite.delete({
        where: {
          id: favoriteId,
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
    revalidatePath(pathname);
    return { message: favoriteId ? "removed from faves" : "added to faves" };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchUserFavorites = async () => {
  // Guest-safe: return an empty list for unauthenticated visitors so the
  // favorites page always opens (showing an empty state) instead of
  // redirecting them away when they click the favorites icon in the nav.
  const session = await auth();
  if (!session?.user?.id) return [];

  const favorites = await db.favorite.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      product: true,
    },
  });
  return favorites;
};

/**
 * Returns the number of saved (favorites) products for the current user.
 * Guest-safe: returns 0 immediately when there is no session, so it can be
 * used in the navbar icon without redirecting unauthenticated visitors.
 */
export const fetchFavoritesCount = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) return 0;

    const count = await db.favorite.count({
      where: {
        userId: session.user.id,
      },
    });
    return count;
  } catch {
    return 0;
  }
};

// ============================================================================
// Reviews Actions
// ============================================================================

export const createReviewAction = async (
  prevState: any,
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
      },
    });
    revalidatePath(`/products/${validatedFields.productId}`);
    return { message: "review submitted successfully" };
  } catch (error) {
    return renderError(error);
  }
};

export const fetchProductReviews = async (productId: string) => {
  const reviews = await db.review.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return reviews;
};

export const fetchProductRating = async (productId: string) => {
  const result = await db.review.groupBy({
    by: ["productId"],
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
    where: { productId },
  });
  return {
    rating: result[0]?._avg.rating?.toFixed(1) ?? 0,
    count: result[0]?._count.rating ?? 0,
  };
};

export const fetchProductReviewsByUser = async () => {
  const user = await getAuthUser();
  const reviews = await db.review.findMany({
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
  });
  return reviews;
};

export const deleteReviewAction = async (prevState: { reviewId: string }) => {
  const { reviewId } = prevState;
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

export const findExistingReview = async (userId: string, productId: string) => {
  return db.review.findFirst({
    where: {
      userId,
      productId,
    },
  });
};

// ============================================================================
// Cart Actions
// ============================================================================

export const fetchCartItems = async () => {
  try {
    const session = await auth();
    // إرجاع 0 فوراً في حال عدم وجود جلسة لتجنب الاستعلام الباطل
    if (!session?.user?.id) return 0;

    const cart = await db.cart.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        numItemsInCart: true,
      },
    });
    return cart?.numItemsInCart || 0;
  } catch {
    return 0;
  }
};

const fetchProduct = async (productId: string) => {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });
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

export const fetchOrCreateCart = async ({
  userId,
  errorOnFailure = false,
}: {
  userId: string;
  errorOnFailure?: boolean;
}) => {
  let cart = await db.cart.findFirst({
    where: {
      userId,
    },
    include: includeProductClause,
  });
  if (!cart && errorOnFailure) {
    throw new Error("Cart not found");
  }
  if (!cart) {
    cart = await db.cart.create({
      data: {
        userId,
      },
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
  let cartItem = await db.cartItem.findFirst({
    where: {
      productId,
      cartId,
    },
  });
  if (cartItem) {
    cartItem = await db.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        amount: cartItem.amount + amount,
      },
    });
  } else {
    cartItem = await db.cartItem.create({
      data: { amount, productId, cartId },
    });
  }
};

export const updateCart = async (cart: Cart) => {
  const cartItems = await db.cartItem.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  let numItemsInCart = 0;
  let cartTotal = 0;

  for (const item of cartItems) {
    numItemsInCart += item.amount;
    cartTotal += item.amount * item.product.price;
  }
  const tax = cart.taxRate * cartTotal;
  const shipping = cartTotal ? cart.shipping : 0;
  const orderTotal = cartTotal + tax + shipping;

  const currentCart = await db.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      numItemsInCart,
      cartTotal,
      tax,
      orderTotal,
    },
    include: includeProductClause,
  });
  return { cartItems, currentCart };
};

export const addToCartAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  try {
    const productId = formData.get("productId") as string;
    const amount = Number(formData.get("amount"));
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
  prevState: any,
  formData: FormData,
) => {
  const user = await getAuthUser();
  try {
    const cartItemId = formData.get("id") as string;
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
        amount,
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

export const createOrderAction = async (prevState: any, formData: FormData) => {
  const user = await getAuthUser();
  let orderId: null | string = null;
  let cartId: null | string = null;

  try {
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    });

    // التحقق من وجود منتجات داخل السلة قبل إنشاء الطلب
    if (!cart || cart.numItemsInCart === 0) {
      return { message: "Cart is empty" };
    }

    cartId = cart.id;

    await db.order.deleteMany({
      where: {
        userId: user.id,
        isPaid: false,
      },
    });

    const order = await db.order.create({
      data: {
        userId: user.id,
        products: cart.numItemsInCart,
        orderTotal: cart.orderTotal,
        tax: cart.tax,
        shipping: cart.shipping,
        email: user.email || "",
      },
    });
    orderId = order.id;
  } catch (error) {
    return renderError(error);
  }
  redirect(`/checkout?orderId=${orderId}&cartId=${cartId}`);
};

export const fetchUserOrders = async () => {
  const user = await getAuthUser();
  const orders = await db.order.findMany({
    where: {
      userId: user.id,
      isPaid: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return orders;
};

export const fetchAdminOrders = async () => {
  await getAdminUser();

  const orders = await db.order.findMany({
    where: {
      isPaid: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return orders;
};
