import type { AppRouter } from "@/server"
import { createClient } from "jstack"

/**
 * Your type-safe API client
 * @see https://jstack.app/docs/backend/api-client
 */

const baseUrl =  "/api"
export const client = createClient<AppRouter>({
  baseUrl,
})
