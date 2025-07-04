import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { demodays, projects, projectSubmissions, votes } from "@/server/db/schema";
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

    // Buscar o demoday para pegar o maxFinalists
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!demoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Buscar projetos aprovados com contagem de votos populares
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
          eq(projectSubmissions.status, "approved")
        )
      )
      .groupBy(
        projectSubmissions.id,
        projects.id,
        projects.title
      )
      .orderBy(sql`count(${votes.id}) DESC`)
      .limit(demoday.maxFinalists);

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

    return NextResponse.json({
      message: "Finalistas selecionados automaticamente com sucesso",
      maxFinalists: demoday.maxFinalists,
      selectedFinalists: projectsWithVotes.length,
      finalists: projectsWithVotes,
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

    // Buscar finalistas do demoday
    const finalists = await db
      .select({
        projectId: projects.id,
        projectTitle: projects.title,
        projectDescription: projects.description,
        submissionId: projectSubmissions.id,
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
          eq(projectSubmissions.status, "finalist")
        )
      )
      .groupBy(
        projects.id,
        projects.title,
        projects.description,
        projectSubmissions.id
      )
      .orderBy(sql`count(${votes.id}) DESC`);

    return NextResponse.json({
      finalists: finalists,
    });
  } catch (error) {
    console.error("Error fetching finalists:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}