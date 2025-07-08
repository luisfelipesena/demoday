import { pgTable, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "student_ufba", "student_external", "professor"]);
export const demodayStatusEnum = pgEnum("demoday_status", ["active", "finished", "canceled"]);

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: roleEnum("role").default("student_ufba").notNull(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Disciplina, IC, TCC, Mestrado, Doutorado
  videoUrl: text("video_url"),
  repositoryUrl: text("repository_url"),
  developmentYear: text("development_year"),
  authors: text("authors").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  advisorName: text("advisor_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const votePhaseEnum = pgEnum("vote_phase", ["popular", "final"]);

export const votes = pgTable("votes", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  voterRole: roleEnum("voter_role").notNull(),
  votePhase: votePhaseEnum("vote_phase").default("popular").notNull(),
  weight: integer("weight").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demodays = pgTable("demodays", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  active: boolean("active").default(false).notNull(),
  status: demodayStatusEnum("status").default("active").notNull(),
  maxFinalists: integer("max_finalists").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const demoDayPhases = pgTable("demoday_phases", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  demoday_id: text("demoday_id")
    .notNull()
    .references(() => demodays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  phaseNumber: integer("phase_number").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



export const evaluationCriteria = pgTable("evaluation_criteria", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  demoday_id: text("demoday_id")
    .notNull()
    .references(() => demodays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectSubmissions = pgTable("project_submissions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  demoday_id: text("demoday_id")
    .notNull()
    .references(() => demodays.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("submitted"), // submitted, approved, rejected, finalist, winner
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New tables for professor evaluations
export const professorEvaluations = pgTable("professor_evaluations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => projectSubmissions.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  approvalPercentage: integer("approval_percentage").notNull(), // Percentual de critérios aprovados (0-100)
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const evaluationScores = pgTable("evaluation_scores", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => professorEvaluations.id, { onDelete: "cascade" }),
  criteriaId: text("criteria_id")
    .notNull()
    .references(() => evaluationCriteria.id, { onDelete: "cascade" }),
  approved: boolean("approved").notNull(), // SIM ou NÃO para o critério
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela invites removida - cadastro simplificado sem convites

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  demodayId: text("demoday_id")
    .notNull()
    .references(() => demodays.id, { onDelete: "cascade" }),
  participatedEvaluation: boolean("participated_evaluation").default(false).notNull(),
  attendedEvent: boolean("attended_event").default(false).notNull(),
  generatedAt: timestamp("generated_at"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFeedback = pgTable("user_feedback", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  demodayId: text("demoday_id")
    .notNull()
    .references(() => demodays.id, { onDelete: "cascade" }),
  usabilityRating: integer("usability_rating").notNull(),
  comments: text("comments"),
  suggestions: text("suggestions"),
  wouldParticipateAgain: boolean("would_participate_again"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tipos para TS
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

// New type definitions
export type Demoday = typeof demodays.$inferSelect;
export type NewDemoday = typeof demodays.$inferInsert;

export type DemoDayPhase = typeof demoDayPhases.$inferSelect;
export type NewDemoDayPhase = typeof demoDayPhases.$inferInsert;



export type EvaluationCriteria = typeof evaluationCriteria.$inferSelect;
export type NewEvaluationCriteria = typeof evaluationCriteria.$inferInsert;

export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type NewProjectSubmission = typeof projectSubmissions.$inferInsert;

export type ProfessorEvaluation = typeof professorEvaluations.$inferSelect;
export type NewProfessorEvaluation = typeof professorEvaluations.$inferInsert;

export type EvaluationScore = typeof evaluationScores.$inferSelect;
export type NewEvaluationScore = typeof evaluationScores.$inferInsert;



export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

export type UserFeedback = typeof userFeedback.$inferSelect;
export type NewUserFeedback = typeof userFeedback.$inferInsert;

// Relações
export const demodaysRelations = relations(demodays, ({ many }) => ({
  phases: many(demoDayPhases),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  submissions: many(projectSubmissions),
  votes: many(votes),
}));

export const demoDayPhasesRelations = relations(demoDayPhases, ({ one }) => ({
  demoday: one(demodays, {
    fields: [demoDayPhases.demoday_id],
    references: [demodays.id],
  }),
}));

export const projectSubmissionsRelations = relations(projectSubmissions, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectSubmissions.projectId],
    references: [projects.id],
  }),
  demoday: one(demodays, {
    fields: [projectSubmissions.demoday_id],
    references: [demodays.id],
  }),
  evaluations: many(professorEvaluations),
}));

export const professorEvaluationsRelations = relations(professorEvaluations, ({ one, many }) => ({
  submission: one(projectSubmissions, {
    fields: [professorEvaluations.submissionId],
    references: [projectSubmissions.id],
  }),
  professor: one(users, {
    fields: [professorEvaluations.userId],
    references: [users.id],
  }),
  scores: many(evaluationScores),
}));

export const evaluationScoresRelations = relations(evaluationScores, ({ one }) => ({
  evaluation: one(professorEvaluations, {
    fields: [evaluationScores.evaluationId],
    references: [professorEvaluations.id],
  }),
  criteria: one(evaluationCriteria, {
    fields: [evaluationScores.criteriaId],
    references: [evaluationCriteria.id],
  }),
})); 

// Tipos Invite removidos - sistema de convites descontinuado 