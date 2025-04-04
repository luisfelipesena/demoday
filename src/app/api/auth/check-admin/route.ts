import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole, isAdmin } from "@/lib/session-utils";

export async function GET(req: NextRequest) {
  try {
    // Get the session with proper typing
    const session = await getSessionWithRole();
    // If no session or user, redirect to login
    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user has admin role
    if (!isAdmin(session.user)) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // If admin, continue to the requested URL
    const path = req.nextUrl.pathname.replace("/api/auth/check-admin", "/admin");
    return NextResponse.redirect(new URL(path, req.url));
  } catch (error) {
    console.error("Error checking admin role:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
} 