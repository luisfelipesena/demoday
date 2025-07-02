import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demodays, projectSubmissions, projects } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar todas as submissões do usuário atual
export async function GET(req: NextRequest) {
  try {
    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    // Buscar todas as submissões do usuário com informações do projeto e demoday
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
          contactEmail: projects.contactEmail,
          contactPhone: projects.contactPhone,
          advisor: projects.advisor,
          videoUrl: projects.videoUrl,
          repositoryUrl: projects.repositoryUrl,
          developmentYear: projects.developmentYear,
          authors: projects.authors,
          workCategory: projects.workCategory,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        },
        demoday: {
          id: demodays.id,
          name: demodays.name,
          active: demodays.active,
          status: demodays.status,
        }
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .innerJoin(demodays, eq(projectSubmissions.demoday_id, demodays.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(projectSubmissions.createdAt));

    return NextResponse.json(userSubmissions);
  } catch (error) {
    console.error("Erro ao buscar submissões do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissões do usuário" },
      { status: 500 }
    );
  }
} 