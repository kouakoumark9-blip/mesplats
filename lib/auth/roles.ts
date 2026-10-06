/**
 * Règles de navigation et d'accès — PURES (aucun import de base de données).
 *
 * Ce module est utilisé à la fois par le middleware (runtime Edge) et par les
 * composants serveur. Il ne doit donc jamais importer Drizzle ni `postgres`.
 */
import type { Role } from "@/lib/constants";

export type RegleAcces = {
  /** true = accessible sans être connecté. */
  publique: boolean;
  /** Rôles autorisés (ignoré si publique). */
  roles: Role[];
};

/** Préfixes protégés de l'application et rôles autorisés. */
export const ZONES_PROTEGEES: { prefixe: string; roles: Role[] }[] = [
  { prefixe: "/dashboard", roles: ["admin"] },
  { prefixe: "/service", roles: ["admin", "serveur", "cuisine"] },
  { prefixe: "/admin", roles: ["superadmin"] },
  { prefixe: "/mon-compte", roles: ["admin", "serveur", "cuisine", "superadmin"] },
];

/** Détermine la règle d'accès applicable à un chemin donné. */
export function regleAcces(chemin: string): RegleAcces {
  const zone = ZONES_PROTEGEES.find(
    (z) => chemin === z.prefixe || chemin.startsWith(`${z.prefixe}/`),
  );
  if (!zone) return { publique: true, roles: [] };
  return { publique: false, roles: zone.roles };
}

/** Page d'accueil de chaque rôle, utilisée après connexion et en cas de refus. */
export function espaceParDefaut(role: Role): string {
  switch (role) {
    case "superadmin":
      return "/admin";
    case "admin":
      return "/dashboard";
    default:
      return "/service";
  }
}

/** Un rôle a-t-il accès à cette zone ? */
export function aAcces(role: Role, chemin: string): boolean {
  const regle = regleAcces(chemin);
  if (regle.publique) return true;
  return regle.roles.includes(role);
}

/** Rôles autorisés à valider un paiement ou à annuler une commande. */
export function peutGererCommandes(role: Role): boolean {
  return role === "admin" || role === "serveur";
}

/** Rôles autorisés à modifier le catalogue, les tables, l'équipe. */
export function peutAdministrer(role: Role): boolean {
  return role === "admin";
}
