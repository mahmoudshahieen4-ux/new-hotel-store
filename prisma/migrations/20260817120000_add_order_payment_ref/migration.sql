-- Migration: add_order_payment_ref
-- Applied: 2026-08-17
--
-- Adds a short, unique `Order.paymentOrderId`. Kashier requires an order id
-- of max 35 characters (our UUID order ids are 36), so we persist a shorter
-- reference and use it to map the payment-gateway callback back to the order.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentOrderId_key" ON "Order"("paymentOrderId");
