ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "role" "role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "used_at" timestamp;--> statement-breakpoint
ALTER TABLE "invites" DROP COLUMN IF EXISTS "type";