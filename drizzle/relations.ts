import { relations } from "drizzle-orm/relations";
import { demodays, evaluationCriteria, projects, projectSubmissions, registrationCriteria, users, sessions, votes, demodayPhases } from "./schema";

export const evaluationCriteriaRelations = relations(evaluationCriteria, ({one}) => ({
	demoday: one(demodays, {
		fields: [evaluationCriteria.demodayId],
		references: [demodays.id]
	}),
}));

export const demodaysRelations = relations(demodays, ({one, many}) => ({
	evaluationCriteria: many(evaluationCriteria),
	projectSubmissions: many(projectSubmissions),
	registrationCriteria: many(registrationCriteria),
	user: one(users, {
		fields: [demodays.createdById],
		references: [users.id]
	}),
	demodayPhases: many(demodayPhases),
}));

export const projectSubmissionsRelations = relations(projectSubmissions, ({one}) => ({
	project: one(projects, {
		fields: [projectSubmissions.projectId],
		references: [projects.id]
	}),
	demoday: one(demodays, {
		fields: [projectSubmissions.demodayId],
		references: [demodays.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	projectSubmissions: many(projectSubmissions),
	votes: many(votes),
	user: one(users, {
		fields: [projects.userId],
		references: [users.id]
	}),
}));

export const registrationCriteriaRelations = relations(registrationCriteria, ({one}) => ({
	demoday: one(demodays, {
		fields: [registrationCriteria.demodayId],
		references: [demodays.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	votes: many(votes),
	projects: many(projects),
	demodays: many(demodays),
}));

export const votesRelations = relations(votes, ({one}) => ({
	user: one(users, {
		fields: [votes.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [votes.projectId],
		references: [projects.id]
	}),
}));

export const demodayPhasesRelations = relations(demodayPhases, ({one}) => ({
	demoday: one(demodays, {
		fields: [demodayPhases.demodayId],
		references: [demodays.id]
	}),
}));