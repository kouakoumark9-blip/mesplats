/**
 * Lien de table : /m/[slug]/t/[numero]
 *
 * ⚠️ ÉTAPE 4 : le numéro de table sera pré-rempli et la commande se fera en
 * mode « sur place ». Cette version vérifie déjà que la table existe bien
 * (protection contre les QR codes erronés ou scannés sur un autre établissement).
 */
import { ArrowLeft, CheckCircle2, Info, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { classesBouton } from "@/components/ui/bouton";
import { Alerte } from "@/components/ui/divers";
import { contrasteSur, formatFcfa } from "@/lib/utils";
import { menuPublic, restaurantParSlug, tableParNumero } from "@/lib/db/public";

type Proprietes = { params: Promise<{ slug: string; numero: string }> };

export async function generateMetadata({ params }: Proprietes): Promise<Metadata> {
  const { slug, numero } = await params;
  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) return { title: "Menu introuvable" };

  return {
    title: `${restaurant.nom} — Table ${numero}`,
    description: `Menu de ${restaurant.nom} pour la table ${numero}. Commandez sur place depuis votre téléphone, sans application.`,
    robots: { index: false },
  };
}

export default async function PageMenuTable({ params }: Proprietes) {
  const { slug, numero } = await params;

  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) notFound();

  const table = await tableParNumero(restaurant.id, numero);
  if (!table) notFound();

  const menu = await menuPublic(restaurant.id);
  const surCouleur = contrasteSur(restaurant.couleurPrincipale);
  const nombrePlats = menu.reduce((somme, categorie) => somme + categorie.produits.length, 0);

  return (
    <div
      className="min-h-dvh bg-slate-50"
      style={{
        ["--couleur-principale" as string]: restaurant.couleurPrincipale,
        ["--couleur-sur-principale" as string]: surCouleur,
      }}
    >
      <header className="degrade-principal px-4 pt-6 pb-12 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/m/${restaurant.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {restaurant.nom}
          </Link>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
            <QrCode className="size-3.5" aria-hidden />
            Table {table.numero}
          </p>

          <h1 className="mt-3 font-titre text-2xl font-extrabold tracking-tight sm:text-3xl">
            Vous êtes à la table {table.numero}
          </h1>
          <p className="mt-2 max-w-xl text-white/85">
            Dans la version finale, vos plats seront envoyés directement au serveur et à la cuisine,
            et vous pourrez suivre l&apos;avancement depuis cette page.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-7 max-w-3xl px-4 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Alerte ton="info" icone={<Info className="size-4" aria-hidden />}>
            Cette page est l&apos;aperçu du parcours « sur place ». Le QR code de la table a bien été
            reconnu, la table existe et le menu du restaurant est chargé ({nombrePlats} plats dans{" "}
            {menu.length} catégorie{menu.length > 1 ? "s" : ""}).
          </Alerte>

          <ul className="mt-5 space-y-2.5">
            {menu.slice(0, 3).map((categorie) => (
              <li key={categorie.id} className="rounded-2xl border border-slate-100 bg-white p-3">
                <p className="font-titre text-sm font-bold text-slate-500 uppercase">
                  {categorie.nom}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {categorie.produits.slice(0, 2).map((produit) => (
                    <li key={produit.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="size-3.5 shrink-0 text-feuille-600" aria-hidden />
                        {produit.nom}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatFcfa(produit.prix, restaurant.devise)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <Link href={`/m/${restaurant.slug}`} className={classesBouton("principal", "md")}>
              Voir le menu complet
            </Link>
            <Link href="/inscription" className={classesBouton("contour", "md")}>
              Créer mon menu
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
