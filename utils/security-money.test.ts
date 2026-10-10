import { beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { verifyKashierSignature } from "./kashier";
import { calculateMoneyTotals } from "./money";
import { cartItemAmountSchema } from "./schemas";
import { isAdminRole } from "./authorization";

describe("Kashier redirect signatures", () => {
  beforeEach(() => {
    process.env.KASHIER_API_KEY = "test-payment-key";
  });

  it("accepts Kashier's fixed response field signature", () => {
    const params = new URLSearchParams({
      paymentStatus: "SUCCESS", merchantOrderId: "merchant-order-1", orderId: "gateway-order-1",
      amount: "155.00", currency: "EGP", transactionId: "TX-123",
    });
    const fields = ["paymentStatus", "cardDataToken", "maskedCard", "merchantOrderId", "orderId", "cardBrand", "orderReference", "transactionId", "amount", "currency"];
    const body = fields.map((field) => `${field}=${params.get(field) ?? "null"}`).join("&");
    params.set("signature", createHmac("sha256", process.env.KASHIER_API_KEY!).update(body).digest("hex"));
    expect(verifyKashierSignature(params)).toBe(true);
    params.set("amount", "1.00");
    expect(verifyKashierSignature(params)).toBe(false);
  });
});

describe("integer money calculations", () => {
  it("rounds tax and keeps every total an integer", () => {
    expect(calculateMoneyTotals(155, 0.1, 5)).toEqual({ cartTotal: 155, tax: 16, shipping: 5, orderTotal: 176 });
  });
});

describe("cart quantity validation", () => {
  it.each(["-1", "0", "1.5", "100", "not-a-number"])("rejects %s", (amount) => {
    expect(cartItemAmountSchema.safeParse(amount).success).toBe(false);
  });
  it("accepts positive whole quantities up to 99", () => {
    expect(cartItemAmountSchema.parse("99")).toBe(99);
  });
});

describe("admin role guard", () => {
  it("grants access only to the database ADMIN role", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("USER")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});
