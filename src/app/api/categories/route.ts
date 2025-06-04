import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { projectCategories } from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demodayId = searchParams.get("demodayId");

    const categories = demodayId
      ? await db.select().from(projectCategories).where(eq(projectCategories.demodayId, demodayId))
      : await db.select().from(projectCategories);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar categorias." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, maxFinalists, demodayId } = body;

    if (!name || !demodayId) {
      return NextResponse.json(
        { error: "Nome e Demoday ID são obrigatórios" },
        { status: 400 }
      );
    }

    const newCategory = await db
      .insert(projectCategories)
      .values({
        id: createId(),
        name,
        description,
        maxFinalists: maxFinalists || 5,
        demodayId,
      })
      .returning();

    return NextResponse.json(newCategory[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}