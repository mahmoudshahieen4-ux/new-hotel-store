import { type NextRequest } from "next/server";
import db from "@/utils/db";
import {
  buildKashierCheckoutUrl,
  generateKashierOrderId,
  isKashierConfigured,
} from "@/utils/kashier";

export const POST = async (req: NextRequest) => {
  const requestHeaders = new Headers(req.headers);
  const origin = requestHeaders.get("origin");

  const { orderId, cartId } = await req.json();

  const order = await db.order.findUnique({
    where: { id: orderId },
  });
  const cart = await db.cart.findUnique({
    where: { id: cartId },
  });
  if (!order || !cart) {
    return Response.json(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  if (!isKashierConfigured()) {
    return Response.json({
      url: null,
      message:
        "Kashier is not configured. Set KASHIER_MERCHANT_ID and KASHIER_HASH_KEY in your .env file.",
    });
  }

  // Kashier requires a unique order reference of max 35 chars.
  // Persist it once so the return callback can map back to our order.
  const paymentOrderId = order.paymentOrderId ?? generateKashierOrderId();
  if (!order.paymentOrderId) {
    await db.order.update({
      where: { id: order.id },
      data: { paymentOrderId },
    });
  }

  const merchantRedirect = `${origin}/api/confirm`;
  const failureRedirect = `${origin}/checkout?orderId=${order.id}&cartId=${cart.id}`;

  const url = buildKashierCheckoutUrl({
    orderId: paymentOrderId,
    amount: order.orderTotal,
    merchantRedirect,
    failureRedirect,
    customerEmail: order.email || undefined,
    customerName: undefined,
  });

  return Response.json({ url });
};

