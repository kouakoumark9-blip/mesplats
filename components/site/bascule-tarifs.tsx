"use client";

/**
 * Grille tarifaire avec bascule Mensuel / Annuel.
 *
 * Deux formules seulement, toutes deux payantes : Pro à 9 900 FCFA par mois et
 * Multi-établissements à 19 900 FCFA par mois. Ni formule gratuite ni mois
 * offert : on paie directement, par mobile money. Sur l'annuel, on paie
 * 10 mois sur 12 (deux mois offerts).
 */
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BoutonPilule } from "@/components/site/bouton-pilule";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { TARIFS } from "@/lib/constants";
import { cn, formatFcfa, formatNombre } from "@/lib/utils";

type Offre = {
  nom: string;
  accroche: string;
  mensuel: number;
  annuel: number;
  avantages: string[];
  /** Précision affichée sous le prix (remplace la mention par défaut). */
  note?: string;
  populaire?: boolean;
  cta: { libelle: string; href: string };
};

const OFFRES: Offre[] = [
  {
    nom: "Pro",
    accroche: "Un restaurant, tout inclus",
    note: "Paiement par Orange Money, Moov Money ou MTN MoMo. Sans engagement.",
    mensuel: TARIFS.pro,
    annuel: TARIFS.pro * 10,
    avantages: [
      "Produits et catégories illimités",
      "Tables et QR codes illimités",
      "Comptes équipe illimités (serveur, cuisine)",
      "Statistiques : plats les plus vendus, chiffre d'affaires",
      "Plat « épuisé » en un clic",
      "Support WhatsApp prioritaire",
    ],
    populaire: true,
    cta: { libelle: "Choisir la formule Pro", href: "/inscription" },
  },
  {
    nom: "Multi-établissements",
    accroche: "Chains, franchises et groupes",
    mensuel: TARIFS.multi,
    annuel: TARIFS.multi * 10,
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

/** Deux mois offerts sur l'annuel : on paie 10 mois sur 12, soit -17 %. */
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
          Un seul tarif, tout compris, sans commission
        </strong>{" "}
        — payable par Orange Money, Moov Money ou MTN MoMo, résiliable à tout moment.
      </p>

      {/* Cartes */}
      <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
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
                <span className="chiffres font-titre text-4xl font-extrabold tracking-tight text-slate-900">
                  {/* `formatNombre` et non `formatFcfa(...).replace(" FCFA", "")` : l'espace
                      qui précède la devise est insécable, un remplacement sur l'espace
                      ordinaire laissait « 9 900 FCFA » suivi du suffixe, soit « FCFA FCFA ». */}
                  {formatNombre(prixAffiche)}
                </span>
                <span className="text-sm font-semibold text-slate-500">FCFA / mois</span>
              </p>
              <p className="mt-1 min-h-10 text-xs text-slate-500">
                {annuel
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
