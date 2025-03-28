import { db } from "@/server/db";
import { demodays, demoDayPhases, projectSubmissions, projects } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, count, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth-options";
import { updateStatusSchema } from "@/server/db/validators";


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
      // Continue mesmo com erro nas estatísticas
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
  // Implementar atualização de demoday aqui
  return NextResponse.json(
    { message: "Endpoint não implementado" },
    { status: 501 }
  );
}

// PATCH - Update a demoday status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

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
    const session = await getServerSession(authOptions);

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