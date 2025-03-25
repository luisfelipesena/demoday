import { db } from "@/server/db";
import { demodays, demoDayPhases, projectSubmissions } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";

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

    // Contar projetos submetidos
    const projectCount = await db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.demoday_id, demodayId));

    // Contar projetos em cada status
    const submittedCount = await db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.demoday_id, demodayId))
      .where(eq(projectSubmissions.status, "submitted"));

    const approvedCount = await db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.demoday_id, demodayId))
      .where(eq(projectSubmissions.status, "approved"));

    const finalistCount = await db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.demoday_id, demodayId))
      .where(eq(projectSubmissions.status, "finalist"));

    const winnerCount = await db
      .select({ value: count() })
      .from(projectSubmissions)
      .where(eq(projectSubmissions.demoday_id, demodayId))
      .where(eq(projectSubmissions.status, "winner"));

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
        totalProjects: projectCount[0]?.value || 0,
        submitted: submittedCount[0]?.value || 0,
        approved: approvedCount[0]?.value || 0,
        finalists: finalistCount[0]?.value || 0,
        winners: winnerCount[0]?.value || 0,
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

// DELETE - Remover demoday (somente admin)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Implementar remoção de demoday aqui
  return NextResponse.json(
    { message: "Endpoint não implementado" },
    { status: 501 }
  );
} 