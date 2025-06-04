import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, sessions, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

    const { name, email } = requestData;

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    if (email !== session.user?.email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: "Este email já está sendo usado por outro usuário" },
          { status: 400 }
        );
      }
    }

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    await db.transaction(async (tx: any) => {
      await tx.update(users)
        .set({ name, email, updatedAt: new Date() })
        .where(eq(users.id, userId));

      await tx.update(accounts)
        .set({ accountId: userId, updatedAt: new Date() })
        .where(eq(accounts.id, account.id));

      if (email !== session.user?.email) {
        await tx.delete(sessions).where(eq(sessions.userId, userId));
      }
    });

    const response = NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      userInfo: { id: userId, name, email }
    });

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');

    return response;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
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
