import { db } from "@/server/db";
import { demodays, demoDayPhases } from "@/server/db/schema";
import { getSessionWithRole } from "@/lib/session-utils";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { demodaySchema } from "@/server/db/validators";

// GET - Fetch all demodays
export async function GET() {
  try {
    // Aplicando a ordem por data de criação mais recente
    const allDemodays = await db.query.demodays.findMany({
      orderBy: desc(demodays.createdAt),
    });

    return NextResponse.json(allDemodays);
  } catch (error) {
    console.error("Error fetching demodays:", error);
    return NextResponse.json(
      { error: "Erro ao buscar demodays" },
      { status: 500 }
    );
  }
}

// POST - Create new demoday
export async function POST(req: NextRequest) {
  try {
    // Get the session to check if user is authenticated
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extract user ID now that we know it exists
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    // Admin check
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar demodays" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = demodaySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, phases } = result.data;

    // Create demoday in a transaction
    const [newDemoday] = await db.transaction(async (tx: any) => {
      // Marque todos os demodays existentes como inativos e finalizados
      await tx
        .update(demodays)
        .set({
          active: false,
          status: "finished"
        })
        .where(eq(demodays.active, true));

      // Insert the demoday
      const [createdDemoday] = await tx
        .insert(demodays)
        .values({
          name,
          createdById: userId,
          active: true,
          status: "active",
        })
        .returning();

      if (!createdDemoday) {
        throw new Error("Falha ao criar demoday");
      }

      // Insert phases
      for (const phase of phases) {
        await tx.insert(demoDayPhases).values({
          demoday_id: createdDemoday.id,
          name: phase.name,
          description: phase.description,
          phaseNumber: phase.phaseNumber,
          startDate: new Date(phase.startDate),
          endDate: new Date(phase.endDate),
        });
      }

      return [createdDemoday];
    });

    return NextResponse.json(newDemoday, { status: 201 });
  } catch (error) {
    console.error("Error creating demoday:", error);
    return NextResponse.json(
      { error: "Erro ao criar demoday" },
      { status: 500 }
    );
  }
} 