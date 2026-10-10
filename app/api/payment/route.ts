import { type NextRequest } from "next/server";
import { z } from "zod";
import db from "@/utils/db";
import { auth } from "@/auth";
import { withDbRetry } from "@/utils/db";
import {
  buildKashierCheckoutUrl,
  generateKashierOrderId,
  isKashierConfigured,
} from "@/utils/kashier";

const paymentBodySchema = z.object({
  orderId: z.string().uuid(),
}).strict();

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = paymentBodySchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: "Invalid request payload", details: result.error.errors },
        { status: 400 }
      );
    }

    const { orderId } = result.data;

    const order = await withDbRetry(() => db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        isPaid: false,
      },
    }));

    if (!order) {
      return Response.json(
        { error: "Order not found or already paid" },
        { status: 404 }
      );
    }

    if (!isKashierConfigured()) {
      return Response.json({
        url: null,
        message:
          "Kashier is not configured. Set KASHIER_MERCHANT_ID and KASHIER_API_KEY.",
      });
    }

    const paymentOrderId = order.paymentOrderId ?? generateKashierOrderId();
    if (!order.paymentOrderId) {
      const storedReference = await db.order.updateMany({
        where: { id: order.id, userId: session.user.id, isPaid: false },
        data: { paymentOrderId },
      });
      if (storedReference.count !== 1) {
        return Response.json({ error: "Order is no longer available for payment" }, { status: 409 });
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.AUTH_URL || "http://localhost:3000";
    const siteUrl = new URL(baseUrl);
    if (siteUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
      throw new Error("Payment redirect base URL must use HTTPS in production");
    }

    const merchantRedirect = new URL("/api/confirm", siteUrl).toString();
    const failureRedirect = new URL("/orders?payment=failed", siteUrl).toString();

    const url = buildKashierCheckoutUrl({
      orderId: paymentOrderId,
      amount: order.orderTotal,
      merchantRedirect,
      failureRedirect,
      customerEmail: order.email || undefined,
      customerName: session.user.name || undefined,
    });

    return Response.json({ url });
  } catch (error) {
    console.error("Payment API error:", error);
    return Response.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
};

