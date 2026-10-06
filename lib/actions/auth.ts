"use server";

/**
 * Server Actions d'authentification.
 * ---------------------------------------------------------------------------
 * Toute validation est refaite côté serveur avec les schémas Zod partagés :
 * le client ne peut donc pas contourner les règles en désactivant le JS.
 */
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import type { EtatFormulaire } from "@/lib/actions/etat";
import { verifierIdentifiants } from "@/lib/auth/credentials";
import { hacherMotDePasse } from "@/lib/auth/password";
import { espaceParDefaut } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { categories, restaurants, users } from "@/lib/db/schema";
import { connexionSchema, erreursParChamp, inscriptionSchema } from "@/lib/validations/auth";
import { normaliserTelephone, slugUnique } from "@/lib/utils";


/* -------------------------------------------------------------------------- */
/*                                 Connexion                                  */
/* -------------------------------------------------------------------------- */

export async function connexionAction(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = connexionSchema.safeParse({
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
  });

  if (!resultat.success) {
    return { ok: false, erreurs: erreursParChamp(resultat.error) };
  }

  const { email, motDePasse } = resultat.data;

  /*
   * Les identifiants sont vérifiés AVANT la création de la session : Auth.js
   * écrit le cookie dans la réponse HTTP, de sorte que `auth()` ne verrait pas
   * encore la session au sein de cette même requête. Connaître le rôle ici
   * permet de rediriger l'utilisateur vers son espace sans dépendre de la
   * session fraîchement posée.
   */
  const identite = await verifierIdentifiants(email, motDePasse);

  if (!identite) {
    // Message volontairement identique pour un email inconnu, un mot de passe
    // erroné ou un restaurant suspendu après connexion.
    return {
      ok: false,
      message: "Email ou mot de passe incorrect. Vérifiez vos identifiants puis réessayez.",
    };
  }

  try {
    await signIn("credentials", { email, motDePasse, redirect: false });
  } catch (erreur) {
    if (erreur instanceof AuthError) {
      return {
        ok: false,
        message: "Connexion impossible pour le moment. Réessayez dans un instant.",
      };
    }
    throw erreur; // Redirections et erreurs inattendues remontent à Next.js.
  }

  redirect(espaceParDefaut(identite.role));
}

/* -------------------------------------------------------------------------- */
/*                                Inscription                                 */
/* -------------------------------------------------------------------------- */

export async function inscriptionAction(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = inscriptionSchema.safeParse({
    nomRestaurant: formData.get("nomRestaurant"),
    nom: formData.get("nom"),
    email: formData.get("email"),
    telephone: formData.get("telephone") ?? "",
    motDePasse: formData.get("motDePasse"),
    confirmation: formData.get("confirmation"),
  });

  if (!resultat.success) {
    return { ok: false, erreurs: erreursParChamp(resultat.error) };
  }

  const donnees = resultat.data;

  // Unicité de l'email.
  const [dejaInscrit] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, donnees.email))
    .limit(1);

  if (dejaInscrit) {
    return {
      ok: false,
      erreurs: { email: "Un compte existe déjà avec cette adresse email." },
    };
  }

  // Slug public unique dérivé du nom du restaurant.
  const slug = await slugUnique(donnees.nomRestaurant, async (candidat) => {
    const [existe] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.slug, candidat))
      .limit(1);
    return Boolean(existe);
  });

  const motDePasseHash = await hacherMotDePasse(donnees.motDePasse);

  // Création du restaurant puis du compte propriétaire.
  const [restaurant] = await db
    .insert(restaurants)
    .values({
      nom: donnees.nomRestaurant,
      slug,
      telephone: donnees.telephone
        ? normaliserTelephone(donnees.telephone)
        : null,
      plan: "gratuit",
      devise: "FCFA",
    })
    .returning({ id: restaurants.id });

  await db.insert(users).values({
    restaurantId: restaurant.id,
    nom: donnees.nom,
    email: donnees.email,
    motDePasseHash,
    role: "admin",
  });

  // Deux catégories vides pour démarrer rapidement le menu.
  await db.insert(categories).values([
    { restaurantId: restaurant.id, nom: "Plats", ordre: 1 },
    { restaurantId: restaurant.id, nom: "Boissons", ordre: 2 },
  ]);

  // Connexion automatique du nouveau propriétaire.
  try {
    await signIn("credentials", {
      email: donnees.email,
      motDePasse: donnees.motDePasse,
      redirect: false,
    });
  } catch (erreur) {
    if (!(erreur instanceof AuthError)) throw erreur;
    // Cas très rare : on renvoie vers la page de connexion.
    redirect("/connexion?inscription=ok");
  }

  redirect("/dashboard");
}
