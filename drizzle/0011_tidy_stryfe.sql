ALTER TABLE "project_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "project_categories" CASCADE;--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_category_id_project_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "authors" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD COLUMN "approved" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "professor_evaluations" ADD COLUMN "approval_percentage" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contact_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contact_phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "advisor_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "evaluation_scores" DROP COLUMN "score";--> statement-breakpoint
ALTER TABLE "professor_evaluations" DROP COLUMN "total_score";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "category_id";