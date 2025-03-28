import { db } from "@/server/db";
import { evaluationCriteria, registrationCriteria, demodays } from "@/server/db/schema";
import { authOptions } from "@/auth/auth-options";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

// Schema for validating batch criteria creation
const batchCriteriaSchema = z.object({
  registration: z.array(
    z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
    })
  ),
  evaluation: z.array(
    z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
    })
  ),
});

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
      for (const criteria of registration) {
        if (criteria.name.trim() && criteria.description.trim()) {
          await tx.insert(registrationCriteria).values({
            demoday_id: demodayId,
            name: criteria.name,
            description: criteria.description,
          });
        }
      }

      // Insert evaluation criteria
      for (const criteria of evaluation) {
        if (criteria.name.trim() && criteria.description.trim()) {
          await tx.insert(evaluationCriteria).values({
            demoday_id: demodayId,
            name: criteria.name,
            description: criteria.description,
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