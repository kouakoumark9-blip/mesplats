"use server";

/**
 * Server Actions d'authentification.
 * ---------------------------------------------------------------------------
 * Toute validation est refaite côté serveur avec les schémas Zod partagés :
 * le client ne peut donc pas contourner les règles en désactivant le JS.
 */
import { and, eq, gt, isNotNull } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import type { EtatFormulaire } from "@/lib/actions/etat";
import { verifierIdentifiants } from "@/lib/auth/credentials";
import { creerJeton, empreinteJeton } from "@/lib/auth/jetons";
import { hacherMotDePasse, verifierMotDePasse } from "@/lib/auth/password";
import { espaceParDefaut } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { categories, restaurants, users } from "@/lib/db/schema";
import { emailConfigure, envoyerReinitialisation } from "@/lib/email";
import { appUrl } from "@/lib/env";
import {
  connexionSchema,
  demandeReinitialisationSchema,
  erreursParChamp,
  inscriptionSchema,
  reinitialisationSchema,
} from "@/lib/validations/auth";
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


/* -------------------------------------------------------------------------- */
/*                          Mot de passe oublié                               */
/* -------------------------------------------------------------------------- */

const MESSAGE_NEUTRE =
  "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être créé. " +
  "Pensez à regarder vos courriers indésirables.";

/**
 * Étape 1 — le propriétaire saisit son adresse e-mail.
 *
 * Réponse volontairement identique que le compte existe ou non : impossible de
 * découvrir les adresses enregistrées en testant la page. Le jeton n'est
 * valable que 30 minutes et son empreinte seule est stockée.
 */
export async function demanderReinitialisation(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const analyse = demandeReinitialisationSchema.safeParse({ email: formData.get("email") });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const email = analyse.data.email;

  const [compte] = await db
    .select({
      id: users.id,
      nom: users.nom,
      restaurantNom: restaurants.nom,
      restaurantActif: restaurants.actif,
    })
    .from(users)
    .leftJoin(restaurants, eq(users.restaurantId, restaurants.id))
    .where(and(eq(users.email, email), eq(users.actif, true)))
    .limit(1);

  if (!compte) {
    // On ne révèle rien : même message, même délai perçu.
    return { ok: true, message: MESSAGE_NEUTRE };
  }

  const { clair, empreinte } = creerJeton();
  const expiration = new Date(Date.now() + 30 * 60 * 1000);

  await db
    .update(users)
    .set({ resetToken: empreinte, resetExpire: expiration })
    .where(eq(users.id, compte.id));

  const lien = `${appUrl()}/reinitialiser-mot-de-passe?jeton=${clair}`;
  const envoi = await envoyerReinitialisation({
    destinataire: email,
    lien,
    restaurant: compte.restaurantNom,
  });

  if (envoi.envoye) {
    return { ok: true, message: MESSAGE_NEUTRE };
  }

  /*
   * Aucun service d'e-mail configuré (ou erreur d'envoi) : plutôt que de
   * laisser le propriétaire bloqué, l'application affiche le lien de secours.
   * Ce comportement est explicité dans le README ; en production, renseignez
   * RESEND_API_KEY pour que le lien parte par e-mail.
   */
  return {
    ok: true,
    message: emailConfigure()
      ? `Le lien n'a pas pu être envoyé. ${envoi.erreur ?? ""}`.trim()
      : "Aucun service d'e-mail n'est configuré sur cette installation. Voici votre lien de réinitialisation, à ouvrir tout de suite :",
    lien: emailConfigure() ? undefined : lien,
    note: emailConfigure()
      ? undefined
      : "Le lien reste valable 30 minutes. Ajoutez RESEND_API_KEY dans vos variables d'environnement pour que ces messages partent automatiquement.",
  };
}

/**
 * Étape 2 — le propriétaire choisit son nouveau mot de passe.
 * Le jeton est vérifié (empreinte + expiration), puis immédiatement invalidé.
 */
export async function reinitialiserMotDePasse(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const analyse = reinitialisationSchema.safeParse({
    jeton: formData.get("jeton"),
    motDePasse: formData.get("motDePasse"),
    confirmation: formData.get("confirmation"),
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const { jeton, motDePasse } = analyse.data;

  const [compte] = await db
    .select({ id: users.id, empreinte: users.resetToken })
    .from(users)
    .where(
      and(
        eq(users.resetToken, empreinteJeton(jeton)),
        isNotNull(users.resetExpire),
        gt(users.resetExpire, new Date()),
      ),
    )
    .limit(1);

  if (!compte) {
    return {
      ok: false,
      message:
        "Ce lien de réinitialisation est expiré ou a déjà été utilisé. Demandez-en un nouveau.",
    };
  }

  const empreinteMotDePasse = await hacherMotDePasse(motDePasse);

  await db
    .update(users)
    .set({
      motDePasseHash: empreinteMotDePasse,
      resetToken: null,
      resetExpire: null,
    })
    .where(eq(users.id, compte.id));

  redirect("/connexion?reinitialise=ok");
}

/* -------------------------------------------------------------------------- */
/*                     Vérification d'un jeton (page dédiée)                  */
/* -------------------------------------------------------------------------- */

/** true si le jeton fourni est encore valable (utilisé par la page de saisie). */
export async function jetonValide(jeton: string): Promise<boolean> {
  if (!jeton || jeton.length < 16) return false;
  const [compte] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.resetToken, empreinteJeton(jeton)),
        isNotNull(users.resetExpire),
        gt(users.resetExpire, new Date()),
      ),
    )
    .limit(1);
  return Boolean(compte);
}

/** Vérifie qu'un mot de passe correspond à celui du compte (zone danger). */
export async function verifierMotDePasseCompte(
  utilisateurId: string,
  motDePasse: string,
): Promise<boolean> {
  const [compte] = await db
    .select({ hash: users.motDePasseHash })
    .from(users)
    .where(eq(users.id, utilisateurId))
    .limit(1);
  return verifierMotDePasse(motDePasse, compte?.hash);
}
