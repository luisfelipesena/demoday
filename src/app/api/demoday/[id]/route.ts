import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demoDayPhases, demodays, projectSubmissions } from "@/server/db/schema";
import { demodaySchema, updateStatusSchema } from "@/server/db/validators";
import { and, count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


// GET - Fetch a specific demoday with its phases
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Desembrulhar (unwrap) o objeto params
    const params = await context.params;
    const demodayId = params.id;

    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o demoday pelo ID
    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!demoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Buscar as fases deste demoday
    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, demodayId),
      orderBy: demoDayPhases.phaseNumber,
    });

    // Calcular estatísticas de projetos de forma segura
    let totalProjects = 0;
    let submittedCount = 0;
    let approvedCount = 0;
    let finalistCount = 0;
    let winnerCount = 0;

    try {
      // Contar projetos submetidos
      const projectCountResult = await db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(eq(projectSubmissions.demoday_id, demodayId));

      totalProjects = projectCountResult[0]?.value || 0;

      // Contar projetos em cada status
      const submittedCountResult = await db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.demoday_id, demodayId),
            eq(projectSubmissions.status, "submitted")
          )
        );

      submittedCount = submittedCountResult[0]?.value || 0;

      const approvedCountResult = await db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.demoday_id, demodayId),
            eq(projectSubmissions.status, "approved")
          )
        );

      approvedCount = approvedCountResult[0]?.value || 0;

      const finalistCountResult = await db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.demoday_id, demodayId),
            eq(projectSubmissions.status, "finalist")
          )
        );

      finalistCount = finalistCountResult[0]?.value || 0;

      const winnerCountResult = await db
        .select({ value: count() })
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.demoday_id, demodayId),
            eq(projectSubmissions.status, "winner")
          )
        );

      winnerCount = winnerCountResult[0]?.value || 0;
    } catch (countError) {
      console.error("Erro ao calcular estatísticas:", countError);
    }

    // Verificar em qual fase estamos atualmente
    const now = new Date();
    let currentPhase = null;
    for (const phase of phases) {
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);

      if (now >= startDate && now <= endDate) {
        currentPhase = phase;
        break;
      }
    }

    // Retornar o demoday com as informações adicionais
    return NextResponse.json({
      ...demoday,
      phases,
      stats: {
        totalProjects,
        submitted: submittedCount,
        approved: approvedCount,
        finalists: finalistCount,
        winners: winnerCount,
      },
      currentPhase,
    });
  } catch (error) {
    console.error("Erro ao buscar demoday:", error);
    return NextResponse.json(
      { error: "Erro ao buscar demoday" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar demoday existente (somente admin)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar demodays" },
        { status: 403 }
      );
    }

    // Unwrap the params
    const params = await context.params;
    const id = params.id;

    // Verificar se o demoday existe
    const existingDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, id),
    });

    if (!existingDemoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Obter dados da requisição
    const body = await req.json();
    const result = demodaySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, phases, maxFinalists } = result.data;

    // Atualizar demoday e fases em uma transação
    await db.transaction(async (tx: any) => {
      // Atualizar nome do demoday
      await tx.update(demodays)
        .set({ 
          name,
          maxFinalists: maxFinalists || 5 
        })
        .where(eq(demodays.id, id));

      // Excluir fases existentes
      await tx.delete(demoDayPhases)
        .where(eq(demoDayPhases.demoday_id, id));

      // Inserir novas fases
      for (const phase of phases) {
        // Verificar se as datas são válidas e obrigatórias
        if (!phase.startDate || !phase.endDate || 
            phase.startDate.trim() === '' || phase.endDate.trim() === '') {
          throw new Error(`Datas são obrigatórias para a fase ${phase.name}`);
        }
        
        // Validar e converter a data de início
        let startDateObj: Date;
        try {
          // Se a data já contém timezone, usar diretamente, senão adicionar
          if (phase.startDate.includes('T')) {
            startDateObj = new Date(phase.startDate);
          } else {
            startDateObj = new Date(`${phase.startDate}T12:00:00.000Z`);
          }
          
          if (isNaN(startDateObj.getTime())) {
            throw new Error(`Data de início inválida: ${phase.startDate}`);
            }
          } catch (error) {
            console.error(`Erro ao converter data de início: ${phase.startDate}`, error);
          throw new Error(`Data de início inválida para a fase ${phase.name}: ${phase.startDate}`);
        }
        
        // Validar e converter a data de fim
        let endDateObj: Date;
        try {
          // Se a data já contém timezone, usar diretamente, senão adicionar
          if (phase.endDate.includes('T')) {
            endDateObj = new Date(phase.endDate);
          } else {
            endDateObj = new Date(`${phase.endDate}T12:00:00.000Z`);
          }
          
          if (isNaN(endDateObj.getTime())) {
            throw new Error(`Data de fim inválida: ${phase.endDate}`);
            }
          } catch (error) {
            console.error(`Erro ao converter data de fim: ${phase.endDate}`, error);
          throw new Error(`Data de fim inválida para a fase ${phase.name}: ${phase.endDate}`);
          }
        
        // Verificar se a data de início não é posterior à data de fim (permite mesmo dia)
        if (startDateObj > endDateObj) {
          throw new Error(`Data de início não pode ser posterior à data de fim para a fase ${phase.name}`);
        }
        
        await tx.insert(demoDayPhases).values({
          demoday_id: id,
          name: phase.name,
          description: phase.description,
          phaseNumber: phase.phaseNumber,
          startDate: startDateObj,
          endDate: endDateObj,
        });
      }
    });

    // Retornar demoday atualizado
    const updatedDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, id),
    });

    const updatedPhases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, id),
      orderBy: demoDayPhases.phaseNumber,
    });

    return NextResponse.json({
      ...updatedDemoday,
      phases: updatedPhases,
    });
  } catch (error) {
    console.error("Error updating demoday:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar demoday" },
      { status: 500 }
    );
  }
}

// PATCH - Update a demoday status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar demodays" },
        { status: 403 }
      );
    }

    // Unwrap the params
    const params = await context.params;
    const id = params.id;

    // Obter dados da requisição
    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // Buscar o demoday atual
    const currentDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, id),
    });

    if (!currentDemoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    // Se estiver atualizando para "canceled", apenas delete o demoday
    if (status === "canceled") {
      await db.delete(demodays).where(eq(demodays.id, id));
      return NextResponse.json({ message: "Demoday cancelado e excluído com sucesso" });
    }

    // Se estiver finalizando um demoday ativo
    if (status === "finished" && currentDemoday.active) {
      await db.update(demodays)
        .set({
          active: false,
          status: "finished",
        })
        .where(eq(demodays.id, id));

      return NextResponse.json({
        message: "Demoday finalizado com sucesso e adicionado ao histórico"
      });
    }

    // Se estiver ativando um demoday
    if (status === "active" && !currentDemoday.active) {
      // Desativar todos os outros demodays ativos
      await db.transaction(async (tx: any) => {
        await tx.update(demodays)
          .set({
            active: false,
            status: "finished",
          })
          .where(eq(demodays.active, true));

        // Ativar o demoday atual
        await tx.update(demodays)
          .set({
            active: true,
            status: "active",
          })
          .where(eq(demodays.id, id));
      });

      return NextResponse.json({ message: "Demoday ativado com sucesso" });
    }

    // Atualização padrão
    await db.update(demodays)
      .set({
        status,
      })
      .where(eq(demodays.id, id));

    return NextResponse.json({ message: "Status do demoday atualizado com sucesso" });
  } catch (error) {
    console.error("Error updating demoday:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar demoday" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a demoday
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir demodays" },
        { status: 403 }
      );
    }

    // Unwrap the params
    const params = await context.params;
    const id = params.id;

    // Excluir demoday
    await db.delete(demodays).where(eq(demodays.id, id));

    return NextResponse.json({ message: "Demoday excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting demoday:", error);
    return NextResponse.json(
      { error: "Erro ao excluir demoday" },
      { status: 500 }
    );
  }
} 