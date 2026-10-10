import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/Navbar";
import Container from "@/components/global/Container";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://shahleenstore.com"),
  title: {
    default:
      "Shahleen Store | Shop Online in Egypt",
    template: "%s | Shahleen Store",
  },
  description:
    "Shop curated products from Shahleen Store. Secure checkout is powered by Kashier, with delivery across Egypt.",
  keywords: [
    "e-commerce",
    "online store",
    "next.js",
    "typescript",
    "shopping",
    "online shopping",
    "store",
    "products",
    "checkout",
    "Kashier payments",
    "modern e-commerce",
    "react",
    "prisma",
    "neon db",
    "vercel blob",
    "shadcn ui",
    "dark mode",
    "responsive design",
    "admin dashboard",
    "product reviews",
    "favorites",
    "shopping cart",
    "secure payments",
  ],
  authors: [
    {
      name: "Shahleen Store",
    },
  ],
  creator: "Shahleen Store",
  publisher: "Shahleen Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shahleenstore.com",
    siteName: "Shahleen Store",
    title:
      "Shahleen Store | Shop Online in Egypt",
    description: "Shop curated products from Shahleen Store with Kashier checkout.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Shahleen Store logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shahleen Store | Shop Online in Egypt",
    description: "Shop curated products from Shahleen Store with Kashier checkout.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "e-commerce",
  classification: "E-commerce Platform",
  applicationName: "Shahleen Store",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "https://shahleenstore.com",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <Navbar />
          <Container className="py-20">{children}</Container>
        </Providers>
      </body>
    </html>
  );
}
