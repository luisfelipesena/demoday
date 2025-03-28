// Import and re-export everything from the server schema
import * as serverSchema from "../src/server/db/schema";

// Re-export all server schema definitions to maintain backward compatibility
export const role = serverSchema.roleEnum;
export const users = serverSchema.users;
export const evaluationCriteria = serverSchema.evaluationCriteria;
export const projectSubmissions = serverSchema.projectSubmissions;
export const registrationCriteria = serverSchema.registrationCriteria;
export const sessions = serverSchema.sessions;
export const votes = serverSchema.votes;
export const projects = serverSchema.projects;
export const demodayStatus = serverSchema.demodayStatusEnum;
export const demodays = serverSchema.demodays;
export const demodayPhases = serverSchema.demoDayPhases;

// Re-export type definitions
export type {
	User,
	NewUser,
	Project,
	NewProject,
	Vote,
	NewVote,
	Demoday,
	NewDemoday,
	DemoDayPhase,
	NewDemoDayPhase,
	RegistrationCriteria,
	NewRegistrationCriteria,
	EvaluationCriteria,
	NewEvaluationCriteria,
	ProjectSubmission,
	NewProjectSubmission,
} from "../src/server/db/schema";
