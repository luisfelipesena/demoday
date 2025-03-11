import { pgTable, text, timestamp, varchar, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const roleEnum = pgEnum("role", ["admin", "user", "professor"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Disciplina, IC, TCC, Mestrado, Doutorado
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

// Tipos para TS
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

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