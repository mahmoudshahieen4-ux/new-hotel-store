import { createHmac, randomUUID } from "crypto";

/**
 * Kashier payment gateway helpers (hosted checkout).
 *
 * Required environment variables:
 *   KASHIER_MERCHANT_ID     e.g. "MID-XXXX-XXXX" (also referenced as `mid`)
 *   KASHIER_HASH_KEY        your merchant hash key (used to sign requests)
 * Optional:
 *   KASHIER_CURRENCY        default "EGP"
 *   KASHIER_MODE            "test" | "live" (default "test")
 *   KASHIER_CHECKOUT_URL    default "https://checkout.kashier.io/"
 */

export const isKashierConfigured = () =>
  Boolean(
    process.env.KASHIER_MERCHANT_ID && process.env.KASHIER_HASH_KEY,
  );

/**
 * Kashier requires a unique order id of max 35 chars, alphanumeric plus
 * dash/underscore. Generate a short reference so we can map the gateway
 * callback back to our UUID-based order.
 */
export const generateKashierOrderId = () => {
  const rand = randomUUID().replace(/-/g, "").slice(0, 24);
  return `${Date.now()}${rand}`.slice(0, 35);
};

/**
 * Kashier signature: HMAC-SHA256 over the concatenation of
 * mid + orderId + amount + currency using the merchant hash key.
 * amount is in the major currency unit with two decimals, e.g. "10.00".
 */
export const kashierHash = (
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  hashKey: string,
) => createHmac("sha256", hashKey).update(`${merchantId}${orderId}${amount}${currency}`).digest("hex");

type BuildUrlArgs = {
  orderId: string;
  amount: number; // major unit, e.g. 10 for $10/EGP10
  merchantRedirect: string;
  failureRedirect: string;
  customerEmail?: string;
  customerName?: string;
};

export const buildKashierCheckoutUrl = ({
  orderId,
  amount,
  merchantRedirect,
  failureRedirect,
  customerEmail,
  customerName,
}: BuildUrlArgs): string => {
  const merchantId = process.env.KASHIER_MERCHANT_ID as string;
  const hashKey = process.env.KASHIER_HASH_KEY as string;
  const currency = process.env.KASHIER_CURRENCY || "EGP";
  const mode = process.env.KASHIER_MODE || "test";
  const checkoutUrl =
    process.env.KASHIER_CHECKOUT_URL || "https://checkout.kashier.io/";

  const amountStr = (typeof amount === "number" ? amount : Number(amount)).toFixed(2);
  const hash = kashierHash(merchantId, orderId, amountStr, currency, hashKey);

  // `merchantId` is the documented hosted-checkout field; `mid` is also widely
  // accepted. We include both (same value) for compatibility. The signature is
  // recomputed server-side from the merchant's own id, so the extra param is
  // harmless.
  const params = new URLSearchParams({
    merchantId,
    mid: merchantId,
    orderId,
    amount: amountStr,
    currency,
    hash,
    type: "card",
    mode,
    merchantRedirect,
    failureRedirect,
  });
  if (customerEmail) params.append("email", customerEmail);
  if (customerName) params.append("name", customerName);

  const hasQuery = checkoutUrl.includes("?");
  return `${checkoutUrl}${hasQuery ? "&" : "?"}${params.toString()}`;
};
