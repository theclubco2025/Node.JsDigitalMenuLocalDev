-- Add per-order SMS opt-in + delivery metadata (idempotent).

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "smsOptIn" boolean NOT NULL DEFAULT false;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "smsOptInAt" timestamp with time zone;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "readySmsSentAt" timestamp with time zone;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "twilioReadyMessageSid" text;

