DROP TABLE "registration_criteria" CASCADE;--> statement-breakpoint
ALTER TABLE "demodays" ADD COLUMN "max_finalists" integer DEFAULT 5 NOT NULL;