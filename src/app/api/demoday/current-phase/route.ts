import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { demodays, demoDayPhases, type DemoDayPhase } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// GET - Endpoint público para obter informações da fase atual do demoday ativo
export async function GET() {
  try {
    // Buscar o demoday ativo
    const activeDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.active, true),
    });

    if (!activeDemoday) {
      return NextResponse.json({
        demoday: null,
        currentPhase: null,
        phases: [],
        isVotingPhase: false,
        isFinalVotingPhase: false,
      });
    }

    // Buscar todas as fases do demoday ativo
    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, activeDemoday.id),
      orderBy: demoDayPhases.phaseNumber,
    });

    // Determinar a fase atual
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

    const isVotingPhase = currentPhase?.phaseNumber === 3;
    const isFinalVotingPhase = currentPhase?.phaseNumber === 4;

    return NextResponse.json({
      demoday: activeDemoday,
      currentPhase,
      phases,
      isVotingPhase,
      isFinalVotingPhase,
    });
  } catch (error) {
    console.error("Error fetching current phase:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fase atual" },
      { status: 500 }
    );
  }
}