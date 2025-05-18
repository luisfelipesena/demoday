import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { getSessionWithRole, isProfessorOrAdmin } from "@/lib/session-utils";

import { db } from "@/server/db";
import { 
  demodays, 
  evaluationCriteria, 
  evaluationScores, 
  professorEvaluations, 
  projectSubmissions, 
  projects, 
  users,
  type ProjectSubmission,
  type ProfessorEvaluation
} from "@/server/db/schema";

// Get evaluations for professor
export async function GET() {
  try {
    const session = await getSessionWithRole();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isProfessorOrAdmin(session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get active demoday
    const activeDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.active, true),
    });

    if (!activeDemoday) {
      return NextResponse.json({ error: "No active demoday" }, { status: 404 });
    }

    // Get all project submissions for active demoday
    const submissions = await db.query.projectSubmissions.findMany({
      where: eq(projectSubmissions.demoday_id, activeDemoday.id),
      with: {
        project: true,
      },
    });

    // Get evaluations by current professor
    const evaluations = await db.query.professorEvaluations.findMany({
      where: eq(professorEvaluations.professorId, session.user.id),
    });

    // Get evaluation criteria
    const criteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, activeDemoday.id),
    });

    // Determine which projects have been evaluated
    const submissionMap = submissions.map((submission: any) => {
      const evaluated = evaluations.some(
        (evaluation: ProfessorEvaluation) => evaluation.submissionId === submission.id
      );
      
      return {
        ...submission,
        evaluated,
      };
    });

    return NextResponse.json({ 
      demoday: activeDemoday,
      submissions: submissionMap,
      criteria,
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}

// Submit evaluation for a project
export async function POST(request: Request) {
  try {
    const session = await getSessionWithRole();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isProfessorOrAdmin(session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { submissionId, scores, totalScore } = await request.json();

    if (!submissionId || !scores || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ error: "Invalid evaluation data" }, { status: 400 });
    }

    // Check if submission exists
    const submission = await db.query.projectSubmissions.findFirst({
      where: eq(projectSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check if professor has already evaluated this submission
    const existingEvaluation = await db.query.professorEvaluations.findFirst({
      where: and(
        eq(professorEvaluations.submissionId, submissionId),
        eq(professorEvaluations.professorId, session.user.id)
      ),
    });

    if (existingEvaluation) {
      return NextResponse.json({ error: "Project already evaluated" }, { status: 409 });
    }

    // Create evaluation
    const [evaluation] = await db
      .insert(professorEvaluations)
      .values({
        submissionId,
        professorId: session.user.id,
        totalScore,
      })
      .returning();

    // Create scores
    for (const scoreData of scores) {
      await db.insert(evaluationScores).values({
        evaluationId: evaluation.id,
        criteriaId: scoreData.criteriaId,
        score: scoreData.score,
        comment: scoreData.comment || null,
      });
    }

    return NextResponse.json({ message: "Evaluation submitted", evaluationId: evaluation.id });
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    return NextResponse.json({ error: "Failed to submit evaluation" }, { status: 500 });
  }
} 