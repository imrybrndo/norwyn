/*
  Warnings:

  - You are about to drop the `inventory_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_user_wallet_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "inventory" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "inventory_items";
