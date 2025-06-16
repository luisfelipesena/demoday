import { db } from "../src/server/db";
import { projectSubmissions, projects, projectCategories } from "../src/server/db/schema";
import { eq, and } from "drizzle-orm";

async function checkFinalists() {
  try {
    console.log("🔍 Verificando status dos projetos e finalistas...\n");
    
    // Get active demoday
    const activeDemoday = await db.query.demodays.findFirst({
      where: (demodays, { eq }) => eq(demodays.active, true),
    });

    if (!activeDemoday) {
      console.log("❌ Nenhum Demoday ativo encontrado");
      return;
    }

    console.log(`📅 Demoday ativo: ${activeDemoday.name} (ID: ${activeDemoday.id})\n`);

    // Check categories
    const categories = await db.query.projectCategories.findMany({
      where: eq(projectCategories.demodayId, activeDemoday.id),
    });

    console.log(`📂 Categorias configuradas: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (máx. ${cat.maxFinalists} finalistas)`);
    });
    console.log();

    // Check project submissions by status
    const submissions = await db.query.projectSubmissions.findMany({
      where: eq(projectSubmissions.demoday_id, activeDemoday.id),
      with: {
        project: true
      }
    });

    const statusCounts = {
      submitted: 0,
      approved: 0,
      finalist: 0,
      winner: 0,
      rejected: 0
    };

    submissions.forEach(sub => {
      if (sub.status in statusCounts) {
        statusCounts[sub.status as keyof typeof statusCounts]++;
      }
    });

    console.log("📊 Status dos projetos:");
    console.log(`   - Submetidos: ${statusCounts.submitted}`);
    console.log(`   - Aprovados: ${statusCounts.approved}`);
    console.log(`   - Finalistas: ${statusCounts.finalist}`);
    console.log(`   - Vencedores: ${statusCounts.winner}`);
    console.log(`   - Rejeitados: ${statusCounts.rejected}`);
    console.log();

    // Show finalist projects if any
    if (statusCounts.finalist > 0) {
      console.log("🏆 Projetos finalistas:");
      const finalists = submissions.filter(sub => sub.status === 'finalist');
      finalists.forEach(sub => {
        console.log(`   - ${sub.project?.title} (ID: ${sub.project?.id})`);
      });
    } else {
      console.log("⚠️  Nenhum projeto finalista encontrado!");
      console.log("💡 Para que projetos apareçam na Fase 4, você precisa:");
      console.log("   1. Ter categorias configuradas");
      console.log("   2. Executar 'Selecionar Finalistas Automaticamente' no painel admin");
    }

    console.log();
    
    // Check current phase
    const phases = await db.query.demoDayPhases.findMany({
      where: (demoDayPhases, { eq }) => eq(demoDayPhases.demoday_id, activeDemoday.id),
      orderBy: (demoDayPhases, { asc }) => [asc(demoDayPhases.phaseNumber)],
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

    if (currentPhase) {
      console.log(`⏰ Fase atual: Fase ${currentPhase.phaseNumber} - ${currentPhase.name}`);
      console.log(`   Período: ${new Date(currentPhase.startDate).toLocaleDateString()} a ${new Date(currentPhase.endDate).toLocaleDateString()}`);
    } else {
      console.log("⏰ Nenhuma fase ativa no momento");
    }

  } catch (error) {
    console.error("❌ Erro ao verificar finalistas:", error);
  }
}

checkFinalists(); 