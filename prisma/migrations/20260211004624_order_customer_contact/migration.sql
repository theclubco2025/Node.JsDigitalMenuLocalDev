-- NOTE:
-- This migration is designed to be resilient when deploying to an existing production database
-- that already has some (or all) of the ordering tables/enums created outside Prisma Migrate.
-- It uses idempotent DDL to avoid failures like: ERROR: type "OrderStatus" already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'OrderStatus'
  ) THEN
    CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PAYMENT', 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'FulfillmentType'
  ) THEN
    CREATE TYPE "public"."FulfillmentType" AS ENUM ('PICKUP');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."orders" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "fulfillment" "public"."FulfillmentType" NOT NULL DEFAULT 'PICKUP',
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "subtotalCents" INTEGER NOT NULL,
  "totalCents" INTEGER NOT NULL,
  "scheduledFor" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "paidAt" TIMESTAMP(3),
  "customerEmail" TEXT,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Ensure newer columns exist even if the table was created earlier
ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "customerName" TEXT,
  ADD COLUMN IF NOT EXISTS "customerPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "public"."order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Indexes are best-effort; if they already exist with a different name they may be duplicated.
CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripeCheckoutSessionId_key" ON "public"."orders"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripePaymentIntentId_key" ON "public"."orders"("stripePaymentIntentId");
CREATE INDEX IF NOT EXISTS "orders_tenantId_createdAt_idx" ON "public"."orders"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "public"."order_items"("orderId");
