-- Track SMS opt-outs/suppressions (STOP, UNSUBSCRIBE, etc.)
CREATE TABLE IF NOT EXISTS "public"."sms_suppressions" (
  "id" text PRIMARY KEY,
  "tenantId" text,
  "phoneE164" text NOT NULL,
  "reason" text,
  "source" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "sms_suppressions_phoneE164_createdAt_idx"
  ON "public"."sms_suppressions" ("phoneE164", "createdAt");

CREATE INDEX IF NOT EXISTS "sms_suppressions_tenantId_phoneE164_createdAt_idx"
  ON "public"."sms_suppressions" ("tenantId", "phoneE164", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sms_suppressions_tenantId_fkey'
  ) THEN
    ALTER TABLE "public"."sms_suppressions"
      ADD CONSTRAINT "sms_suppressions_tenantId_fkey"
      FOREIGN KEY ("tenantId")
      REFERENCES "public"."tenants"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
