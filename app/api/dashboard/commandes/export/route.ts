/**
 * Export CSV du journal des commandes (comptabilité, tableur, sauvegarde).
 * ---------------------------------------------------------------------------
 * Route protégée : propriétaire du restaurant uniquement, et uniquement ses
 * propres commandes. Le séparateur est le point-virgule et l'encodage UTF-8
 * avec BOM, pour qu'Excel en français ouvre le fichier sans manipulation.
 */
import { NextResponse } from "next/server";

import { exigerApiRestaurant } from "@/lib/auth/autorisation";
import { LIBELLES_PAIEMENT, LIBELLES_STATUT, LIBELLES_TYPE_COMMANDE, STATUTS, type Statut } from "@/lib/constants";
import { commandesHistorique } from "@/lib/db/commandes";
import { bornesJour } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(requete: Request) {
  const garde = await exigerApiRestaurant("admin");
  if ("reponse" in garde) return garde.reponse;

  const { searchParams } = new URL(requete.url);
  const statutBrut = searchParams.get("statut");
  const typeBrut = searchParams.get("type");

  const commandes = await commandesHistorique(garde.utilisateur.restaurantId, {
    statut: STATUTS.includes(statutBrut as Statut) ? (statutBrut as Statut) : undefined,
    type: typeBrut === "sur_place" || typeBrut === "emporter" ? typeBrut : undefined,
    limite: 1000,
  });

  const entetes = [
    "Numero",
    "Date",
    "Heure",
    "Type",
    "Table",
    "Client",
    "Telephone",
    "Articles",
    "Total FCFA",
    "Moyen de paiement",
    "Paiement",
    "Statut",
    "Motif d'annulation",
  ];

  const lignes = commandes.map((commande) => {
    const date = commande.createdAt;
    return [
      String(commande.numero),
      date.toISOString().slice(0, 10),
      date.toISOString().slice(11, 16),
      LIBELLES_TYPE_COMMANDE[commande.type],
      commande.tableNumero ?? "",
      commande.nomClient ?? "",
      commande.telephoneClient ?? "",
      commande.lignes
        .map(
          (ligne) =>
            `${ligne.quantite}× ${ligne.nom}` +
            (ligne.options.length > 0 ? ` (${ligne.options.map((o) => o.nom).join(", ")})` : ""),
        )
        .join(" | "),
      String(commande.total),
      commande.modePaiement ? LIBELLES_PAIEMENT[commande.modePaiement as keyof typeof LIBELLES_PAIEMENT] : "",
      commande.paiementStatut === "paye" ? "Paye" : "En attente",
      LIBELLES_STATUT[commande.statut],
      commande.motifAnnulation ?? "",
    ];
  });

  const contenu = [entetes, ...lignes]
    .map((ligne) => ligne.map(echapper).join(";"))
    .join("\r\n");

  const { debut } = bornesJour();
  const nom = `commandes-${garde.utilisateur.restaurantSlug ?? "restaurant"}-${debut
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${contenu}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nom}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Échappement CSV : guillemets doublés, champ encadré si nécessaire. */
function echapper(valeur: string): string {
  const propre = valeur.replace(/\r?\n/g, " ").replace(/"/g, '""');
  return /[";]/.test(propre) ? `"${propre}"` : propre;
}
