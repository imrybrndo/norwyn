-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Farmer', 'Woodcutter', 'Fisher');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Farmer',
    "gender" "Gender" NOT NULL DEFAULT 'Male',
    "avatar_style" INTEGER NOT NULL DEFAULT 1,
    "gold" INTEGER NOT NULL DEFAULT 100,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "energy_capacity" INTEGER NOT NULL DEFAULT 100,
    "hunger" INTEGER NOT NULL DEFAULT 100,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "watering_can_level" INTEGER NOT NULL DEFAULT 1,
    "watering_can_durability" INTEGER NOT NULL DEFAULT 100,
    "axe_level" INTEGER NOT NULL DEFAULT 1,
    "axe_durability" INTEGER NOT NULL DEFAULT 100,
    "fishing_rod_level" INTEGER NOT NULL DEFAULT 1,
    "fishing_rod_durability" INTEGER NOT NULL DEFAULT 100,
    "last_map" TEXT NOT NULL DEFAULT 'farm',
    "last_x" INTEGER NOT NULL DEFAULT 240,
    "last_y" INTEGER NOT NULL DEFAULT 240,
    "last_daily_chest_claim" BIGINT NOT NULL DEFAULT 0,
    "total_playtime" INTEGER NOT NULL DEFAULT 0,
    "last_claimed_quests" JSONB NOT NULL DEFAULT '{}',
    "friends" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "friend_requests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "user_wallet" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_plots" (
    "id" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "owner_wallet" TEXT NOT NULL,
    "planted_item_id" TEXT,
    "planted_at" TIMESTAMP(3),
    "harvest_ready_at" TIMESTAMP(3),
    "is_watered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment_beds" (
    "id" TEXT NOT NULL,
    "bed_id" INTEGER NOT NULL,
    "owner_wallet" TEXT NOT NULL,
    "nft_token_address" TEXT,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartment_beds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "inventory_items_user_wallet_idx" ON "inventory_items"("user_wallet");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_user_wallet_item_type_key" ON "inventory_items"("user_wallet", "item_type");

-- CreateIndex
CREATE UNIQUE INDEX "farm_plots_plot_id_key" ON "farm_plots"("plot_id");

-- CreateIndex
CREATE INDEX "farm_plots_owner_wallet_idx" ON "farm_plots"("owner_wallet");

-- CreateIndex
CREATE INDEX "messages_sender_receiver_timestamp_idx" ON "messages"("sender", "receiver", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "apartment_beds_bed_id_key" ON "apartment_beds"("bed_id");

-- CreateIndex
CREATE INDEX "apartment_beds_owner_wallet_idx" ON "apartment_beds"("owner_wallet");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_user_wallet_fkey" FOREIGN KEY ("user_wallet") REFERENCES "users"("wallet_address") ON DELETE CASCADE ON UPDATE CASCADE;
