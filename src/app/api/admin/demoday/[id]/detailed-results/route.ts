import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  demodays,
  evaluationCriteria,
  evaluationScores,
  professorEvaluations,
  projectCategories,
  projects,
  projectSubmissions,
  users,
  votes
} from "@/server/db/schema";
import { and, count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface ProjectEvaluation {
  id: string;
  evaluatorName: string;
  evaluatorRole: string;
  totalScore: number;
  scores: Array<{
    criterionId: string;
    criterionName: string;
    score: number;
    maxScore: number;
  }>;
  createdAt: string;
}

interface DetailedProjectResult {
  id: string;
  title: string;
  description: string;
  type: string;
  authors: string | null;
  status: string;
  categoryId: string;
  categoryName: string;
  submissionId: string;
  popularVoteCount: number;
  finalVoteCount: number;
  finalWeightedScore: number;
  evaluations: ProjectEvaluation[];
  averageEvaluationScore: number;
  totalEvaluations: number;
  createdAt: string;
}

interface AdminResultsData {
  demodayName: string;
  projects: DetailedProjectResult[];
  categories: Array<{
    id: string;
    name: string;
    maxFinalists: number;
  }>;
  overallStats: {
    totalProjects: number;
    totalEvaluations: number;
    totalVotes: number;
    averageScore: number;
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar estes dados." },
        { status: 403 }
      );
    }

    const params = await context.params;
    const demodayId = params.id;

    // Buscar demoday
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!demoday) {
      return NextResponse.json({ error: "Demoday not found" }, { status: 404 });
    }

    // Buscar categorias
    const categories = await db.query.projectCategories.findMany({
      where: eq(projectCategories.demodayId, demodayId),
    });

    // Buscar todos os projetos submetidos no demoday
    const submissions = await db
      .select({
        submissionId: projectSubmissions.id,
        status: projectSubmissions.status,
        createdAt: projectSubmissions.createdAt,
        project: projects,
        category: projectCategories,
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .leftJoin(projectCategories, eq(projects.categoryId, projectCategories.id))
      .where(eq(projectSubmissions.demoday_id, demodayId));

    const detailedProjects: DetailedProjectResult[] = [];

    for (const submission of submissions) {
      if (!submission.project) continue;

      // Calcular votos populares
      const popularVotes = await db
        .select({ count: count() })
        .from(votes)
        .where(
          and(
            eq(votes.projectId, submission.project.id),
            eq(votes.votePhase, "popular")
          )
        );
      const popularVoteCount = popularVotes[0]?.count || 0;

      // Calcular votos finais
      const finalVotes = await db
        .select({ count: count() })
        .from(votes)
        .where(
          and(
            eq(votes.projectId, submission.project.id),
            eq(votes.votePhase, "final")
          )
        );
      const finalVoteCount = finalVotes[0]?.count || 0;

      // Calcular pontuação final ponderada
      const allVotes = await db
        .select({
          weight: votes.weight,
          phase: votes.votePhase,
          role: votes.voterRole,
        })
        .from(votes)
        .where(eq(votes.projectId, submission.project.id));

      let finalWeightedScore = 0;
      allVotes.forEach((vote) => {
        if (vote.phase === "popular") {
          finalWeightedScore += Number(vote.weight) || 1;
        } else if (vote.phase === "final") {
          const weight = (vote.role === "professor" || vote.role === "admin") ? 3 : 1;
          finalWeightedScore += weight;
        }
      });

      // Buscar avaliações detalhadas
      const projectEvaluations = await db
        .select({
          evaluation: professorEvaluations,
          evaluator: users,
          scores: evaluationScores,
          criteria: evaluationCriteria,
        })
        .from(professorEvaluations)
        .innerJoin(users, eq(professorEvaluations.userId, users.id))
        .leftJoin(evaluationScores, eq(evaluationScores.evaluationId, professorEvaluations.id))
        .leftJoin(evaluationCriteria, eq(evaluationScores.criteriaId, evaluationCriteria.id))
        .where(eq(professorEvaluations.submissionId, submission.submissionId));

      // Organizar avaliações por avaliador
      const evaluationsMap = new Map<string, ProjectEvaluation>();

      for (const evalData of projectEvaluations) {
        const evalId = evalData.evaluation.id;

        if (!evaluationsMap.has(evalId)) {
          evaluationsMap.set(evalId, {
            id: evalId,
            evaluatorName: evalData.evaluator.name || "Anônimo",
            evaluatorRole: evalData.evaluator.role || "user",
            totalScore: evalData.evaluation.totalScore || 0,
            scores: [],
            createdAt: evalData.evaluation.createdAt.toISOString(),
          });
        }

        if (evalData.scores && evalData.criteria) {
          evaluationsMap.get(evalId)!.scores.push({
            criterionId: evalData.criteria.id,
            criterionName: evalData.criteria.name,
            score: evalData.scores.score,
            maxScore: 10, // Default max score since it's not in the schema
          });
        }
      }

      const evaluationsArray = Array.from(evaluationsMap.values());

      // Calcular média das avaliações
      const averageEvaluationScore = evaluationsArray.length > 0
        ? evaluationsArray.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / evaluationsArray.length
        : 0;

      detailedProjects.push({
        id: submission.project.id,
        title: submission.project.title,
        description: submission.project.description || "",
        type: submission.project.type,
        authors: submission.project.authors,
        status: submission.status,
        categoryId: submission.category?.id || "",
        categoryName: submission.category?.name || "Sem categoria",
        submissionId: submission.submissionId,
        popularVoteCount,
        finalVoteCount,
        finalWeightedScore,
        evaluations: evaluationsArray,
        averageEvaluationScore,
        totalEvaluations: evaluationsArray.length,
        createdAt: submission.createdAt.toISOString(),
      });
    }

    // Calcular estatísticas gerais
    const totalProjects = detailedProjects.length;
    const totalEvaluations = detailedProjects.reduce((sum, p) => sum + p.totalEvaluations, 0);
    const totalVotes = detailedProjects.reduce((sum, p) => sum + p.popularVoteCount + p.finalVoteCount, 0);
    const averageScore = totalEvaluations > 0
      ? detailedProjects.reduce((sum, p) => sum + (p.averageEvaluationScore * p.totalEvaluations), 0) / totalEvaluations
      : 0;

    const responseData: AdminResultsData = {
      demodayName: demoday.name,
      projects: detailedProjects.sort((a, b) => b.finalWeightedScore - a.finalWeightedScore),
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        maxFinalists: cat.maxFinalists,
      })),
      overallStats: {
        totalProjects,
        totalEvaluations,
        totalVotes,
        averageScore,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching admin detailed results:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 