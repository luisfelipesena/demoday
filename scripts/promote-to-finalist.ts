import { db } from "../src/server/db";
import { projectSubmissions, projects, projectCategories } from "../src/server/db/schema";
import { eq, and } from "drizzle-orm";

async function promoteToFinalist() {
  try {
    console.log("🚀 Promovendo projetos aprovados para finalistas...\n");
    
    // Get active demoday
    const activeDemoday = await db.query.demodays.findFirst({
      where: (demodays, { eq }) => eq(demodays.active, true),
    });

    if (!activeDemoday) {
      console.log("❌ Nenhum Demoday ativo encontrado");
      return;
    }

    console.log(`📅 Demoday ativo: ${activeDemoday.name} (ID: ${activeDemoday.id})\n`);

    // Get approved projects
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
      console.log("❌ Nenhum projeto aprovado encontrado para promover");
      return;
    }

    console.log(`📋 Encontrados ${approvedSubmissions.length} projetos aprovados:`);
    approvedSubmissions.forEach(sub => {
      console.log(`   - ${sub.project?.title}`);
    });
    console.log();

    // Promote all approved projects to finalist
    let promotedCount = 0;
    for (const submission of approvedSubmissions) {
      await db
        .update(projectSubmissions)
        .set({ 
          status: "finalist",
          updatedAt: new Date()
        })
        .where(eq(projectSubmissions.id, submission.id));
      
      console.log(`✅ ${submission.project?.title} promovido para finalista`);
      promotedCount++;
    }

    console.log(`\n🎉 ${promotedCount} projetos promovidos para finalistas!`);
    console.log("💡 Agora eles aparecerão na votação da Fase 4");

  } catch (error) {
    console.error("❌ Erro ao promover projetos:", error);
  }
}

promoteToFinalist(); 