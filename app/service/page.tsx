import { sql } from "drizzle-orm";
import { BellRing, ChefHat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeconnexionButton } from "@/components/auth/deconnexion-button";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { EtatVide } from "@/components/ui/divers";
import { exigerRole } from "@/lib/auth/autorisation";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { LIBELLES_ROLE } from "@/lib/constants";

export const metadata: Metadata = { title: "Écran de service" };

/**
 * ÉTAPE 1 — écran de vérification des rôles serveur et cuisine.
 * L'écran temps réel complet (alertes sonores, statuts, filtres) arrive à
 * l'étape 5 ; cette page prouve que le contrôle d'accès par rôle fonctionne.
 */
export default async function PageService() {
  const utilisateur = await exigerRole("admin", "serveur", "cuisine");
  const restaurantId = utilisateur.restaurantId!;

  const [compteur] = await db
    .select({
      nouvelles: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(sql`"orders"."restaurant_id" = ${restaurantId} and "orders"."statut" = 'nouvelle'`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-marque-600">{utilisateur.restaurantNom}</p>
          <h1 className="font-titre text-2xl font-extrabold text-slate-900">Écran de service</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge ton="marque" icone={<ChefHat className="size-3.5" aria-hidden />}>
            Rôle : {LIBELLES_ROLE[utilisateur.role]}
          </Badge>
          <DeconnexionButton />
        </div>
      </header>

      <Carte className="mt-6 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <BellRing className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-titre text-lg font-bold text-slate-900">
              {compteur.nouvelles} commande{compteur.nouvelles > 1 ? "s" : ""} en attente
            </p>
            <p className="text-sm text-slate-500">
              L&apos;écran temps réel (mise à jour toutes les 4 secondes, alerte sonore, changement
              de statut en un clic) sera livré à l&apos;étape 5.
            </p>
          </div>
        </div>

        <EtatVide
          className="mt-6"
          icone={<ChefHat className="size-7" aria-hidden />}
          titre="Écran de service à venir"
          description="Cette page confirme que le contrôle d'accès par rôle est bien appliqué : un serveur ou un cuisinier n'accède jamais au back-office du propriétaire."
        />
      </Carte>

      <p className="mt-6 text-sm text-slate-500">
        <Link href="/" className="font-semibold text-marque-600 hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
