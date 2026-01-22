import { prisma } from '@/lib/prisma'

export async function ensureOrdersSchemaPreview(opts?: { host?: string }) {
  // Preview-only safety valve: if a preview deployment points at a DB without the orders migration,
  // create the minimal schema on-demand so POC can run. This will NOT run in production.
  const host = (opts?.host || '').trim().toLowerCase()
  const isLikelyPreviewHost = host.includes('-git-') && host.endsWith('.vercel.app')
  const isPreview = process.env.VERCEL_ENV === 'preview' || isLikelyPreviewHost
  if (!isPreview) return

  await prisma.$transaction([
    // Enums (idempotent)
    prisma.$executeRawUnsafe(`
DO $$
BEGIN
  CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PAYMENT', 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;`),
    prisma.$executeRawUnsafe(`
DO $$
BEGIN
  CREATE TYPE "public"."FulfillmentType" AS ENUM ('PICKUP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;`),

    // Tables
    prisma.$executeRawUnsafe(`
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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);`),
    prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "public"."order_items" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL
);`),

    // Primary keys (idempotent)
    prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
  END IF;
END $$;`),
    prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");
  END IF;
END $$;`),

    // Indexes/uniques (idempotent)
    prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripeCheckoutSessionId_key" ON "public"."orders"("stripeCheckoutSessionId");`),
    prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripePaymentIntentId_key" ON "public"."orders"("stripePaymentIntentId");`),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "orders_tenantId_createdAt_idx" ON "public"."orders"("tenantId", "createdAt");`),
    prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "public"."order_items"("orderId");`),

    // Foreign keys (idempotent)
    prisma.$executeRawUnsafe(`
DO $$
BEGIN
  ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;`),
    prisma.$executeRawUnsafe(`
DO $$
BEGIN
  ALTER TABLE "public"."order_items"
    ADD CONSTRAINT "order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;`),
  ])
}

