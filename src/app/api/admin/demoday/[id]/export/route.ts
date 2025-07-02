import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  demodays,
  professorEvaluations,
  projectCategories,
  projects,
  projectSubmissions,
  users,
  votes
} from "@/server/db/schema";
import { and, count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem exportar dados." },
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

    // Buscar todos os dados para export
    const submissions = await db
      .select({
        submissionId: projectSubmissions.id,
        status: projectSubmissions.status,
        createdAt: projectSubmissions.createdAt,
        project: projects,
        category: projectCategories,
        author: users,
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .innerJoin(users, eq(projects.userId, users.id))
      .leftJoin(projectCategories, eq(projects.categoryId, projectCategories.id))
      .where(eq(projectSubmissions.demoday_id, demodayId));

    // Preparar dados para CSV
    const csvData = [];

    // Header
    csvData.push([
      "ID Projeto",
      "Título",
      "Descrição",
      "Tipo",
      "Categoria",
      "Autores",
      "Autor Principal",
      "Email Autor",
      "Status",
      "Votos Populares",
      "Votos Finais",
      "Pontuação Final",
      "Número Avaliações",
      "Nota Média Avaliações",
      "Data Submissão",
      "URL Vídeo",
      "URL Repositório",
      "Ano Desenvolvimento"
    ]);

    // Dados
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

      // Buscar avaliações
      const evaluationsData = await db
        .select({
          totalScore: professorEvaluations.totalScore,
        })
        .from(professorEvaluations)
        .where(eq(professorEvaluations.submissionId, submission.submissionId));

      const totalEvaluations = evaluationsData.length;
      const averageScore = totalEvaluations > 0
        ? evaluationsData.reduce((sum, evaluation) => sum + (evaluation.totalScore || 0), 0) / totalEvaluations
        : 0;

      csvData.push([
        submission.project.id,
        submission.project.title,
        submission.project.description?.replace(/"/g, '""') || "", // Escape quotes
        submission.project.type,
        submission.category?.name || "Sem categoria",
        submission.project.authors || "",
        submission.author?.name || "",
        submission.author?.email || "",
        submission.status,
        popularVoteCount.toString(),
        finalVoteCount.toString(),
        finalWeightedScore.toString(),
        totalEvaluations.toString(),
        averageScore.toFixed(2),
        submission.createdAt.toISOString(),
        submission.project.videoUrl || "",
        submission.project.repositoryUrl || "",
        submission.project.developmentYear || ""
      ]);
    }

    // Converter para CSV
    const csvContent = csvData
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    // Retornar como download
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="demoday-${demodayId}-export.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting demoday data:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 