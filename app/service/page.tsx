/**
 * Écran de service — serveurs et cuisine.
 *
 * Accessible aux rôles `admin`, `serveur` et `cuisine` rattachés à un
 * restaurant : le personnel voit uniquement les commandes de son établissement.
 * Les données sont chargées ici puis rafraîchies par polling toutes les
 * 4 secondes côté client (voir `components/service/ecran-service.tsx`).
 */
import type { Metadata } from "next";

import { DeconnexionButton } from "@/components/auth/deconnexion-button";
import { EcranService, type CommandeService } from "@/components/service/ecran-service";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIBELLES_ROLE } from "@/lib/constants";
import { commandesDeService } from "@/lib/db/commandes";
import { formatHeure } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Écran de service",
  description: "Suivi en direct des commandes du restaurant, mise à jour toutes les 4 secondes.",
  robots: { index: false },
};

export default async function PageService() {
  const utilisateur = await exigerRole("admin", "serveur", "cuisine");
  const restaurantId = utilisateur.restaurantId!;

  const commandes = await commandesDeService(restaurantId);

  const initiales: CommandeService[] = commandes.map((commande) => ({
    id: commande.id,
    numero: commande.numero,
    type: commande.type,
    statut: commande.statut,
    tableNumero: commande.tableNumero,
    nomClient: commande.nomClient,
    telephoneClient: commande.telephoneClient,
    total: commande.total,
    modePaiement: commande.modePaiement,
    paiementStatut: commande.paiementStatut,
    heureRetrait: commande.heureRetrait?.toISOString() ?? null,
    note: commande.note,
    motifAnnulation: commande.motifAnnulation,
    appelServeurAt: commande.appelServeurAt?.toISOString() ?? null,
    createdAt: commande.createdAt.toISOString(),
    updatedAt: commande.updatedAt.toISOString(),
    lignes: commande.lignes,
  }));

  return (
    <div className="relative">
      {/* Bandeau discret : identité + déconnexion (l'écran reste plein écran). */}
      <div className="absolute inset-x-0 top-0 z-40 flex justify-end p-3 print:hidden">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-3 py-2 backdrop-blur">
          <span className="text-xs font-semibold text-slate-300">
            {utilisateur.nom} · {LIBELLES_ROLE[utilisateur.role]} · {formatHeure(new Date())}
          </span>
          <DeconnexionButton
            compact
            className="border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          />
        </div>
      </div>

      <EcranService
        commandesInitiales={initiales}
        devise={utilisateur.devise}
        nomRestaurant={utilisateur.restaurantNom ?? "Mon restaurant"}
        slug={utilisateur.restaurantSlug ?? ""}
        couleur={utilisateur.couleurPrincipale}
        role={utilisateur.role as "admin" | "serveur" | "cuisine"}
      />
    </div>
  );
}
