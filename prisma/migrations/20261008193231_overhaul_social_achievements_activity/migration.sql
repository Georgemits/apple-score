-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ADD', 'REMOVE', 'REPRICE');

-- AlterTable
-- `family` is added as nullable, back-filled for existing rows, then made
-- required. The seed script sets the accurate family for every catalogue
-- entry; this back-fill only guarantees a sensible value until it runs.
ALTER TABLE "Product" ADD COLUMN     "currentPriceUSD" INTEGER,
ADD COLUMN     "family" TEXT;

UPDATE "Product" SET "family" = CASE
  WHEN "name" ILIKE 'iPhone%Pro%'          THEN 'iPhone Pro'
  WHEN "name" ILIKE 'iPhone SE%'           THEN 'iPhone SE'
  WHEN "name" ILIKE 'iPhone%'              THEN 'iPhone'
  WHEN "name" ILIKE 'MacBook Air%'         THEN 'MacBook Air'
  WHEN "name" ILIKE 'MacBook Pro%'         THEN 'MacBook Pro'
  WHEN "name" ILIKE 'MacBook%'             THEN 'MacBook'
  WHEN "name" ILIKE 'iMac%'                THEN 'iMac'
  WHEN "name" ILIKE 'Mac mini%'            THEN 'Mac mini'
  WHEN "name" ILIKE 'Mac Studio%'          THEN 'Mac Studio'
  WHEN "name" ILIKE 'Mac Pro%'             THEN 'Mac Pro'
  WHEN "name" ILIKE 'iPad Pro%'            THEN 'iPad Pro'
  WHEN "name" ILIKE 'iPad Air%'            THEN 'iPad Air'
  WHEN "name" ILIKE 'iPad mini%'           THEN 'iPad mini'
  WHEN "name" ILIKE 'iPad%'                THEN 'iPad'
  WHEN "name" LIKE 'Apple Watch Ultra%'    THEN 'Apple Watch Ultra'
  WHEN "name" LIKE 'Apple Watch SE%'       THEN 'Apple Watch SE'
  WHEN "name" LIKE 'Apple Watch%'          THEN 'Apple Watch'
  WHEN "name" ILIKE 'AirPods Pro%'         THEN 'AirPods Pro'
  WHEN "name" ILIKE 'AirPods Max%'         THEN 'AirPods Max'
  WHEN "name" ILIKE 'AirPods%'             THEN 'AirPods'
  WHEN "name" ILIKE 'Apple Vision%'        THEN 'Apple Vision Pro'
  WHEN "name" ILIKE 'Apple TV%'            THEN 'Apple TV'
  WHEN "name" ILIKE 'HomePod%'             THEN 'HomePod'
  WHEN "name" ILIKE 'iPod%'                THEN 'iPod'
  WHEN "category" = 'DISPLAY'              THEN 'Displays'
  WHEN "category" = 'ACCESSORY'            THEN 'Accessories'
  WHEN "category" = 'CLASSIC'              THEN 'Classic'
  WHEN "category" = 'MAC'                  THEN 'Mac'
  ELSE split_part("name", ' ', 1)
END
WHERE "family" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "family" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarEmoji" TEXT,
ADD COLUMN     "avatarHue" INTEGER,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "onboardedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_userId_createdAt_idx" ON "ActivityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE INDEX "Product_family_idx" ON "Product"("family");

-- CreateIndex
CREATE INDEX "Product_year_idx" ON "Product"("year");

-- CreateIndex
CREATE INDEX "User_isPublic_idx" ON "User"("isPublic");

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
