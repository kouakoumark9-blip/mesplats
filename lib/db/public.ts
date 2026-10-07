/**
 * Accès public aux restaurants (utilisé par les pages /m/...).
 * Aucune authentification : seuls les restaurants ACTIFS et leurs éléments
 * VISIBLES sont renvoyés.
 */
import { and, asc, eq } from "drizzle-orm";

import type { DisponibiliteCategorie } from "@/lib/constants";

import { db } from "@/lib/db";
import {
  categories,
  paymentMethods,
  productOptions,
  products,
  restaurants,
  tables,
} from "@/lib/db/schema";

export type RestaurantPublic = typeof restaurants.$inferSelect;

/** Restaurant actif correspondant au slug public, sinon `null`. */
export async function restaurantParSlug(slug: string): Promise<RestaurantPublic | null> {
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(and(eq(restaurants.slug, slug.trim().toLowerCase()), eq(restaurants.actif, true)))
    .limit(1);

  return restaurant ?? null;
}

/** Table existante pour ce restaurant (validation du numéro présent dans l'URL). */
export async function tableParNumero(restaurantId: string, numero: string) {
  const [table] = await db
    .select({ id: tables.id, numero: tables.numero })
    .from(tables)
    .where(and(eq(tables.restaurantId, restaurantId), eq(tables.numero, numero)))
    .limit(1);

  return table ?? null;
}

export type CategorieAvecProduits = {
  id: string;
  nom: string;
  /** Jours et créneaux : `null` = servie en permanence. */
  disponibilite: DisponibiliteCategorie | null;
  produits: {
    id: string;
    nom: string;
    description: string | null;
    prix: number;
    photo: string | null;
    disponible: boolean;
    personnesMin: number | null;
    personnesMax: number | null;
    options: { id: string; nom: string; supplementPrix: number }[];
  }[];
};

/**
 * Menu complet d'un restaurant : catégories visibles, produits disponibles
 * **et** épuisés (ces derniers sont signalés au client au lieu d'être cachés).
 * Tout est trié par `ordre` puis par nom.
 */
export async function menuPublic(restaurantId: string): Promise<CategorieAvecProduits[]> {
  const rubriques = await db
    .select({
      id: categories.id,
      nom: categories.nom,
      disponibilite: categories.disponibilite,
    })
    .from(categories)
    .where(and(eq(categories.restaurantId, restaurantId), eq(categories.visible, true)))
    .orderBy(asc(categories.ordre), asc(categories.nom));

  if (rubriques.length === 0) return [];

  const plats = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      nom: products.nom,
      description: products.description,
      prix: products.prix,
      photo: products.photo,
      disponible: products.disponible,
      personnesMin: products.personnesMin,
      personnesMax: products.personnesMax,
    })
    .from(products)
    .where(eq(products.restaurantId, restaurantId))
    .orderBy(asc(products.ordre), asc(products.nom));

  const options =
    plats.length > 0
      ? await db
          .select({
            id: productOptions.id,
            productId: productOptions.productId,
            nom: productOptions.nom,
            supplementPrix: productOptions.supplementPrix,
          })
          .from(productOptions)
          .orderBy(asc(productOptions.ordre))
      : [];

  const optionsParProduit = new Map<string, { id: string; nom: string; supplementPrix: number }[]>();
  for (const option of options) {
    const liste = optionsParProduit.get(option.productId) ?? [];
    liste.push({ id: option.id, nom: option.nom, supplementPrix: option.supplementPrix });
    optionsParProduit.set(option.productId, liste);
  }

  const parCategorie = new Map<string, CategorieAvecProduits["produits"]>();
  for (const plat of plats) {
    const liste = parCategorie.get(plat.categoryId) ?? [];
    liste.push({
      id: plat.id,
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      photo: plat.photo,
      disponible: plat.disponible,
      personnesMin: plat.personnesMin,
      personnesMax: plat.personnesMax,
      options: optionsParProduit.get(plat.id) ?? [],
    });
    parCategorie.set(plat.categoryId, liste);
  }

  return rubriques
    .map((rubrique) => ({
      id: rubrique.id,
      nom: rubrique.nom,
      disponibilite: rubrique.disponibilite ?? null,
      produits: parCategorie.get(rubrique.id) ?? [],
    }))
    .filter((rubrique) => rubrique.produits.length > 0);
}

/** Moyens de paiement actifs affichés au client (numéro + titulaire). */
export async function moyensPaiementPublic(restaurantId: string) {
  return db
    .select({
      operateur: paymentMethods.operateur,
      numero: paymentMethods.numero,
      titulaire: paymentMethods.titulaire,
    })
    .from(paymentMethods)
    .where(and(eq(paymentMethods.restaurantId, restaurantId), eq(paymentMethods.actif, true)))
    .orderBy(asc(paymentMethods.operateur));
}
