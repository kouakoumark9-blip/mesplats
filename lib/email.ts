/**
 * Envoi d'e-mails transactionnels — fonctionne sans dépendance payante.
 * ---------------------------------------------------------------------------
 * Deux modes :
 *  1. `RESEND_API_KEY` (+ `EMAIL_EXPEDITEUR`) configurés : l'e-mail part par
 *     l'API HTTP Resend (plan gratuit largement suffisant pour les liens de
 *     réinitialisation) ;
 *  2. aucune clé : aucun e-mail n'est envoyé. L'application renvoie alors le
 *     lien au demandeur — utile en auto-hébergement et pour la démonstration,
 *     et signalé clairement dans l'interface.
 *
 * Aucun SDK n'est installé : un simple `fetch` suffit et garde le bundle léger.
 */
import { lireEnv } from "@/lib/env";

export type ResultatEnvoiEmail = {
  /** true si un service d'e-mail est configuré et a accepté le message. */
  envoye: boolean;
  /** Message d'erreur éventuel, à afficher au demandeur. */
  erreur?: string;
};

function cleResend(): string | null {
  return lireEnv("RESEND_API_KEY");
}

function expediteur(): string {
  return lireEnv("EMAIL_EXPEDITEUR") ?? "Mesplats <notifications@mesplats.app>";
}

/** Indique si un service d'e-mail est configuré sur cette installation. */
export function emailConfigure(): boolean {
  return cleResend() !== null;
}

export async function envoyerReinitialisation(params: {
  destinataire: string;
  lien: string;
  restaurant?: string | null;
}): Promise<ResultatEnvoiEmail> {
  const cle = cleResend();
  if (!cle) return { envoye: false };

  const sujet = "Réinitialisez votre mot de passe Mesplats";
  const texte = [
    "Bonjour,",
    "",
    `Vous avez demandé à réinitialiser le mot de passe de votre espace Mesplats${params.restaurant ? ` (${params.restaurant})` : ""}.`,
    "",
    `Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 30 minutes) :`,
    params.lien,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail :",
    "votre mot de passe reste inchangé.",
    "",
    "L'équipe Mesplats",
  ].join("\n");

  const corps = `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a">
    <h2 style="margin:0 0 8px">Réinitialisation de votre mot de passe</h2>
    <p>Bonjour,</p>
    <p>
      Vous avez demandé à réinitialiser le mot de passe de votre espace Mesplats${
        params.restaurant ? ` <strong>${params.restaurant}</strong>` : ""
      }.
    </p>
    <p style="margin:24px 0">
      <a href="${params.lien}"
         style="background:#E4572E;color:#fff;padding:12px 20px;border-radius:12px;
                text-decoration:none;font-weight:600;display:inline-block">
        Choisir un nouveau mot de passe
      </a>
    </p>
    <p style="font-size:14px;color:#475569">
      Ce lien est valable 30 minutes. Si vous n'êtes pas à l'origine de cette demande,
      ignorez cet e-mail : votre mot de passe reste inchangé.
    </p>
    <p style="font-size:14px;color:#475569">L'équipe Mesplats</p>
  </div>`.trim();

  try {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: expediteur(),
        to: [params.destinataire],
        subject: sujet,
        text: texte,
        html: corps,
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => "");
      return {
        envoye: false,
        erreur: `Le service d'e-mail a refusé l'envoi (${reponse.status}). ${detail.slice(0, 200)}`,
      };
    }

    return { envoye: true };
  } catch (erreur) {
    return {
      envoye: false,
      erreur:
        "Impossible de joindre le service d'e-mail pour le moment. " +
        (erreur instanceof Error ? erreur.message : ""),
    };
  }
}
