import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users, passwordResets } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { sendEmail } from "@/server/emailService"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const token = createId();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await db.insert(passwordResets).values({
      id: createId(),
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Recuperação de senha - Demoday",
      html: `<p>Olá, ${user.name}!</p><br><p>Para redefinir sua senha, clique neste <a href="${resetLink}" target="_blank" rel="noopener noreferrer">LINK</a>.</p><br><p>Se não solicitou, ignore este e-mail.</p>`
    })

    return NextResponse.json({ success: true, message: "E-mail de recuperação enviado" });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    return NextResponse.json({ error: "Erro ao solicitar recuperação de senha" }, { status: 500 });
  }
} 