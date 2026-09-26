-- Persist the provider identifier separately from the display/proxy URL.
-- Nullable so existing seeded and legacy external media remain unchanged.
ALTER TABLE "Media" ADD COLUMN "driveFileId" TEXT;

CREATE INDEX "Media_driveFileId_idx" ON "Media"("driveFileId");
