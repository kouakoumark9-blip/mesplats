"use server";

/**
 * Server Actions de l'équipe (comptes serveur et cuisine).
 * ---------------------------------------------------------------------------
 * Toutes les actions sont réservées au propriétaire (`admin`) et vérifient que
 * le compte visé appartient bien à SON restaurant : un admin ne peut ni créer,
 * ni suspendre, ni supprimer un compte d'un autre établissement.
 *
 * Le mot de passe n'est jamais stocké en clair : bcrypt côté serveur, et la
 * réinitialisation génère un mot de passe temporaire affiché une seule fois.
 */
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { EtatFormulaire } from "@/lib/actions/etat";
import { exigerRole } from "@/lib/auth/autorisation";
import { hacherMotDePasse } from "@/lib/auth/password";
import { LIBELLES_PLAN, LIMITE_COMPTES_EQUIPE } from "@/lib/constants";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { creationEmployeSchema, erreursParChamp } from "@/lib/validations/auth";

export type ResultatEquipe = { ok: boolean; message?: string; motDePasseTemporaire?: string };

export async function creerEmploye(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const analyse = creationEmployeSchema.safeParse({
    nom: formData.get("nom"),
    email: formData.get("email"),
    role: formData.get("role"),
    motDePasse: formData.get("motDePasse"),
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const donnees = analyse.data;

  const limite = LIMITE_COMPTES_EQUIPE[utilisateur.plan];
  if (limite !== null) {
    const [compteur] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.restaurantId, restaurantId));

    if ((compteur?.total ?? 0) >= limite) {
      return {
        ok: false,
        message:
          `Votre formule ${LIBELLES_PLAN[utilisateur.plan]} permet ${limite} comptes d'équipe. ` +
          "Passez à la formule Pro pour des comptes illimités (9 900 FCFA / mois).",
      };
    }
  }

  const [existant] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, donnees.email))
    .limit(1);

  if (existant) {
    return {
      ok: false,
      erreurs: { email: "Cette adresse email est déjà utilisée par un compte Mesplats." },
    };
  }

  await db.insert(users).values({
    restaurantId,
    nom: donnees.nom,
    email: donnees.email,
    motDePasseHash: await hacherMotDePasse(donnees.motDePasse),
    role: donnees.role,
    actif: true,
  });

  revalidatePath("/dashboard/equipe");
  return {
    ok: true,
    message:
      `${donnees.nom} peut désormais se connecter à l'écran de service ` +
      `avec ${donnees.email}.`,
  };
}

export async function basculerEmploye(id: string, actif: boolean): Promise<ResultatEquipe> {
  const utilisateur = await exigerRole("admin");

  if (id === utilisateur.id) {
    return { ok: false, message: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  const resultat = await db
    .update(users)
    .set({ actif })
    .where(and(eq(users.id, id), eq(users.restaurantId, utilisateur.restaurantId!)))
    .returning({ id: users.id, nom: users.nom });

  if (resultat.length === 0) return { ok: false, message: "Compte introuvable." };

  revalidatePath("/dashboard/equipe");
  return {
    ok: true,
    message: actif
      ? `Accès réactivé pour ${resultat[0].nom}.`
      : `Accès suspendu pour ${resultat[0].nom} : ses sessions en cours seront coupées.`,
  };
}

export async function supprimerEmploye(id: string): Promise<ResultatEquipe> {
  const utilisateur = await exigerRole("admin");

  if (id === utilisateur.id) {
    return { ok: false, message: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const [cible] = await db
    .select({ id: users.id, nom: users.nom, role: users.role })
    .from(users)
    .where(and(eq(users.id, id), eq(users.restaurantId, utilisateur.restaurantId!)))
    .limit(1);

  if (!cible) return { ok: false, message: "Compte introuvable." };

  // On protège le dernier propriétaire : sans lui, plus personne ne gère le compte.
  if (cible.role === "admin") {
    const [admins] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.restaurantId, utilisateur.restaurantId!), eq(users.role, "admin")));

    if ((admins?.total ?? 0) <= 1) {
      return { ok: false, message: "Impossible de supprimer le dernier propriétaire du compte." };
    }
  }

  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.restaurantId, utilisateur.restaurantId!)));

  revalidatePath("/dashboard/equipe");
  return { ok: true, message: `${cible.nom} a été retiré de l'équipe.` };
}

/**
 * Réinitialise le mot de passe d'un membre : un mot de passe temporaire est
 * généré, haché en base et affiché **une seule fois** au propriétaire, qui le
 * transmet de vive voix ou par WhatsApp.
 */
export async function reinitialiserMotDePasseEmploye(id: string): Promise<ResultatEquipe> {
  const utilisateur = await exigerRole("admin");

  const [cible] = await db
    .select({ id: users.id, nom: users.nom })
    .from(users)
    .where(and(eq(users.id, id), eq(users.restaurantId, utilisateur.restaurantId!)))
    .limit(1);

  if (!cible) return { ok: false, message: "Compte introuvable." };

  const temporaire = motDePasseTemporaire();

  await db
    .update(users)
    .set({
      motDePasseHash: await hacherMotDePasse(temporaire),
      resetToken: null,
      resetExpire: null,
    })
    .where(and(eq(users.id, id), eq(users.restaurantId, utilisateur.restaurantId!)));

  revalidatePath("/dashboard/equipe");
  return {
    ok: true,
    message: `Nouveau mot de passe pour ${cible.nom}. Transmettez-le puis demandez-lui de le changer depuis « Mon compte ».`,
    motDePasseTemporaire: temporaire,
  };
}

/** Mot de passe temporaire lisible (12 caractères, sans ambiguïté visuelle). */
function motDePasseTemporaire(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const octets = randomBytes(12);
  let sortie = "";
  for (const octet of octets) sortie += alphabet[octet % alphabet.length];
  return `${sortie.slice(0, 4)}-${sortie.slice(4, 8)}-${sortie.slice(8, 12)}`;
}
