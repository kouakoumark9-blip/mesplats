/**
 * Validation Zod des tables et QR codes (étape 3).
 * Utilisé côté client (formulaire de création en lot) et rejoué côté serveur.
 */
import { z } from "zod";

/** 60 tables en un lot : au-delà, c'est une erreur de saisie. */
export const TABLES_MAX_PAR_LOT = 60;

/** Numéro de table : libellé libre, mais court et sans caractères gênants. */
export const numeroTableSchema = z
  .string("Le numéro de table est obligatoire.")
  .trim()
  .min(1, "Indiquez un numéro de table.")
  .max(12, "12 caractères maximum (ex. « 12 », « Terrasse A »).")
  .regex(
    /^[0-9A-Za-zÀ-ÿ][0-9A-Za-zÀ-ÿ .'-]*$/,
    "Utilisez des lettres, des chiffres, des espaces, points ou tirets.",
  );

/** Création de plusieurs tables d'un coup : « de 1 à 10 », préfixe facultatif. */
export const tablesLotSchema = z
  .object({
    nombre: z.coerce
      .number("Indiquez le nombre de tables.")
      .int("Le nombre de tables doit être entier.")
      .min(1, "Créez au moins une table.")
      .max(TABLES_MAX_PAR_LOT, `${TABLES_MAX_PAR_LOT} tables maximum en une fois.`),
    debut: z.coerce
      .number("Indiquez le premier numéro.")
      .int("Le premier numéro doit être entier.")
      .min(0, "Le premier numéro ne peut pas être négatif.")
      .max(9999, "Numéro trop grand."),
    prefixe: z
      .string()
      .trim()
      .max(16, "16 caractères maximum.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (donnees) => donnees.debut + donnees.nombre <= 10_000,
    "La plage de numéros est trop grande.",
  );
export type DonneesTablesLot = z.infer<typeof tablesLotSchema>;

/** Renommage d'une table existante. */
export const renommageTableSchema = z.object({
  id: z.string("Table inconnue.").uuid("Table inconnue."),
  numero: numeroTableSchema,
});
export type DonneesRenommageTable = z.infer<typeof renommageTableSchema>;
