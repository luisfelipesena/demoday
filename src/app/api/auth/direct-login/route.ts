import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users, accounts, sessions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { cookies } from "next/headers";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      console.log(`Usuário não encontrado para email: ${email}`);
      return NextResponse.json(
        { success: false, message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Buscar a conta associada para verificar a senha
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, user.id),
    });

    if (!account || !account.password) {
      console.log(`Conta não encontrada ou sem senha para usuário: ${user.id}`);
      return NextResponse.json(
        { success: false, message: "Conta não encontrada" },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      console.log(`Senha inválida para usuário: ${user.id}`);
      return NextResponse.json(
        { success: false, message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Criar nova sessão
    const sessionToken = createId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expira em 30 dias

    // Inserir sessão no banco
    await db.insert(sessions).values({
      id: createId(),
      userId: user.id,
      token: sessionToken,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Definir cookie de sessão
    const cookieOptions = {
      name: "auth-session",
      value: JSON.stringify({
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
    };

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

    const cookieStore = await cookies();
    cookieStore.set(cookieOptions);

    return response;
  } catch (error) {
    console.error("Erro no login direto:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
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
