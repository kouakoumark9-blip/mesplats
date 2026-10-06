import { ArrowLeft, CheckCircle2, Utensils } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormulaireInscription } from "@/components/auth/formulaire-inscription";
import { utilisateurCourant } from "@/lib/auth/autorisation";
import { espaceParDefaut } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Créer mon restaurant",
  description:
    "Créez votre compte AfriMenu en 2 minutes : menu QR, commandes sur place et à emporter, écran de service en temps réel.",
};

const AVANTAGES = [
  "Menu QR prêt à imprimer en 2 minutes",
  "Commandes sur place et à emporter",
  "Écran de service en temps réel (téléphone ou tablette)",
  "Paiement Orange Money, Moov Money, MTN MoMo ou espèces",
  "Premier mois du plan Pro offert, sans carte bancaire",
];

export default async function PageInscription() {
  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect(espaceParDefaut(utilisateur.role));

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-marque-600 p-10 text-white lg:flex">
        <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-black/15 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2 text-lg font-extrabold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Utensils className="size-5" aria-hidden />
          </span>
          AfriMenu
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-titre text-4xl leading-tight font-extrabold">
            Votre restaurant en ligne aujourd&apos;hui, sans informaticien.
          </h2>
          <ul className="mt-8 space-y-3">
            {AVANTAGES.map((avantage) => (
              <li key={avantage} className="flex items-start gap-3 text-marque-50">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white" aria-hidden />
                <span>{avantage}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-marque-100">
          Comptez 5 minutes pour tout installer. Aucune carte bancaire requise, aucun
          engagement : vous restez libre d&apos;arrêter quand vous voulez.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800 lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à l&apos;accueil
          </Link>

          <div className="mb-7 lg:hidden">
            <span className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span className="flex size-8 items-center justify-center rounded-lg bg-marque-500 text-white">
                <Utensils className="size-4" aria-hidden />
              </span>
              AfriMenu
            </span>
          </div>

          <h1 className="font-titre text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Créer mon restaurant
          </h1>
          <p className="mt-2 mb-6 text-slate-600">
            Quelques informations suffisent : votre menu et vos QR codes sont générés
            automatiquement. Le premier mois du plan Pro est offert, sans carte bancaire.
          </p>

          <FormulaireInscription />
        </div>
      </section>
    </main>
  );
}
