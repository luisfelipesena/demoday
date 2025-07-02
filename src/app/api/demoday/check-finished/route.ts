import { db } from "@/server/db";
import { demodays } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Buscar todos os Demodays ativos
    const activeDemodays = await db.query.demodays.findMany({
      where: eq(demodays.active, true),
      with: {
        phases: true
      }
    });

    const updatedDemodays = [];

    for (const demoday of activeDemodays) {
      if (!demoday.phases || demoday.phases.length === 0) continue;

      const now = new Date();

      // Encontrar a última fase (maior phaseNumber)
      const lastPhase = demoday.phases.reduce((latest, current) => {
        return current.phaseNumber > latest.phaseNumber ? current : latest;
      });

      if (!lastPhase) continue;

      const lastPhaseEndDate = new Date(lastPhase.endDate);
      lastPhaseEndDate.setHours(23, 59, 59, 999);

      // Se a data atual passou da última fase, marcar como finalizado
      if (now > lastPhaseEndDate) {
        await db
          .update(demodays)
          .set({
            status: "finished",
            active: false,
            updatedAt: new Date()
          })
          .where(eq(demodays.id, demoday.id));

        updatedDemodays.push({
          id: demoday.id,
          name: demoday.name,
          lastPhaseEndDate: lastPhase.endDate
        });
      }
    }

    return NextResponse.json({
      message: `Verificação concluída. ${updatedDemodays.length} Demoday(s) finalizado(s).`,
      updatedDemodays
    });

  } catch (error) {
    console.error("Erro ao verificar Demodays finalizados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 