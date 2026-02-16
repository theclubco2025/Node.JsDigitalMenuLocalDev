-- Persist Twilio READY-SMS delivery telemetry (idempotent).

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyStatus" text;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyTo" text;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyErrorCode" integer;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyErrorMessage" text;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyAttemptCount" integer NOT NULL DEFAULT 0;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyLastAttemptAt" timestamp with time zone;

