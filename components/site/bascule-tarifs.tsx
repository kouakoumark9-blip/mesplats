"use client";

/**
 * Grille tarifaire avec bascule Mensuel / Annuel.
 *
 * Le plan Pro est offert le premier mois, puis facturé 4 900 FCFA par mois.
 * Sur l'annuel, on paie 10 mois sur 12 (deux mois offerts). Prix en FCFA.
 */
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BoutonPilule } from "@/components/site/bouton-pilule";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { cn, formatFcfa } from "@/lib/utils";

type Offre = {
  nom: string;
  accroche: string;
  mensuel: number;
  annuel: number;
  avantages: string[];
  absent?: string[];
  /** Précision affichée sous le prix (remplace la mention par défaut). */
  note?: string;
  populaire?: boolean;
  cta: { libelle: string; href: string };
};

const OFFRES: Offre[] = [
  {
    nom: "Gratuit",
    accroche: "Pour démarrer sans risque",
    mensuel: 0,
    annuel: 0,
    avantages: [
      "20 produits au menu",
      "5 tables avec QR code",
      "Commandes illimitées",
      "Écran de service temps réel",
      "Paiement Orange, Moov, MTN ou espèces",
      "1 compte équipe",
    ],
    absent: ["Statistiques avancées", "Support WhatsApp prioritaire"],
    cta: { libelle: "Commencer gratuitement", href: "/inscription" },
  },
  {
    nom: "Pro",
    accroche: "Le plan des restaurants en activité",
    note: "1er mois offert, puis 4 900 FCFA par mois. Sans engagement.",
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
    cta: { libelle: "Commencer mes 30 jours offerts", href: "/inscription" },
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
        <strong className="font-bold text-marque-700">Le premier mois est offert</strong> — sans
        carte bancaire et sans engagement, résiliable à tout moment.
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

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-titre text-4xl font-extrabold tracking-tight text-slate-900">
                  {offre.mensuel === 0 ? "0" : formatFcfa(prixAffiche).replace(" FCFA", "")}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  FCFA{offre.mensuel === 0 ? "" : " / mois"}
                </span>
              </p>
              <p className="mt-1 min-h-10 text-xs text-slate-500">
                {offre.mensuel === 0
                  ? "Gratuit pour toujours"
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
                {offre.absent?.map((element) => (
                  <li key={element} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <X className="size-2.5" aria-hidden />
                    </span>
                    {element}
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
