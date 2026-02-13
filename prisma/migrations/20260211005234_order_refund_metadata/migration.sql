-- AlterTable
ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "refundAmountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "refundReason" TEXT,
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT;
