import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

function createDb(): NodePgDatabase {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  return drizzle(pool);
}

// Lazily create the real drizzle instance on first use. This keeps module
// import side-effect free so `next build` (which imports route modules to
// collect page data) does not crash when DATABASE_URL isn't set.
function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = createDb();
  }
  return globalForDb.__arenaNextJsPostgresqlDb;
}

export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real as object, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
}) as NodePgDatabase;
