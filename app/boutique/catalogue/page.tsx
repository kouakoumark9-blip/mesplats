/**
 * Catalogue imprimable de la Boutique — /boutique/catalogue
 * ---------------------------------------------------------------------------
 * Une page publique, mise en page pour l'impression A4 : c'est le document à
 * remettre ou à envoyer à un restaurateur (ou à montrer à un prospect) pour
 * présenter les supports imprimés, leurs prix dégressifs et les options.
 *
 * Le visiteur peut l'imprimer ou l'enregistrer en PDF depuis son navigateur ;
 * le bouton d'impression disparaît à l'impression (classe `print:hidden`).
 */
import { ArrowLeft, BadgeCheck, Globe, Package, Printer, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BoutonImpression } from "@/components/dashboard/bouton-impression";
import { LogoMesplats } from "@/components/site/logo";
import { QrCodeInline } from "@/components/site/qr-code";
import { CATALOGUE_BOUTIQUE } from "@/lib/boutique";
import { appUrl } from "@/lib/env";
import { svgQrAvance } from "@/lib/qr-styles";
import { formatFcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Catalogue Boutique — supports imprimés",
  description:
    "Catalogue des supports imprimés Mesplats : chevalets, stickers, sous-bocks, sets de table, affiches et packs, avec leurs prix en FCFA.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function PageCatalogue() {
  const urlBoutique = `${appUrl()}/boutique`;
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-dvh bg-slate-100 print:bg-white">
      {/* Barre d'outils : jamais imprimée */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/boutique"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à la boutique
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Feuille A4 · imprimable depuis le navigateur
            </span>
            <BoutonImpression libelle="Imprimer / Enregistrer en PDF" />
          </div>
        </div>
      </div>

      {/* Feuille */}
      <main className="mx-auto max-w-4xl bg-white px-6 py-10 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none sm:px-10">
        {/* --------------------------------- En-tête --------------------------------- */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
          <div>
            <LogoMesplats />
            <h1 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-slate-900">
              Catalogue Boutique
            </h1>
            <p className="mt-1 text-sm font-semibold text-marque-600">
              Supports imprimés pour votre menu QR
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold tracking-wide text-slate-700 uppercase">Édition du {date}</p>
            <p className="mt-1">Prix en francs CFA, TVA incluse</p>
            <p>Impression et livraison Abidjan comprises</p>
            <p className="mt-1 font-semibold text-slate-700">support@mesplats.app</p>
          </div>
        </header>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Vos clients scannent, votre équipe reçoit la commande. Encore faut-il que le QR code soit
          visible et solide : nous imprimons vos QR codes sur des supports pensés pour la
          restauration ouest-africaine — chevalets de table, stickers de vitrine, sous-bocks, sets de
          table et affiches. Chaque support reprend <strong>votre</strong> style, votre couleur et
          votre logo, tels que configurés dans votre espace Mesplats.
        </p>

        {/* --------------------------------- Supports --------------------------------- */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CATALOGUE_BOUTIQUE.map((article) => (
            <article
              key={article.id}
              className="break-inside-avoid overflow-hidden rounded-2xl border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.photo}
                alt={article.nom}
                className="h-40 w-full object-cover"
                loading="lazy"
              />

              <div className="p-4">
                <p className="text-[11px] font-bold tracking-wide text-marque-600 uppercase">
                  {article.accroche}
                </p>
                <h2 className="mt-0.5 font-titre text-base font-extrabold text-slate-900">
                  {article.nom}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {article.description}
                </p>

                <ul className="mt-2 space-y-0.5">
                  {article.specifications.slice(0, 3).map((specification) => (
                    <li key={specification} className="flex gap-1.5 text-[11px] text-slate-500">
                      <span className="text-marque-500">•</span>
                      {specification}
                    </li>
                  ))}
                </ul>

                {/* Prix et paliers */}
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                  <p className="chiffres">
                    <span className="font-titre text-lg font-extrabold text-slate-900">
                      {formatFcfa(article.prixUnitaire)}
                    </span>
                    <span className="ml-1 text-[11px] font-semibold text-slate-500">
                      / unité · minimum {article.minimum} ex.
                    </span>
                  </p>
                  {article.paliers.length > 1 ? (
                    <p className="chiffres mt-0.5 text-[11px] text-slate-600">
                      {article.paliers
                        .map(
                          (palier) =>
                            `dès ${palier.aPartirDe} ex. : ${formatFcfa(palier.prixUnitaire)}`,
                        )
                        .join("  ·  ")}
                    </p>
                  ) : null}
                </div>

                {article.options.length > 0 ? (
                  <p className="mt-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Options :</span>{" "}
                    {article.options
                      .map((option) => `${option.nom} (+${formatFcfa(option.prix)}/unité)`)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {/* ------------------------------ Comment commander ------------------------------ */}
        <section className="mt-8 grid gap-5 border-t-2 border-slate-900 pt-5 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-titre text-lg font-extrabold text-slate-900">Comment commander ?</h2>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li>
                <span className="font-bold text-slate-800">1.</span> Composez votre tirage sur{" "}
                <Link href="/boutique" className="font-semibold text-marque-600 underline">
                  mesplats.app/boutique
                </Link>{" "}
                : quantité, options, aperçu du prix dégressif.
              </li>
              <li>
                <span className="font-bold text-slate-800">2.</span> Créez votre compte (2 minutes) et
                envoyez la demande depuis votre espace : un devis vous est confirmé sur WhatsApp.
              </li>
              <li>
                <span className="font-bold text-slate-800">3.</span> Nous imprimons, nous testons les
                QR codes au scan, puis nous livrons à Abidjan sous 72 h.
              </li>
            </ol>

            <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5">
                <Truck className="size-3.5 text-marque-500" aria-hidden />
                Livraison Abidjan sous 72 h
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5">
                <Package className="size-3.5 text-marque-500" aria-hidden />
                Expédition province sur devis
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5">
                <BadgeCheck className="size-3.5 text-marque-500" aria-hidden />
                Remplacement gratuit si défaut d&apos;impression
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 p-4 text-center">
            <QrCodeInline
              svg={svgQrAvance({
                texte: urlBoutique,
                style: "classique",
                fonce: "#0f172a",
                clair: "#ffffff",
              })}
              label={`QR code vers la boutique : ${urlBoutique}`}
              taille={132}
            />
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <Globe className="size-3.5 text-marque-500" aria-hidden />
              Scannez pour voir la boutique
            </p>
            <p className="text-[10px] text-slate-400">{urlBoutique}</p>
          </div>
        </section>

        <footer className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Printer className="size-3.5" aria-hidden />
            Mesplats — Abidjan, Côte d&apos;Ivoire · support@mesplats.app
          </span>
          <span>Tarifs susceptibles d&apos;évoluer · devis ferme confirmé avant impression</span>
        </footer>
      </main>
    </div>
  );
}
