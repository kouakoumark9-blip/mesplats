import type { ReactNode } from "react";

import {
  ACCENTS_STATUT,
  COULEURS_STATUT,
  LIBELLES_PAIEMENT_STATUT,
  LIBELLES_STATUT,
  type PaiementStatut,
  type Statut,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Ton = "neutre" | "marque" | "succes" | "alerte" | "danger" | "info";

const TONS: Record<Ton, string> = {
  neutre: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  marque: "bg-marque-50 text-marque-700 dark:bg-marque-500/15 dark:text-marque-300",
  succes: "bg-feuille-50 text-feuille-700 dark:bg-feuille-500/15 dark:text-feuille-300",
  alerte: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
};

export function Badge({
  children,
  ton = "neutre",
  className,
  icone,
}: {
  children: ReactNode;
  ton?: Ton;
  className?: string;
  icone?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        TONS[ton],
        className,
      )}
    >
      {icone}
      {children}
    </span>
  );
}

/** Badge coloré associé au statut d'une commande. */
export function BadgeStatut({ statut, className }: { statut: Statut; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        COULEURS_STATUT[statut],
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", ACCENTS_STATUT[statut])} aria-hidden />
      {LIBELLES_STATUT[statut]}
    </span>
  );
}

/** Badge de paiement : « Payé » (vert) ou « En attente » (orange). */
export function BadgePaiement({
  statut,
  className,
}: {
  statut: PaiementStatut;
  className?: string;
}) {
  return (
    <Badge ton={statut === "paye" ? "succes" : "alerte"} className={className}>
      {LIBELLES_PAIEMENT_STATUT[statut]}
    </Badge>
  );
}

/** Pastille de comptage (nouvelles commandes, appels serveur). */
export function Pastille({
  valeur,
  className,
  clignotante = false,
}: {
  valeur: number | string;
  className?: string;
  clignotante?: boolean;
}) {
  if (valeur === 0 || valeur === "0") return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white",
        clignotante && "animate-clignote",
        className,
      )}
    >
      {valeur}
    </span>
  );
}
