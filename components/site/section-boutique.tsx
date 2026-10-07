/**
 * Section « Boutique » de la page d'accueil.
 * ---------------------------------------------------------------------------
 * Elle sert à MONTRER les supports imprimés (chevalets, stickers, sous-bocks…)
 * et à envoyer le visiteur vers la vitrine complète `/boutique`, où il peut
 * composer son tirage. Les prix affichés viennent du catalogue
 * (`lib/boutique.ts`) : une seule source de vérité pour tout le site.
 */
import { ArrowRight, Package, Printer, Store, Truck } from "lucide-react";
import Link from "next/link";

import { BoutonPilule } from "@/components/site/bouton-pilule";
import { Reveler } from "@/components/site/reveler";
import { TitreSouligne } from "@/components/site/titre-souligne";
import { Badge } from "@/components/ui/badge";
import { CATALOGUE_BOUTIQUE } from "@/lib/boutique";
import { formatFcfa } from "@/lib/utils";

/** Trois supports mis en avant sur l'accueil (la vitrine les affiche tous). */
const MIS_EN_AVANT = ["chevalet-plexiglas", "stickers-ronds", "pack-maquis"];

const ATOUTS = [
  { icone: <Printer className="size-3.5" aria-hidden />, texte: "Votre QR code imprimé dessus" },
  { icone: <Truck className="size-3.5" aria-hidden />, texte: "Livraison Abidjan sous 72 h" },
  { icone: <Package className="size-3.5" aria-hidden />, texte: "Prix dégressifs selon le tirage" },
];

export function SectionBoutique() {
  const articles = MIS_EN_AVANT.map((id) =>
    CATALOGUE_BOUTIQUE.find((article) => article.id === id),
  ).filter((article): article is (typeof CATALOGUE_BOUTIQUE)[number] => Boolean(article));

  return (
    <section id="boutique" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveler className="mx-auto max-w-3xl text-center">
          <Badge ton="marque" icone={<Store className="size-3.5" aria-hidden />}>
            Boutique
          </Badge>
          <div className="mt-4">
            <TitreSouligne avant="Des supports qui portent" accent="vos QR codes" />
          </div>
          <p className="mt-5 text-lg text-slate-600">
            Chevalets de table, stickers autocollants, sous-bocks, sets de table, affiches : nous
            imprimons vos QR codes sur des supports qui tiennent dans le temps, et nous vous les
            livrons prêts à poser.
          </p>
        </Reveler>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Reveler key={article.id} delai={index * 90}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.photo}
                  alt={article.nom}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <Badge ton="neutre" className="self-start">
                    {article.accroche}
                  </Badge>
                  <h3 className="font-titre text-lg font-extrabold text-slate-900">{article.nom}</h3>
                  <p className="text-sm text-slate-600">{article.description}</p>

                  <p className="chiffres mt-auto pt-3">
                    <span className="font-titre text-xl font-extrabold text-slate-900">
                      {formatFcfa(article.prixUnitaire)}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-slate-500">/ unité</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      dès {article.minimum} ex.
                      {article.paliers.length > 1
                        ? ` · ${formatFcfa(article.paliers[article.paliers.length - 1].prixUnitaire)} dès ${
                            article.paliers[article.paliers.length - 1].aPartirDe
                          } ex.`
                        : ""}
                    </span>
                  </p>

                  <Link
                    href="/boutique"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-marque-600 hover:underline"
                  >
                    Composer mon tirage
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            </Reveler>
          ))}
        </div>

        <Reveler className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {ATOUTS.map((atout) => (
            <span
              key={atout.texte}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <span className="text-marque-600">{atout.icone}</span>
              {atout.texte}
            </span>
          ))}
          <BoutonPilule href="/boutique">Voir les 6 supports</BoutonPilule>
        </Reveler>
      </div>
    </section>
  );
}
