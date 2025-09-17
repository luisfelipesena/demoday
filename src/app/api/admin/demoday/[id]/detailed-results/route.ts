import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { 
  demodays, 
  projects, 
  projectSubmissions, 
  votes, 
  professorEvaluations
} from "@/server/db/schema";
import { and, avg, count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
  evaluations: Array<{
    id: string;
    evaluatorName: string;
    evaluatorRole: string;
    approvalPercentage: number;
    scores: Array<{
      criterionId: string;
      criterionName: string;
      score: number;
      maxScore: number;
    }>;
    createdAt: string;
  }>;
  averageEvaluationScore: number;
  totalEvaluations: number;
  createdAt: string;
}

interface DemodayDetailedResults {
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
        { error: "Acesso negado. Apenas administradores podem acessar resultados detalhados." },
        { status: 403 }
      );
    }

    const params = await context.params;
    const demodayId = params.id;

    // Verificar se o demoday existe
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!demoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todos os projetos submetidos no demoday
    const allSubmissions = await db
      .select({
        submissionId: projectSubmissions.id,
        status: projectSubmissions.status,
        project: projects,
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .where(eq(projectSubmissions.demoday_id, demodayId));

    const detailedResults: DetailedProjectResult[] = [];

    for (const submission of allSubmissions) {
      if (!submission.project) continue;

      const projectId = submission.project.id;

      // Contar votos populares
      const popularVotesResult = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.projectId, projectId),
          eq(votes.votePhase, "popular")
        ));
      const popularVoteCount = popularVotesResult[0]?.count || 0;

      // Contar votos finais
      const finalVotesResult = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.projectId, projectId),
          eq(votes.votePhase, "final")
        ));
      const finalVoteCount = finalVotesResult[0]?.count || 0;

      // Contar avaliações de professores
      const evaluationsResult = await db
        .select({ count: count() })
        .from(professorEvaluations)
        .where(eq(professorEvaluations.submissionId, submission.submissionId));
      const totalEvaluations = evaluationsResult[0]?.count || 0;

      // Calcular média das avaliações (taxa de aprovação)
      const avgScoreResult = await db
        .select({ avg: avg(professorEvaluations.approvalPercentage) })
        .from(professorEvaluations)
        .where(eq(professorEvaluations.submissionId, submission.submissionId));
      const averageEvaluationScore = Number(avgScoreResult[0]?.avg) || 0;

      // Calcular pontuação total ponderada (popular + final*3 + avaliações)
      const finalWeightedScore = popularVoteCount + (finalVoteCount * 3) + averageEvaluationScore;

      detailedResults.push({
        id: projectId,
        title: submission.project.title,
        description: submission.project.description || "",
        type: submission.project.type,
        authors: submission.project.authors,
        status: submission.status,
        categoryId: "default", // Placeholder for now since categories were removed
        categoryName: "Geral", // Placeholder for now
        submissionId: submission.submissionId,
        popularVoteCount: popularVoteCount,
        finalVoteCount: finalVoteCount,
        finalWeightedScore: finalWeightedScore,
        evaluations: [], // Will be populated with detailed evaluations if needed
        averageEvaluationScore: averageEvaluationScore,
        totalEvaluations: totalEvaluations,
        createdAt: submission.project.createdAt.toISOString(),
      });
    }

    // Ordenar por pontuação total
    detailedResults.sort((a, b) => b.finalWeightedScore - a.finalWeightedScore);

    // Calcular estatísticas gerais
    const totalProjects = detailedResults.length;

    const allVotesResult = await db
      .select({ count: count() })
      .from(votes)
      .innerJoin(projectSubmissions, eq(votes.projectId, projectSubmissions.projectId))
      .where(eq(projectSubmissions.demoday_id, demodayId));
    const totalVotes = allVotesResult[0]?.count || 0;

    const allEvaluationsResult = await db
      .select({ count: count() })
      .from(professorEvaluations)
      .innerJoin(projectSubmissions, eq(professorEvaluations.submissionId, projectSubmissions.id))
      .where(eq(projectSubmissions.demoday_id, demodayId));
    const totalEvaluations = allEvaluationsResult[0]?.count || 0;

    // Calcular média geral das avaliações
    const averageScore = totalProjects > 0 
      ? detailedResults.reduce((sum, project) => sum + project.averageEvaluationScore, 0) / totalProjects
      : 0;

    const responseData: DemodayDetailedResults = {
      demodayName: demoday.name,
      projects: detailedResults,
      categories: [
        {
          id: "default",
          name: "Geral",
          maxFinalists: demoday.maxFinalists || 10
        }
      ],
      overallStats: {
        totalProjects,
        totalEvaluations,
        totalVotes,
        averageScore,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching detailed results:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 