/**
 * Validation Zod des formulaires d'authentification et d'inscription.
 * Ces schémas sont utilisés côté client (React Hook Form / validation live)
 * ET côté serveur (Server Actions, route handlers) : source unique de vérité.
 */
import { z } from "zod";

import { PAYS_AFRIQUE_OUEST, ROLES_EQUIPE } from "@/lib/constants";

/** Un mot de passe doit rester sous 72 octets (limite bcrypt). */
export const motDePasseSchema = z
  .string("Le mot de passe est obligatoire.")
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.")
  .regex(/[A-Za-z]/, "Ajoutez au moins une lettre.")
  .regex(/[0-9]/, "Ajoutez au moins un chiffre.");

export const emailSchema = z
  .string("L'adresse email est obligatoire.")
  .trim()
  .toLowerCase()
  .email("Adresse email invalide (exemple : contact@monresto.ci).");

export const connexionSchema = z.object({
  email: emailSchema,
  motDePasse: z.string("Le mot de passe est obligatoire.").min(1, "Saisissez votre mot de passe."),
});
export type DonneesConnexion = z.infer<typeof connexionSchema>;

export const inscriptionSchema = z
  .object({
    nomRestaurant: z
      .string("Le nom du restaurant est obligatoire.")
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caractères.")
      .max(80, "80 caractères maximum."),
    nom: z
      .string("Votre nom est obligatoire.")
      .trim()
      .min(2, "Votre nom doit contenir au moins 2 caractères.")
      .max(80, "80 caractères maximum."),
    email: emailSchema,
    telephone: z
      .string()
      .trim()
      .max(24, "Numéro trop long.")
      .optional()
      .or(z.literal("")),
    motDePasse: motDePasseSchema,
    confirmation: z.string("Confirmez le mot de passe."),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Les deux mots de passe ne sont pas identiques.",
    path: ["confirmation"],
  });
export type DonneesInscription = z.infer<typeof inscriptionSchema>;

export const creationEmployeSchema = z.object({
  nom: z.string("Le nom est obligatoire.").trim().min(2, "Au moins 2 caractères.").max(80),
  email: emailSchema,
  role: z.enum(ROLES_EQUIPE, "Choisissez un rôle : serveur ou cuisine."),
  motDePasse: motDePasseSchema,
});
export type DonneesEmploye = z.infer<typeof creationEmployeSchema>;

/** Indicatifs téléphoniques acceptés (Afrique de l'Ouest). */
const INDICATIFS = PAYS_AFRIQUE_OUEST.map((p) => p.indicatif) as [string, ...string[]];

export const telephoneOuestAfricainSchema = z
  .string("Le numéro de téléphone est obligatoire.")
  .trim()
  .min(8, "Numéro de téléphone trop court.")
  .max(20, "Numéro de téléphone trop long.")
  .refine(
    (valeur) => {
      const chiffres = valeur.replace(/\D/g, "");
      return chiffres.length >= 8 && chiffres.length <= 15;
    },
    { message: "Numéro de téléphone invalide." },
  )
  .refine(
    (valeur) => {
      const chiffres = valeur.replace(/\D/g, "");
      return INDICATIFS.some((i) => chiffres.startsWith(i.replace(/\D/g, "")));
    },
    { message: "Choisissez un indicatif d'Afrique de l'Ouest (+225, +221, …)." },
  );

/* -------------------------------------------------------------------------- */
/*                      Mot de passe oublié / réinitialisé                    */
/* -------------------------------------------------------------------------- */

export const demandeReinitialisationSchema = z.object({
  email: emailSchema,
});

export const reinitialisationSchema = z
  .object({
    jeton: z.string("Lien incomplet : demandez un nouveau lien.").min(16, "Lien invalide."),
    motDePasse: motDePasseSchema,
    confirmation: z.string("Confirmez le nouveau mot de passe."),
  })
  .refine((d) => d.motDePasse === d.confirmation, {
    message: "Les deux mots de passe ne sont pas identiques.",
    path: ["confirmation"],
  });
export type DonneesReinitialisation = z.infer<typeof reinitialisationSchema>;

export const changementMotDePasseSchema = z
  .object({
    motDePasseActuel: z.string("Saisissez votre mot de passe actuel.").min(1),
    nouveauMotDePasse: motDePasseSchema,
    confirmation: z.string("Confirmez le nouveau mot de passe."),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmation, {
    message: "Les deux mots de passe ne sont pas identiques.",
    path: ["confirmation"],
  });
export type DonneesChangementMotDePasse = z.infer<typeof changementMotDePasseSchema>;

/**
 * Utilitaire partagé : transforme un `ZodError` en dictionnaire
 * `champ → premier message`, directement exploitable par les formulaires.
 * Compatible Zod 3 et 4 (s'appuie uniquement sur `error.issues`).
 */
export function erreursParChamp(erreur: z.ZodError): Record<string, string> {
  const sortie: Record<string, string> = {};
  for (const probleme of erreur.issues) {
    const champ = probleme.path.join(".") || "_form";
    if (!(champ in sortie)) sortie[champ] = probleme.message;
  }
  return sortie;
}
