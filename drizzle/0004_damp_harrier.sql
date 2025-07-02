DROP TABLE IF EXISTS "password_resets" CASCADE;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"token" text NOT NULL,
	"type" text DEFAULT 'individual' NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);