/**
 * Validation des commandes de supports imprimés (Boutique Mesplats).
 *
 * Validation jouée **côté client** (messages immédiats) et **côté serveur**
 * (aucune confiance dans le navigateur) : les identifiants d'articles, les
 * quantités et les options sont revérifiés contre le catalogue, et le prix est
 * calculé à partir des tarifs du serveur.
 */
import { z } from "zod";

import { telephoneOuestAfricainSchema } from "@/lib/validations/auth";
import { CATALOGUE_BOUTIQUE } from "@/lib/boutique";

export const LIGNES_BOUTIQUE_MAX = 10;
export const QUANTITE_BOUTIQUE_MAX = 5_000;

/** Une ligne du panier de la boutique. */
export const ligneBoutiqueSchema = z.object({
  articleId: z.string().min(1, "Article inconnu."),
  quantite: z
    .number("Quantité obligatoire.")
    .int("Quantité entière attendue.")
    .min(1, "Quantité minimale : 1.")
    .max(QUANTITE_BOUTIQUE_MAX, "Quantité trop importante pour un seul atelier."),
  options: z
    .array(z.string())
    .max(8, "Trop d'options sélectionnées pour un même article.")
    .default([]),
});

export type LigneBoutiqueSaisie = z.infer<typeof ligneBoutiqueSchema>;

export const commandeBoutiqueSchema = z.object({
  nomClient: z
    .string("Votre nom est obligatoire.")
    .trim()
    .min(2, "Au moins 2 caractères.")
    .max(80, "80 caractères maximum."),
  telephoneClient: telephoneOuestAfricainSchema,
  adresse: z
    .string("L'adresse de livraison est obligatoire.")
    .trim()
    .min(5, "Précisez la rue, le repère ou le quartier.")
    .max(160, "160 caractères maximum."),
  ville: z
    .string("La ville est obligatoire.")
    .trim()
    .min(2, "Au moins 2 caractères.")
    .max(60, "60 caractères maximum."),
  note: z.string().trim().max(300, "300 caractères maximum.").optional().default(""),
  lignes: z
    .array(ligneBoutiqueSchema)
    .min(1, "Ajoutez au moins un support à votre panier.")
    .max(LIGNES_BOUTIQUE_MAX, `Un devis ne peut pas dépasser ${LIGNES_BOUTIQUE_MAX} articles différents.`),
});

export type DonneesCommandeBoutique = z.infer<typeof commandeBoutiqueSchema>;

/**
 * Vérifie qu'une ligne respecte le minimum de tirage de son article.
 * Renvoie un message d'erreur, ou `null` si tout va bien.
 */
export function verifierMinimum(articleId: string, quantite: number): string | null {
  const article = CATALOGUE_BOUTIQUE.find((candidat) => candidat.id === articleId);
  if (!article) return "Cet article n'est plus au catalogue.";
  if (quantite < article.minimum) {
    return `« ${article.nom} » : tirage minimum de ${article.minimum}.`;
  }
  if (quantite > article.maximum) {
    return `« ${article.nom} » : au-delà de ${article.maximum}, écrivez-nous pour un devis sur mesure.`;
  }
  return null;
}
