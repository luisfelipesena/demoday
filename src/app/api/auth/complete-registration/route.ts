import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { invites } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, message: "Código de convite é obrigatório" },
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

    // Para convites individuais, verificar se já foi usado
    if (invite.type === "individual" && invite.usedAt) {
      return NextResponse.json(
        { success: false, message: "Este convite já foi utilizado" },
        { status: 400 }
      );
    }

    // Marcar como usado apenas convites individuais (convites globais podem ser reutilizados)
    if (invite.type === "individual") {
      await db
        .update(invites)
        .set({ 
          usedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));
    }

    return NextResponse.json({ 
      success: true, 
      message: invite.type === "global" ? "Convite global utilizado" : "Convite marcado como utilizado" 
    });

  } catch (error) {
    console.error("Erro ao completar registro:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 