/**
 * Affichage d'un QR code sous forme de SVG en ligne.
 *
 * Pourquoi du SVG plutôt qu'un PNG en base64 ?
 *  - **2 fois plus léger** (≈ 1,5 Ko contre 3,5 Ko pour un PNG de 400 px) ;
 *  - **vectoriel** : net à n'importe quelle taille, y compris à l'impression ;
 *  - il adopte la couleur définie à la génération, sans fichier à télécharger.
 *
 * ⚠️ Sécurité : `dangerouslySetInnerHTML` est utilisé ici parce que le balisage
 * provient de la bibliothèque `qrcode`, à partir d'une URL construite par
 * l'application. Ce composant ne doit jamais recevoir de balisage issu d'une
 * saisie utilisateur.
 */
import { cn } from "@/lib/utils";

export function QrCodeInline({
  svg,
  label,
  className,
  /** Taille d'affichage carrée, en pixels (le SVG s'y adapte). */
  taille = 160,
}: {
  svg: string;
  /** Décrit le contenu du QR code aux lecteurs d'écran. */
  label: string;
  className?: string;
  taille?: number;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{ width: taille, height: taille }}
      className={cn("inline-block [&>svg]:block [&>svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
