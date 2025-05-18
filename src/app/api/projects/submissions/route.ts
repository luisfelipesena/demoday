import { db } from "@/server/db";
import { projectSubmissions, projects, demodays, demoDayPhases } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { projectDemoDaySubmissionSchema } from "@/server/db/validators";
import { getSessionWithRole } from "@/lib/session-utils";
// GET - Listar todas as submissões do usuário atual
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

    // Opcionalmente filtrar por demodayId se fornecido na query
    const { searchParams } = new URL(req.url);
    const demodayId = searchParams.get("demodayId");

    // Consulta básica para todas as submissões do usuário
    const userProjectIds = await db.query.projects.findMany({
      columns: { id: true },
      where: eq(projects.userId, userId),
    });

    const projectIds = userProjectIds.map((p: { id: string }) => p.id);

    let userSubmissions;

    if (demodayId) {
      userSubmissions = await db.query.projectSubmissions.findMany({
        where: and(
          eq(projectSubmissions.demoday_id, demodayId),
          // Filtrar apenas projetos do usuário atual
          // usando o array de IDs que já obtivemos
          // Isso seria equivalente a um WHERE IN SQL
          // mas vamos usar múltiplas condições OR
          or(...projectIds.map((id: string) => eq(projectSubmissions.projectId, id)))
        ),
      });
    } else {
      userSubmissions = await db.query.projectSubmissions.findMany({
        where: or(...projectIds.map((id: string) => eq(projectSubmissions.projectId, id))),
      });
    }

    // Enriquecer com dados do projeto e demoday
    const submissions = await Promise.all(userSubmissions.map(async (submission: any) => {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, submission.projectId),
      });

      const demoday = await db.query.demodays.findFirst({
        where: eq(demodays.id, submission.demoday_id),
      });

      return {
        ...submission,
        project,
        demoday,
      };
    }));

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Erro ao buscar submissões de projetos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar submissões de projetos" },
      { status: 500 }
    );
  }
}

// POST - Submeter um projeto para um Demoday
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

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = projectDemoDaySubmissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { projectId, demodayId } = result.data;

    // Verificar se o projeto existe e pertence ao usuário
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    // Verificar se o Demoday existe
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!demoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todas as fases do demoday
    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, demodayId),
    });

    // Verificar se estamos na fase de submissão 
    // (fase 1 conforme regras de negócio)
    const submissionPhase = phases.find((phase: any) => phase.phaseNumber === 1);

    if (!submissionPhase) {
      return NextResponse.json(
        { error: "Fase de submissão não configurada para este Demoday" },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(submissionPhase.startDate);
    const endDate = new Date(submissionPhase.endDate);

    if (now < startDate || now > endDate) {
      return NextResponse.json(
        {
          error: "Fora do período de submissão",
          period: {
            start: submissionPhase.startDate,
            end: submissionPhase.endDate,
          }
        },
        { status: 400 }
      );
    }

    // Verificar se o projeto já foi submetido para este Demoday
    const existingSubmission = await db.query.projectSubmissions.findFirst({
      where: and(
        eq(projectSubmissions.projectId, projectId),
        eq(projectSubmissions.demoday_id, demodayId)
      ),
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Este projeto já foi submetido para este Demoday" },
        { status: 400 }
      );
    }

    // Criar a submissão
    const [newSubmission] = await db
      .insert(projectSubmissions)
      .values({
        projectId,
        demoday_id: demodayId,
        status: "submitted",
      })
      .returning();

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error) {
    console.error("Erro ao submeter projeto:", error);
    return NextResponse.json(
      { error: "Erro ao submeter projeto" },
      { status: 500 }
    );
  }
} 