/**
 * Page de repli hors ligne, servie par le service worker quand le réseau est
 * coupé (fréquent en 3G en fin de service). Elle explique quoi faire sans
 * culpabiliser l'utilisateur, et propose de réessayer.
 */
import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hors ligne",
  description: "Mesplats reste utilisable : la page se rechargera dès le retour du réseau.",
  robots: { index: false },
};

export default function PageHorsLigne() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center dark:bg-slate-950">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm dark:bg-slate-900">
        <CloudOff className="size-7" aria-hidden />
      </span>

      <div>
        <h1 className="font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
          Vous êtes hors ligne
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Pas d&apos;inquiétude : votre commande est enregistrée chez le restaurant. Dès que le
          réseau revient, la page se remet à jour toute seule — comme un SMS qui partirait un peu
          plus tard.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm dark:bg-slate-900">
          <WifiOff className="size-3.5" aria-hidden />
          Vérifiez vos données mobiles
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm dark:bg-slate-900">
          <RefreshCw className="size-3.5" aria-hidden />
          Réessayez dans quelques secondes
        </span>
      </div>

      <Link
        href="/"
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Réessayer
      </Link>
    </main>
  );
}
