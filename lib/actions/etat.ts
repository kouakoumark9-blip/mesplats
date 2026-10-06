/**
 * État partagé des formulaires pilotés par Server Actions.
 *
 * ⚠️ Ce module ne porte PAS la directive `"use server"` : un fichier
 * `"use server"` ne peut exporter que des fonctions asynchrones, ce qui
 * interdit d'y déclarer une constante comme `etatInitial`.
 */
export type EtatFormulaire = {
  ok: boolean;
  /** Message global affiché en haut du formulaire. */
  message?: string;
  /** Erreurs par champ, produites par Zod côté serveur. */
  erreurs?: Record<string, string>;
};

export const etatInitial: EtatFormulaire = { ok: false };
