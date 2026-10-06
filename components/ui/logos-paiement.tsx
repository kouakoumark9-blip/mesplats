/**
 * Logos des moyens de paiement, tous de la même taille et de la même forme.
 *
 * ⚠️ Règle du composant : la pastille (`taille`) est identique pour TOUTES les
 * marques — même carré, même rayon, même anneau, même épaisseur de trait. Seul
 * le dessin intérieur change. C'est ce qui garantit une rangée alignée au pixel
 * sur la page d'accueil, dans les paramètres du restaurant et sur le menu client.
 *
 * Les marques sont dessinées en SVG (aucun fichier image, aucun appel réseau) :
 * elles restent nettes à toutes les tailles, pèsent quelques centaines d'octets
 * et s'affichent instantanément même en 3G. Elles sont volontairement
 * simplifiées : ce sont des repères visuels, pas les logos officiels des
 * opérateurs.
 */
import { Banknote } from "lucide-react";

import { cn } from "@/lib/utils";

export type MarquePaiement = "orange" | "moov" | "mtn" | "wave" | "especes";

export const MARQUES_PAIEMENT: MarquePaiement[] = ["orange", "moov", "mtn", "wave", "especes"];

export type TailleLogo = "sm" | "md" | "lg";

/** Carré, rayon et arrondi de l'anneau : les mêmes pour toutes les marques. */
const TAILLES: Record<TailleLogo, { pastille: string; dessin: string; rayon: number }> = {
  sm: { pastille: "size-9 rounded-lg", dessin: "size-6", rayon: 6 },
  md: { pastille: "size-12 rounded-xl", dessin: "size-8", rayon: 10 },
  lg: { pastille: "size-16 rounded-2xl", dessin: "size-10", rayon: 14 },
};

/** Couleurs de fond des pastilles (approche des couleurs de marque). */
const FONDS: Record<MarquePaiement, string> = {
  orange: "#12212E",
  moov: "#0B5FA5",
  mtn: "#FFCC00",
  wave: "#4DC3F0",
  especes: "#0F172A",
};

/** Anneau intérieur : garde la même épaisseur pour toutes les marques. */
const ANNEAU: Record<MarquePaiement, string> = {
  orange: "ring-white/10",
  moov: "ring-white/15",
  mtn: "ring-black/10",
  wave: "ring-white/25",
  especes: "ring-white/10",
};

/* -------------------------------------------------------------------------- */
/*                          Dessins intérieurs (SVG)                          */
/* -------------------------------------------------------------------------- */

function DessinOrange() {
  // Deux flèches opposées, comme sur le logo Orange Money.
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-full" aria-hidden>
      <path
        d="M12.8 5.4h5.8v5.8M18.2 5.8l-6 6"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 18.6H5.4v-5.8M5.8 18.2l6-6"
        stroke="#FF7900"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DessinMoov() {
  // Croissant orange et losange blanc : le repère de Moov Africa.
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-full" aria-hidden>
      <path
        d="M4.2 18.6C4.2 10.4 10.6 4.4 19 4.9"
        stroke="#F58220"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <rect x="13.1" y="10.1" width="4.6" height="4.6" rx="0.8" fill="#ffffff" transform="rotate(45 15.4 12.4)" />
      <path d="M20 15.2l1.7 1.7-1.7 1.7-1.7-1.7z" fill="#F58220" />
    </svg>
  );
}

function DessinMtn() {
  // Lettrage MTN en gras sur fond jaune.
  return (
    <span className="font-marque text-[0.82rem] leading-none font-extrabold tracking-tight text-slate-900">
      MTN
    </span>
  );
}

function DessinWave() {
  // Manchot stylisé de Wave : corps noir, ventre blanc, bec et pattes orange.
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-full" aria-hidden>
      {/* Aileron levé */}
      <ellipse cx="6.9" cy="11.6" rx="1.5" ry="2.9" fill="#0B0B0B" transform="rotate(24 6.9 11.6)" />
      {/* Corps */}
      <ellipse cx="12.4" cy="11" rx="5" ry="6.6" fill="#0B0B0B" />
      {/* Pattes */}
      <ellipse cx="10.3" cy="18.4" rx="1.7" ry="1" fill="#F58220" />
      <ellipse cx="14.5" cy="18.4" rx="1.7" ry="1" fill="#F58220" />
      {/* Ventre */}
      <ellipse cx="12.4" cy="12.6" rx="3" ry="4.2" fill="#ffffff" />
      {/* Bec */}
      <path d="M7.6 9.9 9.6 8.9l.5 2.1-2.4-.6z" fill="#F58220" />
      {/* Yeux */}
      <circle cx="11" cy="8.1" r="0.62" fill="#ffffff" />
      <circle cx="14.2" cy="8.1" r="0.62" fill="#ffffff" />
    </svg>
  );
}

function DessinEspeces() {
  // Billet : paiement en espèces au comptoir.
  return <Banknote className="size-full text-white" strokeWidth={2.2} aria-hidden />;
}

const DESSINS: Record<MarquePaiement, () => React.ReactElement> = {
  orange: DessinOrange,
  moov: DessinMoov,
  mtn: DessinMtn,
  wave: DessinWave,
  especes: DessinEspeces,
};

/* -------------------------------------------------------------------------- */
/*                                  Composant                                 */
/* -------------------------------------------------------------------------- */

export function LogoPaiement({
  marque,
  taille = "md",
  className,
  libelle,
}: {
  marque: MarquePaiement;
  taille?: TailleLogo;
  className?: string;
  /** Nom accessible ; par défaut « Logo <marque> ». */
  libelle?: string;
}) {
  const dimensions = TAILLES[taille];
  const Dessin = DESSINS[marque];

  return (
    <span
      role="img"
      aria-label={libelle ?? `Logo ${marque}`}
      className={cn(
        // Toutes les marques partagent strictement ces classes : taille, forme,
        // rayon, anneau et centrage sont identiques.
        "inline-flex shrink-0 items-center justify-center ring-1 ring-inset shadow-sm",
        dimensions.pastille,
        ANNEAU[marque],
        className,
      )}
      style={{ backgroundColor: FONDS[marque] }}
    >
      <span className={cn("flex items-center justify-center", dimensions.dessin)}>
        <Dessin />
      </span>
    </span>
  );
}

/** Rangée de logos, alignés et espacés de façon identique partout. */
export function RangeeLogosPaiement({
  marques = MARQUES_PAIEMENT,
  taille = "md",
  className,
}: {
  marques?: MarquePaiement[];
  taille?: TailleLogo;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {marques.map((marque) => (
        <li key={marque}>
          <LogoPaiement marque={marque} taille={taille} />
        </li>
      ))}
    </ul>
  );
}
