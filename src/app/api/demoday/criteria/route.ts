import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demodays, evaluationCriteria } from "@/server/db/schema";
import { batchCriteriaSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const demodayId = searchParams.get("demodayId");

    if (!demodayId) {
      return NextResponse.json(
        { error: "demodayId é obrigatório" },
        { status: 400 }
      );
    }

    const criteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, demodayId),
    });

    return NextResponse.json({ data: criteria });
  } catch (error) {
    console.error("Error fetching criteria:", error);
    return NextResponse.json(
      { error: "Erro ao buscar critérios" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar critérios" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { demodayId, criteria } = body;

    if (!demodayId) {
      return NextResponse.json(
        { error: "demodayId é obrigatório" },
        { status: 400 }
      );
    }

    const existingDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!existingDemoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    const result = batchCriteriaSchema.safeParse({ demodayId, criteria });

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(evaluationCriteria)
        .where(eq(evaluationCriteria.demoday_id, demodayId));

      if (criteria && criteria.length > 0) {
        for (const criteriaItem of criteria) {
          if (criteriaItem.name.trim() && criteriaItem.description.trim()) {
            await tx.insert(evaluationCriteria).values({
              demoday_id: demodayId,
              name: criteriaItem.name,
              description: criteriaItem.description,
            });
          }
        }
      }
    });

    const updatedCriteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, demodayId),
    });

    return NextResponse.json({
      success: true,
      data: {
        criteria: updatedCriteria,
      },
    });
  } catch (error) {
    console.error("Error updating criteria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar critérios" },
      { status: 500 }
    );
  }
}