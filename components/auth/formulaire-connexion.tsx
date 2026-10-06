"use client";

import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { connexionAction } from "@/lib/actions/auth";
import { etatInitial } from "@/lib/actions/etat";

export function FormulaireConnexion({
  messageInscription,
}: {
  messageInscription?: string;
}) {
  const [etat, action, enCours] = useActionState(connexionAction, etatInitial);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const referenceEmail = useRef<HTMLInputElement>(null);
  const referenceMotDePasse = useRef<HTMLInputElement>(null);

  /** Pré-remplit le compte de démonstration créé par `npm run db:seed`. */
  function remplirDemo() {
    if (referenceEmail.current) referenceEmail.current.value = "admin@demo.ci";
    if (referenceMotDePasse.current) referenceMotDePasse.current.value = "Demo1234";
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {messageInscription ? (
        <Alerte ton="succes" titre="Compte créé !">
          Connectez-vous avec vos identifiants pour accéder à votre back-office.
        </Alerte>
      ) : null}

      {etat.message ? (
        <Alerte ton="erreur" titre="Connexion refusée">
          {etat.message}
        </Alerte>
      ) : null}

      <Champ label="Adresse email" htmlFor="email" erreur={etat.erreurs?.email} obligatoire>
        <Entree
          ref={referenceEmail}
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

      <Champ label="Mot de passe" htmlFor="motDePasse" erreur={etat.erreurs?.motDePasse} obligatoire>
        <div className="relative">
          <Entree
            ref={referenceMotDePasse}
            id="motDePasse"
            name="motDePasse"
            type={motDePasseVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            erreur={Boolean(etat.erreurs?.motDePasse)}
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setMotDePasseVisible((v) => !v)}
            aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
          >
            {motDePasseVisible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </Champ>

      <Bouton
        type="submit"
        taille="lg"
        pleineLargeur
        chargement={enCours}
        libelleChargement="Connexion…"
        icone={<LogIn className="size-5" aria-hidden />}
      >
        Se connecter
      </Bouton>

      <button
        type="button"
        onClick={remplirDemo}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-marque-400 hover:text-marque-600 dark:border-slate-700 dark:text-slate-300"
      >
        <Sparkles className="size-4" aria-hidden />
        Remplir avec le compte de démonstration
      </button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-bold text-marque-600 hover:underline">
          Créer mon restaurant
        </Link>
      </p>
    </form>
  );
}
