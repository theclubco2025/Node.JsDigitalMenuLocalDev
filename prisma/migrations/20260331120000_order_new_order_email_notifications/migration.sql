-- Staff "new order" email notifications (Resend)
-- Idempotent DDL to avoid failures on existing production DBs.

ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "newOrderEmailSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "newOrderEmailLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "newOrderEmailAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "newOrderEmailLastError" TEXT;

