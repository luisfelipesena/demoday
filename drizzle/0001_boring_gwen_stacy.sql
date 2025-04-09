CREATE TYPE "public"."demoday_status" AS ENUM('active', 'finished', 'canceled');--> statement-breakpoint
ALTER TABLE "demodays" ADD COLUMN "active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "demodays" ADD COLUMN "status" "demoday_status" DEFAULT 'active' NOT NULL;