import { betterAuth } from "better-auth";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import { users, accounts, invites } from "./db/schema";
import bcrypt from "bcryptjs";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./db/schema";
import {env} from "@/env"

// Defina tipos para os parâmetros dos hooks
interface CredentialCreateParams {
  password: string;
  [key: string]: any;
}

interface CredentialVerifyParams {
  storedCredential: {
    password?: string;
    [key: string]: any;
  };
  suppliedCredential: {
    password?: string;
    [key: string]: any;
  };
}

interface InviteValidateParams {
  inviteCode: string;
  userEmail: string;
}

// Função de utilidade para gerar hash de senha no mesmo formato do better-auth
// Exportada para ser usada em outras partes do sistema, como a API de alteração de senha
export async function generatePasswordHash(password: string): Promise<string> {
  // Usar o mesmo método utilizado pelo hook beforeCreate do better-auth
  if (typeof password === 'string' && password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Senha hasheada com bcrypt para atualização");
    return hashedPassword;
  } else {
    console.error("Senha inválida ou undefined");
    throw new Error("Senha inválida");
  }
}

export const auth = betterAuth({
  // Secret for sessions and tokens encryption
  secret: env.NEXTAUTH_SECRET!,
  
  // Database integration - use the drizzle adapter
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
    schema,
    usePlural: true,
  }),

  // user
  user: {
    additionalFields: {
       role: {
           type: "string"
         },
    }
  },
  
  // Set up email and password authentication
  emailAndPassword: {
    enabled: true,
    confirmEmail: false, // Não exigir confirmação por email para simplicidade

    credential: {
      // Override para hash das senhas - CRÍTICO
      beforeCreate: async ({ password, ...rest }: CredentialCreateParams) => {
        // Verificar se a senha é um hash bcrypt antes de tentar hashear
        console.log("Hook beforeCreate executado na criação de usuário");
        
        // Garantir que a senha sempre seja hasheada mesmo que pareça estar hasheada
        // Os hashes BCrypt começam com $2a$, $2b$ ou $2y$
        let hashedPassword: string;
        
        if (typeof password === 'string' && password) {
          // Sempre geramos um novo hash independente da entrada
          hashedPassword = await bcrypt.hash(password, 10);
          console.log("Senha hasheada com bcrypt na criação da conta");
        } else {
          // Caso improvável, mas para garantir
          console.error("Senha inválida ou undefined no beforeCreate");
          throw new Error("Senha inválida");
        }
        
        return {
          password: hashedPassword,
          ...rest,
        };
      },
      
      // Hook para verificar senha no login
      verifyCredential: async ({ storedCredential, suppliedCredential }: CredentialVerifyParams) => {
        console.log("Hook verifyCredential executado no login");
        
        // Verificações de segurança melhoradas
        if (!storedCredential) {
          console.error("storedCredential é undefined");
          return false;
        }
        
        if (!suppliedCredential) {
          console.error("suppliedCredential é undefined");
          return false;
        }
        
        // Se a senha armazenada está vazia, falha na autenticação
        if (!storedCredential.password) {
          console.error("Senha armazenada está vazia ou undefined");
          return false;
        }
        
        // Se a senha fornecida está vazia, falha na autenticação
        if (!suppliedCredential.password) {
          console.error("Senha fornecida está vazia ou undefined");
          return false;
        }
        
        // Log dos dados para debug
        console.log(`Tipo da senha armazenada: ${typeof storedCredential.password}`);
        console.log(`Formato da senha armazenada: ${storedCredential.password.substring(0, 10)}...`);
        console.log(`Tipo da senha fornecida: ${typeof suppliedCredential.password}`);
        
        // Verifica se a senha fornecida corresponde à senha armazenada
        try {
          const isValid = await bcrypt.compare(
            suppliedCredential.password,
            storedCredential.password
          );
          console.log("Resultado da verificação de senha:", isValid);
          return isValid;
        } catch (error) {
          console.error("Erro ao verificar senha:", error);
          return false;
        }
      },
    },
  },
  
  // Authentication providers
  providers: [
    {
      id: "credentials",
      type: "credentials",
      authorize: async (credentials: any) => {
        const { email, password } = credentials as { email: string; password: string };
        
        if (!email || !password) {
          console.log("Email ou senha ausentes nas credenciais");
          return null;
        }
        
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        
        if (!user) {
          console.log(`Usuário não encontrado: ${email}`);
          return null;
        }
        
        // Buscar conta do usuário para verificar a senha
        const account = await db.query.accounts.findFirst({
          where: eq(accounts.userId, user.id),
        });
        
        if (!account) {
          console.log(`Conta não encontrada para o usuário: ${email}`);
          return null;
        }
        
        if (!account.password) {
          console.log(`Senha não definida para o usuário: ${email}`);
          return null;
        }
        
        try {
        const isPasswordValid = await bcrypt.compare(password, account.password);
          console.log(`Resultado da verificação de senha para ${email}: ${isPasswordValid}`);
          
        if (!isPasswordValid) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
        } catch (error) {
          console.error(`Erro ao verificar senha para ${email}:`, error);
          return null;
        }
      },
    },
  ],
  
  // Session configuration
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours (every 24 hours the session expiration is updated)
  },
  
  // Page redirects
  pages: {
    signIn: "/login",
    signUp: "/register",
    error: "/login?error=auth",
  },
  
  // Callbacks for additional information
  callbacks: {
    jwt: (params: any) => {
      const { token, user } = params;
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
      return token;
    },
    
    session: (params: any) => {
      const { session, token } = params;
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
        };
      }
      return session;
    },
  },

  register: {
    async beforeCreate({ input }: { input: any }) {
      console.log("Register beforeCreate executado com input:", input);
      
      const superUserEmail = "demoday.ic.ufba@gmail.com"
      if (input.email === superUserEmail) {
        throw new Error("Cadastro do super usuário só pode ser feito manualmente pelo administrador do sistema.")
      }
      if (input.role === "admin") {
        throw new Error("Não é permitido criar administradores via cadastro público.")
      }
      const inviteCode = input.inviteCode;
      if (!inviteCode) {
        throw new Error("Código de convite obrigatório");
      }
      const now = new Date();
      const invite = await db.query.invites.findFirst({
        where: eq(invites.token, inviteCode),
      });

      if (!invite) {
        throw new Error("Código de convite inválido");
      }

      if (invite.expiresAt && invite.expiresAt < now) {
        throw new Error("Código de convite expirado");
      }

      if (invite.usedAt) {
        throw new Error("Código de convite já utilizado");
      }

      if (invite.email && invite.email !== input.email) {
        throw new Error(`Código de convite válido apenas para ${invite.email}`);
      }

      // Marcar convite como utilizado
      await db.update(invites)
        .set({ 
          usedAt: now,
          updatedAt: now
        })
        .where(eq(invites.id, invite.id));

      return {
        ...input,
        role: "user", // Garantir que novos usuários sempre sejam "user"
      };
    },
  },

  // Invitation-only registration
  inviteOnly: { 
    enabled: true,
    
    validateUseInvite: async ({ inviteCode, userEmail }: InviteValidateParams) => {
      // Step 1: Find the invite by token
      const invite = await db
        .select()
        .from(invites)
        .where(eq(invites.token, inviteCode))
        .limit(1)
        .then((invites: any[]) => invites[0] || null);

      // Step 2: Check if the invite exists and is valid
      if (!invite) {
        return {
          success: false,
          message: "Código de convite inválido",
        };
      }

      // Step 3: Check if the invite has expired
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return {
          success: false,
          message: "Código de convite expirado",
        };
      }

      // Step 4: Check if the invite is for the correct email (if specified)
      if (invite.email && invite.email !== userEmail) {
        return {
          success: false,
          message: "Este convite não é para este email",
        };
      }

      // Step 5: Check if invite has already been used
      if (invite.usedAt) {
        return {
          success: false,
          message: "Este convite já foi utilizado",
        };
      }
      
      // Step 6: Mark invite as used
      await db
        .update(invites)
        .set({ 
          usedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));
      
      // Return the role from the invite, to set on the user
      return {
        success: true,
        additionalData: {
          role: invite.role,
        },
      };
    },
  },
}); 

export type Session = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};