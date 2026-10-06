/**
 * Jetons à usage unique (réinitialisation de mot de passe).
 * ---------------------------------------------------------------------------
 * Le jeton en clair n'est présent que dans le lien envoyé au propriétaire ;
 * la base ne conserve que son empreinte SHA-256. Un vol de la base ne permet
 * donc pas de réinitialiser un compte.
 *
 * Module réservé au serveur (`node:crypto`).
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Durée de vie d'un lien de réinitialisation : 30 minutes. */
export const DUREE_JETON_MINUTES = 30;

/** Empreinte SHA-256 d'un jeton, en hexadécimal. */
export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

/** Génère un jeton aléatoire (32 octets → 64 caractères hexadécimaux). */
export function creerJeton(): { clair: string; empreinte: string } {
  const clair = randomBytes(32).toString("hex");
  return { clair, empreinte: empreinteJeton(clair) };
}

/** Compare deux empreintes à temps constant (évite les attaques par timing). */
export function empreintesIdentiques(a: string, b: string): boolean {
  const tamponA = Buffer.from(a, "utf8");
  const tamponB = Buffer.from(b, "utf8");
  if (tamponA.length !== tamponB.length) return false;
  return timingSafeEqual(tamponA, tamponB);
}
