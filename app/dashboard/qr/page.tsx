import { ArrowLeft, QrCode, Table2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AtelierQr } from "@/components/dashboard/atelier-qr";
import { Bouton } from "@/components/ui/bouton";
import { Alerte } from "@/components/ui/divers";
import { exigerRole } from "@/lib/auth/autorisation";
import type { StyleQr } from "@/lib/constants";
import { profilRestaurant } from "@/lib/db/catalogue";
import { urlMenu } from "@/lib/env";

export const metadata: Metadata = {
  title: "QR code du menu",
  description: "Personnalisez le QR code de votre menu puis exportez-le en PNG ou en SVG.",
};

export default async function PageQrCode() {
  const utilisateur = await exigerRole("admin");
  const profil = await profilRestaurant(utilisateur.restaurantId!);

  const slug = profil?.slug ?? utilisateur.restaurantSlug ?? "";
  const url = urlMenu({ slug });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
            <QrCode className="size-6 text-marque-600" aria-hidden />
            QR code de votre menu
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Un seul code à imprimer : vos clients le scannent et arrivent sur votre carte, mise à
            jour en direct. Choisissez un style à votre image, puis téléchargez-le en PNG (réseaux
            sociaux, affiches) ou en SVG (imprimeur, grande taille).
          </p>
        </div>

        <Link href="/dashboard/tables">
          <Bouton variante="contour" icone={<Table2 className="size-4" aria-hidden />}>
            QR code par table
          </Bouton>
        </Link>
      </header>

      <AtelierQr
        url={url}
        nomRestaurant={profil?.nom ?? "Mon restaurant"}
        logo={profil?.logo ?? null}
        qrOriginaux={{
          qrStyle: (profil?.qrStyle ?? "classique") as StyleQr,
          qrCouleur: profil?.qrCouleur ?? "#0f172a",
          qrFond: profil?.qrFond ?? "#ffffff",
          qrLogo: profil?.qrLogo ?? false,
        }}
      />

      <Alerte ton="info" titre="Bon à savoir">
        Le QR code reste le même toute votre vie : il pointe vers une adresse fixe. Vous pouvez donc
        changer vos plats, vos prix ou vos photos autant de fois que vous voulez, sans jamais
        réimprimer vos chevalets.
      </Alerte>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la vue d&apos;ensemble
      </Link>
    </div>
  );
}
