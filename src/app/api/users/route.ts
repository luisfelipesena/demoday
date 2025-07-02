import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { getSessionWithRole, isAdmin } from "@/lib/session-utils";
import { desc, ilike, eq, or, and, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithRole();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user)) {
      return NextResponse.json(
        { error: "Apenas administradores podem listar usuários" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (role && role !== "all") {
      conditions.push(eq(users.role, role as any));
    }

    const whereClause = conditions.length === 0 
      ? undefined 
      : conditions.length === 1 
        ? conditions[0] 
        : and(...conditions);

    const userList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

    const totalCount = await db.select({ count: count() })
      .from(users)
      .where(whereClause);
    
    const total = totalCount[0]?.count || 0;

    return NextResponse.json({
      users: userList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 