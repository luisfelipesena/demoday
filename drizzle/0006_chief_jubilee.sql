DO $$ BEGIN
    CREATE TYPE "public"."vote_phase" AS ENUM('popular', 'final');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"demoday_id" text NOT NULL,
	"participated_evaluation" boolean DEFAULT false NOT NULL,
	"attended_event" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"max_finalists" integer DEFAULT 5 NOT NULL,
	"demoday_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"demoday_id" text NOT NULL,
	"usability_rating" integer NOT NULL,
	"comments" text,
	"suggestions" text,
	"would_participate_again" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "category_id" text;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "voter_role" "role" NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "vote_phase" "vote_phase" DEFAULT 'popular' NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "weight" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_demoday_id_demodays_id_fk" FOREIGN KEY ("demoday_id") REFERENCES "public"."demodays"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "project_categories" ADD CONSTRAINT "project_categories_demoday_id_demodays_id_fk" FOREIGN KEY ("demoday_id") REFERENCES "public"."demodays"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_demoday_id_demodays_id_fk" FOREIGN KEY ("demoday_id") REFERENCES "public"."demodays"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_project_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."project_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;