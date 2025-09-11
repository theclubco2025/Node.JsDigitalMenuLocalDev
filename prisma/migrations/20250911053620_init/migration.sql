-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'RESTAURANT_OWNER');

-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."menus" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_categories" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "calories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_tags" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "menu_item_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'RESTAURANT_OWNER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "plan" "public"."Plan" NOT NULL DEFAULT 'BASIC',
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "monthlyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEnd" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{"allowMenuEdits": true, "maxCategories": 10, "maxItems": 50, "aiResponsesPerDay": 100, "customBranding": false}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_tags_itemId_tag_key" ON "public"."menu_item_tags"("itemId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug");

-- AddForeignKey
ALTER TABLE "public"."menus" ADD CONSTRAINT "menus_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_categories" ADD CONSTRAINT "menu_categories_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "public"."menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_tags" ADD CONSTRAINT "menu_item_tags_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
