"use client";

/**
 * Formulaire « Nouveau mot de passe » — étape 2.
 *
 * Le jeton arrive par l'URL (`?jeton=…`) et est renvoyé tel quel au serveur :
 * la vérification (empreinte + expiration + usage unique) est faite à chaque
 * fois, jamais dans le navigateur seul.
 */
import { Check, Eye, EyeOff, KeyRound, ShieldCheck, X } from "lucide-react";
import { useActionState, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { reinitialiserMotDePasse } from "@/lib/actions/auth";
import { etatInitial } from "@/lib/actions/etat";

/** Critères affichés en direct : mêmes règles que le schéma Zod partagé. */
function criteres(motDePasse: string) {
  return [
    { libelle: "8 caractères minimum", ok: motDePasse.length >= 8 },
    { libelle: "une majuscule", ok: /[A-Z]/.test(motDePasse) },
    { libelle: "une minuscule", ok: /[a-z]/.test(motDePasse) },
    { libelle: "un chiffre", ok: /\d/.test(motDePasse) },
  ];
}

export function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(reinitialiserMotDePasse, etatInitial);
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);

  const regles = criteres(motDePasse);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="jeton" value={jeton} />

      {etat.message ? (
        <Alerte ton={etat.ok ? "succes" : "erreur"} titre={etat.ok ? "Mot de passe modifié" : "Réinitialisation impossible"}>
          {etat.message}
        </Alerte>
      ) : null}

      <Champ
        label="Nouveau mot de passe"
        htmlFor="motDePasse"
        erreur={etat.erreurs?.motDePasse}
        obligatoire
      >
        <div className="relative">
          <Entree
            id="motDePasse"
            name="motDePasse"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            erreur={Boolean(etat.erreurs?.motDePasse)}
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </Champ>

      <ul className="grid grid-cols-2 gap-1.5">
        {regles.map((regle) => (
          <li
            key={regle.libelle}
            className={
              "flex items-center gap-1.5 text-xs font-medium " +
              (regle.ok ? "text-feuille-600 dark:text-feuille-400" : "text-slate-400")
            }
          >
            {regle.ok ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <X className="size-3.5" aria-hidden />
            )}
            {regle.libelle}
          </li>
        ))}
      </ul>

      <Champ
        label="Confirmer le mot de passe"
        htmlFor="confirmation"
        erreur={etat.erreurs?.confirmation}
        obligatoire
      >
        <Entree
          id="confirmation"
          name="confirmation"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          erreur={Boolean(etat.erreurs?.confirmation)}
          required
        />
      </Champ>

      <Bouton
        type="submit"
        taille="lg"
        pleineLargeur
        chargement={enCours}
        libelleChargement="Enregistrement…"
        icone={<ShieldCheck className="size-5" aria-hidden />}
      >
        Enregistrer mon nouveau mot de passe
      </Bouton>

      <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Le lien devient inutilisable dès l&apos;enregistrement. Toutes vos autres sessions
        restent actives : changez aussi votre mot de passe depuis « Mon compte » si vous pensez
        qu&apos;un tiers y a accès.
      </p>
    </form>
  );
}
