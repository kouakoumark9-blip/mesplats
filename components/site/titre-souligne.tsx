/**
 * Titre avec une portion mise en avant puis soulignée d'un trait manuscrit.
 * Exemple : « Votre menu <u>QR code</u> pour restaurant ».
 *
 * Le soulignement est un simple tracé SVG étiré sur la largeur de la portion :
 * aucun fichier image, net à toutes les résolutions, et il suit la couleur
 * de la marque.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

function Soulignement({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      className={cn("absolute -bottom-1 left-0 h-2.5 w-full", className)}
    >
      <path
        d="M3 8.5C58 3.5 152 2 297 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TitreSouligne({
  avant,
  accent,
  apres,
  className,
  niveau = "h2",
}: {
  avant?: ReactNode;
  accent: ReactNode;
  apres?: ReactNode;
  className?: string;
  niveau?: "h1" | "h2";
}) {
  const Balise = niveau;

  return (
    <Balise
      className={cn(
        "font-titre font-extrabold tracking-tight text-balance text-slate-900",
        niveau === "h1" ? "text-4xl leading-[1.08] sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl",
        className,
      )}
    >
      {avant ? <>{avant} </> : null}
      <span className="relative inline-block whitespace-nowrap text-marque-600">
        {accent}
        <Soulignement />
      </span>
      {apres ? <> {apres}</> : null}
    </Balise>
  );
}
