import { getSessionWithRole, isProfessorOrAdmin } from "@/lib/session-utils";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/server/db";
import {
  demoDayPhases,
  demodays,
  evaluationCriteria,
  evaluationScores,
  professorEvaluations,
  projectSubmissions,
  type DemoDayPhase,
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

    const activeDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.active, true),
    });

    if (!activeDemoday) {
      return NextResponse.json({ error: "No active demoday" }, { status: 404 });
    }

    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, activeDemoday.id),
      orderBy: demoDayPhases.phaseNumber,
    });

    const now = new Date();
    let currentPhase = null;
    let isEvaluationPeriod = false;

    for (const phase of phases) {
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);

      if (now >= startDate && now <= endDate) {
        currentPhase = phase;
        break;
      }
    }

    const evaluationPhase = phases.find((phase: DemoDayPhase) => phase.phaseNumber === 2);

    if (evaluationPhase) {
      const startDate = new Date(evaluationPhase.startDate);
      const endDate = new Date(evaluationPhase.endDate);
      isEvaluationPeriod = now >= startDate && now <= endDate;
    }

    const submissions = await db.query.projectSubmissions.findMany({
      where: and(
        eq(projectSubmissions.demoday_id, activeDemoday.id),
        eq(projectSubmissions.status, "submitted")
      ),
      with: {
        project: true,
      },
    });

    const evaluations = await db.query.professorEvaluations.findMany({
      where: eq(professorEvaluations.professorId, session.user.id),
    });

    const criteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, activeDemoday.id),
    });

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
      currentPhase,
      evaluationPhase,
      isEvaluationPeriod,
      phases,
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

    const submission = await db.query.projectSubmissions.findFirst({
      where: eq(projectSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const activeDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, submission.demoday_id),
    });

    if (!activeDemoday) {
      return NextResponse.json({ error: "Demoday not found" }, { status: 404 });
    }

    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, activeDemoday.id),
      orderBy: demoDayPhases.phaseNumber,
    });

    const evaluationPhase = phases.find((phase: DemoDayPhase) => phase.phaseNumber === 2);

    if (!evaluationPhase) {
      return NextResponse.json({
        error: "Evaluation phase not configured for this Demoday"
      }, { status: 400 });
    }

    const now = new Date();
    const startDate = new Date(evaluationPhase.startDate);
    const endDate = new Date(evaluationPhase.endDate);

    if (now < startDate || now > endDate) {
      return NextResponse.json({
        error: "Outside evaluation period",
        period: {
          start: evaluationPhase.startDate,
          end: evaluationPhase.endDate,
        }
      }, { status: 400 });
    }

    const existingEvaluation = await db.query.professorEvaluations.findFirst({
      where: and(
        eq(professorEvaluations.submissionId, submissionId),
        eq(professorEvaluations.professorId, session.user.id)
      ),
    });

    if (existingEvaluation) {
      return NextResponse.json({ error: "Project already evaluated" }, { status: 409 });
    }

    const [evaluation] = await db
      .insert(professorEvaluations)
      .values({
        submissionId,
        professorId: session.user.id,
        totalScore,
      })
      .returning();

    for (const scoreData of scores) {
      await db.insert(evaluationScores).values({
        evaluationId: evaluation?.id || "",
        criteriaId: scoreData.criteriaId,
        score: scoreData.score,
        comment: scoreData.comment || null,
      });
    }

    return NextResponse.json({ message: "Evaluation submitted", evaluationId: evaluation?.id || "" });
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    return NextResponse.json({ error: "Failed to submit evaluation" }, { status: 500 });
  }
} 