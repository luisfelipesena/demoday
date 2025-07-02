import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demoDayPhases, demodays, projectSubmissions, projects } from "@/server/db/schema";
import { projectSubmissionSchema, projectSubmissionStatusSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get specific submission by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionWithRole();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const submissionId = resolvedParams.id;

    // Buscar a submissão com dados do projeto e demoday
    const submission = await db
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
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      return NextResponse.json({ error: "Submissão não encontrada" }, { status: 404 });
    }

    const submissionData = submission[0];
    if (!submissionData) {
      return NextResponse.json({ error: "Dados da submissão inválidos" }, { status: 400 });
    }

    // Verificar se o usuário é o dono da submissão
    if (submissionData.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(submissionData);
  } catch (error) {
    console.error("Erro ao buscar submissão:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
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

// PATCH - Update specific submission
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionWithRole();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const submissionId = resolvedParams.id;

    // Buscar a submissão existente
    const existingSubmission = await db
      .select({
        id: projectSubmissions.id,
        projectId: projectSubmissions.projectId,
        demoday_id: projectSubmissions.demoday_id,
        status: projectSubmissions.status,
        project: {
          userId: projects.userId,
        },
        demoday: {
          active: demodays.active,
        }
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .innerJoin(demodays, eq(projectSubmissions.demoday_id, demodays.id))
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (existingSubmission.length === 0) {
      return NextResponse.json({ error: "Submissão não encontrada" }, { status: 404 });
    }

    const submissionData = existingSubmission[0];
    if (!submissionData) {
      return NextResponse.json({ error: "Dados da submissão inválidos" }, { status: 400 });
    }

    // Verificar se o usuário é o dono da submissão
    if (submissionData.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verificar se ainda pode editar (status submitted e demoday ativo)
    if (submissionData.status !== "submitted") {
      return NextResponse.json({
        error: "Só é possível editar submissões com status 'submitted'"
      }, { status: 400 });
    }

    if (!submissionData.demoday.active) {
      return NextResponse.json({
        error: "Não é possível editar submissões de demodays inativos"
      }, { status: 400 });
    }

    // Validar os dados enviados
    const body = await req.json();
    const result = projectSubmissionSchema.safeParse({
      ...body,
      demodayId: submissionData.demoday_id
    });

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
      workCategory
    } = result.data;

    // Atualizar o projeto
    await db
      .update(projects)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(projects.id, submissionData.projectId));

    // Atualizar a submissão
    await db
      .update(projectSubmissions)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId));

    return NextResponse.json({
      message: "Submissão atualizada com sucesso",
      submissionId: submissionId
    });

  } catch (error) {
    console.error("Erro ao atualizar submissão:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
} 