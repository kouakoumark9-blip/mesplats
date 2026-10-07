/**
 * Liste des commandes pour l'écran de service (polling toutes les 4 secondes).
 * ---------------------------------------------------------------------------
 * Route protégée : rôle `admin`, `serveur` ou `cuisine`, et uniquement les
 * commandes du restaurant de la session. Aucune donnée d'un autre établissement
 * ne peut transiter par ici.
 */
import { NextResponse } from "next/server";

import { exigerApiRestaurant } from "@/lib/auth/autorisation";
import { commandesDeService } from "@/lib/db/commandes";

export const dynamic = "force-dynamic";

export async function GET() {
  const garde = await exigerApiRestaurant("admin", "serveur", "cuisine");
  if ("reponse" in garde) return garde.reponse;

  const commandes = await commandesDeService(garde.utilisateur.restaurantId);

  return NextResponse.json(
    {
      horodatage: new Date().toISOString(),
      commandes: commandes.map((commande) => ({
        ...commande,
        heureRetrait: commande.heureRetrait?.toISOString() ?? null,
        appelServeurAt: commande.appelServeurAt?.toISOString() ?? null,
        createdAt: commande.createdAt.toISOString(),
        updatedAt: commande.updatedAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
