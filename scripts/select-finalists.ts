import { db } from "../src/server/db";
import { projectSubmissions, projects, votes } from "../src/server/db/schema";
import { eq, and, count, desc } from "drizzle-orm";

async function selectFinalists() {
  try {
    console.log("🏆 Selecionando finalistas baseado na votação popular...\n");

    // Get active demoday
    const activeDemoday = await db.query.demodays.findFirst({
      where: (demodays, { eq }) => eq(demodays.active, true),
    });

    if (!activeDemoday) {
      console.log("❌ Nenhum Demoday ativo encontrado");
      return;
    }

    console.log(`📅 Demoday ativo: ${activeDemoday.name} (ID: ${activeDemoday.id})`);
    console.log(`🎯 Máximo de finalistas: ${activeDemoday.maxFinalists}\n`);

    // Get all approved projects with their popular vote counts
    const approvedSubmissions = await db.query.projectSubmissions.findMany({
      where: and(
        eq(projectSubmissions.demoday_id, activeDemoday.id),
        eq(projectSubmissions.status, "approved")
      ),
      with: {
        project: true
      }
    });

    if (approvedSubmissions.length === 0) {
      console.log("❌ Nenhum projeto aprovado encontrado");
      return;
    }

    console.log(`📋 Encontrados ${approvedSubmissions.length} projetos aprovados\n`);

    // Get vote counts for each project in popular voting phase (phase 3)
    const projectVoteCounts = [];

    for (const submission of approvedSubmissions) {
      const voteCountResult = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.projectId, submission.projectId),
          eq(votes.votePhase, "popular") // Only popular voting counts
        ));

      const voteCount = voteCountResult[0]?.count || 0;

      projectVoteCounts.push({
        submission,
        project: submission.project,
        votes: voteCount
      });
    }

    // Sort by vote count (descending) and take top maxFinalists
    projectVoteCounts.sort((a, b) => b.votes - a.votes);
    const topProjects = projectVoteCounts.slice(0, activeDemoday.maxFinalists);

    console.log("📊 Resultados da votação popular:");
    projectVoteCounts.forEach((item, index) => {
      const isFinalist = index < activeDemoday.maxFinalists;
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📋";
      console.log(`   ${medal} ${item.project?.title}: ${item.votes} votos${isFinalist ? " ✅ FINALISTA" : ""}`);
    });
    console.log();

    if (topProjects.length === 0) {
      console.log("❌ Nenhum projeto com votos encontrado");
      return;
    }

    // Reset all projects to approved status first (in case we're re-running)
    console.log("🔄 Resetando status de finalistas anteriores...");
    await db
      .update(projectSubmissions)
      .set({
        status: "approved",
        updatedAt: new Date()
      })
      .where(and(
        eq(projectSubmissions.demoday_id, activeDemoday.id),
        eq(projectSubmissions.status, "finalist")
      ));

    // Promote top projects to finalist status
    console.log(`\n🏆 Promovendo top ${topProjects.length} projetos para finalistas:`);
    let promotedCount = 0;

    for (const item of topProjects) {
      await db
        .update(projectSubmissions)
        .set({
          status: "finalist",
          updatedAt: new Date()
        })
        .where(eq(projectSubmissions.id, item.submission.id));

      console.log(`   ✅ ${item.project?.title} (${item.votes} votos) → FINALISTA`);
      promotedCount++;
    }

    console.log(`\n🎉 ${promotedCount} finalistas selecionados com sucesso!`);
    console.log("💡 Agora apenas estes projetos aparecerão na votação final (Fase 4)");

  } catch (error) {
    console.error("❌ Erro ao selecionar finalistas:", error);
  }
}

selectFinalists();