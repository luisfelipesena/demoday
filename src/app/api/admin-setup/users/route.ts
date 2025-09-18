import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "student_ufba", "student_external", "professor"]),
});

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "student_ufba", "student_external", "professor"]),
  password: z.string().optional(),
});

// GET - Lista todos os usuários
export async function GET() {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    }).from(users);

    return Response.json({ users: allUsers });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST - Cria um novo usuário (sem verificação de email)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = createUserSchema.parse(body);

    // Verifica se o email já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return Response.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    // Cria hash da senha usando Better Auth
    const hashedPassword = await hashPassword(password);

    // Insere o usuário diretamente no banco (emailVerified = true)
    const insertedUsers = await db.insert(users).values({
      name,
      email,
      role,
      emailVerified: true, // Pula a verificação de email
    }).returning();

    const newUser = insertedUsers[0];
    if (!newUser) {
      return Response.json({ error: "Erro ao criar usuário" }, { status: 500 });
    }

    // Cria registro na tabela accounts com hash da Better Auth
    const { accounts } = await import("@/server/db/schema");
    await db.insert(accounts).values({
      userId: newUser.id,
      accountId: newUser.email,
      providerId: "credential",
      password: hashedPassword,
    });

    return Response.json({
      message: "Usuário criado com sucesso",
      user: newUser
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        error: "Dados inválidos",
        details: error.errors
      }, { status: 400 });
    }

    console.error("Erro ao criar usuário:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// PUT - Atualiza um usuário existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, role, password } = updateUserSchema.parse(body);

    // Verifica se o usuário existe
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existingUser.length === 0) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verifica se o email já está sendo usado por outro usuário
    const emailExists = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (emailExists.length > 0 && emailExists[0]?.id !== id) {
      return Response.json({ error: "Email já está sendo usado por outro usuário" }, { status: 400 });
    }

    // Atualiza o usuário
    const updatedUsers = await db.update(users)
      .set({
        name,
        email,
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    const updatedUser = updatedUsers[0];
    if (!updatedUser) {
      return Response.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
    }

    // Se senha foi fornecida, usa Better Auth para hash
    if (password) {
      const { accounts } = await import("@/server/db/schema");
      const hashedPassword = await hashPassword(password);
      await db.update(accounts)
        .set({ password: hashedPassword })
        .where(eq(accounts.userId, id));
    }

    return Response.json({ 
      message: "Usuário atualizado com sucesso", 
      user: updatedUser 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: "Dados inválidos", 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error("Erro ao atualizar usuário:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE - Remove um usuário
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }

    // Verifica se o usuário existe
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existingUser.length === 0) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Remove o usuário (cascade vai remover accounts e outros relacionamentos)
    await db.delete(users).where(eq(users.id, id));

    return Response.json({ message: "Usuário removido com sucesso" });

  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
