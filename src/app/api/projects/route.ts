import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { projectSchema } from "@/server/db/validators";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar todos os projetos do usuário atual
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

    // Extrair o ID do usuário
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    // Buscar projetos do usuário
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: desc(projects.createdAt),
    });

    return NextResponse.json(userProjects);
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projetos" },
      { status: 500 }
    );
  }
}

// POST - Criar um novo projeto
export async function POST(req: NextRequest) {
  try {
    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair o ID do usuário
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      type,
      contactEmail,
      contactPhone,
      advisor,
      authors,
      developmentYear,
      videoUrl,
      repositoryUrl,
      workCategory,
    } = result.data;

    // Criar o projeto
    const [newProject] = await db
      .insert(projects)
      .values({
        title,
        description,
        type,
        userId,
        contactEmail,
        contactPhone,
        advisor,
        authors,
        developmentYear,
        videoUrl,
        repositoryUrl,
        workCategory,
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return NextResponse.json(
      { error: "Erro ao criar projeto" },
      { status: 500 }
    );
  }
} 