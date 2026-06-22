-- AlterTable
ALTER TABLE "Template" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Template_shareToken_key" ON "Template"("shareToken");
