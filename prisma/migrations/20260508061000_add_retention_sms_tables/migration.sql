-- Retention / marketing SMS opt-ins and send ledger
ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "marketingSmsOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "marketingSmsOptInAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "public"."sms_retention_messages" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT,
  "phoneRaw" TEXT NOT NULL,
  "campaignKey" TEXT NOT NULL,
  "messageBody" TEXT NOT NULL,
  "messageSid" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "sms_retention_messages_tenantId_phoneRaw_campaignKey_key"
  ON "public"."sms_retention_messages"("tenantId", "phoneRaw", "campaignKey");
CREATE INDEX IF NOT EXISTS "sms_retention_messages_tenantId_campaignKey_idx"
  ON "public"."sms_retention_messages"("tenantId", "campaignKey");
CREATE INDEX IF NOT EXISTS "sms_retention_messages_sentAt_idx"
  ON "public"."sms_retention_messages"("sentAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_retention_messages_tenantId_fkey'
  ) THEN
    ALTER TABLE "public"."sms_retention_messages"
      ADD CONSTRAINT "sms_retention_messages_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_retention_messages_orderId_fkey'
  ) THEN
    ALTER TABLE "public"."sms_retention_messages"
      ADD CONSTRAINT "sms_retention_messages_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
