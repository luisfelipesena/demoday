import { db } from "@/server/db";
import { projects, projectSubmissions } from "@/server/db/schema";
import { getSessionWithRole } from "@/lib/session-utils";
import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const session = await getSessionWithRole();
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem usar esta função" },
        { status: 403 }
      );
    }

    const { demodayId, projects: projectsData } = await req.json();

    if (!demodayId || !projectsData || !Array.isArray(projectsData)) {
      return NextResponse.json(
        { error: "demodayId e projects são obrigatórios" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const createdProjectIds: string[] = [];

    // Criar projetos em transação
    await db.transaction(async (tx) => {
      for (const projectData of projectsData) {
        // Criar o projeto
        const projectId = createId();
        
        await tx.insert(projects).values({
          id: projectId,
          title: projectData.title,
          description: projectData.description,
          type: projectData.type,
          userId: userId,
          authors: projectData.authors,
          developmentYear: projectData.developmentYear,
          videoUrl: projectData.videoUrl || null,
          repositoryUrl: projectData.repositoryUrl || null,
        });

        // Criar a submissão já aprovada
        const submissionId = createId();
        await tx.insert(projectSubmissions).values({
          id: submissionId,
          projectId: projectId,
          demoday_id: demodayId,
          status: "approved", // Já aprovado para votação
        });

        createdProjectIds.push(projectId);
      }
    });

    return NextResponse.json({
      message: "Projetos criados com sucesso",
      created: createdProjectIds.length,
      projectIds: createdProjectIds,
    });

  } catch (error) {
    console.error("Erro ao criar projetos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 