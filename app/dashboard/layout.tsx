/**
 * Coque de l'espace restaurateur.
 *
 * `exigerRole("admin")` protège TOUTES les pages /dashboard : un serveur ou un
 * cuisinier qui tenterait d'y accéder est renvoyé vers son propre espace, et un
 * visiteur non connecté vers /connexion.
 */
import type { ReactNode } from "react";

import { Coque } from "@/components/dashboard/coque";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_PRODUITS } from "@/lib/constants";
import { compterProduits } from "@/lib/db/catalogue";

export const dynamic = "force-dynamic";

export default async function LayoutEspaceRestaurateur({ children }: { children: ReactNode }) {
  const utilisateur = await exigerRole("admin");
  const nbProduits = await compterProduits(utilisateur.restaurantId!);

  return (
    <Coque
      nomRestaurant={utilisateur.restaurantNom ?? "Mon restaurant"}
      slug={utilisateur.restaurantSlug ?? ""}
      plan={utilisateur.plan}
      nomUtilisateur={utilisateur.nom}
      email={utilisateur.email}
      couleurPrincipale={utilisateur.couleurPrincipale}
      nbProduits={nbProduits}
      limiteProduits={LIMITE_PRODUITS[utilisateur.plan]}
    >
      {children}
    </Coque>
  );
}
