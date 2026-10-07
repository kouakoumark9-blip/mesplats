/**
 * Boutique — /dashboard/boutique
 *
 * Supports imprimés autour du menu QR : le restaurateur compose son tirage
 * (chevalets, stickers, sous-bocks, sets de table, affiche, pack complet),
 * visualise la dégressivité des prix en FCFA, puis envoie sa commande.
 * L'équipe Mesplats confirme le devis par WhatsApp — aucune passerelle de
 * paiement n'est nécessaire.
 */
import type { Metadata } from "next";

import { eq } from "drizzle-orm";

import { CatalogueBoutique } from "@/components/boutique/catalogue-boutique";
import { exigerRole } from "@/lib/auth/autorisation";
import { db } from "@/lib/db";
import { chiffresBoutique, commandesBoutique } from "@/lib/db/boutique";
import { restaurants } from "@/lib/db/schema";
import { formatTelephone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Chevalets, stickers, sous-bocks et supports imprimés pour vos QR codes Mesplats.",
};

export const dynamic = "force-dynamic";

export default async function PageBoutique() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [commandes, chiffres, [profilRestaurant]] = await Promise.all([
    commandesBoutique(restaurantId),
    chiffresBoutique(restaurantId),
    // Coordonnées du restaurant : elles pré-remplissent le formulaire de livraison.
    db
      .select({
        ville: restaurants.ville,
        adresse: restaurants.adresse,
        adresseComplement: restaurants.adresseComplement,
      })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1),
  ]);

  const adresseComplete = [profilRestaurant?.adresse, profilRestaurant?.adresseComplement]
    .filter(Boolean)
    .join(", ");

  /* Le sélecteur de téléphone attend un numéro local (« 07 07 … »). */
  const telephoneLocal = utilisateur.telephoneRestaurant
    ? formatTelephone(utilisateur.telephoneRestaurant).replace(/^\+\d+\s?/, "")
    : "";

  return (
    <CatalogueBoutique
      mode="interne"
      commandes={commandes.map((commande) => ({
        id: commande.id,
        reference: commande.reference,
        total: commande.total,
        ville: commande.ville,
        statut: commande.statut,
        createdAt: commande.createdAt.toISOString(),
        articles: commande.articles.map((article) => ({
          nom: article.nom,
          quantite: article.quantite,
        })),
      }))}
      profil={{
        nomRestaurant: utilisateur.restaurantNom ?? "",
        ville: profilRestaurant?.ville ?? null,
        adresse: adresseComplete || null,
        telephone: telephoneLocal,
      }}
      chiffres={{
        total: chiffres.total,
        enCours: chiffres.enCours,
        montant: chiffres.montant,
      }}
    />
  );
}
