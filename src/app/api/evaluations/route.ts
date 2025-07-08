import { getSessionWithRole, isProfessorOrAdmin } from "@/lib/session-utils";
import { and, eq, inArray } from "drizzle-orm";
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

// Get evaluations for admin only
export async function GET() {
  try {
    const session = await getSessionWithRole();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se o usuário é administrador
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
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

    // Buscar TODAS as submissões do demoday (independente do status)
    // Para triagem, precisamos ver tanto as pendentes quanto as já avaliadas
    const submissions = await db.query.projectSubmissions.findMany({
      where: eq(projectSubmissions.demoday_id, activeDemoday.id),
      with: {
        project: true,
      },
    });

    // Buscar todas as avaliações das submissões deste demoday
    const submissionIds = submissions.map(s => s.id);
    const evaluations = submissionIds.length > 0 
      ? await db.query.professorEvaluations.findMany({
          where: inArray(professorEvaluations.submissionId, submissionIds),
        })
      : [];

    const criteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, activeDemoday.id),
    });

    const submissionMap = submissions.map((submission: any) => {
      const evaluation = evaluations.find(
        (evaluation: ProfessorEvaluation) => evaluation.submissionId === submission.id
      );
      const evaluated = !!evaluation;

      return {
        ...submission,
        evaluated,
        evaluation: evaluation || null, // Incluir dados da avaliação se existir
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

// Submit evaluation for a project (admin only during evaluation phase)
export async function POST(request: Request) {
  try {
    const session = await getSessionWithRole();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se o usuário é administrador
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    const { submissionId, scores } = await request.json();

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
        error: "Triagem phase not configured for this Demoday"
      }, { status: 400 });
    }

    const now = new Date();
    const startDate = new Date(evaluationPhase.startDate);
    const endDate = new Date(evaluationPhase.endDate);

    if (now < startDate || now > endDate) {
      return NextResponse.json({
        error: "Outside triagem period",
        period: {
          start: evaluationPhase.startDate,
          end: evaluationPhase.endDate,
        }
      }, { status: 400 });
    }

    const existingEvaluation = await db.query.professorEvaluations.findFirst({
      where: and(
        eq(professorEvaluations.submissionId, submissionId),
        eq(professorEvaluations.userId, session.user.id)
      ),
    });

    if (existingEvaluation) {
      return NextResponse.json({ error: "Project already evaluated" }, { status: 409 });
    }

    // Calcular o percentual de aprovação baseado nos critérios aprovados
    const approvedCount = scores.filter((score: any) => score.approved === true).length;
    const totalCount = scores.length;
    const approvalPercentage = Math.round((approvedCount / totalCount) * 100);

    const [evaluation] = await db
      .insert(professorEvaluations)
      .values({
        submissionId,
        userId: session.user.id,
        approvalPercentage,
      })
      .returning();

    for (const scoreData of scores) {
      await db.insert(evaluationScores).values({
        evaluationId: evaluation?.id || "",
        criteriaId: scoreData.criteriaId,
        approved: scoreData.approved,
        comment: scoreData.comment || null,
      });
    }

    // Automatically approve the project after evaluation is completed (only if percentage >= 50%)
    if (approvalPercentage >= 50) {
      await db
        .update(projectSubmissions)
        .set({ status: "approved" })
        .where(eq(projectSubmissions.id, submissionId));
    } else {
      await db
        .update(projectSubmissions)
        .set({ status: "rejected" })
        .where(eq(projectSubmissions.id, submissionId));
    }

    return NextResponse.json({ 
      message: "Triagem submitted successfully", 
      evaluationId: evaluation?.id || "",
      approvalPercentage
    });
  } catch (error) {
    console.error("Error submitting triagem:", error);
    return NextResponse.json({ error: "Failed to submit triagem" }, { status: 500 });
  }
} 