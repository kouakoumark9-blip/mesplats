/**
 * Lectures des tables et des QR codes, filtrées par `restaurant_id`.
 * Aucune requête de ce module ne peut franchir la frontière d'un établissement.
 */
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { tables, type Table } from "@/lib/db/schema";

/**
 * Tables d'un restaurant, triées « naturellement » : 1, 2, … 10, 11, puis les
 * libellés non numériques (T1, Terrasse A…) par ordre alphabétique.
 *
 * Le tri est fait en SQL avec `NULLIF(regexp_replace(...))` : PostgreSQL a
 * besoin de `nullif` pour éviter l'erreur de conversion quand le numéro n'est
 * pas numérique (« Terrasse A » → NULL au lieu d'une exception).
 */
export async function tablesDuRestaurant(restaurantId: string): Promise<Table[]> {
  const numerique = sql`nullif(regexp_replace(${tables.numero}, '\\D', '', 'g'), '')::int`;

  return db
    .select()
    .from(tables)
    .where(eq(tables.restaurantId, restaurantId))
    .orderBy(
      sql`${numerique} asc nulls last`,
      sql`${tables.numero} asc`,
      sql`${tables.createdAt} asc`,
    );
}

/** Nombre de tables d'un restaurant (sert à appliquer la limite du plan). */
export async function compterTables(restaurantId: string): Promise<number> {
  const [ligne] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(tables)
    .where(eq(tables.restaurantId, restaurantId));
  return ligne?.total ?? 0;
}

/** Une table précise, vérifiée comme appartenant au restaurant. */
export async function tableDuRestaurant(
  restaurantId: string,
  tableId: string,
): Promise<Table | null> {
  const [table] = await db
    .select()
    .from(tables)
    .where(and(eq(tables.id, tableId), eq(tables.restaurantId, restaurantId)))
    .limit(1);
  return table ?? null;
}

/** Ce numéro est-il déjà pris dans ce restaurant ? */
export async function numeroTablePris(
  restaurantId: string,
  numero: string,
  saufId?: string,
): Promise<boolean> {
  const [existante] = await db
    .select({ id: tables.id })
    .from(tables)
    .where(and(eq(tables.restaurantId, restaurantId), eq(tables.numero, numero)))
    .limit(1);

  if (!existante) return false;
  return saufId ? existante.id !== saufId : true;
}
