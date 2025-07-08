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

interface ProjectDetailedResult {
  projectId: string;
  title: string;
  type: string;
  authors: string | null;
  status: string;
  popularVotes: number;
  finalVotes: number;
  professorEvaluations: number;
  averageEvaluationScore: number;
  totalWeightedScore: number;
}

interface DemodayDetailedResults {
  demodayName: string;
  projects: ProjectDetailedResult[];
  totalProjects: number;
  totalParticipants: number;
  totalVotes: number;
  totalEvaluations: number;
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

    const detailedResults: ProjectDetailedResult[] = [];

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
      const popularVotes = popularVotesResult[0]?.count || 0;

      // Contar votos finais
      const finalVotesResult = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.projectId, projectId),
          eq(votes.votePhase, "final")
        ));
      const finalVotes = finalVotesResult[0]?.count || 0;

      // Contar avaliações de professores
      const evaluationsResult = await db
        .select({ count: count() })
        .from(professorEvaluations)
        .where(eq(professorEvaluations.submissionId, submission.submissionId));
      const professorEvaluationsCount = evaluationsResult[0]?.count || 0;

      // Calcular média das avaliações (taxa de aprovação)
      const avgScoreResult = await db
        .select({ avg: avg(professorEvaluations.approvalPercentage) })
        .from(professorEvaluations)
        .where(eq(professorEvaluations.submissionId, submission.submissionId));
      const averageEvaluationScore = Number(avgScoreResult[0]?.avg) || 0;

      // Calcular pontuação total ponderada (popular + final*3 + avaliações)
      const totalWeightedScore = popularVotes + (finalVotes * 3) + averageEvaluationScore;

      detailedResults.push({
        projectId: projectId,
        title: submission.project.title,
        type: submission.project.type,
        authors: submission.project.authors,
        status: submission.status,
        popularVotes: popularVotes,
        finalVotes: finalVotes,
        professorEvaluations: professorEvaluationsCount,
        averageEvaluationScore: averageEvaluationScore,
        totalWeightedScore: totalWeightedScore,
      });
    }

    // Ordenar por pontuação total
    detailedResults.sort((a, b) => b.totalWeightedScore - a.totalWeightedScore);

    // Calcular estatísticas gerais
    const totalProjects = detailedResults.length;
    const uniqueParticipants = new Set(allSubmissions.map(s => s.project?.userId));
    const totalParticipants = uniqueParticipants.size;

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

    const responseData: DemodayDetailedResults = {
      demodayName: demoday.name,
      projects: detailedResults,
      totalProjects,
      totalParticipants,
      totalVotes,
      totalEvaluations,
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