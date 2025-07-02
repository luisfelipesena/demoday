DO $$ BEGIN
    ALTER TYPE "public"."role" ADD VALUE 'student';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TYPE "public"."role" ADD VALUE 'external';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "professor_evaluations" DROP CONSTRAINT IF EXISTS "professor_evaluations_professor_id_user_id_fk";
EXCEPTION
    WHEN undefined_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "video_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "demodays" ADD COLUMN IF NOT EXISTS "max_finalists" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "professor_evaluations" ADD COLUMN IF NOT EXISTS "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contact_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contact_phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "advisor" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "work_category" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_pre_registered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "professor_evaluations" ADD CONSTRAINT "professor_evaluations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "professor_evaluations" DROP COLUMN IF EXISTS "professor_id";