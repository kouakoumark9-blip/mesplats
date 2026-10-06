/**
 * Coque commune aux écrans d'authentification (mot de passe oublié,
 * réinitialisation) : même cadre sobre que la page de connexion, sans la
 * colonne de présentation, pour aller droit au but depuis un lien reçu par
 * e-mail ou WhatsApp (souvent ouvert sur un téléphone en 3G).
 */
import { ArrowLeft, Utensils } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function CoqueAuth({
  titre,
  sousTitre,
  children,
  pied,
}: {
  titre: string;
  sousTitre: string;
  children: ReactNode;
  pied?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour à l&apos;accueil
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <span className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-marque-500 text-white">
              <Utensils className="size-4" aria-hidden />
            </span>
            Mesplats
          </span>

          <h1 className="mt-6 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
            {titre}
          </h1>
          <p className="mt-2 mb-6 text-sm text-slate-600 dark:text-slate-400">{sousTitre}</p>

          {children}
        </div>

        {pied ? <div className="mt-5 text-center text-sm text-slate-500">{pied}</div> : null}
      </div>
    </main>
  );
}
