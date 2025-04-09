import { db } from "@/server/db";
import { demodays, projects, projectSubmissions, DemoDayPhase } from "@/server/db/schema";
import { projectSubmissionSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/session-utils";

// POST - Submeter um trabalho para o Demoday
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const demodayId = params.id;
    
    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar sessão para identificar o usuário
    const session = await getSessionWithRole();
    
    // Verificar se o usuário está autenticado
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Verificar se o Demoday existe e está ativo
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
      with: {
        phases: true,
      },
    });
    
    if (!demoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }
    
    if (!demoday.active) {
      return NextResponse.json(
        { error: "Este Demoday não está ativo no momento" },
        { status: 400 }
      );
    }
    
    // Verificar se está na fase de submissão
    const now = new Date();
    const submissionPhase = demoday.phases.find((phase: DemoDayPhase) => phase.phaseNumber === 1);
    
    if (!submissionPhase) {
      return NextResponse.json(
        { error: "Fase de submissão não configurada para este Demoday" },
        { status: 400 }
      );
    }
    
    const startDate = new Date(submissionPhase.startDate);
    const endDate = new Date(submissionPhase.endDate);
    
    // Ajustar o horário para comparação correta
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    if (now < startDate || now > endDate) {
      return NextResponse.json(
        { error: "O período de submissão não está aberto no momento" },
        { status: 400 }
      );
    }
    
    // Validar os dados enviados
    const body = await req.json();
    const result = projectSubmissionSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { title, description, type, authors, developmentYear, videoUrl, repositoryUrl } = result.data;
    
    // Criar um novo projeto
    let projectId: string = '';
    
    await db.transaction(async (tx: any) => {
      // Criar o projeto
      const [createdProject] = await tx
        .insert(projects)
        .values({
          title,
          description,
          type,
          userId,
          authors,
          developmentYear,
          videoUrl,
          repositoryUrl,
        })
        .returning({ id: projects.id });
      
      projectId = createdProject.id;
      
      // Registrar a submissão
      await tx
        .insert(projectSubmissions)
        .values({
          projectId,
          demoday_id: demodayId,
          status: "submitted",
        });
    });
    
    return NextResponse.json(
      { message: "Trabalho submetido com sucesso", projectId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao submeter trabalho:", error);
    return NextResponse.json(
      { error: "Erro ao submeter trabalho" },
      { status: 500 }
    );
  }
} 