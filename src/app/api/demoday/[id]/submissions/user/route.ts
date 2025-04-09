import { db } from "@/server/db";
import { projectSubmissions, projects, users } from "@/server/db/schema";
import { getSessionWithRole } from "@/lib/session-utils";
import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar submissões do usuário autenticado para um Demoday específico
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const demodayId = params.id;

    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar sessão para identificar o usuário
    const session = await getSessionWithRole();
    
    // Verificar se o usuário está autenticado
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Buscar as submissões do usuário para o Demoday específico
    const userSubmissions = await db
      .select({
        id: projectSubmissions.id,
        projectId: projectSubmissions.projectId,
        demoday_id: projectSubmissions.demoday_id,
        status: projectSubmissions.status,
        createdAt: projectSubmissions.createdAt,
        updatedAt: projectSubmissions.updatedAt,
        project: {
          id: projects.id,
          title: projects.title,
          description: projects.description,
          userId: projects.userId,
          type: projects.type,
          videoUrl: projects.videoUrl,
          repositoryUrl: projects.repositoryUrl,
          developmentYear: projects.developmentYear,
          authors: projects.authors,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        }
      })
      .from(projectSubmissions)
      .leftJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .where(
        and(
          eq(projectSubmissions.demoday_id, demodayId),
          eq(projects.userId, userId)
        )
      )
      .orderBy(asc(projectSubmissions.createdAt));

    // Enriquecer com dados do autor (que é o próprio usuário)
    const submissionsWithAuthors = await Promise.all(
      userSubmissions.map(async (submission: any) => {
        if (!submission.project) {
          return submission;
        }

        // Buscar os dados do autor
        const author = await db.query.users.findFirst({
          where: eq(users.id, submission.project.userId),
          columns: {
            id: true,
            name: true, 
            email: true,
            role: true,
          },
        });

        // Retornar a submissão enriquecida
        return {
          ...submission,
          project: {
            ...submission.project,
            author,
          },
        };
      })
    );

    return NextResponse.json(submissionsWithAuthors);
  } catch (error) {
    console.error("Erro ao buscar submissões do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissões do usuário" },
      { status: 500 }
    );
  }
} 