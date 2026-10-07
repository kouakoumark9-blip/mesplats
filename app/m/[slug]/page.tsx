/**
 * Carte publique d'un restaurant : /m/[slug]
 * ---------------------------------------------------------------------------
 * Le serveur prépare les données (restaurant, menu, moyens de paiement, thème)
 * et la partie commandable est confiée à `MenuCommande` (composant client).
 * La page reste utilisable même sans JavaScript pour consulter la carte et les
 * prix ; seul le panier nécessite le navigateur.
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
import { menuPublic, moyensPaiementPublic, restaurantParSlug } from "@/lib/db/public";
import type { ModePaiement } from "@/lib/constants";
import {
  disponibiliteContrainte,
  estDisponibleMaintenant,
  resumeDisponibilite,
} from "@/lib/utils";

type Proprietes = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Proprietes): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) return { title: "Menu introuvable" };

  return {
    title: `${restaurant.nom} — Carte et commande en ligne`,
    description: `Découvrez la carte de ${restaurant.nom}${restaurant.adresse ? ` · ${restaurant.adresse}` : ""}. Commandez depuis votre téléphone, sans application, et payez par mobile money.`,
  };
}

export default async function PageMenuPublic({ params, searchParams }: Proprietes) {
  const { slug } = await params;
  const { lang } = await searchParams;

  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) notFound();

  const [menu, moyens] = await Promise.all([
    menuPublic(restaurant.id),
    moyensPaiementPublic(restaurant.id),
  ]);

  const languesProposees = restaurant.langues?.length ? restaurant.langues : ["fr"];
  const langue = langueAutorisee(lang, languesProposees);
  const { palette, police } = palettePublique(restaurant);

  /* Les catégories hors créneau restent visibles, mais ne sont pas commandables. */
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
        table={null}
        categories={categories}
        moyensPaiement={moyensPaiement}
        palette={palette}
        langue={langue}
      />
    </CoqueCarte>
  );
}
