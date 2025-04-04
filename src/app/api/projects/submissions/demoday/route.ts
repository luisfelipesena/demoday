import { authOptions } from "@/auth/auth-options";
import { db } from "@/server/db";
import { projectSubmissions, users } from "@/server/db/schema";
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

    // Validar parâmetros
    const queryParams = {
      demodayId: demodayId || undefined,
      status: status || undefined,
      type: type || undefined,
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
    const isAuthenticated = !!session?.user;
    const isAdmin = session?.user?.role === "admin";
    const isProfessor = session?.user?.role === "professor";

    // Construir a consulta com os filtros
    const query: any = {
      where: eq(projectSubmissions.demoday_id, demodayId),
    };

    // Adicionar filtro de status se fornecido
    if (status) {
      query.where = and(
        query.where,
        eq(projectSubmissions.status, status)
      );
    }

    // Se não for admin ou professor, apenas projetos aprovados/finalistas/vencedores
    // são visíveis para usuários comuns (a menos que o status seja explicitamente definido)
    if (!isAdmin && !isProfessor && !status) {
      query.where = and(
        query.where,
        inArray(projectSubmissions.status, ["approved", "finalist", "winner"])
      );
    }

    // Buscar as submissões
    const submissions = await db.query.projectSubmissions.findMany({
      where: query.where,
      orderBy: asc(projectSubmissions.createdAt),
      with: {
        project: true,
      },
    });

    // Filtrar por tipo de projeto se necessário
    let filteredSubmissions = submissions;
    if (type) {
      filteredSubmissions = submissions.filter(
        (sub: any) => sub.project && sub.project.type === type
      );
    }

    // Enriquecer com dados do usuário (autor)
    const projectsWithAuthors = await Promise.all(
      filteredSubmissions.map(async (submission: any) => {
        if (!submission.project) {
          return submission;
        }

        const author = await db.query.users.findFirst({
          where: eq(users.id, submission.project.userId),
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

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