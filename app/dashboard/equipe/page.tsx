/**
 * Équipe du restaurant — /dashboard/equipe (propriétaire uniquement).
 * Réservé à l'`admin` par le layout `/dashboard` ; les actions serveur
 * revérifient le rôle et l'appartenance des comptes au restaurant.
 */
import type { Metadata } from "next";

import { GestionEquipe } from "@/components/dashboard/gestion-equipe";
import { Alerte } from "@/components/ui/divers";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_COMPTES_EQUIPE } from "@/lib/constants";
import { equipeDuRestaurant } from "@/lib/db/equipe";

export const metadata: Metadata = { title: "Équipe" };
export const dynamic = "force-dynamic";

export default async function PageEquipe() {
  const utilisateur = await exigerRole("admin");
  const membres = await equipeDuRestaurant(utilisateur.restaurantId!);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-titre text-2xl font-extrabold text-slate-900 dark:text-white">Équipe</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Créez un compte par personne : chacun se connecte avec son email, reçoit les commandes en
          direct et valide les paiements reçus.
        </p>
      </header>

      <Alerte ton="info" titre="Bon à savoir">
        Les serveurs et la cuisine n&apos;ont accès qu&apos;à l&apos;écran de service
        (<code className="rounded bg-white/60 px-1">/service</code>) : ils ne peuvent ni modifier le
        menu, ni voir le chiffre d&apos;affaires. Seul le propriétaire ouvre le back-office.
      </Alerte>

      <GestionEquipe
        membres={membres}
        limite={LIMITE_COMPTES_EQUIPE[utilisateur.plan]}
        plan={utilisateur.plan}
      />
    </div>
  );
}
