"use client";

/**
 * Modale accessible : fermeture par Échap ou clic sur le fond, focus déplacé
 * dans la boîte à l'ouverture, défilement du fond bloqué.
 */
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modale({
  ouverte,
  onFermer,
  titre,
  description,
  children,
  piedPage,
  taille = "md",
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  description?: string;
  children: ReactNode;
  piedPage?: ReactNode;
  taille?: "sm" | "md" | "lg";
}) {
  const referenceBoite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouverte) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", surTouche);

    const ancienDebordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Place le focus sur le premier élément interactif de la modale.
    const premier = referenceBoite.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    premier?.focus();

    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = ancienDebordement;
    };
  }, [ouverte, onFermer]);

  if (!ouverte) return null;

  const largeurs = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onFermer}
        className="absolute inset-0 cursor-default bg-slate-900/60 backdrop-blur-sm"
      />
      <div
        ref={referenceBoite}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className={cn(
          "relative z-10 w-full animate-apparition overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl",
          "dark:bg-slate-900",
          largeurs[taille],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-titre text-lg font-bold text-slate-900 dark:text-white">{titre}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 -mt-1 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>

        {piedPage ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/40">
            {piedPage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
