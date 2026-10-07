"use server";

/**
 * Server Actions des commandes.
 * ---------------------------------------------------------------------------
 * Côté client (carte publique) :
 *   • `creerCommande`  — prix et options recalculés en base, anti-spam par
 *     téléphone et par session, numéro séquentiel par restaurant ;
 *   • `appelerServeur` — signale au personnel qu'un client attend.
 *
 * Côté personnel (écran de service) :
 *   • `changerStatutCommande`, `refuserCommande`, `marquerCommandePayee`.
 *     Chacune vérifie le rôle ET que la commande appartient bien au restaurant
 *     de la session : impossible d'agir sur la commande d'un autre établissement.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type { EtatCommande } from "@/lib/actions/etat";
import { exigerRole } from "@/lib/auth/autorisation";
import {
  COMMANDES_ACTIVES_MAX,
  COMMANDES_HEURE_MAX,
  changementStatutSchema,
  commandeClientSchema,
  paiementCommandeSchema,
  refusCommandeSchema,
  type LigneCommandeSaisie,
} from "@/lib/validations/commandes";
import { erreursParChamp } from "@/lib/validations/auth";
import { db } from "@/lib/db";
import { orderItems, orders, products, productOptions, restaurants, tables } from "@/lib/db/schema";
import { compterCommandesTelephone } from "@/lib/db/commandes";
import { normaliserTelephone } from "@/lib/utils";

const COOKIE_SESSION = "mesplats_derniere_commande";

/* -------------------------------------------------------------------------- */
/*                            Création d'une commande                         */
/* -------------------------------------------------------------------------- */

export async function creerCommande(
  _etat: EtatCommande,
  formData: FormData,
): Promise<EtatCommande> {
  /* ------------------------- 1. Validation Zod ------------------------- */
  let lignes: LigneCommandeSaisie[] = [];
  const brut = formData.get("lignes");
  if (typeof brut === "string" && brut.trim().length > 0) {
    try {
      const decode = JSON.parse(brut) as unknown;
      lignes = Array.isArray(decode) ? (decode as LigneCommandeSaisie[]) : [];
    } catch {
      return { ok: false, message: "Votre panier est illisible. Videz-le puis recommencez." };
    }
  }

  const analyse = commandeClientSchema.safeParse({
    type: formData.get("type"),
    tableId: formData.get("tableId") ?? "",
    nomClient: formData.get("nomClient"),
    telephoneClient: formData.get("telephoneClient"),
    modePaiement: formData.get("modePaiement"),
    heureRetrait: formData.get("heureRetrait") ?? "",
    note: formData.get("note") ?? "",
    lignes,
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const donnees = analyse.data;
  const restaurantId = String(formData.get("restaurantId") ?? "");
  if (!restaurantId) return { ok: false, message: "Restaurant introuvable." };

  /* --------------------- 2. Le restaurant existe-t-il ? --------------------- */
  const [restaurant] = await db
    .select({ id: restaurants.id, actif: restaurants.actif })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);

  if (!restaurant || !restaurant.actif) {
    return { ok: false, message: "Ce restaurant n'accepte pas de commande pour le moment." };
  }

  /* ------------------------ 3. Table (sur place) ------------------------ */
  let tableId: string | null = null;
  if (donnees.type === "sur_place") {
    const [table] = await db
      .select({ id: tables.id })
      .from(tables)
      .where(and(eq(tables.id, donnees.tableId!), eq(tables.restaurantId, restaurantId)))
      .limit(1);

    if (!table) {
      return {
        ok: false,
        message:
          "La table n'est plus valide. Rescannez le QR code de votre table, ou commandez à emporter.",
      };
    }
    tableId = table.id;
  }

  /* ---------------------------- 4. Anti-spam ---------------------------- */
  const telephone = normaliserTelephone(donnees.telephoneClient);

  const memoire = await cookies();
  const derniere = memoire.get(COOKIE_SESSION)?.value;
  if (derniere) {
    const [horodatage] = derniere.split(":");
    const age = Date.now() - Number(horodatage);
    if (Number.isFinite(age) && age < 20_000) {
      return {
        ok: false,
        message:
          "Votre commande précédente vient de partir : l'équipe la reçoit à l'instant. Patientez quelques secondes avant d'en envoyer une autre.",
      };
    }
  }

  const compteurs = await compterCommandesTelephone(restaurantId, telephone);
  if (compteurs.actives >= COMMANDES_ACTIVES_MAX) {
    return {
      ok: false,
      message:
        `Vous avez déjà ${compteurs.actives} commandes en cours dans cet établissement. ` +
        "Attendez qu'elles soient servies, ou demandez le serveur depuis la page de suivi.",
    };
  }
  if (compteurs.derniereHeure >= COMMANDES_HEURE_MAX) {
    return {
      ok: false,
      message:
        "Trop de commandes envoyées depuis ce numéro en une heure. " +
        "Pour les groupes, adressez-vous directement au serveur.",
    };
  }

  /* -------------- 5. Prix et options recalculés depuis la base -------------- */
  const idsProduits = [...new Set(donnees.lignes.map((ligne) => ligne.productId))];

  const plats = await db
    .select({
      id: products.id,
      nom: products.nom,
      prix: products.prix,
      disponible: products.disponible,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(eq(products.restaurantId, restaurantId), inArray(products.id, idsProduits)));

  const optionsPlats = plats.length
    ? await db
        .select({
          productId: productOptions.productId,
          nom: productOptions.nom,
          supplementPrix: productOptions.supplementPrix,
        })
        .from(productOptions)
        .where(
          inArray(
            productOptions.productId,
            plats.map((plat) => plat.id),
          ),
        )
    : [];

  const platsParId = new Map(plats.map((plat) => [plat.id, plat]));
  const optionsParPlat = new Map<string, { nom: string; supplementPrix: number }[]>();
  for (const option of optionsPlats) {
    const liste = optionsParPlat.get(option.productId) ?? [];
    liste.push({ nom: option.nom, supplementPrix: option.supplementPrix });
    optionsParPlat.set(option.productId, liste);
  }

  const lignesRetenues: {
    productId: string;
    nom: string;
    quantite: number;
    prixUnitaire: number;
    options: { nom: string; prix: number }[];
    note: string | null;
  }[] = [];

  for (const ligne of donnees.lignes) {
    const plat = platsParId.get(ligne.productId);

    if (!plat) {
      return {
        ok: false,
        message:
          "Un plat de votre panier n'est plus au menu. Retirez-le, puis validez à nouveau votre commande.",
      };
    }
    if (!plat.disponible) {
      return {
        ok: false,
        message: `« ${plat.nom} » vient d'être marqué épuisé. Retirez-le de votre panier pour continuer.`,
      };
    }

    // Chaque option envoyée doit exister pour CE plat, avec son vrai supplément.
    const disponibles = optionsParPlat.get(plat.id) ?? [];
    const optionsValidees: { nom: string; prix: number }[] = [];
    for (const optionChoisie of ligne.options) {
      const trouvee = disponibles.find(
        (candidate) =>
          candidate.nom.toLowerCase() === optionChoisie.nom.trim().toLowerCase(),
      );
      if (!trouvee) {
        return {
          ok: false,
          message: `L'option « ${optionChoisie.nom} » n'existe plus pour « ${plat.nom} ». Rechargez la page.`,
        };
      }
      optionsValidees.push({ nom: trouvee.nom, prix: trouvee.supplementPrix });
    }

    lignesRetenues.push({
      productId: plat.id,
      nom: plat.nom,
      quantite: ligne.quantite,
      prixUnitaire: plat.prix,
      options: optionsValidees,
      note: ligne.note?.trim() || null,
    });
  }

  const total = lignesRetenues.reduce(
    (somme, ligne) =>
      somme +
      (ligne.prixUnitaire + ligne.options.reduce((s, o) => s + o.prix, 0)) * ligne.quantite,
    0,
  );

  /* --------------------------- 6. Heure de retrait --------------------------- */
  let heureRetrait: Date | null = null;
  if (donnees.type === "emporter" && donnees.heureRetrait) {
    const [heures, minutes] = donnees.heureRetrait.split(":").map(Number);
    const cible = new Date();
    // Abidjan = UTC+0 toute l'année : l'heure choisie est directement l'heure UTC.
    cible.setUTCHours(heures, minutes, 0, 0);
    if (cible.getTime() < Date.now() + 5 * 60 * 1000) {
      cible.setUTCDate(cible.getUTCDate() + 1); // créneau déjà passé → demain
    }
    heureRetrait = cible;
  }

  /* ----------------------- 7. Écriture transactionnelle ----------------------- */
  let identifiant = "";
  let numero = 0;

  try {
    await db.transaction(async (tx) => {
      // Le verrou sur la ligne du restaurant sérialise la numérotation : deux
      // commandes simultanées ne peuvent pas obtenir le même numéro.
      await tx
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .for("update");

      const [suivant] = await tx
        .select({ numero: sql<number>`coalesce(max(${orders.numero}), 0) + 1` })
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId));

      numero = suivant?.numero ?? 1;

      const [creee] = await tx
        .insert(orders)
        .values({
          restaurantId,
          numero,
          type: donnees.type,
          tableId,
          nomClient: donnees.nomClient,
          telephoneClient: telephone,
          statut: "nouvelle",
          total,
          modePaiement: donnees.modePaiement,
          paiementStatut: "en_attente",
          heureRetrait,
          note: donnees.note?.trim() || null,
        })
        .returning({ id: orders.id });

      identifiant = creee.id;

      await tx.insert(orderItems).values(
        lignesRetenues.map((ligne) => ({
          orderId: creee.id,
          productId: ligne.productId,
          nom: ligne.nom,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          options: ligne.options,
          note: ligne.note,
        })),
      );
    });
  } catch {
    return {
      ok: false,
      message:
        "La commande n'a pas pu être enregistrée (connexion instable). Réessayez dans un instant.",
    };
  }

  const memoire2 = await cookies();
  memoire2.set(COOKIE_SESSION, `${Date.now()}:${identifiant}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 30,
    path: "/",
  });

  revalidatePath("/service");
  revalidatePath(`/commande/${identifiant}`);

  return {
    ok: true,
    message: `Commande n° ${numero} envoyée en cuisine.`,
    commandeId: identifiant,
    commandeNumero: numero,
  };
}

/* -------------------------------------------------------------------------- */
/*                        « Appeler le serveur » (client)                     */
/* -------------------------------------------------------------------------- */

export async function appelerServeur(commandeId: string): Promise<{ ok: boolean; message?: string }> {
  const analyse = paiementCommandeSchema.safeParse({ commandeId, paye: false });
  if (!analyse.success) return { ok: false, message: "Commande inconnue." };

  const [commande] = await db
    .select({ id: orders.id, statut: orders.statut, appel: orders.appelServeurAt })
    .from(orders)
    .where(eq(orders.id, commandeId))
    .limit(1);

  if (!commande) return { ok: false, message: "Commande introuvable." };
  if (commande.statut === "annulee" || commande.statut === "servie") {
    return { ok: false, message: "Cette commande est terminée." };
  }
  if (commande.appel && Date.now() - commande.appel.getTime() < 60_000) {
    return { ok: true, message: "Le serveur a déjà été prévenu : il arrive." };
  }

  await db
    .update(orders)
    .set({ appelServeurAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, commandeId));

  revalidatePath("/service");
  revalidatePath(`/commande/${commandeId}`);
  return { ok: true, message: "Le serveur est prévenu : il arrive à votre table." };
}

/* -------------------------------------------------------------------------- */
/*                      Actions du personnel (écran service)                  */
/* -------------------------------------------------------------------------- */

/** Vérifie que la commande appartient au restaurant de l'utilisateur connecté. */
async function commandeAutorisee(commandeId: string, restaurantId: string) {
  const [commande] = await db
    .select({ id: orders.id, numero: orders.numero, statut: orders.statut })
    .from(orders)
    .where(and(eq(orders.id, commandeId), eq(orders.restaurantId, restaurantId)))
    .limit(1);
  return commande ?? null;
}

export async function changerStatutCommande(
  commandeId: string,
  statut: "acceptee" | "en_preparation" | "prete" | "servie",
): Promise<{ ok: boolean; message?: string }> {
  const utilisateur = await exigerRole("admin", "serveur", "cuisine");
  const analyse = changementStatutSchema.safeParse({ commandeId, statut });
  if (!analyse.success) return { ok: false, message: "Statut inconnu." };

  const commande = await commandeAutorisee(analyse.data.commandeId, utilisateur.restaurantId!);
  if (!commande) return { ok: false, message: "Commande introuvable." };
  if (commande.statut === "annulee") {
    return { ok: false, message: "Cette commande a été refusée." };
  }

  await db
    .update(orders)
    .set({ statut: analyse.data.statut, updatedAt: new Date() })
    .where(and(eq(orders.id, commande.id), eq(orders.restaurantId, utilisateur.restaurantId!)));

  revalidatePath("/service");
  revalidatePath(`/commande/${commande.id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: `Commande n° ${commande.numero} mise à jour.` };
}

export async function refuserCommande(
  commandeId: string,
  motif: string,
): Promise<{ ok: boolean; message?: string }> {
  const utilisateur = await exigerRole("admin", "serveur");
  const analyse = refusCommandeSchema.safeParse({ commandeId, motif });
  if (!analyse.success) return { ok: false, message: erreursParChamp(analyse.error).motif };

  const commande = await commandeAutorisee(analyse.data.commandeId, utilisateur.restaurantId!);
  if (!commande) return { ok: false, message: "Commande introuvable." };

  await db
    .update(orders)
    .set({
      statut: "annulee",
      motifAnnulation: analyse.data.motif,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, commande.id), eq(orders.restaurantId, utilisateur.restaurantId!)));

  revalidatePath("/service");
  revalidatePath(`/commande/${commande.id}`);
  return { ok: true, message: `Commande n° ${commande.numero} refusée : le client est prévenu.` };
}

export async function marquerCommandePayee(
  commandeId: string,
  paye: boolean,
): Promise<{ ok: boolean; message?: string }> {
  const utilisateur = await exigerRole("admin", "serveur");
  const analyse = paiementCommandeSchema.safeParse({ commandeId, paye });
  if (!analyse.success) return { ok: false, message: "Requête invalide." };

  const commande = await commandeAutorisee(analyse.data.commandeId, utilisateur.restaurantId!);
  if (!commande) return { ok: false, message: "Commande introuvable." };

  await db
    .update(orders)
    .set({
      paiementStatut: analyse.data.paye ? "paye" : "en_attente",
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, commande.id), eq(orders.restaurantId, utilisateur.restaurantId!)));

  revalidatePath("/service");
  revalidatePath(`/commande/${commande.id}`);
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: analyse.data.paye
      ? `Paiement de la commande n° ${commande.numero} enregistré.`
      : `Paiement de la commande n° ${commande.numero} remis en attente.`,
  };
}
