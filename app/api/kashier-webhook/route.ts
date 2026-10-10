import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CURRENCY } from "@/utils/config";
import { completeKashierOrder } from "@/utils/order-payment";
import { z } from "zod";

const webhookSchema = z.object({ data: z.record(z.unknown()) }).passthrough();

const verifyWebhook = (data: Record<string, unknown>, signature: string | null) => {
  const apiKey = process.env.KASHIER_API_KEY || process.env.KASHIER_HASH_KEY;
  const keys = data.signatureKeys;
  if (!apiKey || !signature || !Array.isArray(keys) || !keys.every((key) => typeof key === "string")) return false;
  const signed = [...keys as string[]].sort().map((key) => `${key}=${encodeURIComponent(String(data[key] ?? "null"))}`).join("&");
  const expected = Buffer.from(createHmac("sha256", apiKey).update(signed).digest("hex"), "utf8");
  const received = Buffer.from(signature.toLowerCase(), "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const POST = async (request: NextRequest) => {
  try {
    const parsed = webhookSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }
    const data = parsed.data.data;
    if (!verifyWebhook(data, request.headers.get("x-kashier-signature"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const orderId = String(data.merchantOrderId ?? "");
    const amount = Number(data.amount);
    const currency = String(data.currency ?? "");
    if (data.status !== "SUCCESS" || currency !== CURRENCY || !orderId || !Number.isFinite(amount)) {
      return NextResponse.json({ received: true });
    }
    const completed = await completeKashierOrder(orderId, amount, currency);
    if (!completed) return NextResponse.json({ error: "Order amount mismatch" }, { status: 400 });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Kashier webhook failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
