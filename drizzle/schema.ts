import { pgTable, unique, text, timestamp, foreignKey, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const role = pgEnum("role", ['admin', 'user', 'professor'])


export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: role().default('user').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const evaluationCriteria = pgTable("evaluation_criteria", {
	id: text().primaryKey().notNull(),
	demodayId: text("demoday_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.demodayId],
			foreignColumns: [demodays.id],
			name: "evaluation_criteria_demoday_id_demodays_id_fk"
		}).onDelete("cascade"),
]);

export const projectSubmissions = pgTable("project_submissions", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull(),
	demodayId: text("demoday_id").notNull(),
	status: text().default('submitted').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_submissions_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.demodayId],
			foreignColumns: [demodays.id],
			name: "project_submissions_demoday_id_demodays_id_fk"
		}).onDelete("cascade"),
]);

export const registrationCriteria = pgTable("registration_criteria", {
	id: text().primaryKey().notNull(),
	demodayId: text("demoday_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.demodayId],
			foreignColumns: [demodays.id],
			name: "registration_criteria_demoday_id_demodays_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const votes = pgTable("votes", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	projectId: text("project_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "votes_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "votes_project_id_projects_id_fk"
		}).onDelete("cascade"),
]);

export const projects = pgTable("projects", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "projects_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const demodays = pgTable("demodays", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	createdById: text("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "demodays_created_by_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const demodayPhases = pgTable("demoday_phases", {
	id: text().primaryKey().notNull(),
	demodayId: text("demoday_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	phaseNumber: integer("phase_number").notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.demodayId],
			foreignColumns: [demodays.id],
			name: "demoday_phases_demoday_id_demodays_id_fk"
		}).onDelete("cascade"),
]);
