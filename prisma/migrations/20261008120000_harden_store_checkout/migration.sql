-- Preserve one cart per user and merge duplicate cart contents before adding uniqueness.
BEGIN;
CREATE TEMP TABLE "CartMerge" ON COMMIT DROP AS
SELECT c."id" AS "duplicateCartId",
       first_value(c."id") OVER (PARTITION BY c."userId" ORDER BY c."createdAt", c."id") AS "targetCartId"
FROM "Cart" c;

CREATE TEMP TABLE "CartMergeItems" ON COMMIT DROP AS
SELECT m."targetCartId" AS "cartId", ci."productId", SUM(ci."amount")::INTEGER AS "amount",
       MIN(ci."createdAt") AS "createdAt"
FROM "CartMerge" m JOIN "CartItem" ci ON ci."cartId" = m."duplicateCartId"
GROUP BY m."targetCartId", ci."productId";

DELETE FROM "CartItem" ci USING "CartMerge" m WHERE ci."cartId" = m."duplicateCartId";
DELETE FROM "Cart" c USING "CartMerge" m
WHERE c."id" = m."duplicateCartId" AND m."duplicateCartId" <> m."targetCartId";

INSERT INTO "CartItem" ("id", "productId", "cartId", "amount", "createdAt", "updatedAt")
SELECT 'merge-' || md5(i."cartId" || ':' || i."productId"), i."productId", i."cartId", i."amount", i."createdAt", CURRENT_TIMESTAMP
FROM "CartMergeItems" i;

-- Remove historical duplicate favorites and reviews, keeping the earliest row.
DELETE FROM "Favorite" a USING "Favorite" b
WHERE a."userId" = b."userId" AND a."productId" = b."productId"
  AND (a."createdAt", a."id") > (b."createdAt", b."id");
DELETE FROM "Review" a USING "Review" b
WHERE a."userId" = b."userId" AND a."productId" = b."productId"
  AND (a."createdAt", a."id") > (b."createdAt", b."id");

ALTER TABLE "Order" ADD COLUMN "shippingName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "shippingPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "shippingAddress" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");
CREATE UNIQUE INDEX "Review_userId_productId_key" ON "Review"("userId", "productId");
CREATE INDEX "Product_featured_idx" ON "Product"("featured");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");
CREATE INDEX "Review_productId_idx" ON "Review"("productId");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX "Order_userId_isPaid_idx" ON "Order"("userId", "isPaid");

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;
