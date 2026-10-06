"use server";

/**
 * Server Actions du back-office : profil du restaurant, moyens de paiement,
 * catégories et plats.
 * ---------------------------------------------------------------------------
 * Règles appliquées par TOUTES les actions de ce fichier :
 *  1. garde de rôle (`exigerRole("admin")`) — un serveur ne gère pas le menu ;
 *  2. `restaurantId` issu de la session (jamais du formulaire) : impossible de
 *     modifier les données d'un autre établissement ;
 *  3. validation Zod côté serveur, même si le client valide déjà ;
 *  4. `revalidatePath` pour rafraîchir le back-office et le menu public.
 */
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { EtatFormulaire } from "@/lib/actions/etat";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_PRODUITS } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  categories,
  paymentMethods,
  productOptions,
  products,
  restaurants,
} from "@/lib/db/schema";
import {
  categorieSchema,
  moyenPaiementSchema,
  produitSchema,
  profilRestaurantSchema,
  type DonneesOption,
} from "@/lib/validations/catalogue";
import { erreursParChamp } from "@/lib/validations/auth";
import { normaliserTelephone } from "@/lib/utils";

export type ResultatAction = { ok: boolean; message?: string };

const OK: ResultatAction = { ok: true };

function echec(message: string): ResultatAction {
  return { ok: false, message };
}

/** Rafraîchit les écrans concernés après une modification du catalogue. */
function rafraichir(slug?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu");
  revalidatePath("/dashboard/parametres");
  // Le menu public est rendu dynamiquement, mais on invalide tout de même le
  // cache client pour que « Voir mon menu » reflète la modification aussitôt.
  if (slug) revalidatePath(`/m/${slug}`);
}

/* -------------------------------------------------------------------------- */
/*                                   Profil                                   */
/* -------------------------------------------------------------------------- */

/** Vérification d'unicité du slug, appelée en direct depuis le formulaire. */
export async function verifierSlugAction(slug: string): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");
  const analyse = profilRestaurantSchema.shape.slug.safeParse(slug);

  if (!analyse.success) {
    return echec(analyse.error.issues[0]?.message ?? "Adresse invalide.");
  }

  const [existant] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(
      and(
        eq(restaurants.slug, analyse.data),
        utilisateur.restaurantId ? ne(restaurants.id, utilisateur.restaurantId) : undefined,
      ),
    )
    .limit(1);

  return existant
    ? echec("Cette adresse est déjà utilisée par un autre restaurant.")
    : OK;
}

export async function enregistrerProfil(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");

  const analyse = profilRestaurantSchema.safeParse({
    nom: formData.get("nom"),
    slug: formData.get("slug"),
    adresse: formData.get("adresse") ?? "",
    horaires: formData.get("horaires") ?? "",
    telephone: formData.get("telephone") ?? "",
    couleurPrincipale: formData.get("couleurPrincipale"),
    devise: formData.get("devise"),
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const donnees = analyse.data;

  // Unicité de l'adresse publique (l'erreur est rattachée au champ `slug`).
  const [conflit] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(and(eq(restaurants.slug, donnees.slug), ne(restaurants.id, utilisateur.restaurantId!)))
    .limit(1);

  if (conflit) {
    return {
      ok: false,
      erreurs: { slug: "Cette adresse est déjà utilisée par un autre restaurant." },
    };
  }

  await db
    .update(restaurants)
    .set({
      nom: donnees.nom,
      slug: donnees.slug,
      adresse: donnees.adresse || null,
      horaires: donnees.horaires || null,
      telephone: donnees.telephone ? normaliserTelephone(donnees.telephone) : null,
      couleurPrincipale: donnees.couleurPrincipale.toUpperCase(),
      devise: donnees.devise,
      updatedAt: new Date(),
    })
    .where(eq(restaurants.id, utilisateur.restaurantId!));

  rafraichir(utilisateur.restaurantSlug);
  rafraichir(donnees.slug);

  return {
    ok: true,
    message: "Profil enregistré. Votre menu public est à jour immédiatement.",
  };
}

/* -------------------------------------------------------------------------- */
/*                          Moyens de paiement (MoMo)                         */
/* -------------------------------------------------------------------------- */

export async function enregistrerMoyenPaiement(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");

  const analyse = moyenPaiementSchema.safeParse({
    operateur: formData.get("operateur"),
    numero: formData.get("numero"),
    titulaire: formData.get("titulaire") ?? "",
    actif: formData.get("actif") === "true",
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const donnees = analyse.data;
  const numero = `+${donnees.numero.replace(/\D/g, "")}`;

  // Un seul compte par opérateur et par restaurant (contrainte de la table).
  await db
    .insert(paymentMethods)
    .values({
      restaurantId: utilisateur.restaurantId!,
      operateur: donnees.operateur,
      numero,
      titulaire: donnees.titulaire || null,
      actif: donnees.actif,
    })
    .onConflictDoUpdate({
      target: [paymentMethods.restaurantId, paymentMethods.operateur],
      set: {
        numero,
        titulaire: donnees.titulaire || null,
        actif: donnees.actif,
      },
    });

  rafraichir(utilisateur.restaurantSlug);

  return { ok: true, message: "Moyen de paiement enregistré." };
}

export async function supprimerMoyenPaiement(operateur: string): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");

  await db
    .delete(paymentMethods)
    .where(
      and(
        eq(paymentMethods.restaurantId, utilisateur.restaurantId!),
        eq(paymentMethods.operateur, operateur as "orange"),
      ),
    );

  rafraichir(utilisateur.restaurantSlug);
  return OK;
}

/* -------------------------------------------------------------------------- */
/*                                 Catégories                                 */
/* -------------------------------------------------------------------------- */

export async function enregistrerCategorie(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const analyse = categorieSchema.safeParse({
    id: formData.get("id") ?? "",
    nom: formData.get("nom"),
    visible: formData.get("visible") !== "false",
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const { id, nom, visible } = analyse.data;

  if (id) {
    // La catégorie doit appartenir au restaurant (isolation multi-tenant).
    const [existante] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)))
      .limit(1);

    if (!existante) return { ok: false, message: "Catégorie introuvable." };

    await db
      .update(categories)
      .set({ nom, visible: visible ?? true })
      .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)));
  } else {
    const [max] = await db
      .select({ ordre: sql<number>`coalesce(max(ordre), 0)::int` })
      .from(categories)
      .where(eq(categories.restaurantId, restaurantId));

    await db.insert(categories).values({
      restaurantId,
      nom,
      ordre: (max?.ordre ?? 0) + 1,
      visible: visible ?? true,
    });
  }

  rafraichir(utilisateur.restaurantSlug);
  return { ok: true, message: id ? "Catégorie modifiée." : "Catégorie ajoutée." };
}

export async function basculerVisibiliteCategorie(
  id: string,
  visible: boolean,
): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");

  const resultat = await db
    .update(categories)
    .set({ visible })
    .where(
      and(
        eq(categories.id, id),
        eq(categories.restaurantId, utilisateur.restaurantId!),
      ),
    )
    .returning({ id: categories.id });

  if (resultat.length === 0) return echec("Catégorie introuvable.");

  rafraichir(utilisateur.restaurantSlug);
  return OK;
}

/** Déplace une catégorie d'un cran (renumérote ensuite tous les rangs). */
export async function deplacerCategorie(
  id: string,
  sens: "haut" | "bas",
): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const liste = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.restaurantId, restaurantId))
    .orderBy(asc(categories.ordre), asc(categories.createdAt));

  const position = liste.findIndex((c) => c.id === id);
  if (position === -1) return echec("Catégorie introuvable.");

  const cible = sens === "haut" ? position - 1 : position + 1;
  if (cible < 0 || cible >= liste.length) return OK; // déjà en haut / en bas

  const reordonnee = [...liste];
  [reordonnee[position], reordonnee[cible]] = [reordonnee[cible], reordonnee[position]];

  await db.transaction(async (tx) => {
    for (const [index, categorie] of reordonnee.entries()) {
      await tx
        .update(categories)
        .set({ ordre: index + 1 })
        .where(and(eq(categories.id, categorie.id), eq(categories.restaurantId, restaurantId)));
    }
  });

  rafraichir(utilisateur.restaurantSlug);
  return OK;
}

export async function supprimerCategorie(
  id: string,
  avecProduits = false,
): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [categorie] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)))
    .limit(1);

  if (!categorie) return echec("Catégorie introuvable.");

  const [compteur] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(and(eq(products.categoryId, id), eq(products.restaurantId, restaurantId)));

  if ((compteur?.total ?? 0) > 0 && !avecProduits) {
    return echec(
      `Cette catégorie contient ${compteur.total} plat(s). Confirmez la suppression pour tout effacer.`,
    );
  }

  // Les plats (et leurs options) sont supprimés en cascade par la base.
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)));

  rafraichir(utilisateur.restaurantSlug);
  return { ok: true, message: "Catégorie supprimée." };
}

/* -------------------------------------------------------------------------- */
/*                                   Plats                                    */
/* -------------------------------------------------------------------------- */

export async function enregistrerProduit(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  // Les options arrivent en JSON depuis l'éditeur du formulaire.
  let options: DonneesOption[] = [];
  const brut = formData.get("options");
  if (typeof brut === "string" && brut.trim().length > 0) {
    try {
      const analyse = JSON.parse(brut) as unknown;
      options = Array.isArray(analyse) ? (analyse as DonneesOption[]) : [];
    } catch {
      return { ok: false, message: "Les options du plat sont illisibles. Réessayez." };
    }
  }

  const analyse = produitSchema.safeParse({
    id: formData.get("id") ?? "",
    categoryId: formData.get("categoryId"),
    nom: formData.get("nom"),
    description: formData.get("description") ?? "",
    prix: formData.get("prix"),
    photo: formData.get("photo") ?? "",
    disponible: formData.get("disponible") !== "false",
    options,
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const donnees = analyse.data;

  // La catégorie cible doit appartenir au restaurant : sans ce contrôle, un
  // client malveillant pourrait ranger un plat dans le menu d'un concurrent.
  const [categorie] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, donnees.categoryId), eq(categories.restaurantId, restaurantId)))
    .limit(1);

  if (!categorie) {
    return { ok: false, erreurs: { categoryId: "Choisissez une catégorie valide." } };
  }

  const champs = {
    categoryId: donnees.categoryId,
    nom: donnees.nom,
    description: donnees.description || null,
    prix: donnees.prix,
    photo: donnees.photo || null,
    disponible: donnees.disponible ?? true,
  };

  const identifiant = donnees.id || null;

  if (!identifiant) {
    // Limite du plan gratuit : 20 plats maximum.
    const limite = LIMITE_PRODUITS[utilisateur.plan];
    if (limite !== null) {
      const [compteur] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.restaurantId, restaurantId));

      if ((compteur?.total ?? 0) >= limite) {
        return {
          ok: false,
          message:
            `Votre plan ${utilisateur.plan === "gratuit" ? "Gratuit" : "Pro"} est limité à ` +
            `${limite} plats. Passez au plan Pro pour un menu illimité.`,
        };
      }
    }
  }

  try {
    await db.transaction(async (tx) => {
    let produitId = identifiant;

    if (produitId) {
      const modifiees = await tx
        .update(products)
        .set({ ...champs, updatedAt: new Date() })
        .where(and(eq(products.id, produitId), eq(products.restaurantId, restaurantId)))
        .returning({ id: products.id });

      if (modifiees.length === 0) {
        throw new Error("PLAT_INTROUVABLE");
      }
    } else {
      const [max] = await tx
        .select({ ordre: sql<number>`coalesce(max(ordre), 0)::int` })
        .from(products)
        .where(and(eq(products.categoryId, donnees.categoryId), eq(products.restaurantId, restaurantId)));

      const [cree] = await tx
        .insert(products)
        .values({
          ...champs,
          restaurantId,
          ordre: (max?.ordre ?? 0) + 1,
        })
        .returning({ id: products.id });

      produitId = cree.id;
    }

    // Les options sont remplacées en bloc : plus simple et plus sûr que de
    // calculer un diff (elles ne portent aucun historique).
    await tx.delete(productOptions).where(eq(productOptions.productId, produitId));
    if (donnees.options.length > 0) {
      await tx.insert(productOptions).values(
        donnees.options.map((option, index) => ({
          productId: produitId!,
          nom: option.nom,
          supplementPrix: option.supplementPrix,
          ordre: index + 1,
        })),
      );
    }
    });
  } catch (erreur) {
    if (erreur instanceof Error && erreur.message === "PLAT_INTROUVABLE") {
      return { ok: false, message: "Ce plat est introuvable : rechargez la page." };
    }
    throw erreur;
  }

  rafraichir(utilisateur.restaurantSlug);
  return {
    ok: true,
    message: identifiant ? "Plat modifié." : "Plat ajouté à votre menu.",
  };
}

/** Épuisé / disponible en un clic (interrupteur de la liste). */
export async function basculerDisponibilite(
  id: string,
  disponible: boolean,
): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");

  const modifiees = await db
    .update(products)
    .set({ disponible, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.restaurantId, utilisateur.restaurantId!)))
    .returning({ id: products.id });

  if (modifiees.length === 0) return echec("Plat introuvable.");

  rafraichir(utilisateur.restaurantSlug);
  return OK;
}

/** Déplace un plat d'un cran dans sa catégorie. */
export async function deplacerProduit(
  id: string,
  sens: "haut" | "bas",
): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [produit] = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)))
    .limit(1);

  if (!produit) return echec("Plat introuvable.");

  const liste = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(eq(products.categoryId, produit.categoryId), eq(products.restaurantId, restaurantId)),
    )
    .orderBy(asc(products.ordre), asc(products.createdAt));

  const position = liste.findIndex((p) => p.id === id);
  const cible = sens === "haut" ? position - 1 : position + 1;
  if (position === -1 || cible < 0 || cible >= liste.length) return OK;

  const reordonnee = [...liste];
  [reordonnee[position], reordonnee[cible]] = [reordonnee[cible], reordonnee[position]];

  await db.transaction(async (tx) => {
    for (const [index, plat] of reordonnee.entries()) {
      await tx
        .update(products)
        .set({ ordre: index + 1 })
        .where(and(eq(products.id, plat.id), eq(products.restaurantId, restaurantId)));
    }
  });

  rafraichir(utilisateur.restaurantSlug);
  return OK;
}

/** Duplique un plat (très pratique pour créer des variantes). */
export async function dupliquerProduit(id: string): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [produit] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)))
    .limit(1);

  if (!produit) return echec("Plat introuvable.");

  const limite = LIMITE_PRODUITS[utilisateur.plan];
  if (limite !== null) {
    const [compteur] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.restaurantId, restaurantId));
    if ((compteur?.total ?? 0) >= limite) {
      return echec(`Votre plan est limité à ${limite} plats. Passez au plan Pro.`);
    }
  }

  const options = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, id))
    .orderBy(asc(productOptions.ordre));

  await db.transaction(async (tx) => {
    const [max] = await tx
      .select({ ordre: sql<number>`coalesce(max(ordre), 0)::int` })
      .from(products)
      .where(
        and(eq(products.categoryId, produit.categoryId), eq(products.restaurantId, restaurantId)),
      );

    const [copie] = await tx
      .insert(products)
      .values({
        restaurantId,
        categoryId: produit.categoryId,
        nom: `${produit.nom} (copie)`,
        description: produit.description,
        prix: produit.prix,
        photo: produit.photo,
        disponible: produit.disponible,
        ordre: (max?.ordre ?? 0) + 1,
      })
      .returning({ id: products.id });

    if (options.length > 0) {
      await tx.insert(productOptions).values(
        options.map((option) => ({
          productId: copie.id,
          nom: option.nom,
          supplementPrix: option.supplementPrix,
          ordre: option.ordre,
        })),
      );
    }
  });

  rafraichir(utilisateur.restaurantSlug);
  return { ok: true, message: "Plat dupliqué." };
}

export async function supprimerProduit(id: string): Promise<ResultatAction> {
  const utilisateur = await exigerRole("admin");

  const supprimes = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.restaurantId, utilisateur.restaurantId!)))
    .returning({ id: products.id });

  if (supprimes.length === 0) return echec("Plat introuvable.");

  rafraichir(utilisateur.restaurantSlug);
  return { ok: true, message: "Plat supprimé." };
}
