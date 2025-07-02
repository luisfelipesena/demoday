import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { demodays, projectCategories, projects, projectSubmissions, votes } from "@/server/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface FinalistResult {
  categoryId: string;
  categoryName: string;
  maxFinalists: number;
  selectedFinalists: number;
  finalists: Array<{
    projectId: string;
    projectTitle: string;
    submissionId: string;
    voteCount: number;
  }>;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem selecionar finalistas." },
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

    // Buscar todas as categorias do demoday
    const categories = await db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.demodayId, demodayId));

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma categoria encontrada para este demoday" },
        { status: 400 }
      );
    }

    const results: FinalistResult[] = [];

    // Para cada categoria, selecionar os finalistas baseado nos votos populares
    for (const category of categories) {
      // Buscar projetos aprovados da categoria com contagem de votos populares
      const projectsWithVotes = await db
        .select({
          submissionId: projectSubmissions.id,
          projectId: projects.id,
          projectTitle: projects.title,
          voteCount: count(votes.id),
        })
        .from(projectSubmissions)
        .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
        .leftJoin(
          votes,
          and(
            eq(votes.projectId, projects.id),
            eq(votes.votePhase, "popular")
          )
        )
        .where(
          and(
            eq(projectSubmissions.demoday_id, demodayId),
            eq(projectSubmissions.status, "approved"),
            eq(projects.categoryId, category.id)
          )
        )
        .groupBy(
          projectSubmissions.id,
          projects.id,
          projects.title
        )
        .orderBy(desc(count(votes.id)))
        .limit(category.maxFinalists);

      // Marcar os projetos selecionados como finalistas
      const finalistIds = projectsWithVotes.map((p) => p.submissionId);

      if (finalistIds.length > 0) {
        await db
          .update(projectSubmissions)
          .set({ status: "finalist", updatedAt: new Date() })
          .where(
            and(
              eq(projectSubmissions.demoday_id, demodayId),
              sql`${projectSubmissions.id} IN (${sql.join(
                finalistIds.map((id) => sql`${id}`),
                sql`,`
              )})`
            )
          );
      }

      results.push({
        categoryId: category.id,
        categoryName: category.name,
        maxFinalists: category.maxFinalists,
        selectedFinalists: projectsWithVotes.length,
        finalists: projectsWithVotes.map((p) => ({
          projectId: p.projectId,
          projectTitle: p.projectTitle,
          submissionId: p.submissionId,
          voteCount: Number(p.voteCount) || 0,
        })),
      });
    }

    // Tratar projetos sem categoria usando maxFinalists do demoday
    const uncategorizedProjects = await db
      .select({
        submissionId: projectSubmissions.id,
        projectId: projects.id,
        projectTitle: projects.title,
        voteCount: count(votes.id),
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .leftJoin(
        votes,
        and(
          eq(votes.projectId, projects.id),
          eq(votes.votePhase, "popular")
        )
      )
      .where(
        and(
          eq(projectSubmissions.demoday_id, demodayId),
          eq(projectSubmissions.status, "approved"),
          sql`${projects.categoryId} IS NULL`
        )
      )
      .groupBy(
        projectSubmissions.id,
        projects.id,
        projects.title
      )
      .orderBy(desc(count(votes.id)))
      .limit(demoday.maxFinalists);

    if (uncategorizedProjects.length > 0) {
      const uncategorizedIds = uncategorizedProjects.map((p) => p.submissionId);

      await db
        .update(projectSubmissions)
        .set({ status: "finalist", updatedAt: new Date() })
        .where(
          and(
            eq(projectSubmissions.demoday_id, demodayId),
            sql`${projectSubmissions.id} IN (${sql.join(
              uncategorizedIds.map((id) => sql`${id}`),
              sql`,`
            )})`
          )
        );

      results.push({
        categoryId: "uncategorized",
        categoryName: "Projetos Gerais",
        maxFinalists: demoday.maxFinalists,
        selectedFinalists: uncategorizedProjects.length,
        finalists: uncategorizedProjects.map((p) => ({
          projectId: p.projectId,
          projectTitle: p.projectTitle,
          submissionId: p.submissionId,
          voteCount: Number(p.voteCount) || 0,
        })),
      });
    }

    return NextResponse.json({
      message: "Finalistas selecionados automaticamente com sucesso",
      demodayId,
      results: results,
      totalCategories: results.length,
      totalFinalists: results.reduce((sum, r) => sum + r.selectedFinalists, 0),
    });
  } catch (error) {
    console.error("Error auto-selecting finalists:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 