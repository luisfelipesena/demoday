import { db } from "@/server/db";
import { projects, projectSubmissions, demoDayPhases } from "@/server/db/schema";
import { projectSchema } from "@/server/db/validators";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session-utils";

// GET - Obter detalhes de um projeto específico
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const projectId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar o projeto
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "admin";
    const isProfessor = session.user.role === "professor";

    if (!isOwner && !isAdmin && !isProfessor) {
      return NextResponse.json(
        { error: "Você não tem permissão para ver este projeto" },
        { status: 403 }
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
    const params = await context.params;
    const projectId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar o projeto
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono do projeto
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este projeto" },
        { status: 403 }
      );
    }

    // Se for o dono, verificar se ainda está no período de submissão
    if (isOwner && !isAdmin) {
      // Buscar submissões do projeto
      const submissions = await db.query.projectSubmissions.findMany({
        where: eq(projectSubmissions.projectId, projectId),
      });

      // Verificar se ainda está no período de submissão para cada submissão
      for (const submission of submissions) {
        const phases = await db.query.demoDayPhases.findMany({
          where: eq(demoDayPhases.demoday_id, submission.demoday_id),
        });

        const submissionPhase = phases.find(phase => phase.phaseNumber === 1);
        
        if (submissionPhase) {
          const now = new Date();
          const endDate = new Date(submissionPhase.endDate);
          
          if (now > endDate) {
            return NextResponse.json(
              { error: "Período de submissão encerrado. Não é possível editar o projeto." },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validar os dados
    const body = await req.json();
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { title, description, type, videoUrl, repositoryUrl, developmentYear, authors, contactEmail, contactPhone, advisorName } = result.data;

    // Atualizar o projeto
    const [updatedProject] = await db
      .update(projects)
      .set({
        title,
        description,
        type,
        videoUrl,
        repositoryUrl,
        developmentYear,
        authors,
        contactEmail,
        contactPhone,
        advisorName,
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

// DELETE - Deletar um projeto
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const projectId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar o projeto
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono do projeto
    const isOwner = project.userId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar este projeto" },
        { status: 403 }
      );
    }

    // Se for o dono, verificar se ainda está no período de submissão
    if (isOwner && !isAdmin) {
      // Buscar submissões do projeto
      const submissions = await db.query.projectSubmissions.findMany({
        where: eq(projectSubmissions.projectId, projectId),
      });

      // Verificar se ainda está no período de submissão para cada submissão
      for (const submission of submissions) {
        const phases = await db.query.demoDayPhases.findMany({
          where: eq(demoDayPhases.demoday_id, submission.demoday_id),
        });

        const submissionPhase = phases.find(phase => phase.phaseNumber === 1);
        
        if (submissionPhase) {
          const now = new Date();
          const endDate = new Date(submissionPhase.endDate);
          
          if (now > endDate) {
            return NextResponse.json(
              { error: "Período de submissão encerrado. Não é possível deletar o projeto." },
              { status: 400 }
            );
          }
        }
      }
    }

    // Deletar o projeto (as submissões serão deletadas automaticamente por cascade)
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({ message: "Projeto deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    return NextResponse.json(
      { error: "Erro ao deletar projeto" },
      { status: 500 }
    );
  }
} 