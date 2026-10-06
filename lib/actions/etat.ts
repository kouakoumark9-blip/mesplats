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
  /**
   * Nombre d'enregistrements réellement créés, renvoyé par les actions qui
   * travaillent en lot (ex. « créer 12 tables d'un coup »).
   */
  nombre?: number;
  /**
   * Lien de secours renvoyé par la demande de réinitialisation lorsque aucun
   * service d'e-mail n'est configuré sur l'installation.
   */
  lien?: string;
  /** Précisions complémentaires (ex. étapes de secours affichées au demandeur). */
  note?: string;
};

export const etatInitial: EtatFormulaire = { ok: false };
