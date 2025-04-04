import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demoDayPhases, demodays, projectSubmissions, projects } from "@/server/db/schema";
import { projectSubmissionStatusSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Obter detalhes de uma submissão específica
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Desembrulhar (unwrap) o objeto params antes de acessar suas propriedades
    const params = await context.params;
    const submissionId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!submissionId) {
      return NextResponse.json(
        { error: "ID da submissão é obrigatório" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    // Buscar a submissão pelo ID
    const submission = await db.query.projectSubmissions.findFirst({
      where: eq(projectSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submissão não encontrada" },
        { status: 404 }
      );
    }

    // Buscar o projeto associado para verificar permissões
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, submission.projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões:
    // - Se o usuário é o dono do projeto, pode ver
    // - Se o usuário é admin, pode ver
    // - Se o usuário é professor, pode ver
    const isAdmin = session.user.role === "admin";
    const isProfessor = session.user.role === "professor";
    const isOwner = project.userId === userId;

    if (!isOwner && !isAdmin && !isProfessor) {
      return NextResponse.json(
        { error: "Você não tem permissão para ver esta submissão" },
        { status: 403 }
      );
    }

    // Buscar informações complementares
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, submission.demoday_id),
    });

    // Retornar os dados completos
    return NextResponse.json({
      ...submission,
      project,
      demoday,
    });
  } catch (error) {
    console.error("Erro ao buscar submissão:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissão" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar o status de uma submissão
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const submissionId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!submissionId) {
      return NextResponse.json(
        { error: "ID da submissão é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a submissão existe
    const submission = await db.query.projectSubmissions.findFirst({
      where: eq(projectSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submissão não encontrada" },
        { status: 404 }
      );
    }

    // Verificar permissões: apenas admin ou professor pode atualizar o status
    const isAdmin = session.user.role === "admin";
    const isProfessor = session.user.role === "professor";

    if (!isAdmin && !isProfessor) {
      return NextResponse.json(
        { error: "Apenas administradores e professores podem atualizar o status das submissões" },
        { status: 403 }
      );
    }

    // Validar os dados recebidos
    const body = await req.json();
    const result = projectSubmissionStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // Verificar a fase atual do Demoday para garantir que estamos em uma fase apropriada
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, submission.demoday_id),
    });

    if (!demoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todas as fases do demoday
    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, demoday.id),
      orderBy: demoDayPhases.phaseNumber,
    });

    // Validações específicas com base no status desejado
    const now = new Date();

    // Aprovar/rejeitar só pode ser feito na fase 2 (avaliação)
    if ((status === 'approved' || status === 'rejected') && phases.length >= 2) {
      const evaluationPhase = phases.find((phase: any) => phase.phaseNumber === 2);

      if (evaluationPhase) {
        const startDate = new Date(evaluationPhase.startDate);
        const endDate = new Date(evaluationPhase.endDate);

        if (now < startDate || now > endDate) {
          return NextResponse.json(
            {
              error: "Fora do período de avaliação",
              period: {
                start: evaluationPhase.startDate,
                end: evaluationPhase.endDate,
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Definir como finalista só pode ser feito na fase 3 (votação para finalistas)
    if (status === 'finalist' && phases.length >= 3) {
      const finalistPhase = phases.find((phase: any) => phase.phaseNumber === 3);

      if (finalistPhase) {
        const startDate = new Date(finalistPhase.startDate);
        const endDate = new Date(finalistPhase.endDate);

        if (now < startDate || now > endDate) {
          return NextResponse.json(
            {
              error: "Fora do período de seleção de finalistas",
              period: {
                start: finalistPhase.startDate,
                end: finalistPhase.endDate,
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Definir como vencedor só pode ser feito na fase 4 (votação para vencedores)
    if (status === 'winner' && phases.length >= 4) {
      const winnerPhase = phases.find((phase: any) => phase.phaseNumber === 4);

      if (winnerPhase) {
        const startDate = new Date(winnerPhase.startDate);
        const endDate = new Date(winnerPhase.endDate);

        if (now < startDate || now > endDate) {
          return NextResponse.json(
            {
              error: "Fora do período de seleção de vencedores",
              period: {
                start: winnerPhase.startDate,
                end: winnerPhase.endDate,
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Atualizar o status da submissão
    const [updatedSubmission] = await db
      .update(projectSubmissions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId))
      .returning();

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Erro ao atualizar submissão:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar submissão" },
      { status: 500 }
    );
  }
}

// DELETE - Remover uma submissão
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const submissionId = params.id;

    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!submissionId) {
      return NextResponse.json(
        { error: "ID da submissão é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a submissão existe
    const submission = await db.query.projectSubmissions.findFirst({
      where: eq(projectSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submissão não encontrada" },
        { status: 404 }
      );
    }

    // Buscar o projeto associado para verificar permissões
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, submission.projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões:
    // - Se o usuário é o dono do projeto, pode remover durante a fase de submissão
    // - Se o usuário é admin, pode remover em qualquer momento
    const isAdmin = session.user.role === "admin";
    const isOwner = project.userId === userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para remover esta submissão" },
        { status: 403 }
      );
    }

    // Se for o dono, verificar se estamos na fase de submissão
    if (isOwner && !isAdmin) {
      // Buscar as fases do demoday
      const phases = await db.query.demoDayPhases.findMany({
        where: eq(demoDayPhases.demoday_id, submission.demoday_id),
      });

      const submissionPhase = phases.find((phase: any) => phase.phaseNumber === 1);

      if (submissionPhase) {
        const now = new Date();
        const startDate = new Date(submissionPhase.startDate);
        const endDate = new Date(submissionPhase.endDate);

        if (now < startDate || now > endDate) {
          return NextResponse.json(
            {
              error: "Fora do período de submissão. Apenas administradores podem remover submissões fora do período",
              period: {
                start: submissionPhase.startDate,
                end: submissionPhase.endDate,
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Remover a submissão
    await db
      .delete(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId));

    return NextResponse.json(
      { message: "Submissão removida com sucesso" }
    );
  } catch (error) {
    console.error("Erro ao remover submissão:", error);
    return NextResponse.json(
      { error: "Erro ao remover submissão" },
      { status: 500 }
    );
  }
} 