/**
 * Photo d'un plat, avec repli élégant quand aucune photo n'est renseignée.
 *
 * Deux cas d'usage :
 *  - chemin local (`/plats/attieke.jpg`) ou URL Vercel Blob → `next/image`
 *    (conversion WebP automatique, redimensionnement, chargement paresseux) ;
 *  - toute autre URL distante → balise `<img>` simple, car `next/image`
 *    refuserait un domaine non déclaré dans `next.config.ts`.
 */
import { Utensils } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/** Domaines autorisés dans `next.config.ts` (images.remotePatterns). */
function optimisable(src: string): boolean {
  if (src.startsWith("/")) return true;
  return src.includes(".public.blob.vercel-storage.com") || src.includes(".blob.vercel-storage.com");
}

export function PhotoPlat({
  src,
  alt,
  taille = 96,
  className,
  taillesResponsives,
}: {
  src?: string | null;
  alt: string;
  /** Côté du carré, en pixels de référence. */
  taille?: number;
  className?: string;
  /** Attribut `sizes` de next/image ; par défaut, la taille fixe. */
  taillesResponsives?: string;
}) {
  if (!src) {
    return (
      <span
        aria-hidden
        style={{ width: taille, height: taille }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300",
          className,
        )}
      >
        <Utensils className="size-1/3" />
      </span>
    );
  }

  if (optimisable(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={taille}
        height={taille}
        sizes={taillesResponsives ?? `${taille}px`}
        loading="lazy"
        className={cn("shrink-0 rounded-xl object-cover", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={taille}
      height={taille}
      loading="lazy"
      className={cn("shrink-0 rounded-xl object-cover", className)}
    />
  );
}
