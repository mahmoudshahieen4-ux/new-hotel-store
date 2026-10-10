import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    process.env.AUTH_URL ||
    "https://shahleenstore.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/*", "/cart", "/checkout", "/api/*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
