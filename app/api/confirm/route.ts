import { NextRequest, NextResponse } from "next/server";
import { verifyKashierSignature } from "@/utils/kashier";
import { completeKashierOrder } from "@/utils/order-payment";

export const GET = async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const redirect = (payment: "success" | "failed") =>
    NextResponse.redirect(new URL(`/orders?payment=${payment}`, process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.AUTH_URL || "http://localhost:3000"));
  if (!verifyKashierSignature(params) || params.get("paymentStatus") !== "SUCCESS") {
    return redirect("failed");
  }
  const paymentOrderId = params.get("merchantOrderId");
  const amount = Number(params.get("amount"));
  const currency = params.get("currency") || "";
  if (!paymentOrderId || !Number.isFinite(amount)) return redirect("failed");
  try {
    return redirect(await completeKashierOrder(paymentOrderId, amount, currency) ? "success" : "failed");
  } catch (error) {
    console.error("Kashier confirmation failed", error);
    return redirect("failed");
  }
};
