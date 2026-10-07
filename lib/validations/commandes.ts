/**
 * Validation Zod des commandes clients (carte publique).
 *
 * Deux niveaux de vérification, comme partout dans le projet :
 *  1. côté client, pour un retour immédiat dans le panier ;
 *  2. côté serveur, dans la Server Action — source de vérité. Les prix, noms et
 *     options sont **recalculés en base** : rien de ce que le navigateur envoie
 *     n'est repris tel quel (un client malveillant ne peut pas imposer un prix).
 */
import { z } from "zod";

import { MODES_PAIEMENT, TYPES_COMMANDE } from "@/lib/constants";
import { telephoneOuestAfricainSchema } from "@/lib/validations/auth";

export const LIGNES_MAX = 40;
export const QUANTITE_MAX = 20;
export const OPTIONS_PAR_LIGNE_MAX = 8;

/** Une option choisie par le client : nom + supplément en FCFA. */
export const optionChoisieSchema = z.object({
  nom: z.string().trim().min(1, "Nom d'option manquant.").max(60, "Nom d'option trop long."),
  prix: z.coerce
    .number()
    .int("Supplément en francs CFA.")
    .min(0, "Supplément négatif impossible.")
    .max(1_000_000, "Supplément trop élevé."),
});

export const ligneCommandeSchema = z.object({
  productId: z.string("Plat manquant.").uuid("Plat invalide."),
  quantite: z.coerce
    .number("Quantité invalide.")
    .int("Quantité entière attendue.")
    .min(1, "Quantité minimum : 1.")
    .max(QUANTITE_MAX, `${QUANTITE_MAX} exemplaires maximum par plat.`),
  options: z
    .array(optionChoisieSchema)
    .max(OPTIONS_PAR_LIGNE_MAX, `${OPTIONS_PAR_LIGNE_MAX} options maximum par plat.`)
    .default([]),
  note: z
    .string()
    .trim()
    .max(140, "140 caractères maximum pour une précision.")
    .optional()
    .or(z.literal("")),
});
export type LigneCommandeSaisie = z.infer<typeof ligneCommandeSchema>;

/** Heure de retrait « HH:MM » (le créneau est recalculé côté serveur). */
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const commandeClientSchema = z
  .object({
    type: z.enum(TYPES_COMMANDE, "Choisissez sur place ou à emporter."),
    tableId: z.string().uuid().optional().or(z.literal("")),
    nomClient: z
      .string("Indiquez votre prénom.")
      .trim()
      .min(2, "Indiquez votre prénom (2 caractères minimum).")
      .max(60, "60 caractères maximum."),
    telephoneClient: telephoneOuestAfricainSchema,
    modePaiement: z.enum(MODES_PAIEMENT, "Choisissez un moyen de paiement."),
    heureRetrait: z.string().trim().optional().or(z.literal("")),
    note: z
      .string()
      .trim()
      .max(240, "240 caractères maximum.")
      .optional()
      .or(z.literal("")),
    lignes: z
      .array(ligneCommandeSchema)
      .min(1, "Votre panier est vide.")
      .max(LIGNES_MAX, `${LIGNES_MAX} articles maximum par commande.`),
  })
  .refine((d) => d.type !== "sur_place" || Boolean(d.tableId), {
    message: "Scannez le QR code de votre table pour commander sur place.",
    path: ["tableId"],
  })
  .refine((d) => !d.heureRetrait || HEURE.test(d.heureRetrait), {
    message: "Heure de retrait au format 18:30.",
    path: ["heureRetrait"],
  });
export type DonneesCommandeClient = z.infer<typeof commandeClientSchema>;

/* -------------------------------------------------------------------------- */
/*                          Écran de service (personnel)                      */
/* -------------------------------------------------------------------------- */

export const changementStatutSchema = z.object({
  commandeId: z.string("Commande manquante.").uuid("Commande invalide."),
  statut: z.enum(
    ["acceptee", "en_preparation", "prete", "servie"] as const,
    "Statut inconnu.",
  ),
});

export const refusCommandeSchema = z.object({
  commandeId: z.string("Commande manquante.").uuid("Commande invalide."),
  motif: z
    .string("Indiquez le motif du refus : le client le verra.")
    .trim()
    .min(3, "Motif trop court.")
    .max(160, "160 caractères maximum."),
});

export const paiementCommandeSchema = z.object({
  commandeId: z.string("Commande manquante.").uuid("Commande invalide."),
  paye: z.coerce.boolean(),
});

/** Nombre maximal de commandes simultanées par numéro de téléphone (anti-spam). */
export const COMMANDES_ACTIVES_MAX = 2;
/** Nombre maximal de commandes par numéro sur une heure glissante (anti-spam). */
export const COMMANDES_HEURE_MAX = 5;
