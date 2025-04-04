import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole, isProfessorOrAdmin } from "@/lib/session-utils";

export async function GET(req: NextRequest) {
  try {
    // Get the session with proper typing
    const session = await getSessionWithRole();

    // If no session or user, redirect to login
    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user has professor or admin role
    if (!isProfessorOrAdmin(session.user)) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // If professor or admin, continue to the requested URL
    const path = req.nextUrl.pathname.replace("/api/auth/check-professor", "/professor");
    return NextResponse.redirect(new URL(path, req.url));
  } catch (error) {
    console.error("Error checking professor role:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
} 