import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { invites } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { inviteCode, userEmail } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, message: "Código de convite é obrigatório" },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const invite = await db
      .select()
      .from(invites)
      .where(eq(invites.token, inviteCode))
      .limit(1)
      .then((invites: any[]) => invites[0] || null);

    if (!invite) {
      return NextResponse.json(
        { success: false, message: "Código de convite inválido" },
        { status: 400 }
      );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "Código de convite expirado" },
        { status: 400 }
      );
    }

    if (invite.email && invite.email !== userEmail) {
      return NextResponse.json(
        { success: false, message: "Este convite não é para este email" },
        { status: 400 }
      );
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { success: false, message: "Este convite já foi utilizado" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      role: invite.role,
    });

  } catch (error) {
    console.error("Erro ao validar convite:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 