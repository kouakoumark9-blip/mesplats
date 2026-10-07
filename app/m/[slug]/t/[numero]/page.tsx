/**
 * Carte publique ouverte depuis le QR code d'une table : /m/[slug]/t/[numero]
 *
 * Le numéro de table est vérifié en base (un QR code d'un autre établissement ne
 * peut pas commander ici) puis pré-rempli : le client commande « sur place », et
 * sa commande arrive sur l'écran de service avec le bon numéro de table.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoqueCarte, palettePublique } from "@/components/site/coque-carte";
import {
  MenuCommande,
  type CategoriePublique,
  type MoyenPaiementPublique,
} from "@/components/site/menu-commande";
import { langueAutorisee } from "@/lib/i18n-public";
import {
  menuPublic,
  moyensPaiementPublic,
  restaurantParSlug,
  tableParNumero,
} from "@/lib/db/public";
import type { ModePaiement } from "@/lib/constants";
import {
  disponibiliteContrainte,
  estDisponibleMaintenant,
  resumeDisponibilite,
} from "@/lib/utils";

type Proprietes = {
  params: Promise<{ slug: string; numero: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Proprietes): Promise<Metadata> {
  const { slug, numero } = await params;
  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) return { title: "Menu introuvable" };

  return {
    title: `${restaurant.nom} — Table ${numero}`,
    description: `Commandez à la table ${numero} chez ${restaurant.nom} : carte, panier et paiement mobile money depuis votre téléphone.`,
    robots: { index: false },
  };
}

export default async function PageMenuTable({ params, searchParams }: Proprietes) {
  const { slug, numero } = await params;
  const { lang } = await searchParams;

  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) notFound();

  const table = await tableParNumero(restaurant.id, numero);
  if (!table) notFound();

  const [menu, moyens] = await Promise.all([
    menuPublic(restaurant.id),
    moyensPaiementPublic(restaurant.id),
  ]);

  const languesProposees = restaurant.langues?.length ? restaurant.langues : ["fr"];
  const langue = langueAutorisee(lang, languesProposees);
  const { palette, police } = palettePublique(restaurant);

  const categories: CategoriePublique[] = menu.map((categorie) => {
    const servie = estDisponibleMaintenant(categorie.disponibilite);
    const contrainte = disponibiliteContrainte(categorie.disponibilite);
    return {
      id: categorie.id,
      nom: categorie.nom,
      servie,
      disponibiliteTexte: contrainte
        ? resumeDisponibilite(categorie.disponibilite).replace("Tous les jours · ", "")
        : null,
      produits: categorie.produits,
    };
  });

  const moyensPaiement: MoyenPaiementPublique[] = moyens.map((moyen) => ({
    operateur: moyen.operateur as ModePaiement,
    numero: moyen.numero,
    titulaire: moyen.titulaire,
  }));

  return (
    <CoqueCarte
      restaurant={restaurant}
      langue={langue}
      tableNumero={table.numero}
      palette={palette}
      police={police}
    >
      <MenuCommande
        restaurant={{
          id: restaurant.id,
          slug: restaurant.slug,
          nom: restaurant.nom,
          couleur: restaurant.couleurPrincipale,
          devise: restaurant.devise,
        }}
        table={{ id: table.id, numero: table.numero }}
        categories={categories}
        moyensPaiement={moyensPaiement}
        palette={palette}
        langue={langue}
      />
    </CoqueCarte>
  );
}
