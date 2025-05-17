import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users, accounts, passwordResets } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
    }

    const reset = await db.query.passwordResets.findFirst({ where: eq(passwordResets.token, token) });
    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, reset.userId) });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const account = await db.query.accounts.findFirst({ where: eq(accounts.userId, user.id) });
    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(accounts).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(accounts.id, account.id));
    await db.delete(passwordResets).where(and(eq(passwordResets.id, reset.id)));

    return NextResponse.json({ success: true, message: "Senha redefinida com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
} 