import { ArrowLeft, QrCode, Table2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GestionTables } from "@/components/dashboard/gestion-tables";
import { Bouton } from "@/components/ui/bouton";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_TABLES, type StyleQr } from "@/lib/constants";
import { profilRestaurant } from "@/lib/db/catalogue";
import { tablesDuRestaurant } from "@/lib/db/tables";
import { urlMenu } from "@/lib/env";
import { svgQrAvance } from "@/lib/qr-styles";

export const metadata: Metadata = { title: "Tables & QR codes" };

export default async function PageTables() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;
  const slug = utilisateur.restaurantSlug ?? "";

  const [tables, profil] = await Promise.all([
    tablesDuRestaurant(restaurantId),
    profilRestaurant(restaurantId),
  ]);

  /** Les QR codes reprennent le style, les couleurs et le logo enregistrés. */
  const habillage = {
    style: (profil?.qrStyle ?? "classique") as StyleQr,
    fonce: profil?.qrCouleur ?? "#0f172a",
    clair: profil?.qrFond ?? "#ffffff",
    logoUrl: profil?.qrLogo ? profil.logo : null,
  };

  /*
   * Les QR codes sont générés au rendu, en SVG : 1,5 Ko par table, net à
   * l'impression, et rien à télécharger côté client pour l'affichage.
   * Les exports PNG et PDF, eux, sont fabriqués dans le navigateur.
   */
  const urlEmporter = urlMenu({ slug });
  const [tablesAvecQr, qrSvgEmporter] = await Promise.all([
    Promise.all(
      tables.map(async (table) => ({
        id: table.id,
        numero: table.numero,
        url: urlMenu({ slug }, table.numero),
        qrSvg: svgQrAvance({ ...habillage, texte: urlMenu({ slug }, table.numero), marge: 2 }),
      })),
    ),
    svgQrAvance({ ...habillage, texte: urlEmporter, marge: 2 }),
  ]);

  const limiteTables = LIMITE_TABLES[utilisateur.plan];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
            <QrCode className="size-6 text-marque-600" aria-hidden />
            Tables & QR codes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Un QR code unique par table, plus un QR « À emporter ». Le client qui scanne arrive
            directement sur votre menu, avec le bon numéro de table déjà rempli.
          </p>
        </div>

        <Link href="/dashboard">
          <Bouton variante="contour" icone={<ArrowLeft className="size-4" aria-hidden />}>
            Vue d&apos;ensemble
          </Bouton>
        </Link>
      </header>

      <GestionTables
        tables={tablesAvecQr}
        nomRestaurant={utilisateur.restaurantNom ?? "Mon restaurant"}
        slug={slug}
        urlEmporter={urlEmporter}
        qrSvgEmporter={qrSvgEmporter}
        limiteTables={limiteTables}
        plan={utilisateur.plan}
      />

      {tables.length === 0 ? (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-slate-400">
          <Table2 className="size-4" aria-hidden />
          Astuce : commencez par créer vos tables, imprimez la planche A4, puis posez une carte sur
          chaque table. Le QR « À emporter » va sur la vitrine.
        </p>
      ) : null}
    </div>
  );
}
