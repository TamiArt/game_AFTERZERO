-- AlterTable
ALTER TABLE "World"
ADD COLUMN "lastDailyClaimAt" TIMESTAMP(3),
ADD COLUMN "lastProductionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Building" (
    "id" UUID NOT NULL,
    "worldId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "tileC" INTEGER NOT NULL,
    "tileR" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completesAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceNodeCooldown" (
    "id" UUID NOT NULL,
    "worldId" UUID NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceNodeCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAction" (
    "id" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Building_worldId_tileC_tileR_key"
ON "Building"("worldId", "tileC", "tileR");

-- CreateIndex
CREATE INDEX "Building_worldId_completesAt_idx"
ON "Building"("worldId", "completesAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceNodeCooldown_worldId_nodeKey_key"
ON "ResourceNodeCooldown"("worldId", "nodeKey");

-- CreateIndex
CREATE UNIQUE INDEX "GameAction_playerId_key_key"
ON "GameAction"("playerId", "key");

-- CreateIndex
CREATE INDEX "GameAction_createdAt_idx" ON "GameAction"("createdAt");

-- AddForeignKey
ALTER TABLE "Building"
ADD CONSTRAINT "Building_worldId_fkey"
FOREIGN KEY ("worldId") REFERENCES "World"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceNodeCooldown"
ADD CONSTRAINT "ResourceNodeCooldown_worldId_fkey"
FOREIGN KEY ("worldId") REFERENCES "World"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAction"
ADD CONSTRAINT "GameAction_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "Player"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
