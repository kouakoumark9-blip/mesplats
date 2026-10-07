"use server";

/**
 * Server Action de la Boutique Mesplats (supports imprimés).
 * ---------------------------------------------------------------------------
 * Le restaurant choisit ses supports, ses quantités et ses options ; l'action
 * recalcule **tout le prix à partir du catalogue serveur** (jamais celui envoyé
 * par le navigateur), enregistre la commande avec une référence lisible, puis
 * l'équipe Mesplats confirme le devis par WhatsApp.
 *
 * Contrôles : rôle `admin` obligatoire, tirage minimum respecté par article,
 * options existantes uniquement, adresse et téléphone validés par Zod.
 */
import { revalidatePath } from "next/cache";

import type { EtatBoutique } from "@/lib/actions/etat";
import { exigerRole } from "@/lib/auth/autorisation";
import { articleBoutique, construireLigne, referenceBoutique } from "@/lib/boutique";
import { db } from "@/lib/db";
import { boutiqueOrders } from "@/lib/db/schema";
import { commandeBoutiqueSchema, verifierMinimum, type LigneBoutiqueSaisie } from "@/lib/validations/boutique";
import { erreursParChamp } from "@/lib/validations/auth";

export async function commanderSupports(
  _etat: EtatBoutique,
  formData: FormData,
): Promise<EtatBoutique> {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  /* ---------------------------- 1. Lecture du panier ---------------------------- */
  let lignes: LigneBoutiqueSaisie[] = [];
  const brut = formData.get("lignes");
  if (typeof brut === "string" && brut.trim().length > 0) {
    try {
      const decode = JSON.parse(brut) as unknown;
      lignes = Array.isArray(decode) ? (decode as LigneBoutiqueSaisie[]) : [];
    } catch {
      return { ok: false, message: "Votre panier est illisible. Videz-le puis recommencez." };
    }
  }

  /* ------------------------- 2. Validation Zod (serveur) ------------------------- */
  const analyse = commandeBoutiqueSchema.safeParse({
    nomClient: formData.get("nomClient"),
    telephoneClient: formData.get("telephoneClient"),
    adresse: formData.get("adresse"),
    ville: formData.get("ville"),
    note: formData.get("note") ?? "",
    lignes,
  });

  if (!analyse.success) {
    return { ok: false, erreurs: erreursParChamp(analyse.error) };
  }

  const donnees = analyse.data;

  /* --------------- 3. Prix, options et minimums recalculés en base --------------- */
  const articles = [];
  let total = 0;

  for (const ligne of donnees.lignes) {
    const erreurMinimum = verifierMinimum(ligne.articleId, ligne.quantite);
    if (erreurMinimum) return { ok: false, message: erreurMinimum };

    const article = articleBoutique(ligne.articleId);
    if (!article) {
      return {
        ok: false,
        message: "Un article de votre panier n'est plus disponible. Rechargez la page.",
      };
    }

    const optionsInconnues = ligne.options.filter(
      (option) => !article.options.some((candidat) => candidat.id === option),
    );
    if (optionsInconnues.length > 0) {
      return {
        ok: false,
        message: `Une option choisie pour « ${article.nom} » n'existe plus. Rechargez la page.`,
      };
    }

    const construite = construireLigne(article, ligne.quantite, ligne.options);
    total += construite.total;

    articles.push({
      articleId: article.id,
      nom: article.nom,
      quantite: ligne.quantite,
      prixUnitaire: construite.prixUnitaire,
      options: construite.options,
    });
  }

  if (articles.length === 0) {
    return { ok: false, message: "Ajoutez au moins un support à votre panier." };
  }

  /* ---------------------------- 4. Enregistrement ---------------------------- */
  const reference = referenceBoutique();

  await db.insert(boutiqueOrders).values({
    reference,
    restaurantId,
    articles,
    total,
    nomClient: donnees.nomClient,
    telephoneClient: donnees.telephoneClient,
    adresse: donnees.adresse,
    ville: donnees.ville,
    note: donnees.note ? donnees.note : null,
    statut: "nouvelle",
  });

  revalidatePath("/dashboard/boutique");

  /* ------------------- 5. Message WhatsApp pré-rempli pour l'équipe ------------------- */
  const details = articles
    .map((article) => {
      const options = article.options.length
        ? ` (${article.options.map((option) => option.nom).join(", ")})`
        : "";
      return `• ${article.quantite} × ${article.nom}${options}`;
    })
    .join("\n");

  const message = [
    `Bonjour Mesplats, je viens de passer la commande ${reference}.`,
    "",
    details,
    "",
    `Total : ${total.toLocaleString("fr-FR")} FCFA`,
    `Établissement : ${utilisateur.restaurantNom ?? "—"}`,
    `Livraison : ${donnees.adresse}, ${donnees.ville}`,
    `Contact : ${donnees.nomClient} — ${donnees.telephoneClient}`,
  ].join("\n");

  return {
    ok: true,
    message: `Commande ${reference} enregistrée. Nous vous confirmons le devis avant impression.`,
    reference,
    total,
    lienWhatsApp: `https://wa.me/?text=${encodeURIComponent(message)}`,
  };
}
