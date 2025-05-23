import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { invites } from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { desc } from "drizzle-orm";
import { sendEmail } from "@/server/emailService"
import { env } from "@/env";

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
        id: createId(),
        email: null,
        token,
        type: "global",
        accepted: false,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        id: createId(),
        email,
        token,
        type: "individual",
        accepted: false,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const inviteLink = `${env.NEXTAUTH_URL}/register?invite=${token}`;
      await sendEmail({
        to: email,
        subject: "Convite para Demoday",
        html: `<p>Você foi convidado para participar do Demoday!</p><br><p>Use este <a href="${inviteLink}" target="_blank" rel="noopener noreferrer">LINK</a> para se cadastrar.</p><br><p>Se não solicitou, ignore este e-mail.</p>`
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