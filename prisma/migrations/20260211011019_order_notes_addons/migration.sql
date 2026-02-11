-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "addOns" JSONB,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "note" TEXT;
