import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { Session } from "@/server/auth";

// Get session with proper typings
export async function getSessionWithRole() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Ensure user role is properly typed
    if (session?.user) {
      return {
        ...session,
        user: session.user,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Check if user has specific role
export function hasRole(user: Session["user"] | undefined, role: string | string[]): boolean {
  if (!user || !user.role) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
}

// Check if user is admin
export function isAdmin(user: Session["user"] | undefined): boolean {
  return hasRole(user, "admin");
}

// Check if user is professor or admin
export function isProfessorOrAdmin(user: Session["user"] | undefined): boolean {
  return hasRole(user, ["professor", "admin"]);
}

// Helper for role-based redirects
export function checkRoleAccess(session: { user?: Session["user"] } | null, allowedRoles: string[]): boolean {
  if (!session || !session.user) return false;
  
  return hasRole(session.user, allowedRoles);
} 