import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Conteneur blanc arrondi utilisé dans tout le back-office. */
export function Carte({ className, ...reste }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...reste}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    />
  );
}

export function CarteEntete({
  titre,
  description,
  action,
  icone,
  className,
}: {
  titre: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icone?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5",
        "dark:border-slate-800",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icone ? (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {icone}
          </span>
        ) : null}
        <div>
          <h3 className="font-titre text-base font-bold text-slate-900 dark:text-slate-100">{titre}</h3>
          {description ? (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CarteContenu({ className, ...reste }: HTMLAttributes<HTMLDivElement>) {
  return <div {...reste} className={cn("p-4 sm:p-5", className)} />;
}

/** Carte de statistique (chiffre d'affaires, commandes du jour…). */
export function CarteStat({
  libelle,
  valeur,
  detail,
  icone,
  tendance,
  className,
}: {
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  icone?: ReactNode;
  tendance?: { valeur: string; positif: boolean };
  className?: string;
}) {
  return (
    <Carte className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{libelle}</p>
          <p className="mt-1.5 font-titre text-xl leading-tight font-extrabold break-words text-slate-900 sm:text-2xl dark:text-white">
            {valeur}
          </p>
          {detail ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
          ) : null}
        </div>
        {icone ? (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-marque-50 text-marque-600 dark:bg-marque-500/15 dark:text-marque-300">
            {icone}
          </span>
        ) : null}
      </div>
      {tendance ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
            tendance.positif
              ? "bg-feuille-50 text-feuille-700 dark:bg-feuille-500/15 dark:text-feuille-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
          )}
        >
          {tendance.valeur}
        </p>
      ) : null}
    </Carte>
  );
}
