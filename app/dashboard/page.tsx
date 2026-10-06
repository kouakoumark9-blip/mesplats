import { sql } from "drizzle-orm";
import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  QrCode,
  Smartphone,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Carte, CarteContenu, CarteEntete, CarteStat } from "@/components/ui/carte";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_PRODUITS } from "@/lib/constants";
import { db } from "@/lib/db";
import { bornesJour, formatFcfa } from "@/lib/utils";

export const metadata: Metadata = { title: "Vue d'ensemble" };

export default async function PageTableauDeBord() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;
  const { debut, fin } = bornesJour();

  const [compteurs] = await db
    .select({
      produits: sql<number>`(select count(*)::int from "products" as p_compteur where p_compteur.restaurant_id = ${restaurantId})`,
      tables: sql<number>`(select count(*)::int from "tables" as t_compteur where t_compteur.restaurant_id = ${restaurantId})`,
      paiements: sql<number>`(select count(*)::int from "payment_methods" as m_compteur where m_compteur.restaurant_id = ${restaurantId} and m_compteur.actif)`,
      equipe: sql<number>`(select count(*)::int from "users" as u_compteur where u_compteur.restaurant_id = ${restaurantId})`,
      categories: sql<number>`(select count(*)::int from "categories" as c_compteur where c_compteur.restaurant_id = ${restaurantId})`,
      commandesJour: sql<number>`(
        select count(*)::int from "orders" as o_jour
        where o_jour.restaurant_id = ${restaurantId}
          and o_jour.created_at >= ${debut.toISOString()}
          and o_jour.created_at < ${fin.toISOString()}
          and o_jour.statut <> 'annulee'
      )`,
      aTraiter: sql<number>`(
        select count(*)::int from "orders" as o_attente
        where o_attente.restaurant_id = ${restaurantId}
          and o_attente.statut in ('nouvelle', 'acceptee', 'en_preparation')
      )`,
      chiffreJour: sql<number>`(
        select coalesce(sum(o_jour.total), 0)::int from "orders" as o_jour
        where o_jour.restaurant_id = ${restaurantId}
          and o_jour.created_at >= ${debut.toISOString()}
          and o_jour.created_at < ${fin.toISOString()}
          and o_jour.statut <> 'annulee'
      )`,
    })
    .from(sql`(select 1) as compteurs_ancre`);

  const limite = LIMITE_PRODUITS[utilisateur.plan];

  /*
   * Liste de mise en route : elle indique au restaurateur ce qu'il reste à
   * faire pour être opérationnel. Chaque étape pointe vers l'écran concerné.
   */
  const etapes = [
    {
      titre: "Compléter le profil du restaurant",
      detail: "Nom, adresse, horaires, téléphone et couleur de marque.",
      fait: Boolean(utilisateur.telephoneRestaurant),
      href: "/dashboard/parametres",
      action: "Ouvrir les paramètres",
    },
    {
      titre: "Créer votre menu",
      detail:
        `${compteurs.categories} ${compteurs.categories > 1 ? "catégories" : "catégorie"} · ` +
        `${compteurs.produits} ${compteurs.produits > 1 ? "plats" : "plat"}` +
        (limite !== null ? ` sur ${limite} avec votre formule actuelle.` : " (formule Pro : illimité)."),
      fait: compteurs.produits > 0 && compteurs.categories > 0,
      href: "/dashboard/menu",
      action: "Gérer le menu",
    },
    {
      titre: "Ajouter vos moyens de paiement",
      detail: `${compteurs.paiements} ${
        compteurs.paiements > 1 ? "numéros" : "numéro"
      } mobile money ${compteurs.paiements > 1 ? "actifs" : "actif"}.`,
      fait: compteurs.paiements > 0,
      href: "/dashboard/parametres#paiements",
      action: "Renseigner les numéros",
    },
    {
      titre: "Créer vos tables et imprimer les QR codes",
      detail: `${compteurs.tables} ${compteurs.tables > 1 ? "tables" : "table"} ${
        compteurs.tables > 1 ? "enregistrées" : "enregistrée"
      }.`,
      fait: compteurs.tables > 0,
      href: "/dashboard/tables",
      action: "Gérer les tables",
    },
  ] satisfies {
    titre: string;
    detail: string;
    fait: boolean;
    href: string;
    action: string;
  }[];

  const restantes = etapes.filter((etape) => !etape.fait).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
          Bonjour {utilisateur.nom.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Voici l&apos;état de {utilisateur.restaurantNom} aujourd&apos;hui.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat
          libelle="Chiffre d'affaires du jour"
          valeur={formatFcfa(compteurs.chiffreJour, utilisateur.devise)}
          detail="Commandes non annulées"
          icone={<TrendingUp className="size-5" aria-hidden />}
        />
        <CarteStat
          libelle="Commandes du jour"
          valeur={compteurs.commandesJour}
          detail="Depuis minuit"
          icone={<ClipboardList className="size-5" aria-hidden />}
        />
        <CarteStat
          libelle="À traiter maintenant"
          valeur={compteurs.aTraiter}
          detail="Nouvelles, acceptées ou en préparation"
          icone={<UtensilsCrossed className="size-5" aria-hidden />}
        />
        <CarteStat
          libelle="Plats au menu"
          valeur={
            <>
              {compteurs.produits}
              {limite !== null ? (
                <span className="text-base font-bold text-slate-400"> / {limite}</span>
              ) : null}
            </>
          }
          detail={limite === null ? "Formule Pro : illimité" : "Formule à activer"}
          icone={<Smartphone className="size-5" aria-hidden />}
        />
      </div>

      {restantes > 0 ? (
        <Carte>
          <CarteEntete
            titre="Mise en route"
            description={
              `${restantes} ${restantes > 1 ? "étapes restantes" : "étape restante"} ` +
              "pour être totalement opérationnel."
            }
            icone={<CircleDashed className="size-4" aria-hidden />}
            action={<Badge ton="alerte">{etapes.length - restantes}/{etapes.length}</Badge>}
          />
          <CarteContenu className="space-y-3">
            {etapes.map((etape) => (
              <div
                key={etape.titre}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {etape.fait ? (
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-feuille-600" aria-hidden />
                  ) : (
                    <CircleDashed className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p
                      className={
                        etape.fait
                          ? "font-semibold text-slate-500 line-through dark:text-slate-400"
                          : "font-semibold text-slate-800 dark:text-slate-100"
                      }
                    >
                      {etape.titre}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{etape.detail}</p>
                  </div>
                </div>
                {!etape.fait ? (
                  <Link
                    href={etape.href}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {etape.action}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                ) : null}
              </div>
            ))}
          </CarteContenu>
        </Carte>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Carte>
          <CarteEntete
            titre="Écran de service"
            description="La salle et la cuisine suivent les commandes en temps réel."
            icone={<ClipboardList className="size-4" aria-hidden />}
          />
          <CarteContenu className="flex flex-wrap items-center gap-3">
            <Badge ton={compteurs.aTraiter > 0 ? "alerte" : "neutre"}>
              {compteurs.aTraiter} {compteurs.aTraiter > 1 ? "commandes" : "commande"} à traiter
            </Badge>
            <Link
              href="/service"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-marque-600 hover:underline"
            >
              Ouvrir l&apos;écran de service
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CarteContenu>
        </Carte>

        <Carte>
          <CarteEntete
            titre="Mes QR codes"
            description="Un QR par table et un QR « À emporter » pour la vitrine."
            icone={<QrCode className="size-4" aria-hidden />}
          />
          <CarteContenu className="flex flex-wrap items-center gap-3">
            <Badge ton="neutre">
              {compteurs.tables} {compteurs.tables > 1 ? "tables" : "table"}
            </Badge>
            <Link
              href="/dashboard/tables"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-marque-600 hover:underline"
            >
              Générer mes QR codes
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CarteContenu>
        </Carte>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        Établissement : {utilisateur.restaurantSlug} · {compteurs.equipe}{" "}
        {compteurs.equipe > 1 ? "comptes d'équipe" : "compte d'équipe"} · Commission Mesplats : 0
        %.
      </p>
    </div>
  );
}
