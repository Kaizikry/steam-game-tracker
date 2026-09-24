-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "steamId" TEXT,
    "steamUsername" TEXT,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastImport" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "steamId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "coverArtUrl" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "hoursPlayed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "releaseDate" TIMESTAMP(3),
    "steamRating" DOUBLE PRECISION,
    "isFreeToPlay" BOOLEAN NOT NULL DEFAULT false,
    "isDLC" BOOLEAN NOT NULL DEFAULT false,
    "lastPlayedAt" TIMESTAMP(3),
    "notes" TEXT,
    "notesUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "steamAchievementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "unlockedAt" TIMESTAMP(3),
    "rarity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'steam',
    "totalGamesImported" INTEGER NOT NULL DEFAULT 0,
    "newGamesAdded" INTEGER NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "defaultViewType" TEXT NOT NULL DEFAULT 'kanban',
    "language" TEXT NOT NULL DEFAULT 'en',
    "privacyOptIn" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "includeFreeToPlay" BOOLEAN NOT NULL DEFAULT true,
    "monthlyCompletionGoal" INTEGER NOT NULL DEFAULT 0,
    "statusLabels" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityDay" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "ActivityDay_pkey" PRIMARY KEY ("userId","day")
);

-- CreateTable
CREATE TABLE "_GameToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GameToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "User_steamId_idx" ON "User"("steamId");

-- CreateIndex
CREATE INDEX "Game_userId_idx" ON "Game"("userId");

-- CreateIndex
CREATE INDEX "Game_userId_status_idx" ON "Game"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Game_userId_steamId_key" ON "Game"("userId", "steamId");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "Achievement_gameId_idx" ON "Achievement"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_gameId_steamAchievementId_key" ON "Achievement"("gameId", "steamAchievementId");

-- CreateIndex
CREATE INDEX "ImportHistory_userId_idx" ON "ImportHistory"("userId");

-- CreateIndex
CREATE INDEX "ImportHistory_importedAt_idx" ON "ImportHistory"("importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "_GameToTag_B_index" ON "_GameToTag"("B");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDay" ADD CONSTRAINT "ActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToTag" ADD CONSTRAINT "_GameToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToTag" ADD CONSTRAINT "_GameToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
