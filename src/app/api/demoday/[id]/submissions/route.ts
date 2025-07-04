import { db } from "@/server/db";
import { projectSubmissions, projects, users } from "@/server/db/schema";
import { asc, eq } from "drizzle-orm";
import { getSessionWithRole } from "@/lib/session-utils";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar submissões de um Demoday específico
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

    // Verificar sessão para permissões
    const session = await getSessionWithRole();
    const isAdmin = session?.user?.role === "admin";
    const isProfessor = session?.user?.role === "professor";
    
    // Verificar se o usuário pode visualizar as submissões
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Se não for admin ou professor, não tem permissão para ver todas as submissões
    if (!isAdmin && !isProfessor) {
      return NextResponse.json(
        { error: "Apenas administradores e professores podem visualizar todas as submissões" },
        { status: 403 }
      );
    }

    // Construir a consulta para buscar as submissões do Demoday
    const submissions = await db
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
          contactEmail: projects.contactEmail,
          contactPhone: projects.contactPhone,
          advisorName: projects.advisorName,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        }
      })
      .from(projectSubmissions)
      .leftJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .where(eq(projectSubmissions.demoday_id, demodayId))
      .orderBy(asc(projectSubmissions.createdAt));

    // Buscar os autores dos projetos
    const projectsWithAuthors = await Promise.all(
      submissions.map(async (submission: any) => {
        if (!submission.project) {
          return submission;
        }

        // Buscar o autor do projeto
        const author = await db.query.users.findFirst({
          where: eq(users.id, submission.project.userId),
          columns: {
            id: true,
            name: true, 
            email: true,
            role: true,
          },
        });

        // Retornar o projeto enriquecido com dados do autor
        return {
          ...submission,
          project: {
            ...submission.project,
            author,
          },
        };
      })
    );

    return NextResponse.json(projectsWithAuthors);
  } catch (error) {
    console.error("Erro ao buscar submissões do demoday:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissões do demoday" },
      { status: 500 }
    );
  }
} 