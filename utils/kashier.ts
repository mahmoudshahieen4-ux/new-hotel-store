import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { CURRENCY } from "./config";

const paymentApiKey = () => process.env.KASHIER_API_KEY || process.env.KASHIER_HASH_KEY;

export const isKashierConfigured = () =>
  Boolean(process.env.KASHIER_MERCHANT_ID && paymentApiKey());

export const generateKashierOrderId = () =>
  `${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 24)}`.slice(0, 35);

export const kashierHash = (
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  apiKey: string,
) =>
  createHmac("sha256", apiKey)
    .update(`/?payment=${merchantId}.${orderId}.${amount}.${currency}`)
    .digest("hex");

/** Verify Kashier Payment UI redirect responses using its fixed signed field order. */
export const verifyKashierSignature = (params: URLSearchParams): boolean => {
  const apiKey = paymentApiKey();
  const signature = params.get("signature");
  if (!apiKey || !signature || !/^[a-f\d]{64}$/i.test(signature)) return false;

  const fields = [
    "paymentStatus", "cardDataToken", "maskedCard", "merchantOrderId", "orderId",
    "cardBrand", "orderReference", "transactionId", "amount", "currency",
  ];
  const body = fields.map((field) => `${field}=${params.get(field) ?? "null"}`).join("&");
  const expected = Buffer.from(createHmac("sha256", apiKey).update(body).digest("hex"), "utf8");
  const received = Buffer.from(signature.toLowerCase(), "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
};

type BuildUrlArgs = {
  orderId: string;
  amount: number;
  merchantRedirect: string;
  failureRedirect: string;
  customerEmail?: string;
  customerName?: string;
};

export const buildKashierCheckoutUrl = ({
  orderId, amount, merchantRedirect, failureRedirect, customerEmail, customerName,
}: BuildUrlArgs): string => {
  const merchantId = process.env.KASHIER_MERCHANT_ID as string;
  const apiKey = paymentApiKey() as string;
  const mode = process.env.KASHIER_MODE || "test";
  const checkoutUrl = process.env.KASHIER_CHECKOUT_URL || "https://checkout.kashier.io/";
  const amountStr = amount.toFixed(2);
  const hash = kashierHash(merchantId, orderId, amountStr, CURRENCY, apiKey);
  const params = new URLSearchParams({
    merchantId, mid: merchantId, orderId, amount: amountStr, currency: CURRENCY,
    hash, type: "card", mode, merchantRedirect, failureRedirect,
  });
  if (customerEmail) params.append("email", customerEmail);
  if (customerName) params.append("name", customerName);
  return `${checkoutUrl}${checkoutUrl.includes("?") ? "&" : "?"}${params.toString()}`;
};

