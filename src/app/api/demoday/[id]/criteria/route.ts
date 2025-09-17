import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demodays, evaluationCriteria } from "@/server/db/schema";
import { batchCriteriaSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
        { error: "Apenas administradores podem criar critérios" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const demodayId = params.id;

    const existingDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!existingDemoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const result = batchCriteriaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { criteria } = result.data;

    await db.transaction(async (tx) => {
      for (const criteriaItem of criteria) {
        if (criteriaItem.name.trim() && criteriaItem.description.trim()) {
          await tx.insert(evaluationCriteria).values({
            demoday_id: demodayId,
            name: criteriaItem.name,
            description: criteriaItem.description,
          });
        }
      }
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating criteria:", error);
    return NextResponse.json(
      { error: "Erro ao criar critérios" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const demodayId = params.id;

    const existingDemoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!existingDemoday) {
      return NextResponse.json(
        { error: "Demoday não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const result = batchCriteriaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { criteria } = result.data;

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