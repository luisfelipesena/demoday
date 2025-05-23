ALTER TABLE "invites" ADD COLUMN "role" "role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "used_at" timestamp;--> statement-breakpoint
ALTER TABLE "invites" DROP COLUMN "type";