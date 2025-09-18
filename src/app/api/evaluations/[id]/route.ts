import { getSessionWithRole } from "@/lib/session-utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/server/db";
import {
  evaluationScores,
  professorEvaluations,
} from "@/server/db/schema";

// Get evaluation details with scores (admin only)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithRole();
    const params = await context.params;
    const evaluationId = params.id;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se o usuário é administrador
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    const evaluation = await db.query.professorEvaluations.findFirst({
      where: eq(professorEvaluations.id, evaluationId),
      with: {
        submission: {
          with: {
            project: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    const scores = await db.query.evaluationScores.findMany({
      where: eq(evaluationScores.evaluationId, evaluationId),
      with: {
        criteria: true,
      },
    });

    return NextResponse.json({
      evaluation,
      scores,
    });
  } catch (error) {
    console.error("Error fetching evaluation details:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation details" }, { status: 500 });
  }
}