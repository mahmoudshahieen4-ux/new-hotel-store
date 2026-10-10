import db from "@/utils/db";
import { CURRENCY, DEFAULT_SHIPPING_FEE, DEFAULT_TAX_RATE } from "@/utils/config";
import { calculateMoneyTotals } from "@/utils/money";

/** Atomically marks a correctly priced order paid and subtracts its purchased quantities from that user's cart. */
export async function completeKashierOrder(paymentOrderId: string, amount: number, currency: string) {
  if (currency !== CURRENCY || !Number.isFinite(amount)) return false;
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { paymentOrderId },
      include: { orderItems: true },
    });
    if (!order || order.orderTotal <= 0 || Math.abs(amount - order.orderTotal) > 0.009) return false;

    const changed = await tx.order.updateMany({
      where: { id: order.id, isPaid: false },
      data: { isPaid: true },
    });
    if (changed.count !== 1) return order.isPaid;

    const cart = await tx.cart.findUnique({
      where: { userId: order.userId },
      include: { cartItems: true },
    });
    if (cart) {
      for (const purchased of order.orderItems) {
        const current = cart.cartItems.find((item) => item.productId === purchased.productId);
        if (!current) continue;
        const remaining = current.amount - purchased.amount;
        if (remaining > 0) {
          await tx.cartItem.update({ where: { id: current.id }, data: { amount: remaining } });
        } else {
          await tx.cartItem.delete({ where: { id: current.id } });
        }
      }
      const remaining = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: { select: { price: true } } },
      });
      const totals = calculateMoneyTotals(
        remaining.reduce((sum, item) => sum + item.amount * item.product.price, 0),
        DEFAULT_TAX_RATE,
        DEFAULT_SHIPPING_FEE,
      );
      await tx.cart.update({
        where: { id: cart.id },
        data: { ...totals, taxRate: DEFAULT_TAX_RATE, numItemsInCart: remaining.reduce((sum, item) => sum + item.amount, 0) },
      });
    }
    return true;
  });
}
