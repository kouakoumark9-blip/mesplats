/**
 * Vue plateforme (super-admin) : la liste des établissements avec leurs
 * compteurs. Aucune donnée métier sensible (pas de commandes nominatives) :
 * seulement ce qu'il faut pour activer, suspendre ou changer de formule.
 */
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders, products, restaurants, tables, users } from "@/lib/db/schema";
import type { Plan } from "@/lib/constants";

export type RestaurantPlateforme = {
  id: string;
  nom: string;
  slug: string;
  ville: string | null;
  plan: Plan;
  actif: boolean;
  createdAt: Date;
  produits: number;
  tables: number;
  comptes: number;
  commandes: number;
  commandes30j: number;
};

export async function restaurantsPlateforme(): Promise<RestaurantPlateforme[]> {
  const lignes = await db
    .select({
      id: restaurants.id,
      nom: restaurants.nom,
      slug: restaurants.slug,
      ville: restaurants.ville,
      plan: restaurants.plan,
      actif: restaurants.actif,
      createdAt: restaurants.createdAt,
      produits: sql<number>`(select count(*)::int from ${products} p where p.restaurant_id = ${restaurants.id})`,
      tables: sql<number>`(select count(*)::int from ${tables} t where t.restaurant_id = ${restaurants.id})`,
      comptes: sql<number>`(select count(*)::int from ${users} u where u.restaurant_id = ${restaurants.id})`,
      commandes: sql<number>`(select count(*)::int from ${orders} o where o.restaurant_id = ${restaurants.id})`,
      commandes30j: sql<number>`(
        select count(*)::int from ${orders} o30
        where o30.restaurant_id = ${restaurants.id}
          and o30.created_at >= now() - interval '30 days'
      )`,
    })
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt));

  return lignes;
}

/** Chiffres globaux de la plateforme. */
export async function chiffresPlateforme() {
  const [totaux] = await db
    .select({
      restaurants: sql<number>`count(*)::int`,
      actifs: sql<number>`count(*) filter (where ${restaurants.actif})::int`,
      pro: sql<number>`count(*) filter (where ${restaurants.plan} = 'pro')::int`,
      aActiver: sql<number>`count(*) filter (where ${restaurants.plan} = 'gratuit')::int`,
    })
    .from(restaurants);

  const [commandes] = await db
    .select({
      total: sql<number>`count(*)::int`,
      trente: sql<number>`count(*) filter (where ${orders.createdAt} >= now() - interval '30 days')::int`,
      encaisse: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.paiementStatut} = 'paye'), 0)::int`,
    })
    .from(orders);

  return {
    restaurants: totaux?.restaurants ?? 0,
    actifs: totaux?.actifs ?? 0,
    pro: totaux?.pro ?? 0,
    aActiver: totaux?.aActiver ?? 0,
    commandes: commandes?.total ?? 0,
    commandes30j: commandes?.trente ?? 0,
    volumeEncaisse: commandes?.encaisse ?? 0,
  };
}

/** Dernières commandes de la plateforme (surveillance support). */
export async function dernieresCommandesPlateforme(limite = 8) {
  return db
    .select({
      id: orders.id,
      numero: orders.numero,
      statut: orders.statut,
      total: orders.total,
      createdAt: orders.createdAt,
      restaurant: restaurants.nom,
      restaurantSlug: restaurants.slug,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .orderBy(desc(orders.createdAt))
    .limit(limite);
}

/** Étiquettes de tri réutilisables par l'écran super-admin. */
export const TRIS_PLATEFORME = ["recent", "nom", "commandes"] as const;
export type TriPlateforme = (typeof TRIS_PLATEFORME)[number];

export function trierRestaurants(
  liste: RestaurantPlateforme[],
  tri: TriPlateforme,
): RestaurantPlateforme[] {
  switch (tri) {
    case "nom":
      return [...liste].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    case "commandes":
      return [...liste].sort((a, b) => b.commandes - a.commandes);
    default:
      return [...liste].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

/** Fonction utilitaire : première lettre d'un nom d'établissement. */
export function initialeRestaurant(nom: string): string {
  return nom.trim().charAt(0).toUpperCase() || "M";
}
