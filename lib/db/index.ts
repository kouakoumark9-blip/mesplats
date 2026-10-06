/**
 * Client Drizzle unique pour toute l'application.
 *
 * On utilise le pilote `postgres` (postgres.js), compatible à la fois avec un
 * PostgreSQL local et avec Neon en production (chaîne de connexion « pooled »).
 * `prepare: false` est indispensable derrière le pooler de Neon (PgBouncer en
 * mode transaction).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;

const globalPourDb = globalThis as unknown as { __mesplatsSql?: Sql };

const sql =
  globalPourDb.__mesplatsSql ??
  postgres(databaseUrl(), {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
  });

// En développement, Next.js recharge les modules : on réutilise la même
// connexion pour éviter d'épuiser le pool de connexions.
if (process.env.NODE_ENV !== "production") {
  globalPourDb.__mesplatsSql = sql;
}

export const db = drizzle(sql, { schema });

export { schema, sql };
export * from "./schema";
