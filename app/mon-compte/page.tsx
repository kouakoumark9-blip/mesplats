import { KeyRound, UserRound } from "lucide-react";
import type { Metadata } from "next";

import { DeconnexionButton } from "@/components/auth/deconnexion-button";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteEntete } from "@/components/ui/carte";
import { Alerte } from "@/components/ui/divers";
import { exigerUtilisateur } from "@/lib/auth/autorisation";
import { LIBELLES_PLAN, LIBELLES_ROLE } from "@/lib/constants";
import { formatRelatif } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

/** Informations du compte connecté, accessible à tous les rôles. */
export default async function PageMonCompte() {
  const utilisateur = await exigerUtilisateur();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl font-extrabold text-slate-900">Mon compte</h1>
        <DeconnexionButton />
      </header>

      <Carte className="mt-6">
        <CarteEntete titre="Identité" icone={<UserRound className="size-5" aria-hidden />} />
        <dl className="divide-y divide-slate-100 px-5 text-sm dark:divide-slate-800">
          {[
            { terme: "Nom", valeur: utilisateur.nom },
            { terme: "Email", valeur: utilisateur.email },
            { terme: "Rôle", valeur: LIBELLES_ROLE[utilisateur.role] },
            { terme: "Restaurant", valeur: utilisateur.restaurantNom ?? "—" },
            { terme: "Formule", valeur: LIBELLES_PLAN[utilisateur.plan] },
            { terme: "Devise", valeur: utilisateur.devise },
          ].map((ligne) => (
            <div key={ligne.terme} className="flex items-center justify-between gap-4 py-3">
              <dt className="font-medium text-slate-500">{ligne.terme}</dt>
              <dd className="text-right font-semibold text-slate-900">{ligne.valeur}</dd>
            </div>
          ))}
        </dl>
      </Carte>

      <Carte className="mt-4">
        <CarteEntete titre="Sécurité" icone={<KeyRound className="size-5" aria-hidden />} />
        <div className="p-5">
          <Alerte ton="info">
            Le changement de mot de passe et la gestion des sessions seront ajoutés avec les
            paramètres du compte (étape 2). Votre mot de passe est stocké haché avec bcrypt : il
            n&apos;est jamais lisible, même par l&apos;équipe Mesplats.
          </Alerte>
          <p className="mt-3 text-sm text-slate-500">
            Session ouverte depuis {formatRelatif(new Date())} sur ce navigateur.
          </p>
        </div>
      </Carte>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge ton="marque">Session JWT sécurisée</Badge>
        <Badge ton="succes">Isolation par restaurant</Badge>
      </div>
    </div>
  );
}
