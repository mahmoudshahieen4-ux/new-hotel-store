import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import db from "@/utils/db";

/**
 * Kashier hosted-checkout return callback.
 *
 * Kashier redirects the buyer back to `merchantRedirect` (this route) with
 * query parameters such as `orderId`, `transactionId` and `paymentStatus`
 * (values like `TRX_SUCCESS` / `TRX_FAILED`).
 */
export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const paymentStatus =
    searchParams.get("paymentStatus") ||
    searchParams.get("trxStatus") ||
    searchParams.get("success");

  try {
    if (orderId) {
      const order = await db.order.findUnique({
        where: { paymentOrderId: orderId },
      });
      if (order) {
        const isPaid =
          paymentStatus === "TRX_SUCCESS" ||
          paymentStatus === "true" ||
          paymentStatus === "1" ||
          paymentStatus === "paid";

        if (isPaid) {
          await db.order.update({
            where: { id: order.id },
            data: { isPaid: true },
          });
          // Clear the user's cart after a successful payment.
          await db.cart.deleteMany({
            where: { userId: order.userId },
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  redirect("/orders");
};

