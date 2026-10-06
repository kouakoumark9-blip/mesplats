/**
 * Vérification des identifiants — SOURCE UNIQUE utilisée à la fois par le
 * provider Credentials d'Auth.js et par la Server Action de connexion.
 *
 * Pourquoi ce partage ? Auth.js pose le cookie de session dans la réponse
 * HTTP : `auth()` ne voit pas encore la session au sein de la même requête.
 * La Server Action doit donc connaître le rôle pour rediriger l'utilisateur
 * vers son espace, sans dépendre de la session fraîchement créée.
 */
import { eq } from "drizzle-orm";

import { comparerAvecEmpreinteFactice, verifierMotDePasse } from "@/lib/auth/password";
import type { Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";

export type IdentiteVerifiee = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  restaurantId: string | null;
  restaurantNom: string | null;
  restaurantSlug: string | null;
  restaurantActif: boolean;
};

/**
 * Renvoie l'identité si l'email et le mot de passe correspondent à un compte
 * actif rattaché à un restaurant non suspendu, sinon `null`.
 */
export async function verifierIdentifiants(
  email: string,
  motDePasse: string,
): Promise<IdentiteVerifiee | null> {
  const [ligne] = await db
    .select({
      id: users.id,
      nom: users.nom,
      email: users.email,
      role: users.role,
      actif: users.actif,
      motDePasseHash: users.motDePasseHash,
      restaurantId: users.restaurantId,
      restaurantNom: restaurants.nom,
      restaurantSlug: restaurants.slug,
      restaurantActif: restaurants.actif,
    })
    .from(users)
    .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
    .where(eq(users.email, email))
    .limit(1);

  // Compte inconnu : on compare malgré tout une empreinte factice pour que le
  // temps de réponse ne révèle pas l'existence de l'adresse email.
  if (!ligne) {
    await comparerAvecEmpreinteFactice(motDePasse);
    return null;
  }

  if (!(await verifierMotDePasse(motDePasse, ligne.motDePasseHash))) return null;
  if (!ligne.actif) return null;

  // Le super-admin de la plateforme n'est rattaché à aucun restaurant.
  if (ligne.role !== "superadmin" && ligne.restaurantActif === false) return null;

  // Journalise la dernière connexion (informations utiles à l'écran Équipe).
  void db
    .update(users)
    .set({ dernierAccesAt: new Date() })
    .where(eq(users.id, ligne.id))
    .catch(() => undefined);

  return {
    id: ligne.id,
    nom: ligne.nom,
    email: ligne.email,
    role: ligne.role,
    restaurantId: ligne.restaurantId ?? null,
    restaurantNom: ligne.restaurantNom ?? null,
    restaurantSlug: ligne.restaurantSlug ?? null,
    restaurantActif: ligne.restaurantActif ?? true,
  };
}
