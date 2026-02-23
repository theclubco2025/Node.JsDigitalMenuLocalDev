-- Stripe Connect Standard + tips (sales-ready ordering)
-- Idempotent DDL to avoid failures on existing production DBs.

-- Tenants: store connected account id and onboarding timestamp
ALTER TABLE "public"."tenants"
  ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeConnectOnboardedAt" TIMESTAMP(3);

-- Orders: store tip cents + which Stripe account processed payment
ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "tipCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;

-- Uniqueness: a connected Stripe account should belong to only one tenant.
-- Postgres unique index allows multiple NULLs, so this is safe for nullable columns.
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_stripeConnectAccountId_key"
  ON "public"."tenants"("stripeConnectAccountId");

