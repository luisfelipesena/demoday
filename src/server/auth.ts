import { betterAuth } from "better-auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { invites } from "./db/schema";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./db/schema";
import { env } from "@/env";
import { sendEmail } from "./emailService";

interface InviteValidateParams {
  inviteCode: string;
  userEmail: string;
}

export const auth = betterAuth({
  secret: env.NEXTAUTH_SECRET!,
  
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),

  user: {
    additionalFields: {
      role: { type: "string" }
    }
  },
  
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Recuperação de senha - Demoday",
        html: `
        <h2>Recuperação de senha</h2>
        <p>Olá, ${user.name}!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Para redefinir sua senha, clique no link abaixo:</p>
        <p><a href="${url}" target="_blank" rel="noopener noreferrer" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
        <hr>
        <p><small>Demoday - Plataforma de Projetos Acadêmicos</small></p>
        `,
      });
    },
  },

  session: {
    expiresIn: 30 * 24 * 60 * 60,
  },

  register: {
    async beforeCreate({ input }: { input: any }) {
      const superUserEmail = "demoday.ic.ufba@gmail.com";
      if (input.email === superUserEmail) {
        throw new Error("Cadastro do super usuário só pode ser feito manualmente pelo administrador do sistema.");
      }
      if (input.role === "admin") {
        throw new Error("Não é permitido criar administradores via cadastro público.");
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

      await db.update(invites)
        .set({ 
          usedAt: now,
          updatedAt: now
        })
        .where(eq(invites.id, invite.id));

      return {
        ...input,
        role: "user",
      };
    },
  },

  inviteOnly: { 
    enabled: true,
    
    validateUseInvite: async ({ inviteCode, userEmail }: InviteValidateParams) => {
      const invite = await db
        .select()
        .from(invites)
        .where(eq(invites.token, inviteCode))
        .limit(1)
        .then((invites: any[]) => invites[0] || null);

      if (!invite) {
        return {
          success: false,
          message: "Código de convite inválido",
        };
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return {
          success: false,
          message: "Código de convite expirado",
        };
      }

      if (invite.email && invite.email !== userEmail) {
        return {
          success: false,
          message: "Este convite não é para este email",
        };
      }

      if (invite.usedAt) {
        return {
          success: false,
          message: "Este convite já foi utilizado",
        };
      }
      
      await db
        .update(invites)
        .set({ 
          usedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));
      
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