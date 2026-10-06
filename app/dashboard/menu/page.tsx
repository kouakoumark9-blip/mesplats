import { ExternalLink, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GestionMenu } from "@/components/dashboard/gestion-menu";
import { Bouton } from "@/components/ui/bouton";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIMITE_PRODUITS } from "@/lib/constants";
import { catalogueRestaurant } from "@/lib/db/catalogue";

export const metadata: Metadata = { title: "Mon menu" };

export default async function PageMenu() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const catalogue = await catalogueRestaurant(restaurantId);

  // Seules les données utiles à l'affichage traversent la frontière serveur → client.
  const categories = catalogue.map((categorie) => ({
    id: categorie.id,
    nom: categorie.nom,
    visible: categorie.visible,
    produits: categorie.produits.map((produit) => ({
      id: produit.id,
      categoryId: produit.categoryId,
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      photo: produit.photo,
      disponible: produit.disponible,
      options: produit.options.map((option) => ({
        id: option.id,
        nom: option.nom,
        supplementPrix: option.supplementPrix,
      })),
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
            <UtensilsCrossed className="size-6 text-marque-600" aria-hidden />
            Mon menu
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Catégories, plats, prix en {utilisateur.devise} et suppléments. Une modification est
            visible par vos clients immédiatement.
          </p>
        </div>

        {utilisateur.restaurantSlug ? (
          <Link href={`/m/${utilisateur.restaurantSlug}`} target="_blank">
            <Bouton variante="contour" icone={<ExternalLink className="size-4" aria-hidden />}>
              Voir mon menu public
            </Bouton>
          </Link>
        ) : null}
      </header>

      <GestionMenu
        categories={categories}
        limiteProduits={LIMITE_PRODUITS[utilisateur.plan]}
        devise={utilisateur.devise}
        slug={utilisateur.restaurantSlug ?? ""}
      />
    </div>
  );
}
