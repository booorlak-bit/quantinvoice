import "server-only";
import postgres from "postgres";

const globalForSql = globalThis as unknown as { sql?: postgres.Sql };

// Supabase's shared pooler runs in transaction mode on port 6543, which does not
// support prepared statements, hence `prepare: false`.
export const sql =
  globalForSql.sql ??
  postgres(process.env.DATABASE_URL ?? "", {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    transform: postgres.camel,
  });

if (process.env.NODE_ENV !== "production") globalForSql.sql = sql;
