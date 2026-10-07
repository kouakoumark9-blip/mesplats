/**
 * Lecture des commandes de supports imprimés — toujours filtrée par
 * `restaurant_id`. Le restaurant voit ses propres commandes ; le super-admin
 * voit l'ensemble pour le suivi de production.
 */
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { boutiqueOrders, restaurants, type ArticleBoutiqueCommande } from "@/lib/db/schema";
import type { StatutBoutique } from "@/lib/constants";

export type CommandeBoutiqueAffichee = {
  id: string;
  reference: string;
  articles: ArticleBoutiqueCommande[];
  total: number;
  nomClient: string;
  telephoneClient: string;
  adresse: string;
  ville: string;
  note: string | null;
  statut: StatutBoutique;
  createdAt: Date;
};

const COLONNES = {
  id: boutiqueOrders.id,
  reference: boutiqueOrders.reference,
  articles: boutiqueOrders.articles,
  total: boutiqueOrders.total,
  nomClient: boutiqueOrders.nomClient,
  telephoneClient: boutiqueOrders.telephoneClient,
  adresse: boutiqueOrders.adresse,
  ville: boutiqueOrders.ville,
  note: boutiqueOrders.note,
  statut: boutiqueOrders.statut,
  createdAt: boutiqueOrders.createdAt,
} as const;

/** Commandes de supports d'un restaurant (les plus récentes d'abord). */
export async function commandesBoutique(
  restaurantId: string,
  limite = 20,
): Promise<CommandeBoutiqueAffichee[]> {
  return db
    .select(COLONNES)
    .from(boutiqueOrders)
    .where(eq(boutiqueOrders.restaurantId, restaurantId))
    .orderBy(desc(boutiqueOrders.createdAt))
    .limit(limite);
}

/** Chiffres de la boutique : devis en cours et montant engagé. */
export async function chiffresBoutique(restaurantId: string) {
  const [totaux] = await db
    .select({
      total: sql<number>`count(*)::int`,
      enCours: sql<number>`count(*) filter (where ${boutiqueOrders.statut} in ('nouvelle', 'confirmee', 'en_production'))::int`,
      montant: sql<number>`coalesce(sum(${boutiqueOrders.total}), 0)::int`,
      dernierAt: sql<Date | null>`max(${boutiqueOrders.createdAt})`,
    })
    .from(boutiqueOrders)
    .where(eq(boutiqueOrders.restaurantId, restaurantId));

  return {
    total: totaux?.total ?? 0,
    enCours: totaux?.enCours ?? 0,
    montant: totaux?.montant ?? 0,
    dernierAt: totaux?.dernierAt ?? null,
  };
}

/** Vue plateforme : dernières commandes de supports, tous restaurants. */
export async function dernieresCommandesBoutique(limite = 6) {
  return db
    .select({
      id: boutiqueOrders.id,
      reference: boutiqueOrders.reference,
      total: boutiqueOrders.total,
      statut: boutiqueOrders.statut,
      ville: boutiqueOrders.ville,
      createdAt: boutiqueOrders.createdAt,
      articles: boutiqueOrders.articles,
      restaurant: restaurants.nom,
      restaurantSlug: restaurants.slug,
    })
    .from(boutiqueOrders)
    .innerJoin(restaurants, eq(boutiqueOrders.restaurantId, restaurants.id))
    .orderBy(desc(boutiqueOrders.createdAt))
    .limit(limite);
}

/** Compteur global de supports commandés par la plateforme. */
export async function chiffresBoutiquePlateforme() {
  const [ligne] = await db
    .select({
      commandes: sql<number>`count(*)::int`,
      montant: sql<number>`coalesce(sum(${boutiqueOrders.total}), 0)::int`,
      nouvelles: sql<number>`count(*) filter (where ${boutiqueOrders.statut} = 'nouvelle')::int`,
    })
    .from(boutiqueOrders);

  return {
    commandes: ligne?.commandes ?? 0,
    montant: ligne?.montant ?? 0,
    nouvelles: ligne?.nouvelles ?? 0,
  };
}
