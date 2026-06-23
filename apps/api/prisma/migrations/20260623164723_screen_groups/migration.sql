-- CreateTable
CREATE TABLE "ScreenGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ScreenGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScreenGroup_projectId_idx" ON "ScreenGroup"("projectId");

-- AddForeignKey
ALTER TABLE "ScreenGroup" ADD CONSTRAINT "ScreenGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Screen" ADD COLUMN "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Screen_groupId_idx" ON "Screen"("groupId");

-- AddForeignKey
ALTER TABLE "Screen" ADD CONSTRAINT "Screen_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ScreenGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
