export type MoneyTotals = {
  cartTotal: number;
  tax: number;
  shipping: number;
  orderTotal: number;
};

/** Prices are stored as integer whole currency units; tax is rounded to an integer. */
export function calculateMoneyTotals(
  cartTotal: number,
  taxRate: number,
  shippingFee: number,
): MoneyTotals {
  const safeCartTotal = Number.isFinite(cartTotal) ? Math.max(0, Math.round(cartTotal)) : 0;
  const tax = Math.round(safeCartTotal * taxRate);
  const shipping = safeCartTotal > 0 ? Math.round(shippingFee) : 0;
  return { cartTotal: safeCartTotal, tax, shipping, orderTotal: safeCartTotal + tax + shipping };
}
