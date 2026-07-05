-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "tile_x" INTEGER NOT NULL,
    "tile_y" INTEGER NOT NULL,
    "crop_type" TEXT NOT NULL,
    "planted_at" BIGINT NOT NULL,
    "ready_at" BIGINT NOT NULL,
    "watered" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);
