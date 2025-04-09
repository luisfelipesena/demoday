import { db } from "@/server/db";
import { projectSubmissions, projects, users, demodays } from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getSessionWithRole } from "@/lib/session-utils";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar todas as submissões de todos os DemoDays
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

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

    // Construir as condições WHERE para a consulta
    const conditions = [];
    
    // Adicionar filtro de status se fornecido
    if (status) {
      conditions.push(eq(projectSubmissions.status, status));
    }

    // Criar a condição WHERE final
    const whereCondition = conditions.length === 0 
      ? undefined 
      : conditions.length === 1 
        ? conditions[0] 
        : and(...conditions);

    // Buscar as submissões com joins para projetos e demodays
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
      .leftJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .leftJoin(demodays, eq(projectSubmissions.demoday_id, demodays.id))
      .where(whereCondition)
      .orderBy(asc(projectSubmissions.createdAt));

    // Filtrar por tipo de projeto se necessário
    let filteredSubmissions = submissions;
    if (type) {
      filteredSubmissions = submissions.filter(
        (sub: any) => sub.project && sub.project.type === type
      );
    }

    // Buscar os autores dos projetos
    const projectsWithAuthors = await Promise.all(
      filteredSubmissions.map(async (submission: any) => {
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
    console.error("Erro ao buscar submissões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissões" },
      { status: 500 }
    );
  }
} 