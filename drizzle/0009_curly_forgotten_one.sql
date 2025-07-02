-- Migration: Add star rating support to votes table
-- For final voting phase, we need to support 1-5 star ratings
-- Popular voting will continue to use binary (weight-based) system

ALTER TABLE "votes" ADD COLUMN "rating" integer;

-- Add comment for clarity
COMMENT ON COLUMN "votes"."rating" IS 'Star rating (1-5) for final voting phase. NULL for popular voting (binary).'; 