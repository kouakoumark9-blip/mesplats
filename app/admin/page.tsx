/**
 * Console plateforme — /admin (super-admin Mesplats uniquement).
 *
 * Trois usages :
 *  • chiffres globaux (établissements, commandes, volume encaissé) ;
 *  • suivi de chaque restaurant client : activation, suspension, formule ;
 *  • dernières commandes, pour le support (un restaurateur appelle parce qu'il
 *    ne voit pas une commande : on la retrouve ici en deux secondes).
 *
 * Les actions sont des Server Actions réservées au rôle `superadmin`
 * (`lib/actions/plateforme.ts`).
 */
import { Building2, CheckCircle2, Clock, Package, Receipt, ShieldCheck, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { TableauPlateforme } from "@/components/admin/tableau-plateforme";
import { DeconnexionButton } from "@/components/auth/deconnexion-button";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteEntete, CarteStat } from "@/components/ui/carte";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIBELLES_STATUT, LIBELLES_STATUT_BOUTIQUE } from "@/lib/constants";
import { chiffresBoutiquePlateforme, dernieresCommandesBoutique } from "@/lib/db/boutique";
import {
  chiffresPlateforme,
  dernieresCommandesPlateforme,
  restaurantsPlateforme,
} from "@/lib/db/plateforme";
import { formatDateHeure, formatFcfa } from "@/lib/utils";

export const metadata: Metadata = { title: "Plateforme", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PageAdmin() {
  const utilisateur = await exigerRole("superadmin");

  const [chiffres, restaurants, commandes, boutique, commandesBoutique] = await Promise.all([
    chiffresPlateforme(),
    restaurantsPlateforme(),
    dernieresCommandesPlateforme(10),
    chiffresBoutiquePlateforme(),
    dernieresCommandesBoutique(6),
  ]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-marque-600">
              <ShieldCheck className="size-4" aria-hidden />
              Plateforme Mesplats
            </p>
            <h1 className="font-titre text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
              Restaurants clients
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Connecté en tant que {utilisateur.nom}
            </p>
          </div>
          <DeconnexionButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CarteStat
            libelle="Établissements"
            valeur={chiffres.restaurants}
            detail={`${chiffres.actifs} actifs · ${chiffres.aActiver} à activer`}
            icone={<Building2 className="size-5" aria-hidden />}
          />
          <CarteStat
            libelle="Abonnements Pro"
            valeur={chiffres.pro}
            detail="Facturation 19 900 FCFA / mois"
            icone={<CheckCircle2 className="size-5" aria-hidden />}
          />
          <CarteStat
            libelle="Commandes"
            valeur={chiffres.commandes}
            detail={`${chiffres.commandes30j} sur 30 jours`}
            icone={<Receipt className="size-5" aria-hidden />}
          />
          <CarteStat
            libelle="Volume encaissé"
            valeur={formatFcfa(chiffres.volumeEncaisse)}
            detail="Paiements validés par les restaurants"
            icone={<TrendingUp className="size-5" aria-hidden />}
          />
          <CarteStat
            libelle="Supports imprimés"
            valeur={boutique.commandes}
            detail={`${boutique.nouvelles} à confirmer · ${formatFcfa(boutique.montant)} commandés`}
            icone={<Package className="size-5" aria-hidden />}
          />
        </div>

        <section>
          <h2 className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
            Établissements
          </h2>
          <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">
            Activez, suspendez ou changez la formule d&apos;un restaurant. La suspension coupe
            immédiatement la carte publique et l&apos;accès de l&apos;équipe.
          </p>
          <TableauPlateforme restaurants={restaurants} />
        </section>

        <Carte>
          <CarteEntete
            titre="Boutique : derniers tirages commandés"
            description="Supports imprimés demandés par les restaurants (chevalets, stickers, packs). Le devis est confirmé par WhatsApp avant impression."
            icone={<Package className="size-5" aria-hidden />}
          />
          {commandesBoutique.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
              Aucune commande de supports imprimés pour le moment. La boutique est accessible depuis
              l&apos;espace restaurateur, entrée « Boutique ».
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {commandesBoutique.map((commande) => (
                <li
                  key={commande.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {commande.reference} · {commande.restaurant}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateHeure(commande.createdAt)} · {commande.ville} ·{" "}
                      {commande.articles
                        .map((article) => `${article.quantite} × ${article.nom}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      ton={
                        commande.statut === "annulee"
                          ? "danger"
                          : commande.statut === "nouvelle"
                            ? "alerte"
                            : "succes"
                      }
                    >
                      {LIBELLES_STATUT_BOUTIQUE[commande.statut]}
                    </Badge>
                    <span className="chiffres font-semibold text-slate-700 dark:text-slate-200">
                      {formatFcfa(commande.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte>
          <CarteEntete
            titre="Dernières commandes de la plateforme"
            description="Utile pour le support : vérifier qu'une commande est bien arrivée côté restaurant."
            icone={<Clock className="size-5" aria-hidden />}
          />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {commandes.map((commande) => (
              <li
                key={commande.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    n° {commande.numero} · {commande.restaurant}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateHeure(commande.createdAt)} · /m/{commande.restaurantSlug}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    ton={
                      commande.statut === "annulee"
                        ? "danger"
                        : commande.statut === "servie"
                          ? "neutre"
                          : "alerte"
                    }
                  >
                    {LIBELLES_STATUT[commande.statut]}
                  </Badge>
                  <span className="chiffres font-semibold text-slate-700 dark:text-slate-200">
                    {formatFcfa(commande.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Carte>
      </main>
    </div>
  );
}
