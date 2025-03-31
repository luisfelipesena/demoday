import { DrizzleAdapter } from '@auth/drizzle-adapter'
import bcrypt from 'bcrypt'
import { DefaultSession, NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { env } from '@/env'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const { email, password } = credentials

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
}

// Extensão de tipos para incluir role e id no token e sessão
declare module 'next-auth' {
  interface User {
    role?: string
  }

  interface Session {
    user?: {
      id?: string
      role?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    id?: string
  }
}
