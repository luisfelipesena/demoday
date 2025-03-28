import { authOptions } from "@/auth/auth-options";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { projectSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar um projeto específico pelo ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Desembrulhar (unwrap) o objeto params antes de acessar suas propriedades
    const params = await context.params;
    const projectId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "ID do projeto é obrigatório" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    // Buscar o projeto pelo ID
    // Se o usuário for admin, permitir ver qualquer projeto
    // Se não, só permite ver projetos do próprio usuário
    const isAdmin = session.user.role === "admin";

    let project;
    if (isAdmin) {
      // Admin pode ver qualquer projeto
      project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });
    } else {
      // Usuário comum só pode ver seus próprios projetos
      // Primeiro verificamos se o projeto existe
      const projectExists = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      // Depois verificamos se pertence ao usuário atual
      if (projectExists && projectExists.userId === userId) {
        project = projectExists;
      } else {
        project = null;
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erro ao buscar projeto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projeto" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um projeto existente
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Desembrulhar (unwrap) o objeto params antes de acessar suas propriedades
    const params = await context.params;
    const projectId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "ID do projeto é obrigatório" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    // Verificar se o projeto existe e pertence ao usuário
    const existingProject = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: apenas o proprietário ou um admin pode editar
    const isAdmin = session.user.role === "admin";
    if (existingProject.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este projeto" },
        { status: 403 }
      );
    }

    // Validar os dados recebidos
    const body = await req.json();
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { title, description, type } = result.data;

    // Atualizar o projeto
    const [updatedProject] = await db
      .update(projects)
      .set({
        title,
        description,
        type,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar projeto" },
      { status: 500 }
    );
  }
} 