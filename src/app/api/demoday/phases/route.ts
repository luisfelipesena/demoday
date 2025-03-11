import { db } from "@/server/db";
import { demoDayPhases } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const demodayId = url.searchParams.get("demodayId");

    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    const phases = await db.query.demoDayPhases.findMany({
      where: (phases) => eq(phases.demoday_id, demodayId),
      orderBy: (phases) => phases.phaseNumber,
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error("Error fetching demoday phases:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fases do demoday" },
      { status: 500 }
    );
  }
} 