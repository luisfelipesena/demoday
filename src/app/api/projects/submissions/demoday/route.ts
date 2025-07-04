import { db } from "@/server/db";
import { projectSubmissions, projects, users } from "@/server/db/schema";
import { projectQuerySchema } from "@/server/db/validators";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getSessionWithRole } from "@/lib/session-utils";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar projetos de um Demoday com filtros
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const demodayId = searchParams.get("demodayId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");

    // Validar parâmetros
    const queryParams = {
      demodayId: demodayId || undefined,
      status: status || undefined,
      type: type || undefined,
      categoryId: categoryId || undefined,
    };

    const result = projectQuerySchema.safeParse(queryParams);

    if (!result.success) {
      return NextResponse.json(
        { error: "Parâmetros de busca inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    // Verificar se o demodayId é fornecido (obrigatório)
    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar sessão para permissões (opcionalmente restringir visualização)
    const session = await getSessionWithRole();
    const isAdmin = session?.user?.role === "admin";
    const isProfessor = session?.user?.role === "professor";

    // Construir as condições WHERE para a consulta
    const conditions = [eq(projectSubmissions.demoday_id, demodayId)];
    
    // Adicionar filtro de status se fornecido
    if (status) {
      conditions.push(eq(projectSubmissions.status, status));
    }

    // Note: categoryId filter removed as categories are no longer supported

    // Se não for admin ou professor, apenas projetos aprovados/finalistas/vencedores
    // são visíveis para usuários comuns (a menos que o status seja explicitamente definido)
    if (!isAdmin && !isProfessor && !status) {
      conditions.push(inArray(projectSubmissions.status, ["approved", "finalist", "winner"]));
    }

    // Criar a condição WHERE final
    const whereCondition = conditions.length === 1 
      ? conditions[0] 
      : and(...conditions);

    // Buscar as submissões com joins para projetos - Selecionar apenas colunas específicas
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
    console.error("Erro ao buscar projetos do demoday:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projetos do demoday" },
      { status: 500 }
    );
  }
} 