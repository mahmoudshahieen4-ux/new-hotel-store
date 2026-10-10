/**
 * Navigation and URL safety helpers.
 */

export function sanitizeCallbackUrl(
  url: string | null | undefined,
  defaultUrl = "/products"
): string {
  if (!url) return defaultUrl;
  try {
    const decoded = decodeURIComponent(url);
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/\\")
    ) {
      return decoded;
    }
  } catch {
    // If decoding fails, fall back to defaultUrl
  }
  return defaultUrl;
}
