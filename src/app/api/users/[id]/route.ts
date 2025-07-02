import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { getSessionWithRole, isAdmin } from "@/lib/session-utils";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithRole();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar usuários" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const userId = params.id;
    const { role } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    if (!role || !["admin", "user", "professor"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido" },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    await db.update(users)
      .set({ 
        role,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 