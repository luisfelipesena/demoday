import { pgTable, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "user", "professor"]);
export const demodayStatusEnum = pgEnum("demoday_status", ["active", "finished", "canceled"]);

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: roleEnum("role").default("user").notNull(),
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
  authors: text("authors"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
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

export const registrationCriteria = pgTable("registration_criteria", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  demoday_id: text("demoday_id")
    .notNull()
    .references(() => demodays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
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

export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email"),
  token: text("token").notNull().unique(),
  type: text("type").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export type RegistrationCriteria = typeof registrationCriteria.$inferSelect;
export type NewRegistrationCriteria = typeof registrationCriteria.$inferInsert;

export type EvaluationCriteria = typeof evaluationCriteria.$inferSelect;
export type NewEvaluationCriteria = typeof evaluationCriteria.$inferInsert;

export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type NewProjectSubmission = typeof projectSubmissions.$inferInsert;

// Relações
export const demodaysRelations = relations(demodays, ({ many }) => ({
  phases: many(demoDayPhases),
}));

export const demoDayPhasesRelations = relations(demoDayPhases, ({ one }) => ({
  demoday: one(demodays, {
    fields: [demoDayPhases.demoday_id],
    references: [demodays.id],
  }),
})); 

export type Invite = {
  id: string;
  email: string;
  token: string;
  accepted: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type NewInvite = Omit<Invite, 'id' | 'accepted' | 'createdAt' | 'updatedAt'>; 