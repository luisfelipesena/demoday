import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demodays, evaluationCriteria, registrationCriteria } from "@/server/db/schema";
import { batchCriteriaSchema, criteriaSchema } from "@/server/db/validators";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch criteria for a specific demoday
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const demodayId = url.searchParams.get("demodayId");
    const type = url.searchParams.get("type");

    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    if (type === "registration") {
      const criteria = await db.query.registrationCriteria.findMany({
        where: eq(registrationCriteria.demoday_id, demodayId),
      });
      return NextResponse.json(criteria);
    } else if (type === "evaluation") {
      const criteria = await db.query.evaluationCriteria.findMany({
        where: eq(evaluationCriteria.demoday_id, demodayId),
      });
      return NextResponse.json(criteria);
    } else {
      // Fetch both types if type is not specified
      const registrationCriteriaList = await db.query.registrationCriteria.findMany({
        where: eq(registrationCriteria.demoday_id, demodayId),
      });

      const evaluationCriteriaList = await db.query.evaluationCriteria.findMany({
        where: eq(evaluationCriteria.demoday_id, demodayId),
      });

      return NextResponse.json({
        registration: registrationCriteriaList,
        evaluation: evaluationCriteriaList,
      });
    }
  } catch (error) {
    console.error("Error fetching criteria:", error);
    return NextResponse.json(
      { error: "Erro ao buscar critérios" },
      { status: 500 }
    );
  }
}

// POST - Create new criteria
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

    // Admin check
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar critérios" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Verificar se estamos recebendo um lote de critérios
    if (body.demodayId !== undefined && (body.registration !== undefined || body.evaluation !== undefined)) {
      const batchResult = batchCriteriaSchema.safeParse(body);

      if (!batchResult.success) {
        return NextResponse.json(
          { error: "Dados inválidos", details: batchResult.error.format() },
          { status: 400 }
        );
      }

      const { demodayId, registration, evaluation } = batchResult.data;

      // Processar em uma transação
      const result = await db.transaction(async (tx) => {
        // Adicionar critérios de inscrição
        if (registration && registration.length > 0) {
          for (const criteria of registration) {
            await tx.insert(registrationCriteria).values({
              demoday_id: demodayId,
              name: criteria.name,
              description: criteria.description,
            });
          }
        }

        // Adicionar critérios de avaliação
        if (evaluation && evaluation.length > 0) {
          for (const criteria of evaluation) {
            await tx.insert(evaluationCriteria).values({
              demoday_id: demodayId,
              name: criteria.name,
              description: criteria.description,
            });
          }
        }

        return { success: true };
      });

      return NextResponse.json(result, { status: 201 });
    } else {
      // Processamento individual de critério
      const result = criteriaSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { error: "Dados inválidos", details: result.error.format() },
          { status: 400 }
        );
      }

      const { demoday_id, name, description, type } = result.data;

      if (!demoday_id) {
        return NextResponse.json(
          { error: "ID do demoday é obrigatório" },
          { status: 400 }
        );
      }

      let newCriteria;

      if (type === "registration") {
        const [criteria] = await db
          .insert(registrationCriteria)
          .values({
            demoday_id,
            name,
            description,
          })
          .returning();
        newCriteria = criteria;
      } else {
        // type === "evaluation"
        const [criteria] = await db
          .insert(evaluationCriteria)
          .values({
            demoday_id,
            name,
            description,
          })
          .returning();
        newCriteria = criteria;
      }

      return NextResponse.json(newCriteria, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating criteria:", error);
    return NextResponse.json(
      { error: "Erro ao criar critério" },
      { status: 500 }
    );
  }
}

// DELETE - Remove criteria
export async function DELETE(req: NextRequest) {
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
        { error: "Apenas administradores podem remover critérios" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "ID e tipo do critério são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === "registration") {
      await db
        .delete(registrationCriteria)
        .where(eq(registrationCriteria.id, id));
    } else if (type === "evaluation") {
      await db
        .delete(evaluationCriteria)
        .where(eq(evaluationCriteria.id, id));
    } else {
      return NextResponse.json(
        { error: "Tipo inválido" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting criteria:", error);
    return NextResponse.json(
      { error: "Erro ao remover critério" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar critérios de um demoday
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionWithRole();

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

    const body = await req.json();
    const result = batchCriteriaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { demodayId, registration, evaluation } = result.data;

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

    // Atualizar todos os critérios em uma transação
    await db.transaction(async (tx) => {
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