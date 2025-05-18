import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/server/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return NextResponse.json({ error: "Formato de requisição inválido" }, { status: 400 });
    }
    
    const { currentPassword, newPassword } = requestData;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 });
    }
    
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
    });
    
    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }
    
    if (!account.password) {
      return NextResponse.json({ error: "Conta sem senha configurada" }, { status: 404 });
    }
    
    try {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Erro na validação da senha" }, { status: 500 });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id));
    
    const response = NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
    
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
    
    return response;
  } catch {
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
