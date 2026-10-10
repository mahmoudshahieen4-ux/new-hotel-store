/**
 * Global application configuration and constants.
 */

export const CURRENCY = process.env.CURRENCY || process.env.KASHIER_CURRENCY || "EGP";

const configuredTaxRate = Number(process.env.TAX_RATE ?? 0.1);
const configuredShippingFee = Number(process.env.SHIPPING_FEE ?? 5);

export const DEFAULT_TAX_RATE = Number.isFinite(configuredTaxRate) && configuredTaxRate >= 0
  ? configuredTaxRate
  : 0.1;
export const DEFAULT_SHIPPING_FEE = Number.isFinite(configuredShippingFee) && configuredShippingFee >= 0
  ? Math.round(configuredShippingFee)
  : 5;
