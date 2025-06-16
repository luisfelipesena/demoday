import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { projectSubmissions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem atualizar status de projetos." },
        { status: 403 }
      );
    }

    const params = await context.params;
    const submissionId = params.id;
    const { status } = await request.json();

    // Validar status
    const validStatuses = ["submitted", "approved", "rejected", "finalist", "winner"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido. Use: submitted, approved, rejected, finalist, winner" },
        { status: 400 }
      );
    }

    // Verificar se a submissão existe
    const submission = await db.query.projectSubmissions.findFirst({
      where: eq(projectSubmissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submissão não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar status
    const updatedSubmission = await db
      .update(projectSubmissions)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(projectSubmissions.id, submissionId))
      .returning();

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      submission: updatedSubmission[0],
    });
  } catch (error) {
    console.error("Error updating project status:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 