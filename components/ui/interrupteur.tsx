"use client";

/**
 * Interrupteur binaire (« épuisé / disponible ») : grande zone tactile,
 * retour visuel immédiat, accessible au clavier.
 */
import { cn } from "@/lib/utils";

export function Interrupteur({
  actif,
  onChange,
  label,
  labelActif,
  labelInactif,
  desactive = false,
  taille = "md",
}: {
  actif: boolean;
  onChange: (valeur: boolean) => void;
  label?: string;
  labelActif?: string;
  labelInactif?: string;
  desactive?: boolean;
  taille?: "sm" | "md";
}) {
  const dimensions = taille === "sm" ? { piste: "h-6 w-11", pastille: "size-4", course: "translate-x-5" } : { piste: "h-7 w-13", pastille: "size-5", course: "translate-x-6" };

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2.5",
        desactive ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={label}
        disabled={desactive}
        onClick={() => onChange(!actif)}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full p-1 transition-colors",
          dimensions.piste,
          actif ? "bg-feuille-500" : "bg-slate-300 dark:bg-slate-600",
        )}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow transition-transform",
            dimensions.pastille,
            actif ? dimensions.course : "translate-x-0",
          )}
        />
      </button>
      {labelActif || labelInactif ? (
        <span
          className={cn(
            "text-sm font-semibold",
            actif ? "text-feuille-700 dark:text-feuille-300" : "text-slate-500 dark:text-slate-400",
          )}
        >
          {actif ? labelActif : labelInactif}
        </span>
      ) : label ? (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      ) : null}
    </label>
  );
}
