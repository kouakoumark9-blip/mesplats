import { clsx, type ClassValue } from "clsx";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

import { PAYS_AFRIQUE_OUEST, PAYS_DEFAUT } from "@/lib/constants";

/** Fusionne des classes Tailwind sans conflits. */
export function cn(...entrees: ClassValue[]): string {
  return twMerge(clsx(entrees));
}

/* -------------------------------------------------------------------------- */
/*                                  Montants                                  */
/* -------------------------------------------------------------------------- */

const formateurNombre = new Intl.NumberFormat("fr-FR");

/*
 * `Intl.NumberFormat("fr-FR")` sépare les milliers par une espace fine insécable
 * (U+202F). Selon la police utilisée — et notamment dans les tableaux de bord et
 * les factures — ce caractère est si étroit qu'il disparaît : « 24 900 » se lit
 * alors « 24900 » et « 2 500 FCFA » se lit « 2500FCFA ». On normalise donc sur
 * l'espace insécable classique (U+00A0), visible et qui empêche toujours la
 * coupure en fin de ligne.
 */
function grouper(nombre: number): string {
  return formateurNombre.format(nombre).replace(/\u202F|\u00A0|\u2009/g, "\u00A0");
}

/** 1500 → « 1 500 FCFA » */
export function formatFcfa(montant: number, devise = "FCFA"): string {
  const valeur = Number.isFinite(montant) ? Math.round(montant) : 0;
  return `${grouper(valeur)}\u00A0${devise}`;
}

/** 1500 → « 1 500 » (sans devise, pour les tableaux compacts) */
export function formatNombre(montant: number): string {
  return grouper(Math.round(montant || 0));
}

/* -------------------------------------------------------------------------- */
/*                                   Slugs                                    */
/* -------------------------------------------------------------------------- */

/** « Maquis Le Baoulé » → « maquis-le-baoule » */
export function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Génère un slug unique à partir d'un nom : ajoute -2, -3… si nécessaire.
 * `existe` interroge la base de données.
 */
export async function slugUnique(
  nom: string,
  existe: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(nom) || "restaurant";
  let candidat = base;
  let suffixe = 2;
  // 50 tentatives suffisent largement en pratique.
  while (await existe(candidat)) {
    candidat = `${base}-${suffixe}`;
    suffixe += 1;
    if (suffixe > 50) {
      candidat = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  return candidat;
}

/* -------------------------------------------------------------------------- */
/*                              Téléphone / pays                              */
/* -------------------------------------------------------------------------- */

/** Retire tout sauf les chiffres. */
export function chiffresSeuls(valeur: string): string {
  return (valeur || "").replace(/\D/g, "");
}

/**
 * Normalise un numéro au format international E.164 sans « + »
 * (ex. « 07 07 12 34 56 » + « +225 » → « 2250707123456 »).
 */
export function normaliserTelephone(numero: string, indicatif = PAYS_DEFAUT.indicatif): string {
  let chiffres = chiffresSeuls(numero);
  const indicatifChiffres = chiffresSeuls(indicatif);

  // Le numéro contient déjà l'indicatif (saisi en 00XX… ou +XX…)
  if (chiffres.startsWith("00")) chiffres = chiffres.slice(2);
  if (chiffres.startsWith(indicatifChiffres)) return chiffres;
  // Numéro local avec un 0 initial (Côte d'Ivoire : 01, 05, 07…)
  if (chiffres.startsWith("0")) chiffres = chiffres.replace(/^0+/, "");
  return `${indicatifChiffres}${chiffres}`;
}

/** « 2250707123456 » → « +225 07 07 12 34 56 » (affichage lisible). */
export function formatTelephone(international: string): string {
  const chiffres = chiffresSeuls(international);
  const pays =
    [...PAYS_AFRIQUE_OUEST]
      .sort((a, b) => b.indicatif.length - a.indicatif.length)
      .find((p) => chiffres.startsWith(chiffresSeuls(p.indicatif))) ?? PAYS_DEFAUT;

  const indicatif = chiffresSeuls(pays.indicatif);
  const local = chiffres.slice(indicatif.length);

  // Groupes de 2 chiffres : 07 07 12 34 56
  const groupes = local.match(/.{1,2}/g)?.join(" ") ?? local;
  return `+${indicatif} ${groupes}`.trim();
}

/** Lien WhatsApp pré-rempli (sans « + » : wa.me attend le format international brut). */
export function lienWhatsApp(message: string, telephone?: string | null): string {
  const texte = encodeURIComponent(message);
  const numero = telephone ? chiffresSeuls(telephone) : "";
  return numero ? `https://wa.me/${numero}?text=${texte}` : `https://wa.me/?text=${texte}`;
}

/** Lien SMS pré-rempli (compatible iOS « &body= », Android « ?body= »). */
export function lienSms(message: string, telephone?: string | null): string {
  const numero = telephone ? `+${chiffresSeuls(telephone)}` : "";
  return `sms:${numero}?body=${encodeURIComponent(message)}`;
}

/** Lien d'appel téléphonique. */
export function lienTel(telephone?: string | null): string {
  return `tel:+${chiffresSeuls(telephone ?? "")}`;
}

/* -------------------------------------------------------------------------- */
/*                                   Dates                                    */
/* -------------------------------------------------------------------------- */

/**
 * La Côte d'Ivoire et la majorité des pays de la zone sont sur GMT (UTC+0) :
 * le fuseau serveur (UTC) correspond donc au fuseau local des restaurants.
 * Si un client exploite plusieurs fuseaux, ce paramètre est le point unique
 * à adapter.
 */
export const FUSEAU_APP = "Africa/Abidjan";

/** « 14:32 » */
export function formatHeure(date: Date | string): string {
  return format(new Date(date), "HH:mm", { locale: fr });
}

/** « 12 oct. 2026 » */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy", { locale: fr });
}

/** « 12 oct. à 14:32 » */
export function formatDateHeure(date: Date | string): string {
  return format(new Date(date), "d MMM 'à' HH:mm", { locale: fr });
}

/** « Aujourd'hui à 14:32 », « Hier à 20:10 », sinon « 12 oct. à 14:32 ». */
export function formatRelatif(date: Date | string): string {
  const d = new Date(date);
  const heure = format(d, "HH:mm", { locale: fr });
  if (isToday(d)) return `Aujourd'hui à ${heure}`;
  if (isYesterday(d)) return `Hier à ${heure}`;
  return format(d, "d MMM 'à' HH:mm", { locale: fr });
}

/** Bornes du jour courant (fuseau UTC = fuseau local en Afrique de l'Ouest). */
export function bornesJour(date = new Date()): { debut: Date; fin: Date } {
  const debut = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
  const fin = new Date(debut.getTime() + 24 * 60 * 60 * 1000);
  return { debut, fin };
}

/* -------------------------------------------------------------------------- */
/*                                  Divers                                    */
/* -------------------------------------------------------------------------- */

/** Couleur de texte (blanc ou noir) offrant le meilleur contraste sur un fond. */
export function contrasteSur(hex: string): "#ffffff" | "#111111" {
  const c = hex.replace("#", "");
  const complet = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(complet.slice(0, 2), 16) || 0;
  const g = parseInt(complet.slice(2, 4), 16) || 0;
  const b = parseInt(complet.slice(4, 6), 16) || 0;
  // Luminance relative (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#ffffff";
}

/** Tronque un texte proprement. */
export function tronquer(texte: string, longueur = 80): string {
  return texte.length > longueur ? `${texte.slice(0, longueur - 1).trimEnd()}…` : texte;
}

/** Initiales pour les avatars : « Maquis Le Baoulé » → « MB ». */
export function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter((mot) => mot.length > 2 || /^[A-Z]/.test(mot))
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? "")
    .join("");
}

/** Valide une couleur hexadécimale (#RRGGBB). */
export function estCouleurHex(valeur: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(valeur);
}

export function identifiantCourt(): string {
  return Math.random().toString(36).slice(2, 10);
}
