-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "refundAmountCents" INTEGER,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripeRefundId" TEXT,
ADD COLUMN     "stripeRefundStatus" TEXT;
