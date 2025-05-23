import { betterAuth } from "better-auth";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./db/schema";
import { env } from "@/env";
import { sendEmail } from "./emailService";

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
  
  emailVerification: {
    expiresIn: 60 * 60, // 1 hour in seconds
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verifique seu email - Demoday",
        html: `
        <h2>Verifique seu email</h2>
        <p>Olá, ${user.name}!</p>
        <p>Obrigado por se cadastrar no Demoday! Para completar seu cadastro, precisamos verificar seu endereço de email.</p>
        <p>Para verificar seu email, clique no link abaixo:</p>
        <p><a href="${url}" target="_blank" rel="noopener noreferrer" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Email</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou este cadastro, ignore este e-mail.</p>
        <p>Após a verificação, você poderá fazer login normalmente.</p>
        <hr>
        <p><small>Demoday - Plataforma de Projetos Acadêmicos</small></p>
        `,
      });
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour in seconds
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
}); 

export type Session = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};