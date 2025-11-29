-- Migration: Add HLS streaming fields to Content model
-- Run this manually or use: pnpm db:push

-- Add ContentStatus enum
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'ERROR');

-- Rename 'title' to 'name' in contents table
ALTER TABLE "contents" RENAME COLUMN "title" TO "name";

-- Add status column with default value
ALTER TABLE "contents" ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'PENDING';

-- Rename 'url' to 'originalUrl'
ALTER TABLE "contents" RENAME COLUMN "url" TO "originalUrl";

-- Add new URL fields
ALTER TABLE "contents" ADD COLUMN "hlsUrl" TEXT;
ALTER TABLE "contents" ADD COLUMN "thumbnailUrl" TEXT;

-- Add resolution field
ALTER TABLE "contents" ADD COLUMN "resolution" TEXT;

-- Create index on status for faster queries
CREATE INDEX "contents_status_idx" ON "contents"("status");
