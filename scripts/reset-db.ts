/**
 * Remise à zéro du schéma (développement uniquement).
 *
 * Supprime toutes les tables de l'application puis les recrée à partir des
 * migrations Drizzle. À utiliser lorsque le schéma local est devenu incohérent.
 *
 *   npm run db:reset   (nécessite DATABASE_URL)
 */
import "./charger-env";
import { sql } from "drizzle-orm";

import { db, sql as client } from "@/lib/db";

const TABLES = [
  "order_items",
  "orders",
  "payment_methods",
  "product_options",
  "products",
  "categories",
  "tables",
  "users",
  "restaurants",
];

/** Types énumérés créés par les migrations Drizzle. */
const ENUMS = [
  "role",
  "plan",
  "type_commande",
  "statut_commande",
  "mode_paiement",
  "paiement_statut",
  "operateur",
];

async function reinitialiser() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("db:reset est interdit en production.");
  }

  console.log("🧹  Suppression du schéma…");
  for (const table of TABLES) {
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
  }
  for (const type of ENUMS) {
    await db.execute(sql.raw(`DROP TYPE IF EXISTS "${type}" CASCADE;`));
  }
  console.log("✅  Schéma supprimé. Lancez maintenant : npm run db:migrate && npm run db:seed");
}

reinitialiser()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (erreur) => {
    console.error("❌", erreur);
    await client.end().catch(() => undefined);
    process.exit(1);
  });
