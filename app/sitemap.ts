import { MetadataRoute } from "next";
import db from "@/utils/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    process.env.AUTH_URL ||
    "https://shahleenstore.com";

  let products: { id: string; updatedAt: Date }[] = [];
  try {
    products = await db.product.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
    });
  } catch {
    // Fallback if DB unavailable during static generation
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/products",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
