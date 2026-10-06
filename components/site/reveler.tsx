"use client";

/**
 * Animation d'apparition au défilement.
 *
 * Choix d'implémentation :
 *  - les éléments visibles dès le montage s'affichent **sans** animation :
 *    aucun scintillement, aucune dépendance au JavaScript pour être lisible ;
 *  - `prefers-reduced-motion` désactive totalement l'effet ;
 *  - coût négligeable (un IntersectionObserver par section, débranché après).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Reveler({
  children,
  delai = 0,
  className,
}: {
  children: ReactNode;
  /** Décalage en millisecondes (effet d'escalier sur les grilles). */
  delai?: number;
  className?: string;
}) {
  const reference = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<"initial" | "animer" | "visible">("initial");

  useEffect(() => {
    const element = reference.current;
    if (!element) return;

    // Accessibilité : aucune animation si l'utilisateur la refuse.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEtat("visible");
      return;
    }

    // Déjà à l'écran au chargement → affichage immédiat, sans transition.
    const cadre = element.getBoundingClientRect();
    if (cadre.top < window.innerHeight - 40) {
      setEtat("visible");
      return;
    }

    setEtat("animer");

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (entree.isIntersecting) {
            setEtat("visible");
            observateur.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 },
    );

    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  return (
    <div
      ref={reference}
      // Le délai n'est appliqué qu'au moment de l'apparition (état « visible »).
      style={etat === "visible" && delai > 0 ? { transitionDelay: `${delai}ms` } : undefined}
      className={cn(
        etat === "animer" &&
          "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        etat === "visible" && "translate-y-0 opacity-100",
        "transition-[transform,opacity] duration-700 ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}
