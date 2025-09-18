
import { db } from "../src/server/db";
import { projectSubmissions } from "../src/server/db/schema";
import { eq, and } from "drizzle-orm";

async function limitFinalists() {
  try {
    console.log("🎯 Limitando finalistas para os top 3...\n");

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

    // Get all finalist projects
    const finalistSubmissions = await db.query.projectSubmissions.findMany({
      where: and(
        eq(projectSubmissions.demoday_id, activeDemoday.id),
        eq(projectSubmissions.status, "finalist")
      ),
      with: {
        project: true
      }
    });

    console.log(`📋 Encontrados ${finalistSubmissions.length} projetos finalistas atuais:`);
    finalistSubmissions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ${sub.project?.title} (ID: ${sub.project?.id})`);
    });

    if (finalistSubmissions.length <= activeDemoday.maxFinalists) {
      console.log(`\n✅ Número de finalistas (${finalistSubmissions.length}) já está dentro do limite (${activeDemoday.maxFinalists})`);
      return;
    }

    // Keep only the first 3 as finalists, demote the rest to approved
    const toKeep = finalistSubmissions.slice(0, activeDemoday.maxFinalists);
    const toDemote = finalistSubmissions.slice(activeDemoday.maxFinalists);

    if (toDemote.length > 0) {
      console.log(`\n🔄 Demovendo ${toDemote.length} projetos de finalista para aprovado:`);

      for (const submission of toDemote) {
        await db
          .update(projectSubmissions)
          .set({
            status: "approved",
            updatedAt: new Date()
          })
          .where(eq(projectSubmissions.id, submission.id));

        console.log(`   ⬇️  ${submission.project?.title} → aprovado`);
      }
    }

    console.log(`\n✅ Finalistas mantidos (top ${activeDemoday.maxFinalists}):`);
    toKeep.forEach((sub, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏆";
      console.log(`   ${medal} ${sub.project?.title}`);
    });

    console.log(`\n🎉 Processo concluído! Agora há exatamente ${activeDemoday.maxFinalists} finalistas.`);

  } catch (error) {
    console.error("❌ Erro ao limitar finalistas:", error);
  }
}

limitFinalists();