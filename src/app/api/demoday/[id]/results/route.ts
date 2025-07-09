import { db } from "@/server/db";
import { demodays, projects, projectSubmissions, votes } from "@/server/db/schema";
import { and, eq, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface ProjectResult {
  id: string;
  title: string;
  type: string;
  authors: string | null;
  status: string;
  popularVoteCount: number;
  finalWeightedScore: number;
  submissionId: string;
}

interface DemodayOverallStats {
  totalSubmittedProjects: number;
  totalUniqueParticipants: number;
  totalPopularVotes: number;
  totalFinalVotes: number;
}

interface DemodayResultsData {
  demodayName: string;
  projects: ProjectResult[];
  overallStats: DemodayOverallStats;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const demodayId = params.id;

    const demoday = await db.query.demodays.findFirst({
      where: eq(demodays.id, demodayId),
    });

    if (!demoday) {
      return NextResponse.json({ error: "Demoday not found" }, { status: 404 });
    }

    // Buscar TODOS os projetos submetidos no demoday
    const allSubmissions = await db
      .select({
        submissionId: projectSubmissions.id,
        status: projectSubmissions.status,
        project: projects,
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .where(eq(projectSubmissions.demoday_id, demodayId));

    const projectResults: ProjectResult[] = [];

    for (const sub of allSubmissions) {
      if (!sub.project) continue;

      // Calculate Popular Vote Count
      const popularVotes = await db
        .select({ value: sum(votes.weight) })
        .from(votes)
        .where(and(eq(votes.projectId, sub.project.id), eq(votes.votePhase, "popular")));
      const popularVoteCount = Number(popularVotes[0]?.value) || 0;

      // Calculate Final Weighted Score (Popular votes + Final votes - todos com peso 1)
      const allPhaseVotes = await db
        .select({
          weight: votes.weight,
          phase: votes.votePhase,
          role: votes.voterRole
        })
        .from(votes)
        .where(eq(votes.projectId, sub.project.id));

      let finalWeightedScore = 0;
      allPhaseVotes.forEach((vote: { phase: "popular" | "final" | null, weight: number | null, role: string | null }) => {
        if (vote.phase === 'popular') {
          // Todos os votos populares têm peso 1
          finalWeightedScore += 1;
        } else if (vote.phase === 'final') {
          // Todos os votos finais têm peso 1 (removido o peso diferenciado por role)
          finalWeightedScore += 1;
        }
      });

      const projectResult: ProjectResult = {
        id: sub.project.id,
        submissionId: sub.submissionId,
        title: sub.project.title,
        type: sub.project.type,
        authors: sub.project.authors,
        status: sub.status,
        popularVoteCount: popularVoteCount,
        finalWeightedScore: finalWeightedScore,
      };

      projectResults.push(projectResult);
    }

    // Sort projects by finalWeightedScore DESC, then popularVoteCount DESC
    projectResults.sort((a, b) => {
      if (b.finalWeightedScore !== a.finalWeightedScore) {
        return b.finalWeightedScore - a.finalWeightedScore;
      }
      return b.popularVoteCount - a.popularVoteCount;
    });

    // Results are now determined solely by vote counts, no manual winner assignment

    // Calculate Overall Demoday Statistics
    const allSubmissionsForDemoday = await db
      .select({
        projectId: projectSubmissions.projectId,
        userId: projects.userId,
      })
      .from(projectSubmissions)
      .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
      .where(eq(projectSubmissions.demoday_id, demodayId));

    const totalSubmittedProjects = allSubmissionsForDemoday.length;
    const uniqueParticipantIds = new Set(allSubmissionsForDemoday.map((s: { userId: string | null }) => s.userId));
    const totalUniqueParticipants = uniqueParticipantIds.size;

    const allVotesForDemoday = await db
      .select({
        phase: votes.votePhase,
        weight: votes.weight,
      })
      .from(votes)
      .innerJoin(projectSubmissions, eq(votes.projectId, projectSubmissions.projectId))
      .where(eq(projectSubmissions.demoday_id, demodayId));

    let totalPopularVotes = 0;
    let totalFinalVotes = 0;
    allVotesForDemoday.forEach((vote: { phase: "popular" | "final" | null; weight: number | null }) => {
      if (vote.phase === "popular") {
        totalPopularVotes += Number(vote.weight) || 1;
      } else if (vote.phase === "final") {
        totalFinalVotes += Number(vote.weight) || 1;
      }
    });

    const overallStats: DemodayOverallStats = {
      totalSubmittedProjects,
      totalUniqueParticipants,
      totalPopularVotes,
      totalFinalVotes,
    };

    const responseData: DemodayResultsData = {
      demodayName: demoday.name,
      projects: projectResults,
      overallStats,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching demoday results:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 