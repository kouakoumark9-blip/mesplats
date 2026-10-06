/**
 * Bouton unique de l'application, décliné en variantes et tailles.
 * Tailles « lg »/« xl » pensées pour le tactile : tablettes de restaurant,
 * doigts mouillés ou gantés, écrans lus au soleil.
 *
 * Aucun hook n'est utilisé : le composant fonctionne aussi bien dans un
 * composant serveur (avec `classesBouton` sur un <Link>) que dans un
 * composant client (avec un gestionnaire onClick).
 */
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type VarianteBouton =
  | "principal"
  | "secondaire"
  | "contour"
  | "fantome"
  | "danger"
  | "succes"
  | "sombre";

export type TailleBouton = "sm" | "md" | "lg" | "xl";

const VARIANTES: Record<VarianteBouton, string> = {
  // Utilise la couleur du restaurant (variable CSS --couleur-principale)
  principal: "fond-principal fond-principal-hover shadow-sm",
  secondaire: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
  contour:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  fantome:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  succes: "bg-feuille-600 text-white hover:bg-feuille-700 shadow-sm",
  sombre: "bg-slate-900 text-white hover:bg-slate-700",
};

const TAILLES: Record<TailleBouton, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
  xl: "h-14 px-6 text-lg gap-2.5 rounded-2xl",
};

export function classesBouton(
  variante: VarianteBouton = "principal",
  taille: TailleBouton = "md",
  className?: string,
): string {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTES[variante],
    TAILLES[taille],
    className,
  );
}

type ProprietesBouton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton;
  taille?: TailleBouton;
  chargement?: boolean;
  icone?: ReactNode;
  /** Libellé affiché pendant le chargement (facultatif). */
  libelleChargement?: string;
  pleineLargeur?: boolean;
};

export function Bouton({
  variante = "principal",
  taille = "md",
  chargement = false,
  icone,
  libelleChargement,
  pleineLargeur,
  className,
  children,
  disabled,
  ...reste
}: ProprietesBouton) {
  return (
    <button
      {...reste}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      className={classesBouton(variante, taille, cn(pleineLargeur && "w-full", className))}
    >
      {chargement ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        icone
      )}
      {chargement && libelleChargement ? libelleChargement : children}
    </button>
  );
}
