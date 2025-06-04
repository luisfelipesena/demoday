import { env } from "@/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Ensure DATABASE_URL is defined
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isLocal = process.env.NODE_ENV === "development"

type DatabaseInstance =
  | ReturnType<typeof drizzle<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>

let db: DatabaseInstance;

if (isLocal) {
  // Connect to local PostgreSQL using postgres.js
  const client = postgres(env.DATABASE_URL);
  db = drizzlePg(client, { schema });
} else {
  // Connect to Neon serverless using HTTP
  const sql = neon(env.DATABASE_URL);
  db = drizzle(sql, { schema });
}

export * from "drizzle-orm";
export { db };

