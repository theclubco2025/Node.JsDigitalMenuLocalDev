ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "readyEmailSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "readyEmailMessageId" TEXT,
  ADD COLUMN IF NOT EXISTS "readyEmailLastError" TEXT;

CREATE TABLE IF NOT EXISTS "public"."email_retention_messages" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT,
  "customerEmail" TEXT NOT NULL,
  "campaignKey" TEXT NOT NULL,
  "messageBody" TEXT NOT NULL,
  "messageId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_retention_messages_tenantId_customerEmail_campaignKey_key"
  ON "public"."email_retention_messages"("tenantId", "customerEmail", "campaignKey");
CREATE INDEX IF NOT EXISTS "email_retention_messages_tenantId_campaignKey_idx"
  ON "public"."email_retention_messages"("tenantId", "campaignKey");
CREATE INDEX IF NOT EXISTS "email_retention_messages_sentAt_idx"
  ON "public"."email_retention_messages"("sentAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_retention_messages_tenantId_fkey'
  ) THEN
    ALTER TABLE "public"."email_retention_messages"
      ADD CONSTRAINT "email_retention_messages_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_retention_messages_orderId_fkey'
  ) THEN
    ALTER TABLE "public"."email_retention_messages"
      ADD CONSTRAINT "email_retention_messages_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
