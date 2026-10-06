/**
 * Validation Zod du catalogue (catégories, plats, options) et du profil du
 * restaurant. Ces schémas sont utilisés :
 *  - côté client, pour la validation immédiate des formulaires ;
 *  - côté serveur, dans chaque Server Action (source de vérité).
 */
import { z } from "zod";

import {
  COULEURS_FOND_MENU,
  DEVISES,
  LANGUES_MENU,
  OPERATEURS,
  POLICES_MENU,
  RESEAUX_SOCIAUX,
  STYLES_QR,
  THEMES_MENU,
  type DisponibiliteCategorie,
} from "@/lib/constants";

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
  adresseComplement: z
    .string()
    .trim()
    .max(120, "120 caractères maximum.")
    .optional()
    .or(z.literal("")),
  codePostal: z.string().trim().max(12, "Code postal trop long.").optional().or(z.literal("")),
  ville: z.string().trim().max(60, "60 caractères maximum.").optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(280, "280 caractères maximum — deux phrases suffisent.")
    .optional()
    .or(z.literal("")),
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

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const creneauHoraireSchema = z
  .object({
    debut: z.string("Heure de début manquante.").regex(HEURE, "Heure au format 08:00."),
    fin: z.string("Heure de fin manquante.").regex(HEURE, "Heure au format 22:00."),
  })
  .refine((c) => c.debut < c.fin, "L'heure de fin doit suivre l'heure de début.");

/** Disponibilité d'une catégorie : jours (0 = lundi) + créneaux horaires. */
export const disponibiliteSchema = z.object({
  jours: z
    .array(z.coerce.number().int().min(0).max(6))
    .max(7, "7 jours au maximum.")
    .optional(),
  creneaux: z.array(creneauHoraireSchema).max(4, "4 créneaux au maximum.").optional(),
});

/**
 * Le formulaire transmet la disponibilité sous forme de chaîne JSON (ou vide
 * pour « disponible en permanence »). On la décode ici pour que la Server
 * Action travaille toujours sur un objet vérifié.
 */
const disponibiliteFormulaire = z
  .string()
  .optional()
  .transform((valeur, ctx): DisponibiliteCategorie | null => {
    if (!valeur || valeur === "toujours") return null;
    let brut: unknown;
    try {
      brut = JSON.parse(valeur);
    } catch {
      ctx.addIssue({ code: "custom", message: "Disponibilité illisible." });
      return null;
    }
    const analyse = disponibiliteSchema.safeParse(brut);
    if (!analyse.success) {
      ctx.addIssue({ code: "custom", message: "Vérifiez les jours et les créneaux horaires." });
      return null;
    }
    const jours = analyse.data.jours?.length ? [...new Set(analyse.data.jours)].sort() : undefined;
    const creneaux = analyse.data.creneaux?.length ? analyse.data.creneaux : undefined;
    if (!jours && !creneaux) return null;
    return { jours, creneaux };
  });

export const categorieSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  nom: z
    .string("Le nom de la catégorie est obligatoire.")
    .trim()
    .min(1, "Le nom de la catégorie est obligatoire.")
    .max(40, "40 caractères maximum."),
  visible: z.coerce.boolean().optional().default(true),
  disponibilite: disponibiliteFormulaire,
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
  personnesMin: z
    .union([z.coerce.number().int("Nombre entier attendu.").min(1).max(50), z.literal("")])
    .optional(),
  personnesMax: z
    .union([z.coerce.number().int("Nombre entier attendu.").min(1).max(50), z.literal("")])
    .optional(),
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


/* -------------------------------------------------------------------------- */
/*                       Apparence de la carte publique                        */
/* -------------------------------------------------------------------------- */

export const apparenceSchema = z.object({
  themeMenu: z.enum(THEMES_MENU, "Choisissez un thème clair ou sombre."),
  couleurFond: z.enum(
    COULEURS_FOND_MENU.map((c) => c.cle) as [string, ...string[]],
    "Choisissez une couleur de fond.",
  ),
  policeMenu: z.enum(
    POLICES_MENU.map((p) => p.cle) as [string, ...string[]],
    "Choisissez une police.",
  ),
  langues: z
    .array(z.string())
    .min(1, "Gardez au moins le français.")
    .max(LANGUES_MENU.length, "Trop de langues.")
    .transform((langues) => [...new Set(langues)].slice(0, LANGUES_MENU.length)),
});
export type DonneesApparence = z.infer<typeof apparenceSchema>;

/* -------------------------------------------------------------------------- */
/*                    Vitrine : logo, bannière et coordonnées                 */
/* -------------------------------------------------------------------------- */

const adresseImage = z
  .string()
  .trim()
  .max(500, "Adresse d'image trop longue.")
  .optional()
  .or(z.literal(""));

export const vitrineSchema = z.object({
  logo: adresseImage,
  banniere: adresseImage,
  description: z
    .string()
    .trim()
    .max(280, "280 caractères maximum — deux phrases suffisent.")
    .optional()
    .or(z.literal("")),
  adresse: z.string().trim().max(160, "160 caractères maximum.").optional().or(z.literal("")),
  adresseComplement: z
    .string()
    .trim()
    .max(120, "120 caractères maximum.")
    .optional()
    .or(z.literal("")),
  codePostal: z.string().trim().max(12, "Code postal trop long.").optional().or(z.literal("")),
  ville: z.string().trim().max(60, "60 caractères maximum.").optional().or(z.literal("")),
  telephone: z.string().trim().max(24, "Numéro trop long.").optional().or(z.literal("")),
});
export type DonneesVitrine = z.infer<typeof vitrineSchema>;

export const reseauxSchema = z.object({
  reseaux: z
    .array(
      z.object({
        cle: z.enum(RESEAUX_SOCIAUX.map((r) => r.cle) as [string, ...string[]]),
        url: z.string().trim().max(200, "Adresse trop longue.").optional().or(z.literal("")),
      }),
    )
    .max(RESEAUX_SOCIAUX.length),
});
export type DonneesReseaux = z.infer<typeof reseauxSchema>;

/* -------------------------------------------------------------------------- */
/*                        Personnalisation des QR codes                        */
/* -------------------------------------------------------------------------- */

const couleurHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur attendue au format #RRGGBB.");

export const personnalisationQrSchema = z.object({
  qrStyle: z.enum(STYLES_QR.map((s) => s.cle) as [string, ...string[]], "Style inconnu."),
  qrCouleur: couleurHex,
  qrFond: couleurHex,
  qrLogo: z.coerce.boolean().optional().default(false),
});
export type DonneesPersonnalisationQr = z.infer<typeof personnalisationQrSchema>;

/* -------------------------------------------------------------------------- */
/*                        Suppression de l'établissement                       */
/* -------------------------------------------------------------------------- */

export const suppressionEtablissementSchema = z.object({
  confirmation: z.string("Saisissez le nom de votre établissement pour confirmer.").trim(),
  motDePasse: z.string("Votre mot de passe est requis.").min(1, "Votre mot de passe est requis."),
});
export type DonneesSuppressionEtablissement = z.infer<
  typeof suppressionEtablissementSchema
>;
