"use server";

/**
 * Server Actions des tables et des QR codes (étape 3).
 * ---------------------------------------------------------------------------
 * Mêmes règles que les autres actions du back-office :
 *  1. garde de rôle (`exigerRole("admin")`) ;
 *  2. `restaurantId` issu de la session — jamais du formulaire ;
 *  3. validation Zod côté serveur ;
 *  4. limite du plan appliquée côté serveur (plan Gratuit : 5 tables).
 */
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { EtatFormulaire } from "@/lib/actions/etat";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_TABLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";
import { compterTables, numeroTablePris } from "@/lib/db/tables";
import { erreursParChamp } from "@/lib/validations/auth";
import { renommageTableSchema, tablesLotSchema } from "@/lib/validations/tables";

export type ResultatAction = { ok: boolean; message?: string; nombre?: number };

function rafraichir(slug?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tables");
  revalidatePath("/dashboard/tables/impression");
  if (slug) revalidatePath(`/m/${slug}`);
}

/* -------------------------------------------------------------------------- */
/*                        Création de plusieurs tables                        */
/* -------------------------------------------------------------------------- */

/**
 * Crée des tables en lot : « 10 tables numérotées de 1 à 10 », avec un préfixe
 * facultatif (« Table 1 », « Terrasse A »…). Les numéros déjà utilisés sont
 * ignorés plutôt que de faire échouer toute l'opération.
 */
export async function creerTablesLot(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const analyse = tablesLotSchema.safeParse({
    nombre: formData.get("nombre"),
    debut: formData.get("debut") ?? 1,
    prefixe: formData.get("prefixe") ?? "",
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const { nombre, debut, prefixe } = analyse.data;
  const prefixePropre = (prefixe ?? "").trim();

  // Limite du plan (gratuit : 5 tables).
  const deja = await compterTables(restaurantId);
  const limite = LIMITE_TABLES[utilisateur.plan];

  if (limite !== null && deja >= limite) {
    return {
      ok: false,
      message:
        `Votre plan Gratuit est limité à ${limite} tables. ` +
        "Passez au plan Pro pour des tables illimitées.",
    };
  }

  // Numéros déjà pris par ce restaurant (un seul aller-retour en base).
  const existants = await db
    .select({ numero: tables.numero })
    .from(tables)
    .where(eq(tables.restaurantId, restaurantId));
  const pris = new Set(existants.map((t) => t.numero));

  // Construction de la liste souhaitée, bornée par la limite du plan.
  const souhaites: string[] = [];
  for (let index = 0; index < nombre; index += 1) {
    const valeur = debut + index;
    souhaites.push(prefixePropre ? `${prefixePropre} ${valeur}` : String(valeur));
  }

  const placeRestante = limite === null ? souhaites.length : Math.max(0, limite - deja);
  const retenus = souhaites.slice(0, placeRestante);
  const aInserer = retenus.filter((numero) => !pris.has(numero));
  const ignores = retenus.length - aInserer.length;
  const refuses = souhaites.length - retenus.length;

  if (aInserer.length === 0) {
    return {
      ok: false,
      message:
        ignores > 0
          ? "Toutes ces tables existent déjà : modifiez le premier numéro ou le préfixe."
          : "Aucune table à créer pour ces numéros.",
    };
  }

  await db
    .insert(tables)
    .values(aInserer.map((numero) => ({ restaurantId, numero })))
    // Ceinture et bretelles : la contrainte unique (restaurant_id, numero)
    // protège même si deux créations partent en même temps.
    .onConflictDoNothing({ target: [tables.restaurantId, tables.numero] });

  rafraichir(utilisateur.restaurantSlug);

  const morceaux: string[] = [
    `${aInserer.length} table${aInserer.length > 1 ? "s" : ""} créée${aInserer.length > 1 ? "s" : ""} avec son QR code.`,
  ];
  if (ignores > 0) morceaux.push(`${ignores} numéro(s) déjà utilisé(s), ignoré(s).`);
  if (refuses > 0) {
    morceaux.push(
      `plan Gratuit limité à ${limite} tables : ${refuses} table(s) non créée(s).`,
    );
  }

  return { ok: true, message: morceaux.join(" "), nombre: aInserer.length };
}

/* -------------------------------------------------------------------------- */
/*                              Modifier / supprimer                          */
/* -------------------------------------------------------------------------- */

export async function renommerTable(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const analyse = renommageTableSchema.safeParse({
    id: formData.get("id"),
    numero: formData.get("numero"),
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const { id, numero } = analyse.data;

  if (await numeroTablePris(restaurantId, numero, id)) {
    return {
      ok: false,
      erreurs: { numero: `La table « ${numero} » existe déjà dans votre établissement.` },
    };
  }

  const modifiees = await db
    .update(tables)
    .set({ numero })
    .where(and(eq(tables.id, id), eq(tables.restaurantId, restaurantId)))
    .returning({ id: tables.id });

  if (modifiees.length === 0) {
    return { ok: false, message: "Cette table est introuvable." };
  }

  rafraichir(utilisateur.restaurantSlug);
  return {
    ok: true,
    message:
      "Table renommée. Son QR code a été régénéré : réimprimez la carte, " +
      "l'ancienne pointe vers l'ancien numéro.",
  };
}

/** Supprime une table — les commandes passées gardent leur historique. */
export async function supprimerTable(id: string): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");

  const supprimees = await db
    .delete(tables)
    .where(and(eq(tables.id, id), eq(tables.restaurantId, utilisateur.restaurantId!)))
    .returning({ id: tables.id });

  if (supprimees.length === 0) {
    return { ok: false, message: "Cette table est introuvable." };
  }

  rafraichir(utilisateur.restaurantSlug);
  return { ok: true, message: "Table supprimée. Les commandes passées sont conservées." };
}

/**
 * Supprime toutes les tables d'un seul coup (remise à zéro avant une nouvelle
 * numérotation). Les commandes passées restent dans l'historique.
 */
export async function supprimerToutesLesTables(): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [compteur] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(tables)
    .where(eq(tables.restaurantId, restaurantId));

  if ((compteur?.total ?? 0) === 0) {
    return { ok: false, message: "Votre établissement n'a aucune table à supprimer." };
  }

  await db.delete(tables).where(eq(tables.restaurantId, restaurantId));

  rafraichir(utilisateur.restaurantSlug);
  return {
    ok: true,
    message: `${compteur.total} table(s) supprimée(s). Les commandes passées sont conservées.`,
  };
}
