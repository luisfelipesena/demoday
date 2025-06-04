import { env } from "@/env";
import { db } from "@/server/db";
import { invites } from "@/server/db/schema";
import { sendEmail } from "@/server/emailService";
import { createId } from "@paralleldrive/cuid2";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { emails, type } = await req.json();
    if (!type || (type !== "global" && type !== "individual")) {
      return NextResponse.json({ error: "Tipo de convite inválido" }, { status: 400 });
    }

    if (type === "global") {
      const token = createId();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias
      await db.insert(invites).values({
        email: null,
        token,
        role: "user",
        expiresAt,
      });
      return NextResponse.json({ success: true, token, link: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/register?invite=${token}` });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Lista de e-mails obrigatória para convites individuais" }, { status: 400 });
    }

    const results = [];
    for (const email of emails) {
      const token = createId();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      await db.insert(invites).values({
        email,
        token,
        role: "user",
        expiresAt,
      });
      const inviteLink = `${env.NEXTAUTH_URL}/register?invite=${token}`;
      await sendEmail({
        to: email,
        subject: "Convite para Demoday",
        html: `<h2>Convite para Demoday</h2>
        <p>Olá!</p>
        <p>Você foi convidado para participar da plataforma Demoday.</p>
        <p>Para criar sua conta, clique no link abaixo:</p>
        <p><a href="${inviteLink}" target="_blank" rel="noopener noreferrer" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Criar Conta</a></p>
        <p>Este link expira em 7 dias.</p>
        <p>Se você não solicitou este convite, ignore este e-mail.</p>
        <hr>
        <p><small>Demoday - Plataforma de Projetos Acadêmicos</small></p>`
      })
      results.push({ email, token, link: inviteLink });
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao enviar convite" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allInvites = await db.select().from(invites).orderBy(desc(invites.createdAt));
    return NextResponse.json({ invites: allInvites });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar convites" }, { status: 500 });
  }
} 