import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

// Conexão com o Neon PostgreSQL
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Exportar helpers de consulta
export * from "drizzle-orm"; 