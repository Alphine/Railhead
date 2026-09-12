import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

// `Pool` is constructed lazily-safe: node-postgres does not open a
// connection until a query is actually run, so it is safe to import this
// module (e.g. during typecheck/build, or when DATABASE_URL is unset) without
// throwing or attempting any network I/O.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "",
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
