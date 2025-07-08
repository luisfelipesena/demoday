import { getSessionWithRole, isProfessorOrAdmin } from "@/lib/session-utils";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/server/db";
import {
  demodays,
  evaluationCriteria,
  professorEvaluations,
  projectSubmissions
} from "@/server/db/schema";

// GET report data for all projects
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getSessionWithRole();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isProfessorOrAdmin(session.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get request parameters
    const url = new URL(request.url);
    const demodayId = url.searchParams.get("demodayId");

    // Get demoday data
    let demoday;
    if (demodayId) {
      demoday = await db.query.demodays.findFirst({ where: eq(demodays.id, demodayId) });
    } else {
      // Try to get active demoday first
      demoday = await db.query.demodays.findFirst({ where: eq(demodays.active, true) });
      
      // If no active demoday, get the most recent one
      if (!demoday) {
        const allDemodays = await db.query.demodays.findMany({
          orderBy: (demodays, { desc }) => [desc(demodays.createdAt)],
          limit: 1,
        });
        demoday = allDemodays[0];
      }
    }

    if (!demoday) {
      return NextResponse.json({ 
        error: "No demoday found",
        message: "Nenhum Demoday foi criado ainda. Crie um Demoday primeiro."
      }, { status: 404 });
    }

    // Get all project submissions for this demoday
    const submissions = await db.query.projectSubmissions.findMany({
      where: eq(projectSubmissions.demoday_id, demoday.id),
      with: {
        project: true,
      },
    });

    // Get all evaluation criteria for this demoday
    const criteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, demoday.id),
    });

    // Get all evaluations for this demoday's submissions
    const submissionIds = submissions.map((sub: any) => sub.id);

    if (submissionIds.length === 0) {
      return NextResponse.json({
        demoday,
        submissions: [],
        criteria,
        evaluationSummary: [],
        evaluationDetails: [],
        message: "Nenhum projeto foi submetido para este Demoday ainda.",
      });
    }

    const evaluations = await db.query.professorEvaluations.findMany({
      where: inArray(professorEvaluations.submissionId, submissionIds),
      with: {
        professor: true,
        scores: {
          with: {
            criteria: true,
          },
        },
      },
    });

    // Calculate average approval percentage per project and criteria
    const evaluationSummary = submissions.map((submission: any) => {
      const projectEvaluations = evaluations.filter(
        (evaluation: any) => evaluation.submissionId === submission.id
      );
      const totalEvaluations = projectEvaluations.length;

      // Calculate average approval percentage
      const avgApprovalPercentage = totalEvaluations > 0
        ? projectEvaluations.reduce(
          (sum: number, evaluation: any) => sum + (evaluation.approvalPercentage || 0),
          0
        ) / totalEvaluations
        : 0;

      // Calculate approval percentage per criteria
      const criteriaScores = criteria.map((criterion: any) => {
        const scores = projectEvaluations.flatMap(
          (evaluation: any) => evaluation.scores.filter(
            (score: any) => score.criteriaId === criterion.id
          )
        );

        // Calculate percentage of approvals for this criterion
        const approvalPercentage = scores.length > 0
          ? (scores.filter((score: any) => score.approved === true).length / scores.length) * 100
          : 0;

        return {
          criteriaId: criterion.id,
          criteriaName: criterion.name,
          approvalPercentage: Math.round(approvalPercentage),
        };
      });

      return {
        submissionId: submission.id,
        projectId: submission.projectId,
        projectTitle: submission.project.title,
        totalEvaluations,
        averageTotalScore: Math.round(avgApprovalPercentage), // Mantém o nome para compatibilidade
        criteriaScores,
      };
    });

    // Check if there are any evaluations
    const hasEvaluations = evaluations.length > 0;
    
    // Return detailed data for report generation
    return NextResponse.json({
      demoday,
      submissions,
      criteria,
      evaluationSummary,
      evaluationDetails: evaluations,
      hasEvaluations,
      message: hasEvaluations 
        ? `${evaluations.length} avaliações encontradas para ${submissions.length} projetos.`
        : `${submissions.length} projetos submetidos, mas nenhuma avaliação foi feita ainda.`,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
} 