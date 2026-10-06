/**
 * Garde-fous d'autorisation côté serveur (runtime Node).
 *
 * Deux familles de fonctions :
 *  - `exiger…` : pour les pages et layouts — redirige l'utilisateur.
 *  - `utilisateurApi` / `exiger…Api` : pour les routes d'API — renvoie une
 *    réponse JSON 401/403.
 *
 * ⚠️ Le middleware ne fait qu'un contrôle « grossier » sur le JWT. Ce module
 * est la seule source de vérité : il revérifie en base de données l'état du
 * restaurant (actif/suspendu, plan, devise) à chaque requête de page.
 */
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { espaceParDefaut } from "@/lib/auth/roles";
import type { Plan, Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";

export type SessionUtilisateur = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  /** Nul pour le super-admin de la plateforme. */
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantNom: string | null;
  plan: Plan;
  devise: string;
  /** false = établissement suspendu par la plateforme. */
  restaurantActif: boolean;
  /** Couleur principale du restaurant (thème du back-office). */
  couleurPrincipale: string;
  telephoneRestaurant: string | null;
};

/** Session brute, sans accès base de données. */
export async function sessionCourante() {
  return auth();
}

/**
 * Utilisateur connecté, enrichi des informations du restaurant.
 * Renvoie `null` si personne n'est connecté.
 */
export async function utilisateurCourant(): Promise<SessionUtilisateur | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const base: SessionUtilisateur = {
    id: session.user.id,
    nom: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    restaurantId: session.user.restaurantId ?? null,
    restaurantSlug: session.user.restaurantSlug ?? null,
    restaurantNom: session.user.restaurantNom ?? null,
    plan: "gratuit",
    devise: "FCFA",
    restaurantActif: true,
    couleurPrincipale: "#E4572E",
    telephoneRestaurant: null,
  };

  if (!base.restaurantId) return base;

  const [restaurant] = await db
    .select({
      nom: restaurants.nom,
      slug: restaurants.slug,
      plan: restaurants.plan,
      devise: restaurants.devise,
      actif: restaurants.actif,
      couleurPrincipale: restaurants.couleurPrincipale,
      telephone: restaurants.telephone,
    })
    .from(restaurants)
    .where(eq(restaurants.id, base.restaurantId))
    .limit(1);

  if (!restaurant) return null;

  return {
    ...base,
    restaurantActif: restaurant.actif,
    restaurantNom: restaurant.nom,
    restaurantSlug: restaurant.slug,
    plan: restaurant.plan,
    devise: restaurant.devise,
    couleurPrincipale: restaurant.couleurPrincipale,
    telephoneRestaurant: restaurant.telephone,
  };
}

/* -------------------------------------------------------------------------- */
/*                          Version « pages » (redirections)                  */
/* -------------------------------------------------------------------------- */

/** Exige une session valide, sinon redirige vers /connexion. */
export async function exigerUtilisateur(): Promise<SessionUtilisateur> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) redirect("/connexion");

  // Sécurité : la suspension est revérifiée en base à chaque requête (et non
  // seulement au moment de la connexion), le JWT pouvant rester valide 30 jours.
  if (utilisateur.role !== "superadmin") {
    if (
      !utilisateur.restaurantId ||
      !utilisateur.restaurantSlug ||
      !utilisateur.restaurantActif
    ) {
      redirect("/compte-suspendu");
    }
  }

  return utilisateur;
}

/** Exige une session valide ET l'un des rôles fournis. */
export async function exigerRole(...roles: Role[]): Promise<SessionUtilisateur> {
  const utilisateur = await exigerUtilisateur();
  if (!roles.includes(utilisateur.role)) {
    redirect(espaceParDefaut(utilisateur.role));
  }
  return utilisateur;
}

/** Exige un restaurant : garantit un `restaurantId` non nul. */
export async function exigerRestaurant(): Promise<SessionUtilisateur & { restaurantId: string }> {
  const utilisateur = await exigerUtilisateur();
  if (!utilisateur.restaurantId) redirect("/admin");
  return utilisateur as SessionUtilisateur & { restaurantId: string };
}

/* -------------------------------------------------------------------------- */
/*                            Version « API » (JSON)                          */
/* -------------------------------------------------------------------------- */

export function nonAutorise(message = "Connexion requise.") {
  return NextResponse.json({ erreur: message }, { status: 401 });
}

export function interdit(message = "Action non autorisée.") {
  return NextResponse.json({ erreur: message }, { status: 403 });
}

export function mauvaiseRequete(message = "Requête invalide.") {
  return NextResponse.json({ erreur: message }, { status: 400 });
}

export function introuvable(message = "Élément introuvable.") {
  return NextResponse.json({ erreur: message }, { status: 404 });
}

/**
 * Récupère l'utilisateur connecté pour une route d'API.
 * Retourne soit `{ utilisateur }`, soit `{ reponse }` (401) — à traiter ainsi :
 *
 * ```ts
 * const garde = await exigerApi("serveur");
 * if ("reponse" in garde) return garde.reponse;
 * const { utilisateur } = garde;
 * ```
 */
export async function exigerApi(
  ...roles: Role[]
): Promise<{ utilisateur: SessionUtilisateur } | { reponse: NextResponse }> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { reponse: nonAutorise() };
  if (roles.length > 0 && !roles.includes(utilisateur.role)) return { reponse: interdit() };
  return { utilisateur };
}

/** Exige un utilisateur rattaché à un restaurant (toutes les actions métier). */
export async function exigerApiRestaurant(
  ...roles: Role[]
): Promise<{ utilisateur: SessionUtilisateur & { restaurantId: string } } | { reponse: NextResponse }> {
  const garde = await exigerApi(...roles);
  if ("reponse" in garde) return garde;
  if (!garde.utilisateur.restaurantId) {
    return { reponse: interdit("Aucun restaurant associé à ce compte.") };
  }
  if (!garde.utilisateur.restaurantActif) {
    return { reponse: interdit("Établissement suspendu : contactez le support AfriMenu.") };
  }
  return { utilisateur: garde.utilisateur as SessionUtilisateur & { restaurantId: string } };
}
