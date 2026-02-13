-- AlterTable
ALTER TABLE "public"."order_items"
  ADD COLUMN IF NOT EXISTS "addOns" JSONB,
  ADD COLUMN IF NOT EXISTS "note" TEXT;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "note" TEXT;
