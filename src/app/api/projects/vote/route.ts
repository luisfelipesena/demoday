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

    // Verificar se o usuário já votou neste projeto
    const userVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.userId, userId as string),
        eq(votes.projectId, projectId)
      ),
    });

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

    // Verificar se o projeto está aprovado
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
    // let currentPhase; // Removido pois não está sendo usado
    let allowedVotePhase = "popular";

    // Verificar fase 3 (votação popular para finalistas)
    const phase3 = phases.find((phase: any) => phase.phaseNumber === 3);
    if (phase3) {
      const startDate = new Date(phase3.startDate);
      const endDate = new Date(phase3.endDate);

      if (now >= startDate && now <= endDate) {
        isVotingPeriod = true;
        // currentPhase = phase3;
        allowedVotePhase = "popular";
      }
    }

    // Verificar fase 4 (votação final - apenas professores)
    if (!isVotingPeriod) {
      const phase4 = phases.find((phase: any) => phase.phaseNumber === 4);
      if (phase4) {
        const startDate = new Date(phase4.startDate);
        const endDate = new Date(phase4.endDate);

        if (now >= startDate && now <= endDate) {
          isVotingPeriod = true;
          // currentPhase = phase4;
          allowedVotePhase = "final";

          // Na fase 4, apenas professores podem votar
          if (session.user.role !== "professor" && session.user.role !== "admin") {
            return NextResponse.json(
              { error: "Apenas professores podem votar na fase final" },
              { status: 403 }
            );
          }

          // Na fase 4, apenas projetos finalistas podem receber votos
          if (submission.status !== "finalist") {
            return NextResponse.json(
              { error: "Apenas projetos finalistas podem receber votos nesta fase" },
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

    // Verificar se o usuário já votou neste projeto nesta fase
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.userId, userId as string),
        eq(votes.projectId, projectId),
        eq(votes.votePhase, votePhase)
      ),
    });

    if (existingVote) {
      return NextResponse.json(
        { error: `Você já votou neste projeto na votação ${votePhase === 'popular' ? 'popular' : 'final'}` },
        { status: 400 }
      );
    }

    // Determinar peso do voto baseado no role e fase
    let weight = 1;
    if (votePhase === "final" && session.user.role === "professor") {
      weight = 3; // Professores têm peso maior na votação final
    }

    // Registrar o voto
    const [newVote] = await db
      .insert(votes)
      .values({
        userId,
        projectId,
        voterRole: session.user.role as "admin" | "user" | "professor",
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