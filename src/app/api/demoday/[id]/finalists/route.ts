import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { projectCategories, projects, projectSubmissions, votes } from "@/server/db/schema";
import { and, count, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

    const results = [];

    // Para cada categoria, selecionar os finalistas
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
        .orderBy(sql`count(${votes.id}) DESC`)
        .limit(category.maxFinalists);

      // Marcar os projetos selecionados como finalistas
      const finalistIds = projectsWithVotes.map((p: { submissionId: string }) => p.submissionId);

      if (finalistIds.length > 0) {
        await db
          .update(projectSubmissions)
          .set({ status: "finalist", updatedAt: new Date() })
          .where(
            and(
              eq(projectSubmissions.demoday_id, demodayId),
              sql`${projectSubmissions.id} IN (${sql.join(finalistIds.map((id: string) => sql`${id}`), sql`,`)})`
            )
          );
      }

      results.push({
        categoryId: category.id,
        categoryName: category.name,
        maxFinalists: category.maxFinalists,
        selectedFinalists: projectsWithVotes.length,
        finalists: projectsWithVotes,
      });
    }

    return NextResponse.json({
      message: "Finalistas selecionados automaticamente com sucesso",
      results: results,
    });
  } catch (error) {
    console.error("Error selecting finalists:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const demodayId = params.id;

    // Buscar finalistas por categoria
    const finalistsByCategory = await db
      .select({
        categoryId: projectCategories.id,
        categoryName: projectCategories.name,
        maxFinalists: projectCategories.maxFinalists,
        projectId: projects.id,
        projectTitle: projects.title,
        projectDescription: projects.description,
        submissionId: projectSubmissions.id,
        voteCount: count(votes.id),
      })
      .from(projectCategories)
      .leftJoin(projects, eq(projects.categoryId, projectCategories.id))
      .leftJoin(
        projectSubmissions,
        and(
          eq(projectSubmissions.projectId, projects.id),
          eq(projectSubmissions.demoday_id, demodayId),
          eq(projectSubmissions.status, "finalist")
        )
      )
      .leftJoin(
        votes,
        and(
          eq(votes.projectId, projects.id),
          eq(votes.votePhase, "popular")
        )
      )
      .where(eq(projectCategories.demodayId, demodayId))
      .groupBy(
        projectCategories.id,
        projectCategories.name,
        projectCategories.maxFinalists,
        projects.id,
        projects.title,
        projects.description,
        projectSubmissions.id
      )
      .orderBy(projectCategories.name, sql`count(${votes.id}) DESC`);

    // Organizar dados por categoria
    const categorizedFinalists: any = {};

    finalistsByCategory.forEach((row: {
      categoryId: string;
      categoryName: string;
      maxFinalists: number;
      projectId: string | null;
      projectTitle: string | null;
      projectDescription: string | null;
      submissionId: string | null;
      voteCount: number | null;
    }) => {
      if (!row.categoryId) return;

      if (!categorizedFinalists[row.categoryId]) {
        categorizedFinalists[row.categoryId] = {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          maxFinalists: row.maxFinalists,
          finalists: [],
        };
      }

      if (row.submissionId && row.projectId) {
        categorizedFinalists[row.categoryId].finalists.push({
          projectId: row.projectId,
          projectTitle: row.projectTitle,
          projectDescription: row.projectDescription,
          submissionId: row.submissionId,
          voteCount: row.voteCount || 0,
        });
      }
    });

    return NextResponse.json({
      categories: Object.values(categorizedFinalists),
    });
  } catch (error) {
    console.error("Error fetching finalists:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}