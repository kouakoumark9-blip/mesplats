/**
 * Aperçu du menu public (lecture seule).
 *
 * ⚠️ ÉTAPE 4 : cette page deviendra l'interface complète de commande
 * (panier, options, choix du paiement, suivi). Pour l'instant elle affiche
 * les vraies données du restaurant — nom, couleur, catégories, plats et
 * prix lus en base — afin que les liens de la page d'accueil mènent
 * quelque part d'utile plutôt qu'à une page introuvable.
 */
import { ArrowLeft, Clock, Info, MapPin, Phone, ShoppingBag, Utensils } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoPlat } from "@/components/site/photo-plat";
import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { cn, contrasteSur, formatFcfa } from "@/lib/utils";
import { menuPublic, restaurantParSlug } from "@/lib/db/public";

type Proprietes = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Proprietes): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) return { title: "Menu introuvable" };

  return {
    title: `${restaurant.nom} — Menu`,
    description: `Découvrez le menu de ${restaurant.nom}${restaurant.adresse ? ` · ${restaurant.adresse}` : ""}. Commandez en ligne, sans application.`,
  };
}

export default async function PageMenuPublic({ params }: Proprietes) {
  const { slug } = await params;
  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) notFound();

  const menu = await menuPublic(restaurant.id);
  const surCouleur = contrasteSur(restaurant.couleurPrincipale);

  return (
    <div
      className="min-h-dvh bg-slate-50"
      style={{
        // Thème du restaurant : la couleur choisie dans ses paramètres.
        ["--couleur-principale" as string]: restaurant.couleurPrincipale,
        ["--couleur-sur-principale" as string]: surCouleur,
      }}
    >
      {/* En-tête aux couleurs du restaurant */}
      <header className="degrade-principal relative overflow-hidden px-4 pt-6 pb-10 text-white">
        <div className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-white/10 blur-2xl" />

        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            AfriMenu
          </Link>

          <div className="mt-5 flex items-center gap-4">
            {restaurant.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo}
                alt={`Logo de ${restaurant.nom}`}
                className="size-14 rounded-2xl border-2 border-white/30 object-cover"
              />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold">
                {restaurant.nom.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-titre text-2xl font-extrabold tracking-tight sm:text-3xl">
                {restaurant.nom}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
                {restaurant.adresse ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden />
                    {restaurant.adresse}
                  </span>
                ) : null}
                {restaurant.horaires ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden />
                    {restaurant.horaires}
                  </span>
                ) : null}
                {restaurant.telephone ? (
                  <a
                    href={`tel:${restaurant.telephone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {restaurant.telephone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl px-4 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <Alerte ton="info" icone={<Info className="size-4" aria-hidden />}>
            <strong>Commande en ligne bientôt disponible.</strong> Voici le menu actuel de
            l&apos;établissement, tel qu&apos;il apparaîtra aux clients. La prise de commande
            (panier, table, paiement Orange Money / Moov / MTN) arrive à l&apos;étape 4 de la
            construction.
          </Alerte>

          {menu.length === 0 ? (
            <EtatVide
              className="mt-5"
              icone={<ShoppingBag className="size-7" aria-hidden />}
              titre="Aucun plat au menu pour le moment"
              description="Le restaurateur n'a pas encore publié de catégorie visible avec des produits."
            />
          ) : (
            <div className="mt-6 space-y-8">
              {menu.map((categorie) => (
                <section key={categorie.id} aria-labelledby={`categorie-${categorie.id}`}>
                  <h2
                    id={`categorie-${categorie.id}`}
                    className="font-titre text-lg font-extrabold tracking-tight text-slate-900"
                  >
                    {categorie.nom}
                  </h2>

                  <ul className="mt-3 space-y-2.5">
                    {categorie.produits.map((produit) => (
                      <li
                        key={produit.id}
                        className={cn(
                          "flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm",
                          !produit.disponible && "opacity-70",
                        )}
                      >
                        <PhotoPlat
                          src={produit.photo}
                          alt={produit.nom}
                          taille={80}
                          className="size-20 rounded-xl"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900">
                            {produit.nom}
                            {!produit.disponible ? (
                              <Badge ton="danger" className="ml-2 align-middle">
                                Épuisé
                              </Badge>
                            ) : null}
                          </p>
                          {produit.description ? (
                            <p className="mt-0.5 text-sm text-slate-600">{produit.description}</p>
                          ) : null}
                          {produit.options.length > 0 ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Options :{" "}
                              {produit.options
                                .map(
                                  (option) =>
                                    `${option.nom}${option.supplementPrix > 0 ? ` (+${formatFcfa(option.supplementPrix, restaurant.devise)})` : ""}`,
                                )
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 font-titre font-extrabold text-marque-600">
                          {formatFcfa(produit.prix, restaurant.devise)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <Link href={`/m/${restaurant.slug}/t/2`} className={classesBouton("contour", "md")}>
              <Utensils className="size-4" aria-hidden />
              Voir le lien de la table 2
            </Link>
            <Link href="/inscription" className={classesBouton("principal", "md")}>
              Créer mon menu pour mon restaurant
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
