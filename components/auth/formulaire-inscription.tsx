"use client";

import { Eye, EyeOff, Store, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { ChoixTelephone } from "@/components/formulaires/choix-telephone";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { inscriptionAction } from "@/lib/actions/auth";
import { etatInitial } from "@/lib/actions/etat";
import { slugify } from "@/lib/utils";

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState(inscriptionAction, etatInitial);
  const [nomRestaurant, setNomRestaurant] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const slug = slugify(nomRestaurant);

  return (
    <form action={action} className="space-y-5" noValidate>
      {etat.message ? (
        <Alerte ton="erreur" titre="Inscription impossible">
          {etat.message}
        </Alerte>
      ) : null}

      <Champ
        label="Nom du restaurant"
        htmlFor="nomRestaurant"
        erreur={etat.erreurs?.nomRestaurant}
        aide={
          slug
            ? `Votre menu sera accessible à l'adresse /m/${slug}`
            : "Ce nom apparaîtra sur votre menu et vos QR codes."
        }
        obligatoire
      >
        <Entree
          id="nomRestaurant"
          name="nomRestaurant"
          placeholder="Maquis Le Baoulé"
          value={nomRestaurant}
          onChange={(evenement) => setNomRestaurant(evenement.target.value)}
          erreur={Boolean(etat.erreurs?.nomRestaurant)}
          autoComplete="organization"
          required
        />
      </Champ>

      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label="Votre nom" htmlFor="nom" erreur={etat.erreurs?.nom} obligatoire>
          <Entree
            id="nom"
            name="nom"
            placeholder="Awa Konan"
            erreur={Boolean(etat.erreurs?.nom)}
            autoComplete="name"
            required
          />
        </Champ>

        <Champ label="Email professionnel" htmlFor="email" erreur={etat.erreurs?.email} obligatoire>
          <Entree
            id="email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="contact@monrestaurant.ci"
            erreur={Boolean(etat.erreurs?.email)}
            autoComplete="email"
            required
          />
        </Champ>
      </div>

      <ChoixTelephone
        nomChamp="telephone"
        erreur={etat.erreurs?.telephone}
        obligatoire={false}
        label="Téléphone du restaurant (facultatif)"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Champ
          label="Mot de passe"
          htmlFor="motDePasse"
          erreur={etat.erreurs?.motDePasse}
          aide="8 caractères minimum, avec au moins une lettre et un chiffre."
          obligatoire
        >
          <div className="relative">
            <Entree
              id="motDePasse"
              name="motDePasse"
              type={motDePasseVisible ? "text" : "password"}
              autoComplete="new-password"
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

        <Champ
          label="Confirmation"
          htmlFor="confirmation"
          erreur={etat.erreurs?.confirmation}
          obligatoire
        >
          <Entree
            id="confirmation"
            name="confirmation"
            type={motDePasseVisible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            erreur={Boolean(etat.erreurs?.confirmation)}
            required
          />
        </Champ>
      </div>

      <Alerte ton="info" icone={<Store className="size-4" aria-hidden />}>
        Formule <strong>Pro à 9 900 FCFA par mois</strong> (ou Multi-établissements à 19 900 FCFA)
        : plats, tables et comptes équipe illimités. Le règlement se fait par Orange Money, Moov
        Money ou MTN MoMo — aucune carte bancaire.
      </Alerte>

      <Bouton
        type="submit"
        taille="lg"
        pleineLargeur
        chargement={enCours}
        libelleChargement="Création du compte…"
        icone={<UserPlus className="size-5" aria-hidden />}
      >
        Créer mon restaurant
      </Bouton>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-bold text-marque-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
