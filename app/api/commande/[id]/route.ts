/**
 * Suivi d'une commande en lecture seule, pour le polling de la page client.
 * ---------------------------------------------------------------------------
 * Route PUBLIQUE : l'identifiant est un UUID non devinable, et la réponse ne
 * contient que ce qu'un client doit voir (statut, paiement, numéro, heure).
 * Aucune donnée du restaurant, aucune statistique, aucun autre client.
 *
 * Le temps réel est assuré par polling toutes les 4 secondes (contrainte du
 * projet : pas de WebSockets, compatibilité 3G).
 */
import { NextResponse } from "next/server";

import { commandePublique } from "@/lib/db/commandes";

export const dynamic = "force-dynamic";

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Garde-fou : on n'interroge la base que sur un UUID plausible.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ erreur: "Commande inconnue." }, { status: 404 });
  }

  const commande = await commandePublique(id);
  if (!commande) {
    return NextResponse.json({ erreur: "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: commande.id,
      numero: commande.numero,
      statut: commande.statut,
      paiementStatut: commande.paiementStatut,
      modePaiement: commande.modePaiement,
      total: commande.total,
      motifAnnulation: commande.motifAnnulation,
      appelServeurAt: commande.appelServeurAt,
      heureRetrait: commande.heureRetrait,
      updatedAt: commande.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
