#!/usr/bin/env tsx

import { db, eq } from "@/server/db";
import { users, accounts } from "@/server/db/schema";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";

// Configurações do super usuário
const SUPER_USER_EMAIL = "demoday.ic.ufba@gmail.com";
const SUPER_USER_PASSWORD = "!1S@d9^/54m<";
const SUPER_USER_NAME = "Administrador Demoday";

async function createSuperUser() {
  console.log("🔍 Verificando se o super usuário já existe...");
  
  try {
    // Verificar se o usuário já existe
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, SUPER_USER_EMAIL),
    });

    if (existingUser) {
      console.log("⚠️  Super usuário já existe no sistema!");
      console.log(`User ID: ${existingUser.id}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Email Verificado: ${existingUser.emailVerified ? "Sim" : "Não"}`);
      
      // Verificar se a conta também existe
      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.userId, existingUser.id),
      });
      
      if (existingAccount) {
        console.log("✅ Conta de acesso também já existe.");
      } else {
        console.log("❌ Usuário existe mas conta de acesso não encontrada!");
        console.log("🔧 Criando conta de acesso...");
        
        // Criptografar senha
        const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 12);
        
        // Criar conta de acesso
        await db.insert(accounts).values({
          id: createId(),
          userId: existingUser.id,
          accountId: SUPER_USER_EMAIL,
          providerId: "credential",
          password: hashedPassword,
        });
        
        console.log("✅ Conta de acesso criada com sucesso!");
      }
      
      return existingUser;
    }

    console.log("👤 Criando novo super usuário...");

    // Criptografar a senha
    console.log("🔐 Criptografando senha...");
    const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 12);

    // Criar o usuário
    const [newUser] = await db
      .insert(users)
      .values({
        id: createId(),
        name: SUPER_USER_NAME,
        email: SUPER_USER_EMAIL,
        emailVerified: true, // Super usuário já verificado
        role: "admin",
      })
      .returning();

    if (!newUser) {
      throw new Error("Falha ao criar usuário no banco de dados");
    }

    console.log("✅ Usuário criado com sucesso!");
    console.log(`User ID: ${newUser.id}`);

    // Criar a conta associada com senha
    console.log("🔑 Criando conta de acesso...");
    const [newAccount] = await db
      .insert(accounts)
      .values({
        id: createId(),
        userId: newUser.id,
        accountId: SUPER_USER_EMAIL,
        providerId: "credential",
        password: hashedPassword,
      })
      .returning();

    if (!newAccount) {
      throw new Error("Falha ao criar conta de acesso no banco de dados");
    }

    console.log("✅ Conta de acesso criada com sucesso!");
    console.log(`Account ID: ${newAccount.id}`);

    console.log("\n🎉 Super usuário criado com sucesso!");
    console.log("📋 Dados do super usuário:");
    console.log(`📧 Email: ${SUPER_USER_EMAIL}`);
    console.log(`🔑 Senha: ${SUPER_USER_PASSWORD}`);
    console.log(`👤 Nome: ${SUPER_USER_NAME}`);
    console.log(`🛡️  Role: admin`);
    console.log(`✅ Email verificado: Sim`);
    
    return newUser;

  } catch (error) {
    console.error("❌ Erro ao criar super usuário:", error);
    throw error;
  }
}

async function validateEnvironment() {
  console.log("🔍 Validando variáveis de ambiente...");
  
  const requiredEnvVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL"
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Variáveis de ambiente obrigatórias não encontradas:");
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    throw new Error("Variáveis de ambiente obrigatórias não configuradas");
  }

  console.log("✅ Todas as variáveis de ambiente estão configuradas!");
  console.log(`🗄️  DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
  console.log(`🌐 NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`🏢 NODE_ENV: ${process.env.NODE_ENV || "development"}`);
}

async function testDatabaseConnection() {
  console.log("🔍 Testando conexão com o banco de dados...");
  
  try {
    // Testar uma query simples
    const testQuery = await db.select().from(users).limit(1);
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Iniciando criação do super usuário...\n");
  
  try {
    // Validar ambiente
    await validateEnvironment();
    
    // Testar conexão
    await testDatabaseConnection();
    
    // Criar super usuário
    await createSuperUser();
    
    console.log("\n✅ Script executado com sucesso!");
    console.log("🎯 O super usuário pode agora fazer login no sistema.");
    
  } catch (error) {
    console.error("\n💥 Falha na execução do script:", error);
    process.exit(1);
  } finally {
    console.log("\n👋 Encerrando script...");
    process.exit(0);
  }
}

// Executar apenas se for chamado diretamente
if (require.main === module) {
  main();
}

export { createSuperUser };
