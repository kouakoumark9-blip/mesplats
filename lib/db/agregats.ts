/**
 * Fragments SQL réutilisables pour les compteurs et agrégats.
 *
 * ⚠️ Pourquoi du SQL écrit à la main plutôt que des références Drizzle ?
 * Dans une liste `select`, Drizzle génère parfois les colonnes **sans**
 * qualification de table (`"restaurant_id"` au lieu de `"products"."restaurant_id"`).
 * À l'intérieur d'une sous-requête corrélée, ces noms non qualifiés se
 * résolvent alors sur la table **interne** et le compteur renvoie toujours 0.
 * On écrit donc les sous-requêtes avec des identifiants pleinement qualifiés.
 *
 * Aucun identifiant n'est dynamique ici : aucune donnée utilisateur n'est
 * interpolée, il n'y a donc aucun risque d'injection SQL.
 */
import { sql, type SQL } from "drizzle-orm";

/** Nombre de produits d'un restaurant (toutes catégories confondues). */
export function sousRequeteProduits(): SQL<number> {
  return sql<number>`(
    select count(*)::int from "products" as p_compteur
    where p_compteur.restaurant_id = "restaurants"."id"
  )`;
}

/** Nombre de comptes d'équipe rattachés au restaurant. */
export function sousRequeteEquipe(): SQL<number> {
  return sql<number>`(
    select count(*)::int from "users" as u_compteur
    where u_compteur.restaurant_id = "restaurants"."id"
  )`;
}

/** Nombre de commandes (toutes périodes, hors annulées). */
export function sousRequeteCommandes(): SQL<number> {
  return sql<number>`(
    select count(*)::int from "orders" as o_compteur
    where o_compteur.restaurant_id = "restaurants"."id"
      and o_compteur.statut <> 'annulee'
  )`;
}

/** Chiffre d'affaires cumulé (hors commandes annulées). */
export function sousRequeteChiffreAffaires(): SQL<number> {
  return sql<number>`(
    select coalesce(sum(o_chiffre.total), 0)::int from "orders" as o_chiffre
    where o_chiffre.restaurant_id = "restaurants"."id"
      and o_chiffre.statut <> 'annulee'
  )`;
}

/** Nombre de tables du restaurant. */
export function sousRequeteTables(): SQL<number> {
  return sql<number>`(
    select count(*)::int from "tables" as t_compteur
    where t_compteur.restaurant_id = "restaurants"."id"
  )`;
}
