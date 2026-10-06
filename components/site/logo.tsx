/**
 * Logo Mesplats : un QR code stylisé contenant des couverts.
 *
 * ⚠️ Le dessin (pastille sombre, repères de QR code, couverts orange) ne change
 * pas : seul le mot-symbole affiché à côté suit le nom du produit.
 *
 * Dessiné en SVG (aucun fichier image) : net à toutes les tailles, teinté via
 * `currentColor` et modifiable par les variables de thème.
 */
import { cn } from "@/lib/utils";

export function LogoMesplats({
  className,
  /** Masque le mot-symbole et ne garde que la pastille. */
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        className="size-9 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="11" className="fill-slate-900" />
        {/* Trois repères de QR code */}
        <path
          d="M7 7h7v7H7zM26 7h7v7h-7zM7 26h7v7H7z"
          className="fill-white"
          opacity="0.95"
        />
        <path d="M9 9h3v3H9zM28 9h3v3h-3zM9 28h3v3H9z" className="fill-slate-900" />
        {/* Couverts au centre (couteau + fourchette stylisés) */}
        <path
          d="M19 6.5v9.2M17 6.5v3.4a2 2 0 0 0 4 0V6.5M19 15.7V33"
          stroke="#E4572E"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      {!compact ? (
        <span className="font-titre text-lg leading-none font-extrabold tracking-tight text-slate-900">
          Mesplats
        </span>
      ) : null}
    </span>
  );
}
