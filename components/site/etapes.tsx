/**
 * Section « Votre menu en 3 étapes » de la page d'accueil.
 *
 * Elle répond à la question que se pose un restaurateur avant de s'inscrire :
 * « concrètement, je fais quoi et dans quel ordre ? ». Les trois étapes suivent
 * exactement le parcours réel de l'application : créer la carte, imprimer les
 * QR codes, recevoir les commandes.
 */
import { ArrowRight, HandPlatter, QrCode, Sparkles, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BoutonPilule } from "@/components/site/bouton-pilule";
import {
  MaquetteCommandeRecue,
  MaquetteCreation,
  MaquetteQrImprimes,
} from "@/components/site/maquettes-etapes";
import { Reveler } from "@/components/site/reveler";
import { TitreSouligne } from "@/components/site/titre-souligne";

type Etape = {
  numero: string;
  titre: string;
  texte: string;
  icone: ReactNode;
  maquette: ReactNode;
  exemple: string;
};

function construireEtapes(qrSvgParTable: Record<string, string>): Etape[] {
  return [
  {
    numero: "1",
    titre: "Créez votre menu",
    texte:
      "Ajoutez vos catégories, vos plats, leurs prix en FCFA et leurs photos. Deux minutes suffisent, depuis votre téléphone ou l'ordinateur du comptoir, sans compétence technique.",
    icone: <UtensilsCrossed className="size-5" aria-hidden />,
    maquette: <MaquetteCreation />,
    exemple: "Plats ivoiriens · Grillades · Boissons",
  },
  {
    numero: "2",
    titre: "Imprimez vos QR codes",
    texte:
      "Chaque table reçoit son propre QR code, plus un QR « À emporter » pour la vitrine ou le comptoir. Exportez-les en PNG, ou en planche PDF A4 prête à photocopier.",
    icone: <QrCode className="size-5" aria-hidden />,
    maquette: <MaquetteQrImprimes qrSvgParTable={qrSvgParTable} />,
    exemple: "Table 4 · Table 5 · À emporter",
  },
  {
    numero: "3",
    titre: "Recevez les commandes",
    texte:
      "Le client scanne, choisit et paie en mobile money. La salle et la cuisine voient la commande arriver en temps réel, et vous suivez le chiffre du jour sans tableau à remplir.",
    icone: <HandPlatter className="size-5" aria-hidden />,
    maquette: <MaquetteCommandeRecue />,
    exemple: "N° 14 · Table 4 · 6 000 FCFA · Prête",
  },
  ];
}

/**
 * Section des trois étapes.
 *
 * `qrSvg` est un véritable QR code (généré côté serveur) : la vignette de
 * l'étape 2 reste scannable, comme les QR codes de la section « QR codes ».
 */
export function Etapes({ qrSvgParTable }: { qrSvgParTable: Record<string, string> }) {
  const etapes = construireEtapes(qrSvgParTable);

  return (
    <section id="etapes" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveler className="mx-auto max-w-3xl text-center">
          <TitreSouligne avant="Votre menu en ligne en" accent="3 étapes" />
          <p className="mt-5 text-lg text-slate-600">
            Pas de matériel à acheter, pas d&apos;application à installer : tout se fait dans le
            navigateur, et vos clients n&apos;ont qu&apos;un QR code à scanner.
          </p>
        </Reveler>

        <div className="relative mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Trait pointillé qui relie les trois étapes (ordinateur uniquement) */}
          <div
            aria-hidden
            className="absolute top-6 right-12 left-12 hidden border-t-2 border-dashed border-marque-200 lg:block"
          />

          {etapes.map((etape, index) => (
            <Reveler key={etape.numero} delai={index * 110}>
              <div className="group relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 pt-10 shadow-sm transition hover:-translate-y-1 hover:border-marque-200 hover:shadow-lg">
                <span
                  className="absolute -top-5 left-6 flex size-12 items-center justify-center rounded-2xl bg-marque-500 font-titre text-xl font-extrabold text-white shadow-lg shadow-marque-500/25 ring-4 ring-white"
                  aria-hidden
                >
                  {etape.numero}
                </span>

                <span className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-marque-600 uppercase">
                  Étape {etape.numero}
                </span>

                <h3 className="mt-2 flex items-center gap-2 font-titre text-xl font-extrabold text-slate-900">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-marque-50 text-marque-600">
                    {etape.icone}
                  </span>
                  {etape.titre}
                </h3>

                <p className="mt-3 text-slate-600">{etape.texte}</p>

                <div className="mt-4 flex-1">{etape.maquette}</div>

                <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <Sparkles className="size-3.5 shrink-0 text-marque-500" aria-hidden />
                  {etape.exemple}
                </p>
              </div>
            </Reveler>
          ))}
        </div>

        <Reveler delai={140} className="mt-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <BoutonPilule href="/inscription" variante="marque" taille="lg">
                Créer mon menu
              </BoutonPilule>
              <Link
                href="/m/maquis-le-baoule"
                className="inline-flex h-[3.25rem] items-center gap-2 rounded-full border border-slate-300 bg-white px-6 font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Voir un menu de démonstration
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              9 900 FCFA / mois · sans commission sur vos ventes · résiliable à tout moment
            </p>
          </div>
        </Reveler>
      </div>
    </section>
  );
}
