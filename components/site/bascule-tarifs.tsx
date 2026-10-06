"use client";

/**
 * Grille tarifaire avec bascule Mensuel / Annuel.
 *
 * Première carte : un mois gratuit avec TOUTES les fonctionnalités débloquées
 * (l'ancienne carte « Gratuit · 0 FCFA · pour toujours » a été retirée à la
 * demande du propriétaire). Ensuite le plan Pro à 4 900 FCFA par mois, ou la
 * formule multi-établissements. Sur l'annuel, on paie 10 mois sur 12.
 */
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BoutonPilule } from "@/components/site/bouton-pilule";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { cn, formatFcfa, formatNombre } from "@/lib/utils";

type Offre = {
  nom: string;
  accroche: string;
  mensuel: number;
  annuel: number;
  avantages: string[];
  /**
   * Offres sans prix chiffré (ex. « 1 mois gratuit ») : ces deux champs
   * remplacent l'affichage « 4 900 FCFA / mois ».
   */
  prixTitre?: string;
  prixSuffixe?: string;
  /** Précision affichée sous le prix (remplace la mention par défaut). */
  note?: string;
  populaire?: boolean;
  cta: { libelle: string; href: string };
};

const OFFRES: Offre[] = [
  {
    nom: "1 mois gratuit",
    accroche: "Tout utiliser, sans aucune limite",
    prixTitre: "1 mois",
    prixSuffixe: "gratuit, tout inclus",
    note: "Puis 4 900 FCFA par mois. Sans carte bancaire, sans engagement.",
    mensuel: 0,
    annuel: 0,
    avantages: [
      "Tout le plan Pro débloqué dès l'inscription",
      "Plats, catégories et suppléments illimités",
      "Tables et QR codes illimités",
      "Écran de service temps réel",
      "Paiement Orange, Moov, MTN ou espèces",
      "Statistiques et comptes équipe illimités",
    ],
    cta: { libelle: "Commencer mes 30 jours", href: "/inscription" },
  },
  {
    nom: "Pro",
    accroche: "Le plan des restaurants en activité",
    note: "Après votre mois gratuit. Sans engagement, résiliable à tout moment.",
    mensuel: 4_900,
    annuel: 49_000,
    avantages: [
      "Produits et catégories illimités",
      "Tables et QR codes illimités",
      "Comptes équipe illimités (serveur, cuisine)",
      "Statistiques : plats les plus vendus, chiffre d'affaires",
      "Plat « épuisé » en un clic",
      "Support WhatsApp prioritaire",
    ],
    populaire: true,
    cta: { libelle: "Passer au plan Pro", href: "/inscription" },
  },
  {
    nom: "Multi-établissements",
    accroche: "Chains, franchises et groupes",
    mensuel: 24_900,
    annuel: 249_000,
    avantages: [
      "Jusqu'à 5 établissements",
      "Tableau de bord consolidé",
      "Couleurs et menus par établissement",
      "Export des commandes (CSV / Excel)",
      "Accompagnement à la mise en place",
      "Interlocuteur dédié",
    ],
    cta: { libelle: "Nous contacter", href: "/inscription" },
  },
];

/** Deux mois offerts sur l'annuel : -17 % par rapport au mensuel. */
const REMISE_ANNUELLE = "-17 %";

export function BasculeTarifs() {
  const [annuel, setAnnuel] = useState(false);

  return (
    <div>
      {/* Bascule Mensuel / Annuel */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Période de facturation"
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1"
        >
          {[
            { cle: false, libelle: "Mensuel" },
            { cle: true, libelle: "Annuel" },
          ].map((option) => (
            <button
              key={String(option.cle)}
              type="button"
              role="tab"
              aria-selected={annuel === option.cle}
              onClick={() => setAnnuel(option.cle)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition",
                annuel === option.cle
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {option.libelle}
              {option.cle ? (
                <span className="rounded-full bg-marque-100 px-1.5 py-0.5 text-[10px] font-extrabold text-marque-700">
                  {REMISE_ANNUELLE}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-slate-500">
        <strong className="font-bold text-marque-700">
          Le premier mois est offert, tout est débloqué
        </strong>{" "}
        — sans carte bancaire et sans engagement, résiliable à tout moment.
      </p>

      {/* Cartes */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {OFFRES.map((offre) => {
          const prixAffiche = annuel ? Math.round(offre.annuel / 12) : offre.mensuel;

          return (
            <Carte
              key={offre.nom}
              className={cn(
                "relative flex flex-col p-6",
                offre.populaire
                  ? "border-marque-300 shadow-lg shadow-marque-500/10 ring-2 ring-marque-500/30"
                  : "",
              )}
            >
              {offre.populaire ? (
                <Badge
                  ton="marque"
                  className="absolute -top-3 left-6 shadow-sm"
                  icone={<Sparkles className="size-3.5" aria-hidden />}
                >
                  Le plus choisi
                </Badge>
              ) : null}

              <h3 className="font-titre text-lg font-extrabold text-slate-900">{offre.nom}</h3>
              <p className="mt-1 text-sm text-slate-500">{offre.accroche}</p>

              <p className="mt-5 flex flex-wrap items-baseline gap-1.5">
                {offre.prixTitre ? (
                  <>
                    <span className="font-titre text-4xl font-extrabold tracking-tight text-slate-900">
                      {offre.prixTitre}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      {offre.prixSuffixe}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-titre text-4xl font-extrabold tracking-tight text-slate-900">
                      {/* `formatNombre` et non `formatFcfa(...).replace(" FCFA", "")` :
                          l'espace qui précède la devise est insécable, un simple
                          remplacement sur l'espace ordinaire laissait « 4 900 FCFA »
                          suivi du suffixe, soit un « FCFA FCFA » affiché. */}
                      {formatNombre(prixAffiche)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">FCFA / mois</span>
                  </>
                )}
              </p>
              <p className="mt-1 min-h-10 text-xs text-slate-500">
                {offre.prixTitre
                  ? offre.note
                  : annuel
                    ? `Facturé ${formatFcfa(offre.annuel)} par an, 2 mois offerts`
                    : (offre.note ?? "Sans engagement, résiliable à tout moment")}
              </p>

              <p className="mt-6 text-xs font-bold tracking-wide text-slate-400 uppercase">
                Ce qui est inclus
              </p>
              <ul className="mt-3 flex-1 space-y-2.5">
                {offre.avantages.map((avantage) => (
                  <li key={avantage} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-marque-50 text-marque-600">
                      <Check className="size-2.5" aria-hidden />
                    </span>
                    {avantage}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {offre.populaire ? (
                  <BoutonPilule href={offre.cta.href} variante="marque" className="w-full justify-between">
                    {offre.cta.libelle}
                  </BoutonPilule>
                ) : (
                  <Link
                    href={offre.cta.href}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {offre.cta.libelle}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </Carte>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Tarif de lancement valable pour les 100 premiers restaurants d&apos;Abidjan. Aucune
        commission n&apos;est prélevée sur vos ventes, quel que soit le plan.
      </p>
    </div>
  );
}
