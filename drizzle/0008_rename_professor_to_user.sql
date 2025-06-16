-- Rename professor_id column to user_id to allow all users to evaluate
ALTER TABLE "professor_evaluations" RENAME COLUMN "professor_id" TO "user_id"; 