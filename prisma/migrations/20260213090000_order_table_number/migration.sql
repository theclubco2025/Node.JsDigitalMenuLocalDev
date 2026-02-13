-- AlterTable
ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "tableNumber" TEXT;

