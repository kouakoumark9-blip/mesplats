import { desc, sql } from "drizzle-orm";
import { Building2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { DeconnexionButton } from "@/components/auth/deconnexion-button";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteStat } from "@/components/ui/carte";
import { exigerRole } from "@/lib/auth/autorisation";
import { db } from "@/lib/db";
import {
  sousRequeteChiffreAffaires,
  sousRequeteCommandes,
  sousRequeteEquipe,
  sousRequeteProduits,
} from "@/lib/db/agregats";
import { restaurants } from "@/lib/db/schema";
import { formatDate, formatFcfa } from "@/lib/utils";

export const metadata: Metadata = { title: "Plateforme", robots: { index: false } };

/**
 * ÉTAPE 1 — version minimale du super-admin (liste des restaurants et
 * compteurs). L'activation/suspension et les statistiques plateforme sont
 * finalisées à l'étape 7.
 */
export default async function PageAdmin() {
  await exigerRole("superadmin");

  const liste = await db
    .select({
      id: restaurants.id,
      nom: restaurants.nom,
      slug: restaurants.slug,
      plan: restaurants.plan,
      actif: restaurants.actif,
      createdAt: restaurants.createdAt,
      produits: sousRequeteProduits(),
      equipe: sousRequeteEquipe(),
      commandes: sousRequeteCommandes(),
      chiffre: sousRequeteChiffreAffaires(),
    })
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt));

  const totalActifs = liste.filter((r) => r.actif).length;
  const totalCommandes = liste.reduce((somme, r) => somme + r.commandes, 0);
  const totalChiffre = liste.reduce((somme, r) => somme + r.chiffre, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-marque-600">
            <ShieldCheck className="size-4" aria-hidden /> Plateforme AfriMenu
          </p>
          <h1 className="font-titre text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Restaurants clients
          </h1>
        </div>
        <DeconnexionButton />
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <CarteStat libelle="Restaurants" valeur={liste.length} detail={`${totalActifs} actifs`} icone={<Building2 className="size-5" aria-hidden />} />
        <CarteStat libelle="Commandes totales" valeur={totalCommandes} />
        <CarteStat libelle="Volume traité" valeur={formatFcfa(totalChiffre)} />
      </div>

      <Carte className="mt-6 overflow-hidden">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {liste.map((restaurant) => (
            <li key={restaurant.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-titre font-bold text-slate-900">{restaurant.nom}</p>
                <p className="text-sm text-slate-500">
                  /m/{restaurant.slug} · inscrit le {formatDate(restaurant.createdAt)} ·{" "}
                  {restaurant.equipe} compte(s) · {restaurant.produits} produit(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge ton={restaurant.plan === "pro" ? "succes" : "neutre"}>
                  {restaurant.plan === "pro" ? "Pro" : "Gratuit"}
                </Badge>
                <Badge ton={restaurant.actif ? "succes" : "danger"}>
                  {restaurant.actif ? "Actif" : "Suspendu"}
                </Badge>
                <span className="text-sm font-semibold text-slate-600">
                  {restaurant.commandes} cmd · {formatFcfa(restaurant.chiffre)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Carte>

      <p className="mt-4 text-sm text-slate-500">
        Les actions d&apos;activation et de suspension seront ajoutées à l&apos;étape 7.
      </p>
    </div>
  );
}
