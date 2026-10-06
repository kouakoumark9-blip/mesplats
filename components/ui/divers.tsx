import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Bloc gris animé affiché pendant le chargement des données. */
export function Squelette({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800", className)}
    />
  );
}

/** Squelette d'une carte produit du menu client. */
export function SqueletteCarteProduit() {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <Squelette className="size-20 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <Squelette className="h-4 w-3/5" />
        <Squelette className="h-3 w-4/5" />
        <Squelette className="h-4 w-24" />
      </div>
    </div>
  );
}

/** Squelette d'une carte commande de l'écran de service. */
export function SqueletteCarteCommande() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <Squelette className="h-5 w-28" />
        <Squelette className="h-6 w-24 rounded-full" />
      </div>
      <Squelette className="h-4 w-full" />
      <Squelette className="h-4 w-4/5" />
      <div className="flex gap-2 pt-1">
        <Squelette className="h-10 flex-1" />
        <Squelette className="h-10 w-24" />
      </div>
    </div>
  );
}

/** Squelette de ligne de tableau (listes du back-office). */
export function SqueletteLigne({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <Squelette className="size-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Squelette className="h-3.5 w-1/3" />
        <Squelette className="h-3 w-1/2" />
      </div>
      <Squelette className="h-8 w-20 rounded-lg" />
    </div>
  );
}

export function IndicateurChargement({ libelle = "Chargement…" }: { libelle?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-marque-500" />
      <span className="text-sm font-medium">{libelle}</span>
    </div>
  );
}

/** État vide soigné : icône, titre, explication, action facultative. */
export function EtatVide({
  icone,
  titre,
  description,
  action,
  className,
}: {
  icone: ReactNode;
  titre: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center",
        "dark:border-slate-700 dark:bg-slate-900/40",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icone}
      </span>
      <div>
        <p className="font-titre text-base font-bold text-slate-800 dark:text-slate-100">{titre}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Bandeau d'information / erreur / succès, réutilisable partout. */
export function Alerte({
  ton = "info",
  titre,
  children,
  icone,
  className,
}: {
  ton?: "info" | "succes" | "alerte" | "erreur";
  titre?: string;
  children?: ReactNode;
  icone?: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    succes:
      "border-feuille-200 bg-feuille-50 text-feuille-800 dark:border-feuille-500/30 dark:bg-feuille-500/10 dark:text-feuille-200",
    alerte:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    erreur:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  };

  return (
    <div className={cn("flex gap-3 rounded-2xl border px-4 py-3 text-sm", styles[ton], className)}>
      {icone ? <span className="mt-0.5 shrink-0">{icone}</span> : null}
      <div className="min-w-0">
        {titre ? <p className="font-bold">{titre}</p> : null}
        {children ? <div className={cn(titre && "mt-0.5")}>{children}</div> : null}
      </div>
    </div>
  );
}
