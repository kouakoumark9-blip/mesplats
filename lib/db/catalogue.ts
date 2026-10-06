/**
 * Lectures du catalogue, TOUJOURS filtrées par `restaurant_id`.
 * ---------------------------------------------------------------------------
 * Aucune requête de ce module ne peut renvoyer une ligne appartenant à un autre
 * établissement : le `restaurantId` est un paramètre obligatoire, jamais une
 * valeur issue directement de la requête HTTP.
 */
import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  categories,
  paymentMethods,
  productOptions,
  products,
  restaurants,
  type Categorie,
  type MoyenPaiement,
  type Produit,
} from "@/lib/db/schema";

export type OptionCatalogue = {
  id: string;
  nom: string;
  supplementPrix: number;
  ordre: number;
};

export type ProduitCatalogue = Produit & { options: OptionCatalogue[] };

export type CategorieCatalogue = Categorie & { produits: ProduitCatalogue[] };

/**
 * Catalogue complet d'un restaurant : catégories, plats et options, dans
 * l'ordre d'affichage prévu pour le menu public.
 */
export async function catalogueRestaurant(
  restaurantId: string,
): Promise<CategorieCatalogue[]> {
  const lignes = await db
    .select({
      categorie: categories,
      produit: products,
      option: productOptions,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.restaurantId, restaurantId)),
    )
    // Les options n'ont pas de `restaurant_id` : le rattachement au plat
    // (lui-même filtré ci-dessus) garantit le cloisonnement.
    .leftJoin(productOptions, eq(productOptions.productId, products.id))
    .where(eq(categories.restaurantId, restaurantId))
    .orderBy(
      asc(categories.ordre),
      asc(categories.createdAt),
      asc(products.ordre),
      asc(products.createdAt),
      asc(productOptions.ordre),
      asc(productOptions.nom),
    );

  const parCategorie = new Map<string, CategorieCatalogue>();
  const parProduit = new Map<string, ProduitCatalogue>();

  for (const ligne of lignes) {
    let categorie = parCategorie.get(ligne.categorie.id);
    if (!categorie) {
      categorie = { ...ligne.categorie, produits: [] };
      parCategorie.set(ligne.categorie.id, categorie);
    }

    if (!ligne.produit) continue;

    let produit = parProduit.get(ligne.produit.id);
    if (!produit) {
      produit = { ...ligne.produit, options: [] };
      parProduit.set(ligne.produit.id, produit);
      categorie.produits.push(produit);
    }

    if (ligne.option) produit.options.push(ligne.option);
  }

  return [...parCategorie.values()];
}

/** Nombre de plats au catalogue (sert à appliquer la limite du plan gratuit). */
export async function compterProduits(restaurantId: string): Promise<number> {
  const [ligne] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.restaurantId, restaurantId));
  return ligne?.total ?? 0;
}

/** Nombre de plats par catégorie (avertissement avant suppression). */
export async function compterProduitsParCategorie(
  restaurantId: string,
): Promise<Record<string, number>> {
  const lignes = await db
    .select({ categoryId: products.categoryId, total: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.restaurantId, restaurantId))
    .groupBy(products.categoryId);

  return Object.fromEntries(lignes.map((l) => [l.categoryId, l.total]));
}

/** Moyens de paiement mobile money du restaurant. */
export async function moyensPaiementRestaurant(
  restaurantId: string,
): Promise<MoyenPaiement[]> {
  return db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.restaurantId, restaurantId))
    .orderBy(asc(paymentMethods.operateur));
}

/** Profil complet du restaurant (page Paramètres). */
export async function profilRestaurant(restaurantId: string) {
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);
  return restaurant ?? null;
}

/**
 * Un slug est-il disponible ? `restaurantId` permet d'ignorer le restaurant
 * courant lorsqu'il modifie sa propre adresse.
 */
export async function slugDisponible(slug: string, restaurantId?: string): Promise<boolean> {
  const [existant] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);

  if (!existant) return true;
  return Boolean(restaurantId && existant.id === restaurantId);
}

/** Identifiant d'un plat, vérifié comme appartenant bien au restaurant. */
export async function produitDuRestaurant(
  restaurantId: string,
  produitId: string,
): Promise<Produit | null> {
  const [produit] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, produitId), eq(products.restaurantId, restaurantId)))
    .limit(1);
  return produit ?? null;
}

/** Identifiant d'une catégorie, vérifiée comme appartenant bien au restaurant. */
export async function categorieDuRestaurant(
  restaurantId: string,
  categorieId: string,
): Promise<Categorie | null> {
  const [categorie] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categorieId), eq(categories.restaurantId, restaurantId)))
    .limit(1);
  return categorie ?? null;
}
