import { z, ZodSchema } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "name must be at least 2 characters.",
    })
    .max(100, {
      message: "name must be less than 100 characters.",
    }),
  company: z.string(),
  featured: z.coerce.boolean(),
  price: z.coerce.number().int().min(0, {
    message: "price must be a positive number.",
  }),
  description: z.string().refine(
    (description) => {
      const wordCount = description.split(" ").length;
      return wordCount >= 10 && wordCount <= 1000;
    },
    {
      message: "description must be between 10 and 1000 words.",
    }
  ),
});

export const entityIdSchema = z.string().uuid();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export const productListInputSchema = paginationSchema.extend({
  search: z.string().max(200).default(""),
});
export const deleteProductInputSchema = z.object({ productId: entityIdSchema });
export const deleteReviewInputSchema = z.object({ reviewId: entityIdSchema });
export const favoriteInputSchema = z.object({
  productId: entityIdSchema,
  favoriteId: entityIdSchema.nullable(),
});

export const cartItemAmountSchema = z.coerce
  .number()
  .int({ message: "Amount must be an integer" })
  .min(1, { message: "Amount must be at least 1" })
  .max(99, { message: "Amount cannot exceed 99" });

export const imageSchema = z.object({
  image: validateImageFile(),
});

function validateImageFile() {
  const maxUploadSize = 1024 * 1024;
  const acceptedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  return z.custom<File>((file) => {
    if (!file) return false;
    if (typeof window === "undefined") {
      // Server-side check
      if (!(file instanceof File)) return false;
      if (file.size > maxUploadSize) return false;
      if (!acceptedMimeTypes.includes(file.type)) return false;
      return true;
    } else {
      // Client-side check
      if (!(file instanceof File)) return false;
      if (file.size > maxUploadSize) return false;
      return acceptedMimeTypes.includes(file.type);
    }
  }, "File must be a valid image (JPEG, PNG, WebP) and less than 1MB");
}

export function validateWithZodSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((error) => error.message);
    throw new ValidationError(errors.join(","));
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const reviewSchema = z.object({
  productId: entityIdSchema,
  rating: z.coerce
    .number()
    .int()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
  comment: z
    .string()
    .min(10, { message: "Comment must be at least 10 characters long" })
    .max(1000, { message: "Comment must be at most 1000 characters long" }),
});

export const shippingSchema = z.object({
  shippingName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  shippingPhone: z.string().refine(
    (phone) => /^01[0125][0-9]{8}$/.test(phone.trim()),
    { message: "Please enter a valid Egyptian phone number (e.g. 01012345678)" }
  ),
  shippingAddress: z
    .string()
    .min(5, { message: "Address must be at least 5 characters" }),
  city: z
    .string()
    .min(2, { message: "City must be at least 2 characters" }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be at most 50 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password must be at most 100 characters" }),
});
