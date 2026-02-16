-- Create assistant events table for analytics (best-effort, PII-light).

CREATE TABLE IF NOT EXISTS "assistant_events" (
  "id" text NOT NULL,
  "tenantSlug" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "question" text NOT NULL,
  "answerSnippet" text,
  "category" text,
  "matchedItemIds" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "latencyMs" integer,
  "model" text,
  "fallback" boolean NOT NULL DEFAULT false,
  CONSTRAINT "assistant_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "assistant_events_tenantSlug_createdAt_idx" ON "assistant_events" ("tenantSlug", "createdAt");

