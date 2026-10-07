import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db?: Db };

function create(): Db {
  // `prepare: false` keeps us compatible with Supabase's transaction pooler.
  const client = postgres(env().DATABASE_URL, { prepare: false, max: 5 });
  return drizzle(client, { schema, casing: "snake_case" });
}

/** Lazily-created Drizzle client, reused across hot reloads in development. */
export function db(): Db {
  globalForDb.db ??= create();
  return globalForDb.db;
}

export { schema };
