ALTER TABLE "invites" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invites" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'student_ufba';