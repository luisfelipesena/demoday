import { auth } from "@/server/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { env } from "@/env";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
  baseURL: env.NEXTAUTH_URL,
});

export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword } = authClient; 