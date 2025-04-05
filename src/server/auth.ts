import { betterAuth } from "better-auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "./db/schema";
import bcrypt from "bcryptjs";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./db/schema";
import {env} from "@/env"

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
    // Add the verify function to handle email sign-in
    verify: async (email: string, password: string) => {
      if (!email || !password) return null;
      
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      
      if (!user || !user.password) return null;
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return null;
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  },
  
  // Authentication providers
  providers: [
    {
      id: "credentials",
      type: "credentials",
      authorize: async (credentials: any) => {
        const { email, password } = credentials as { email: string; password: string };
        
        if (!email || !password) return null;
        
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        
        if (!user || !user.password) return null;
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
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
        token.role = user.role;
      }
      return token;
    },
    session: (params: any) => {
      const { session, token } = params;
      if (token && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
}); 

export type Session = typeof auth.$Infer.Session