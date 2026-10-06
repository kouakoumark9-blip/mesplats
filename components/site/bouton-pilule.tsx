/**
 * Bouton « pilule » du site public : libellé + pastille circulaire contenant
 * une flèche. Deux variantes : sombre (action principale) et clair (secondaire).
 */
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BoutonPilule({
  href,
  children,
  variante = "sombre",
  taille = "md",
  className,
  icone,
}: {
  href: string;
  children: ReactNode;
  variante?: "sombre" | "clair" | "marque" | "contour";
  taille?: "md" | "lg";
  className?: string;
  /** Remplace la flèche de la pastille. */
  icone?: ReactNode;
}) {
  const variantes = {
    sombre:
      "bg-slate-900 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800",
    clair: "bg-white text-slate-900 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 hover:bg-slate-50",
    marque:
      "bg-marque-600 text-white shadow-lg shadow-marque-600/25 hover:bg-marque-700",
    contour:
      "bg-transparent text-slate-800 ring-1 ring-slate-300 hover:bg-white",
  };

  const tailles = {
    md: { bouton: "py-1.5 pl-5 pr-1.5 text-sm", pastille: "size-8" },
    lg: { bouton: "py-2 pl-6 pr-2 text-base", pastille: "size-10" },
  };

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full font-bold transition-colors",
        variantes[variante],
        tailles[taille].bouton,
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-colors",
          tailles[taille].pastille,
          variante === "clair" || variante === "contour"
            ? "bg-slate-900 text-white group-hover:bg-marque-600"
            : "bg-white/15 text-white group-hover:bg-white group-hover:text-slate-900",
        )}
      >
        {icone ?? <ArrowRight className="size-4" aria-hidden />}
      </span>
    </Link>
  );
}
