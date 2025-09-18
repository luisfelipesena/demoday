import { getSessionWithRole } from "@/lib/session-utils";
import { db } from "@/server/db";
import { demoDayPhases, projects, projectSubmissions, votes } from "@/server/db/schema";
import { voteSchema } from "@/server/db/validators";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET - Verificar se o usuário já votou em um projeto específico
export async function GET(req: NextRequest) {
  try {
    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "ID do projeto é obrigatório" },
        { status: 400 }
      );
    }

    const demodayId = searchParams.get("demodayId");

    if (!demodayId) {
      return NextResponse.json(
        { error: "ID do demoday é obrigatório" },
        { status: 400 }
      );
    }

    // Get current phase to determine voting logic
    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, demodayId),
      orderBy: demoDayPhases.phaseNumber
    });

    const now = new Date();
    let currentPhase = null;
    for (const phase of phases) {
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      if (now >= startDate && now <= endDate) {
        currentPhase = phase;
        break;
      }
    }

    if (!currentPhase) {
      return NextResponse.json(
        { error: "Fase não encontrada" },
        { status: 400 }
      );
    }

    const isCurrentlyFinalPhase = currentPhase.phaseNumber === 4;

    let userVote;
    if (isCurrentlyFinalPhase) {
      // For final phase, check if user voted for ANY project in final phase
      userVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.userId, userId as string),
          eq(votes.votePhase, "final")
        ),
      });
    } else {
      // For popular phase, check if user voted for this specific project
      userVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.userId, userId as string),
          eq(votes.projectId, projectId),
          eq(votes.votePhase, "popular")
        ),
      });
    }

    return NextResponse.json({
      hasVoted: !!userVote,
      vote: userVote,
    });
  } catch (error) {
    console.error("Erro ao verificar voto:", error);
    return NextResponse.json(
      { error: "Erro ao verificar voto" },
      { status: 500 }
    );
  }
}

// POST - Registrar um voto em um projeto
export async function POST(req: NextRequest) {
  try {
    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuário não encontrado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = voteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { projectId, demodayId, votePhase = "popular" } = result.data;

    // Verificar se o projeto existe
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o projeto está submetido no Demoday especificado
    const submission = await db.query.projectSubmissions.findFirst({
      where: and(
        eq(projectSubmissions.projectId, projectId),
        eq(projectSubmissions.demoday_id, demodayId)
      ),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Projeto não submetido neste Demoday" },
        { status: 404 }
      );
    }

    // Verificar se o projeto está aprovado OU é finalista (dependendo da fase)
    if (submission.status !== "approved" && submission.status !== "finalist") {
      return NextResponse.json(
        { error: "Projeto não está disponível para votação" },
        { status: 400 }
      );
    }

    // Verificar em qual fase estamos
    const phases = await db.query.demoDayPhases.findMany({
      where: eq(demoDayPhases.demoday_id, demodayId),
      orderBy: demoDayPhases.phaseNumber,
    });

    const now = new Date();
    let isVotingPeriod = false;
    let allowedVotePhase = "popular";

    // Verificar fase 3 (votação popular)
    const phase3 = phases.find((phase: any) => phase.phaseNumber === 3);
    if (phase3) {
      const startDate = new Date(phase3.startDate);
      const endDate = new Date(phase3.endDate);

      if (now >= startDate && now <= endDate) {
        isVotingPeriod = true;
        allowedVotePhase = "popular";
        // Na fase 3, apenas projetos aprovados podem receber votos
        if (submission.status !== "approved") {
          return NextResponse.json(
            { error: "Projeto não está disponível para votação popular" },
            { status: 400 }
          );
        }
      }
    }

    // Verificar fase 4 (votação final)
    if (!isVotingPeriod) {
      const phase4 = phases.find((phase: any) => phase.phaseNumber === 4);
      if (phase4) {
        const startDate = new Date(phase4.startDate);
        const endDate = new Date(phase4.endDate);

        if (now >= startDate && now <= endDate) {
          isVotingPeriod = true;
          allowedVotePhase = "final";
          
          // Na fase 4, apenas projetos finalistas podem receber votos
          if (submission.status !== "finalist") {
            return NextResponse.json(
              { error: "Projeto não está disponível para votação final - apenas finalistas podem receber votos" },
              { status: 400 }
            );
          }
        }
      }
    }

    if (!isVotingPeriod) {
      return NextResponse.json(
        { error: "Fora do período de votação" },
        { status: 400 }
      );
    }

    // Verificar se o tipo de voto é permitido para a fase atual
    if (votePhase !== allowedVotePhase) {
      return NextResponse.json(
        { error: `Tipo de votação '${votePhase}' não permitido na fase atual. Use '${allowedVotePhase}'` },
        { status: 400 }
      );
    }

    // For final phase, check if user has already voted for ANY project in this phase
    // For popular phase, check if user has already voted for THIS SPECIFIC project
    let existingVote;
    if (votePhase === "final") {
      // In final voting, user can only vote ONCE total (for any project)
      existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.userId, userId as string),
          eq(votes.votePhase, "final")
        ),
      });

      if (existingVote) {
        return NextResponse.json(
          { error: "Você já votou na votação final - apenas um voto é permitido" },
          { status: 400 }
        );
      }
    } else {
      // In popular voting, user can vote for multiple projects but not the same project twice
      existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.userId, userId as string),
          eq(votes.projectId, projectId),
          eq(votes.votePhase, "popular")
        ),
      });

      if (existingVote) {
        return NextResponse.json(
          { error: "Você já votou neste projeto na votação popular" },
          { status: 400 }
        );
      }
    }

    // Todos os votos têm peso 1 (removido o sistema de peso diferenciado)
    const weight = 1;

    // Registrar o voto
    const [newVote] = await db
      .insert(votes)
      .values({
        userId,
        projectId,
        voterRole: session.user.role as "admin" | "student_ufba" | "student_external" | "professor",
        votePhase: votePhase as "popular" | "final",
        weight: weight,
      })
      .returning();

    return NextResponse.json(newVote, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar voto:", error);
    return NextResponse.json(
      { error: "Erro ao registrar voto" },
      { status: 500 }
    );
  }
}

// DELETE - Remover um voto (pode ser usado para implementar funcionalidade de desfazer voto)
export async function DELETE(req: NextRequest) {
  try {
    // Obter a sessão para verificar se o usuário está autenticado
    const session = await getSessionWithRole();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const votePhaseParam = searchParams.get("votePhase") || "popular";

    if (!projectId) {
      return NextResponse.json(
        { error: "ID do projeto é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o voto existe
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.userId, userId as string),
        eq(votes.projectId, projectId),
        eq(votes.votePhase, votePhaseParam as "popular" | "final")
      ),
    });

    if (!existingVote) {
      return NextResponse.json(
        { error: "Voto não encontrado" },
        { status: 404 }
      );
    }

    // Remover o voto
    await db
      .delete(votes)
      .where(and(
        eq(votes.userId, userId as string),
        eq(votes.projectId, projectId),
        eq(votes.votePhase, votePhaseParam as "popular" | "final")
      ));

    return NextResponse.json(
      { message: "Voto removido com sucesso" }
    );
  } catch (error) {
    console.error("Erro ao remover voto:", error);
    return NextResponse.json(
      { error: "Erro ao remover voto" },
      { status: 500 }
    );
  }
} 