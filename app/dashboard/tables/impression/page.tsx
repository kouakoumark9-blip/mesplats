/**
 * Planche imprimable des QR codes de table (une carte par table).
 *
 * Page volontairement dépouillée : elle est faite pour l'impression papier.
 * 8 cartes par feuille A4 (2 colonnes × 4 rangées), traits de coupe fins,
 * et une barre d'outils masquée à l'impression (`print:hidden`).
 *
 * Pourquoi une page dédiée plutôt qu'un PDF côté client ? Le navigateur imprime
 * en vectoriel : le QR code reste net même sur une imprimante bon marché, et
 * l'utilisateur garde la main sur le format (A4, marges, recto verso).
 */
import { ArrowLeft, Scissors } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BoutonImpression } from "@/components/dashboard/bouton-impression";
import { Bouton } from "@/components/ui/bouton";
import { exigerRole } from "@/lib/auth/autorisation";
import { tablesDuRestaurant } from "@/lib/db/tables";
import { urlMenu } from "@/lib/env";
import { qrSvg } from "@/lib/qr";

export const metadata: Metadata = {
  title: "Planche de QR codes à imprimer",
  robots: { index: false, follow: false },
};

export default async function PageImpressionTables() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;
  const slug = utilisateur.restaurantSlug ?? "";
  const nomRestaurant = utilisateur.restaurantNom ?? "Mon restaurant";

  const tables = await tablesDuRestaurant(restaurantId);
  const urlEmporter = urlMenu({ slug });

  // Le QR « À emporter » ferme la planche : une carte de plus à découper.
  const cartes = await Promise.all(
    [
      ...tables.map((table) => ({ titre: `Table ${table.numero}`, url: urlMenu({ slug }, table.numero) })),
      { titre: "À emporter", url: urlEmporter },
    ].map(async (carte) => ({ ...carte, qrSvg: await qrSvg(carte.url, { marge: 2 }) })),
  );

  return (
    <div className="min-h-dvh bg-slate-100 print:bg-white">
      {/* Barre d'outils — masquée à l'impression */}
      <div className="sans-impression sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-titre text-sm font-extrabold text-slate-900">
              Planche de {cartes.length} carte(s) — A4
            </p>
            <p className="text-xs text-slate-500">
              Imprimez, découpez sur les traits, posez une carte sur chaque table.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/tables">
              <Bouton variante="contour" taille="sm" icone={<ArrowLeft className="size-4" aria-hidden />}>
                Retour aux tables
              </Bouton>
            </Link>
            <BoutonImpression libelle="Imprimer la planche" />
          </div>
        </div>
      </div>

      {/* Feuilles */}
      <div className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:p-0">
        {cartes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Aucune table à imprimer pour l&apos;instant. Créez vos tables depuis l&apos;écran
            « Tables & QR codes ».
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-0 rounded-2xl bg-white p-0 shadow-sm print:rounded-none print:shadow-none">
            {cartes.map((carte, index) => (
              <article
                key={`${carte.titre}-${index}`}
                className="flex break-inside-avoid flex-col items-center border border-dashed border-slate-300 px-4 py-5 text-center"
              >
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  {nomRestaurant}
                </p>
                <p className="mt-1 font-titre text-xl font-extrabold text-slate-900">
                  {carte.titre}
                </p>

                <span
                  role="img"
                  aria-label={`QR code ${carte.titre} du restaurant ${nomRestaurant}`}
                  className="mt-2 block size-40 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: carte.qrSvg }}
                />

                <p className="mt-2 text-[11px] font-semibold text-slate-600">
                  Scannez avec l&apos;appareil photo
                  <br />
                  pour voir le menu et commander
                </p>
                <p className="mt-1 font-mono text-[8px] text-slate-400">
                  {carte.url.replace(/^https?:\/\//, "")}
                </p>
              </article>
            ))}
          </div>
        )}

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400 print:hidden">
          <Scissors className="size-3.5" aria-hidden />
          Conseil : imprimez sur du papier épais (160 g) ou plastifiez les cartes pour qu&apos;elles
          résistent aux éclaboussures et au nettoyage.
        </p>
      </div>
    </div>
  );
}
