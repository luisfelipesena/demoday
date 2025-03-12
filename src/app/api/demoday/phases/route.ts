import { db } from "@/server/db";
import { demoDayPhases } from "@/server/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// GET - Fetch phases for a specific demoday
export async function GET(req: NextRequest) {
  try {
    // Get demoday ID from query param
    const url = new URL(req.url);
    const demodayId = url.searchParams.get("demodayId");

    if (!demodayId) {
      return NextResponse.json({ error: "Demoday ID is required" }, { status: 400 });
    }

    // Get phases
    const phases = await db.query.demoDayPhases.findMany({
      where: (phases: typeof demoDayPhases) => eq(phases.demoday_id, demodayId),
      orderBy: (phases: typeof demoDayPhases) => phases.phaseNumber,
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