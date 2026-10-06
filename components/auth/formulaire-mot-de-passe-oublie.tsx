"use client";

/**
 * Formulaire « Mot de passe oublié » — étape 1.
 *
 * Le message de retour est identique que l'adresse existe ou non (pas
 * d'énumération de comptes). Si aucun service d'e-mail n'est configuré sur
 * l'installation, le lien de secours est affiché avec une copie en un clic.
 */
import { CheckCircle2, Copy, KeyRound, MailCheck, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { demanderReinitialisation } from "@/lib/actions/auth";
import { etatInitial } from "@/lib/actions/etat";

export function FormulaireMotDePasseOublie() {
  const [etat, action, enCours] = useActionState(demanderReinitialisation, etatInitial);
  const [copie, setCopie] = useState(false);

  return (
    <form action={action} className="space-y-4" noValidate>
      {etat.message ? (
        <Alerte ton={etat.ok ? "succes" : "erreur"} titre={etat.ok ? "Demande envoyée" : "Vérifiez votre saisie"}>
          {etat.message}
        </Alerte>
      ) : null}

      {etat.lien ? (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/40">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Lien de réinitialisation (valable 30 minutes)
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-amber-900/60 dark:bg-slate-900 dark:text-slate-200">
              {etat.lien}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(etat.lien ?? "").then(() => {
                  setCopie(true);
                  window.setTimeout(() => setCopie(false), 2500);
                });
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-300 px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200"
            >
              {copie ? <CheckCircle2 className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copie ? "Copié" : "Copier"}
            </button>
          </div>
          {etat.note ? (
            <p className="text-xs text-amber-800 dark:text-amber-300">{etat.note}</p>
          ) : null}
          <a
            href={etat.lien}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline dark:text-amber-200"
          >
            <KeyRound className="size-3.5" aria-hidden />
            Ouvrir la page de réinitialisation
          </a>
        </div>
      ) : null}

      <Champ
        label="Adresse email de votre compte"
        htmlFor="email"
        erreur={etat.erreurs?.email}
        aide="Nous y envoyons un lien sécurisé, utilisable une seule fois."
        obligatoire
      >
        <Entree
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="vous@monrestaurant.ci"
          erreur={Boolean(etat.erreurs?.email)}
          required
        />
      </Champ>

      <Bouton
        type="submit"
        taille="lg"
        pleineLargeur
        chargement={enCours}
        libelleChargement="Création du lien…"
        icone={etat.ok ? <MailCheck className="size-5" aria-hidden /> : <Send className="size-5" aria-hidden />}
      >
        Recevoir le lien de réinitialisation
      </Bouton>
    </form>
  );
}
