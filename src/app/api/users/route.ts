import { NextResponse } from 'next/server';
import { db } from "@/server/db";

export async function GET() {
  try {
    // Query all users from the database
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Exclude password for security
      }
    });

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    );
  }
} 