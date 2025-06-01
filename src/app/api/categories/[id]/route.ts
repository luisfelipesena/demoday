import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { projectCategories } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const category = await db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.id, resolvedParams.id))
      .limit(1);

    if (category.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category[0]);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await paramsPromise;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem editar categorias." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, maxFinalists } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const updatedCategory = await db
      .update(projectCategories)
      .set({
        name,
        description,
        maxFinalists: maxFinalists || 5,
        updatedAt: new Date(),
      })
      .where(eq(projectCategories.id, resolvedParams.id))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await paramsPromise;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem excluir categorias." },
        { status: 403 }
      );
    }

    const deletedCategory = await db
      .delete(projectCategories)
      .where(eq(projectCategories.id, resolvedParams.id))
      .returning();

    if (deletedCategory.length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Categoria excluída com sucesso" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}