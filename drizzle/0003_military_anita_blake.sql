CREATE TABLE "evaluation_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"evaluation_id" text NOT NULL,
	"criteria_id" text NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professor_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"professor_id" text NOT NULL,
	"total_score" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_id_professor_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."professor_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_criteria_id_evaluation_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_evaluations" ADD CONSTRAINT "professor_evaluations_submission_id_project_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."project_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_evaluations" ADD CONSTRAINT "professor_evaluations_professor_id_user_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;