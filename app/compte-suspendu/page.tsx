/**
 * Page affichée lorsqu'un restaurant a été suspendu par la plateforme.
 */
import { Lock, Phone } from "lucide-react";
import type { Metadata } from "next";

import { DeconnexionButton } from "@/components/auth/deconnexion-button";

export const metadata: Metadata = {
  title: "Compte suspendu — Mesplats",
  robots: { index: false },
};

export default function PageCompteSuspendu() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="size-7" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          Accès temporairement suspendu
        </h1>
        <p className="mt-3 text-slate-600">
          Votre établissement a été suspendu par l&apos;équipe Mesplats. Vos données et vos
          commandes sont conservées, mais l&apos;accès au back-office et à l&apos;écran de service
          est momentanément bloqué.
        </p>
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Pour réactiver votre compte, contactez le support à{" "}
          <a className="font-semibold text-slate-900 underline" href="mailto:support@mesplats.app">
            support@mesplats.app
          </a>{" "}
          ou par téléphone au <span className="font-semibold text-slate-900">+225 07 00 00 00 00</span>.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="tel:+2250700000000"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <Phone className="size-4" aria-hidden />
            Appeler le support
          </a>
          <DeconnexionButton
            libelle="Se déconnecter"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          />
        </div>
      </div>
    </main>
  );
}
