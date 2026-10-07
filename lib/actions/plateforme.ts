"use server";

/**
 * Server Actions du super-admin (plateforme Mesplats).
 * ---------------------------------------------------------------------------
 * Réservées au rôle `superadmin` : activation / suspension d'un établissement
 * et changement de formule. La suspension coupe immédiatement l'accès : les
 * gardes de `lib/auth/autorisation` refusent toute session dont le restaurant
 * n'est plus actif, et la page publique renvoie « établissement suspendu ».
 */
import { eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigerRole } from "@/lib/auth/autorisation";
import { PLANS, type Plan } from "@/lib/constants";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";

export type ResultatPlateforme = { ok: boolean; message?: string };

export async function basculerActivationRestaurant(
  id: string,
  actif: boolean,
): Promise<ResultatPlateforme> {
  await exigerRole("superadmin");

  const resultat = await db
    .update(restaurants)
    .set({ actif, updatedAt: new Date() })
    .where(eq(restaurants.id, id))
    .returning({ nom: restaurants.nom, slug: restaurants.slug });

  if (resultat.length === 0) return { ok: false, message: "Restaurant introuvable." };

  revalidatePath("/admin");
  revalidatePath(`/m/${resultat[0].slug}`);
  return {
    ok: true,
    message: actif
      ? `${resultat[0].nom} réactivé : son menu et ses commandes refonctionnent.`
      : `${resultat[0].nom} suspendu : accès coupé pour le propriétaire et son équipe.`,
  };
}

export async function changerFormuleRestaurant(
  id: string,
  plan: Plan,
): Promise<ResultatPlateforme> {
  await exigerRole("superadmin");

  if (!PLANS.includes(plan)) return { ok: false, message: "Formule inconnue." };

  const resultat = await db
    .update(restaurants)
    .set({ plan, updatedAt: new Date() })
    .where(eq(restaurants.id, id))
    .returning({ nom: restaurants.nom });

  if (resultat.length === 0) return { ok: false, message: "Restaurant introuvable." };

  revalidatePath("/admin");
  return {
    ok: true,
    message:
      plan === "pro"
        ? `Formule Pro activée pour ${resultat[0].nom} (plats, tables et comptes illimités).`
        : `Formule « À activer » rétablie pour ${resultat[0].nom} (20 plats, 5 tables).`,
  };
}

/** Chiffres globaux de la plateforme, affichés en tête du tableau super-admin. */
export async function statistiquesPlateforme() {
  await exigerRole("superadmin");

  const [ligne] = await db
    .select({
      restaurants: sql<number>`count(*)::int`,
      actifs: sql<number>`count(*) filter (where ${restaurants.actif})::int`,
      pro: sql<number>`count(*) filter (where ${restaurants.plan} = 'pro')::int`,
    })
    .from(restaurants);

  return ligne ?? { restaurants: 0, actifs: 0, pro: 0 };
}

/** Comptes hors super-admin (pour le compteur « équipe » du tableau). */
export async function compterComptesClients() {
  await exigerRole("superadmin");
  const [ligne] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(restaurants)
    .where(ne(restaurants.plan, "pro"));
  return ligne?.total ?? 0;
}
