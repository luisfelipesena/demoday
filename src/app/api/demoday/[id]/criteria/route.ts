import { authOptions } from "@/auth/auth-options";
import { db } from "@/server/db";
import { demodays, evaluationCriteria, registrationCriteria } from "@/server/db/schema";
import { batchCriteriaSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Admin check
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar critérios" },
        { status: 403 }
      );
    }

    // Unwrap the params
    const params = await context.params;
    const demodayId = params.id;

    // Validate that the demoday exists
    const existingDemoday = await db.query.demodays.findFirst({
      where: (demdays: typeof demodays) => eq(demdays.id, demodayId),
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

    const { registration, evaluation } = result.data;

    // Insert all criteria in a transaction
    await db.transaction(async (tx: typeof db) => {
      // Insert registration criteria
      if (registration) {
        for (const criteria of registration) {
          if (criteria.name.trim() && criteria.description.trim()) {
            await tx.insert(registrationCriteria).values({
              demoday_id: demodayId,
              name: criteria.name,
              description: criteria.description,
            });
          }
        }
      }

      // Insert evaluation criteria
      if (evaluation) {
        for (const criteria of evaluation) {
          if (criteria.name.trim() && criteria.description.trim()) {
            await tx.insert(evaluationCriteria).values({
              demoday_id: demodayId,
              name: criteria.name,
              description: criteria.description,
            });
          }
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

// PUT - Atualizar critérios de um demoday
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Admin check
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar critérios" },
        { status: 403 }
      );
    }

    // Unwrap the params
    const params = await context.params;
    const demodayId = params.id;

    // Validate that the demoday exists
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

    const { registration, evaluation } = result.data;

    // Atualizar todos os critérios em uma transação
    await db.transaction(async (tx: typeof db) => {
      // Remover todos os critérios existentes
      await tx.delete(registrationCriteria)
        .where(eq(registrationCriteria.demoday_id, demodayId));

      await tx.delete(evaluationCriteria)
        .where(eq(evaluationCriteria.demoday_id, demodayId));

      // Inserir novos critérios de inscrição
      if (registration && registration.length > 0) {
        for (const criteria of registration) {
          if (criteria.name.trim() && criteria.description.trim()) {
            await tx.insert(registrationCriteria).values({
              demoday_id: demodayId,
              name: criteria.name,
              description: criteria.description,
            });
          }
        }
      }

      // Inserir novos critérios de avaliação
      if (evaluation && evaluation.length > 0) {
        for (const criteria of evaluation) {
          if (criteria.name.trim() && criteria.description.trim()) {
            await tx.insert(evaluationCriteria).values({
              demoday_id: demodayId,
              name: criteria.name,
              description: criteria.description,
            });
          }
        }
      }
    });

    // Buscar critérios atualizados
    const updatedRegistrationCriteria = await db.query.registrationCriteria.findMany({
      where: eq(registrationCriteria.demoday_id, demodayId),
    });

    const updatedEvaluationCriteria = await db.query.evaluationCriteria.findMany({
      where: eq(evaluationCriteria.demoday_id, demodayId),
    });

    return NextResponse.json({
      success: true,
      data: {
        registration: updatedRegistrationCriteria,
        evaluation: updatedEvaluationCriteria,
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