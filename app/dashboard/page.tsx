import { sql } from "drizzle-orm";
import { ClipboardList, Package, QrCode, TrendingUp, Users, Utensils } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeconnexionButton } from "@/components/auth/deconnexion-button";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteStat } from "@/components/ui/carte";
import { Alerte } from "@/components/ui/divers";
import { exigerRole } from "@/lib/auth/autorisation";
import { db } from "@/lib/db";

import { bornesJour, formatFcfa } from "@/lib/utils";

export const metadata: Metadata = { title: "Vue d'ensemble" };

/**
 * ÉTAPE 1 — page de vérification.
 * Elle confirme que l'inscription, la connexion et le cloisonnement par
 * restaurant fonctionnent. Les statistiques complètes arrivent à l'étape 7.
 */
export default async function PageTableauDeBord() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;
  const { debut, fin } = bornesJour();

  const [compteurs] = await db
    .select({
      produits: sql<number>`(select count(*)::int from "products" as p_compteur where p_compteur.restaurant_id = ${restaurantId})`,
      tables: sql<number>`(select count(*)::int from "tables" as t_compteur where t_compteur.restaurant_id = ${restaurantId})`,
      equipe: sql<number>`(select count(*)::int from "users" as u_compteur where u_compteur.restaurant_id = ${restaurantId})`,
      commandesJour: sql<number>`(
        select count(*)::int from "orders" as o_jour
        where o_jour.restaurant_id = ${restaurantId}
          and o_jour.created_at >= ${debut.toISOString()}
          and o_jour.created_at < ${fin.toISOString()}
          and o_jour.statut <> 'annulee'
      )`,
      chiffreJour: sql<number>`(
        select coalesce(sum(o_jour.total), 0)::int from "orders" as o_jour
        where o_jour.restaurant_id = ${restaurantId}
          and o_jour.created_at >= ${debut.toISOString()}
          and o_jour.created_at < ${fin.toISOString()}
          and o_jour.statut <> 'annulee'
      )`,
      nouvelles: sql<number>`(select count(*)::int from "orders" as o_attente where o_attente.restaurant_id = ${restaurantId} and o_attente.statut = 'nouvelle')`,
    })
    .from(sql`(select 1) as unite`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-marque-600">Back-office</p>
          <h1 className="font-titre text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Bonjour {utilisateur.nom.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-slate-600">
            {utilisateur.restaurantNom} ·{" "}
            <Link href={`/m/${utilisateur.restaurantSlug}`} className="font-semibold text-marque-600 hover:underline">
              /m/{utilisateur.restaurantSlug}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge ton={utilisateur.plan === "pro" ? "succes" : "neutre"}>
            Plan {utilisateur.plan === "pro" ? "Pro" : "Gratuit"}
          </Badge>
          <DeconnexionButton />
        </div>
      </header>

      <Alerte ton="info" className="mt-6" icone={<Utensils className="size-4" aria-hidden />}>
        <strong>Étape 1 terminée</strong> — base de données, seed et authentification opérationnels.
        L&apos;étape 2 ajoutera la gestion du profil, des catégories et des produits.
      </Alerte>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStat
          libelle="Commandes du jour"
          valeur={compteurs.commandesJour}
          icone={<ClipboardList className="size-5" aria-hidden />}
          detail={`${compteurs.nouvelles} en attente de traitement`}
        />
        <CarteStat
          libelle="Chiffre d'affaires du jour"
          valeur={formatFcfa(compteurs.chiffreJour, utilisateur.devise)}
          icone={<TrendingUp className="size-5" aria-hidden />}
          detail="Hors commandes annulées"
        />
        <CarteStat
          libelle="Produits au menu"
          valeur={compteurs.produits}
          icone={<Package className="size-5" aria-hidden />}
          detail={utilisateur.plan === "gratuit" ? "Limite du plan gratuit : 20" : "Plan Pro : illimité"}
        />
        <CarteStat
          libelle="Tables & équipe"
          valeur={`${compteurs.tables} / ${compteurs.equipe}`}
          icone={<QrCode className="size-5" aria-hidden />}
          detail="Tables QR · comptes employés"
        />
      </div>

      <Carte className="mt-6 p-5">
        <h2 className="font-titre text-lg font-bold text-slate-900">Prochaines étapes de construction</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            <strong className="text-slate-800">Étape 2</strong> — /dashboard/parametres (profil) et
            /dashboard/menu (catégories, produits, options, épuisé/disponible)
          </li>
          <li>
            <strong className="text-slate-800">Étape 3</strong> — /dashboard/tables : création en lot,
            QR codes PNG et planche PDF imprimable
          </li>
          <li>
            <strong className="text-slate-800">Étape 4</strong> — /m/[slug] : menu public, panier,
            commande et paiement mobile money
          </li>
          <li>
            <strong className="text-slate-800">Étape 5</strong> — /service : écran temps réel, statuts,
            alertes sonores
          </li>
          <li>
            <strong className="text-slate-800">Étape 6</strong> — suivi client, WhatsApp/SMS, appel
            serveur
          </li>
          <li>
            <strong className="text-slate-800">Étape 7</strong> — statistiques, équipe, super-admin, PWA
          </li>
        </ul>
      </Carte>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/service" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-white">
          Ouvrir l&apos;écran de service
        </Link>
        <Link href="/mon-compte" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-white">
          Mon compte
        </Link>
        <Link
          href="/m/maquis-le-baoule"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-white"
        >
          <Users className="size-4" aria-hidden />
          Voir le menu de démonstration
        </Link>
      </div>
    </div>
  );
}
