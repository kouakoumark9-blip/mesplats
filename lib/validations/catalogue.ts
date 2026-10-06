/**
 * Validation Zod du catalogue (catégories, plats, options) et du profil du
 * restaurant. Ces schémas sont utilisés :
 *  - côté client, pour la validation immédiate des formulaires ;
 *  - côté serveur, dans chaque Server Action (source de vérité).
 */
import { z } from "zod";

import { DEVISES, OPERATEURS } from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*                                  Couleurs                                  */
/* -------------------------------------------------------------------------- */

/** Palette proposée dans les paramètres (teintes chaudes et ivoiriennes). */
export const COULEURS_PROPOSEES = [
  { nom: "Terre cuite", valeur: "#E4572E" },
  { nom: "Orange attiéké", valeur: "#F2732B" },
  { nom: "Rouge bissap", valeur: "#C0392B" },
  { nom: "Vert feuille", valeur: "#12A057" },
  { nom: "Vert maquis", valeur: "#1E7A4B" },
  { nom: "Bleu lagune", valeur: "#1D6FA5" },
  { nom: "Indigo", valeur: "#4C51BF" },
  { nom: "Aubergine", valeur: "#7C3AED" },
  { nom: "Rose grenadine", valeur: "#DB2777" },
  { nom: "Terre de Banco", valeur: "#8B5E34" },
  { nom: "Or", valeur: "#B7791F" },
  { nom: "Charbon", valeur: "#1F2937" },
] as const;

export const couleurSchema = z
  .string("Choisissez une couleur.")
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide : utilisez le format #E4572E.");

/* -------------------------------------------------------------------------- */
/*                            Adresse publique (slug)                          */
/* -------------------------------------------------------------------------- */

/** Slugs réservés par l'application : ils ne doivent pas être pris par un client. */
export const SLUGS_RESERVES = [
  "m",
  "api",
  "dashboard",
  "service",
  "admin",
  "connexion",
  "inscription",
  "mon-compte",
  "compte-suspendu",
  "commande",
  "conditions",
  "confidentialite",
] as const;

export const slugRestaurantSchema = z
  .string("L'adresse du menu est obligatoire.")
  .trim()
  .toLowerCase()
  .min(3, "L'adresse doit contenir au moins 3 caractères.")
  .max(48, "L'adresse ne peut pas dépasser 48 caractères.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Utilisez uniquement des minuscules, des chiffres et des tirets (ex. maquis-le-baoule).",
  )
  .refine(
    (valeur) => !(SLUGS_RESERVES as readonly string[]).includes(valeur),
    "Cette adresse est réservée par Mesplats. Choisissez-en une autre.",
  );

/* -------------------------------------------------------------------------- */
/*                             Profil du restaurant                            */
/* -------------------------------------------------------------------------- */

export const profilRestaurantSchema = z.object({
  nom: z
    .string("Le nom du restaurant est obligatoire.")
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(80, "80 caractères maximum."),
  slug: slugRestaurantSchema,
  adresse: z.string().trim().max(160, "160 caractères maximum.").optional().or(z.literal("")),
  horaires: z.string().trim().max(160, "160 caractères maximum.").optional().or(z.literal("")),
  telephone: z
    .string()
    .trim()
    .max(24, "Numéro trop long.")
    .optional()
    .or(z.literal("")),
  couleurPrincipale: couleurSchema,
  devise: z.enum(DEVISES, "Choisissez la devise affichée sur votre menu."),
});
export type DonneesProfilRestaurant = z.infer<typeof profilRestaurantSchema>;

/* -------------------------------------------------------------------------- */
/*                                 Catégories                                  */
/* -------------------------------------------------------------------------- */

export const categorieSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  nom: z
    .string("Le nom de la catégorie est obligatoire.")
    .trim()
    .min(1, "Le nom de la catégorie est obligatoire.")
    .max(40, "40 caractères maximum."),
  visible: z.coerce.boolean().optional().default(true),
});
export type DonneesCategorie = z.infer<typeof categorieSchema>;

/* -------------------------------------------------------------------------- */
/*                              Plats et options                               */
/* -------------------------------------------------------------------------- */

export const PRIX_MAX = 10_000_000; // 10 millions FCFA : au-delà, c'est une coquille

export const optionProduitSchema = z.object({
  nom: z
    .string("Nommez l'option.")
    .trim()
    .min(1, "Nommez l'option.")
    .max(40, "40 caractères maximum."),
  supplementPrix: z.coerce
    .number("Montant invalide.")
    .int("Le montant doit être un nombre entier de FCFA.")
    .min(0, "Le supplément ne peut pas être négatif.")
    .max(PRIX_MAX, "Montant trop élevé."),
});
export type DonneesOption = z.infer<typeof optionProduitSchema>;

export const NOMBRE_OPTIONS_MAX = 8;

export const produitSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string("Choisissez une catégorie.").uuid("Choisissez une catégorie."),
  nom: z
    .string("Le nom du plat est obligatoire.")
    .trim()
    .min(1, "Le nom du plat est obligatoire.")
    .max(80, "80 caractères maximum."),
  description: z
    .string()
    .trim()
    .max(280, "280 caractères maximum.")
    .optional()
    .or(z.literal("")),
  prix: z.coerce
    .number("Indiquez un prix.")
    .int("Le prix doit être un nombre entier de FCFA (sans centimes).")
    .min(0, "Le prix ne peut pas être négatif.")
    .max(PRIX_MAX, "Prix trop élevé : vérifiez la saisie."),
  photo: z.string().trim().max(500, "Adresse d'image trop longue.").optional().or(z.literal("")),
  disponible: z.coerce.boolean().optional().default(true),
  options: z
    .array(optionProduitSchema)
    .max(NOMBRE_OPTIONS_MAX, `${NOMBRE_OPTIONS_MAX} options maximum par plat.`)
    .default([]),
});
export type DonneesProduit = z.infer<typeof produitSchema>;

/* -------------------------------------------------------------------------- */
/*                          Moyens de paiement (MoMo)                          */
/* -------------------------------------------------------------------------- */

export const moyenPaiementSchema = z.object({
  operateur: z.enum(OPERATEURS, "Choisissez un opérateur."),
  numero: z
    .string("Le numéro est obligatoire.")
    .trim()
    .min(8, "Numéro trop court.")
    .max(20, "Numéro trop long.")
    .refine(
      (valeur) => /^\d{8,15}$/.test(valeur.replace(/\D/g, "")),
      "Saisissez le numéro mobile money (8 à 15 chiffres).",
    ),
  titulaire: z
    .string()
    .trim()
    .max(80, "80 caractères maximum.")
    .optional()
    .or(z.literal("")),
  actif: z.coerce.boolean().optional().default(true),
});
export type DonneesMoyenPaiement = z.infer<typeof moyenPaiementSchema>;
