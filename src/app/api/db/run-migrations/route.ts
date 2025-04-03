import { NextResponse } from "next/server"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "@/server/db"

export async function POST() {
  try {
    // Protect this endpoint - in a real app, you would add authentication checks here
    // to ensure only authorized users (admins) can run migrations
    
    console.log("Starting database migrations...")
    
    // Run migrations
    await migrate(db, { migrationsFolder: "./drizzle" })
    
    console.log("Migrations completed successfully")
    
    return NextResponse.json({ success: true, message: "Migrations executed successfully" })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to run migrations", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
} 