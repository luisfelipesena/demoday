import { auth } from "@/server/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
  baseURL: process.env.NEXTAUTH_URL || "", // Use NEXTAUTH_URL from env
});

export const { signIn, signUp, signOut, useSession } = authClient; 