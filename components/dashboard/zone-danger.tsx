"use client";

/**
 * Zone de suppression de l'établissement.
 * ---------------------------------------------------------------------------
 * Trois garde-fous, dans cet ordre :
 *  1. un panneau de confirmation à ouvrir explicitement ;
 *  2. la saisie du nom exact de l'établissement ;
 *  3. le mot de passe du propriétaire, revérifié côté serveur.
 * La suppression efface toutes les données (plats, tables, commandes, équipe)
 * et déconnecte immédiatement l'utilisateur.
 */
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { signOut } from "next-auth/react";

import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { supprimerEtablissement } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";

export function ZoneDanger({ nomRestaurant }: { nomRestaurant: string }) {
  const [etat, action, enCours] = useActionState(supprimerEtablissement, etatInitial);
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");

  useEffect(() => {
    if (!etat.ok) return;
    const minuteur = window.setTimeout(() => {
      void signOut({ callbackUrl: "/" });
    }, 2500);
    return () => window.clearTimeout(minuteur);
  }, [etat.ok]);

  const nomCorrect = saisie.trim().toLowerCase() === nomRestaurant.trim().toLowerCase();

  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
      <h2 className="flex items-center gap-2 font-titre text-base font-extrabold text-rose-800 dark:text-rose-200">
        <AlertTriangle className="size-4" aria-hidden />
        Supprimer cet établissement
      </h2>
      <p className="mt-2 text-sm text-rose-800/90 dark:text-rose-200/90">
        Cette action est définitive : votre menu, vos tables, vos QR codes, votre historique de
        commandes et les comptes de votre équipe sont effacés. Pensez à exporter ce dont vous avez
        besoin avant de continuer.
      </p>

      {etat.ok ? (
        <div className="mt-4">
          <Alerte ton="succes" titre="Établissement supprimé">
            {etat.message}
          </Alerte>
        </div>
      ) : !ouvert ? (
        <div className="mt-4">
          <Bouton
            type="button"
            variante="contour"
            className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-200"
            icone={<Trash2 className="size-4" aria-hidden />}
            onClick={() => setOuvert(true)}
          >
            Je veux supprimer mon établissement
          </Bouton>
        </div>
      ) : (
        <form action={action} className="mt-4 space-y-3">
          {etat.message && !etat.ok ? (
            <Alerte ton="erreur" titre="Suppression refusée">
              {etat.message}
            </Alerte>
          ) : null}

          <Champ
            label={`Recopiez le nom exact de votre établissement : « ${nomRestaurant} »`}
            htmlFor="danger-confirmation"
            erreur={etat.erreurs?.confirmation}
            obligatoire
          >
            <Entree
              id="danger-confirmation"
              name="confirmation"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder={nomRestaurant}
              erreur={Boolean(etat.erreurs?.confirmation)}
              autoComplete="off"
            />
          </Champ>

          <Champ
            label="Votre mot de passe"
            htmlFor="danger-motdepasse"
            erreur={etat.erreurs?.motDePasse}
            obligatoire
          >
            <Entree
              id="danger-motdepasse"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              erreur={Boolean(etat.erreurs?.motDePasse)}
            />
          </Champ>

          <div className="flex flex-wrap gap-2">
            <Bouton
              type="submit"
              variante="danger"
              disabled={!nomCorrect || enCours}
              icone={
                enCours ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-4" aria-hidden />
                )
              }
            >
              {enCours ? "Suppression…" : "Supprimer définitivement"}
            </Bouton>
            <Bouton type="button" variante="fantome" onClick={() => setOuvert(false)}>
              Annuler
            </Bouton>
          </div>

          {!nomCorrect && saisie.length > 0 ? (
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              Le nom saisi ne correspond pas encore au nom de l&apos;établissement.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
