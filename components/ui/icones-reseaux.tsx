/**
 * Pictogrammes des réseaux sociaux.
 *
 * Lucide ne fournit plus les logos de marques : ces tracés minimalistes
 * (24 × 24, `currentColor`) gardent une interface cohérente sans dépendre d'une
 * bibliothèque d'icônes commerciales. Ce sont des repères visuels simplifiés,
 * pas les logos officiels des plateformes.
 */
import type { SVGProps } from "react";

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconeInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE} {...props} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeFacebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE} {...props} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 8.4h-1.3c-1 0-1.6.6-1.6 1.7v1.2h-1.5v1.9h1.5V18h1.9v-4.8h1.5l.3-1.9h-1.8v-1c0-.3.2-.5.5-.5h1.5V8.4z" />
    </svg>
  );
}

export function IconeX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE} {...props} aria-hidden>
      <path d="M4.5 4.5l6.4 7.6-6.2 7.4" />
      <path d="M19.5 4.5h-3.2L4.7 19.5h3.2" />
    </svg>
  );
}

export function IconeSnapchat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...BASE} {...props} aria-hidden>
      <path d="M12 4c3 0 4.6 2.1 4.6 5 0 1 .1 1.9.3 2.6.6.3 1.3-.1 1.8.1.4.2.4.9-.4 1.3-.5.3-1.2.4-1.4.8-.2.5.6 1.6 1.9 2.4.5.3.4.8-.3 1-.9.3-1.8.2-2.1.7-.2.4-.3.9-.9.7-1-.3-1.7-1-3.5-1s-2.5.7-3.5 1c-.6.2-.7-.3-.9-.7-.3-.5-1.2-.4-2.1-.7-.7-.2-.8-.7-.3-1 1.3-.8 2.1-1.9 1.9-2.4-.2-.4-.9-.5-1.4-.8-.8-.4-.8-1.1-.4-1.3.5-.2 1.2.2 1.8-.1.2-.7.3-1.6.3-2.6 0-2.9 1.6-5 4.6-5z" />
    </svg>
  );
}

export const ICONES_RESEAUX = {
  instagram: IconeInstagram,
  facebook: IconeFacebook,
  x: IconeX,
  snapchat: IconeSnapchat,
} as const;

export type CleReseau = keyof typeof ICONES_RESEAUX;
