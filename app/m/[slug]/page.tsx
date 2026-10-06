/**
 * Aperçu du menu public (lecture seule).
 *
 * ⚠️ ÉTAPE 4 : cette page deviendra l'interface complète de commande
 * (panier, options, choix du paiement, suivi). Pour l'instant elle affiche
 * les vraies données du restaurant — nom, couleur, catégories, plats et
 * prix lus en base — afin que les liens de la page d'accueil mènent
 * quelque part d'utile plutôt qu'à une page introuvable.
 */
import {
  ArrowLeft,
  Clock,
  Info,
  MapPin,
  Phone,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoPlat } from "@/components/site/photo-plat";
import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { ICONES_RESEAUX, type CleReseau } from "@/components/ui/icones-reseaux";
import {
  COULEURS_FOND_MENU,
  LANGUES_MENU,
  POLICES_MENU,
  RESEAUX_SOCIAUX,
  type CouleurFondMenu,
  type PoliceMenu,
} from "@/lib/constants";
import { menuPublic, restaurantParSlug } from "@/lib/db/public";
import { direction, langueAutorisee, libelles } from "@/lib/i18n-public";
import {
  cn,
  contrasteSur,
  disponibiliteContrainte,
  estDisponibleMaintenant,
  formatFcfa,
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
    title: `${restaurant.nom} — Menu`,
    description: `Découvrez le menu de ${restaurant.nom}${restaurant.adresse ? ` · ${restaurant.adresse}` : ""}. Commandez en ligne, sans application.`,
  };
}

export default async function PageMenuPublic({ params, searchParams }: Proprietes) {
  const { slug } = await params;
  const { lang } = await searchParams;

  const restaurant = await restaurantParSlug(slug);
  if (!restaurant) notFound();

  const menu = await menuPublic(restaurant.id);
  const surCouleur = contrasteSur(restaurant.couleurPrincipale);

  /* ------------------- Réglages d'apparence choisis par le restaurateur ------------------- */
  const sombre = restaurant.themeMenu === "sombre";
  const fond =
    COULEURS_FOND_MENU.find((c) => c.cle === (restaurant.couleurFond as CouleurFondMenu)) ??
    COULEURS_FOND_MENU[0];
  const police =
    POLICES_MENU.find((p) => p.cle === (restaurant.policeMenu as PoliceMenu)) ?? POLICES_MENU[0];

  const languesProposees = restaurant.langues?.length ? restaurant.langues : ["fr"];
  const langue = langueAutorisee(lang, languesProposees);
  const t = libelles(langue);

  /** Palette dérivée du thème : les mêmes composants servent dans les deux modes. */
  const c = {
    fond: sombre ? "#0f172a" : fond.couleur,
    carte: sombre ? "#1b2637" : "#ffffff",
    carteDouce: sombre ? "#16202f" : "#f8fafc",
    bordure: sombre ? "#2c3a4f" : "#e8edf3",
    texte: sombre ? "#f8fafc" : "#0f172a",
    texteDoux: sombre ? "#9fb0c6" : "#5a6b80",
  };

  const reseauxActifs = RESEAUX_SOCIAUX.filter((reseau) => restaurant.reseaux?.[reseau.cle]);
  const adresseComplete = [
    restaurant.adresse,
    restaurant.adresseComplement,
    [restaurant.codePostal, restaurant.ville].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      dir={direction(langue)}
      className="min-h-dvh"
      style={{
        // Thème du restaurant : couleur de marque, fond, police et mode clair/sombre.
        ["--couleur-principale" as string]: restaurant.couleurPrincipale,
        ["--couleur-sur-principale" as string]: surCouleur,
        backgroundColor: c.fond,
        fontFamily: police.variable,
        color: c.texte,
      }}
    >
      {/* En-tête aux couleurs du restaurant (avec la bannière si elle est définie) */}
      <header className="degrade-principal relative overflow-hidden px-4 pt-6 pb-10 text-white">
        {restaurant.banniere ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.banniere}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(180deg, rgba(2,6,23,.45), rgba(2,6,23,.72)), ${restaurant.couleurPrincipale}55`,
              }}
            />
          </>
        ) : (
          <div className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-white/10 blur-2xl" />
        )}

        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Mesplats
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
              {restaurant.description ? (
                <p className="mt-1.5 max-w-xl text-sm text-white/85">{restaurant.description}</p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
                {adresseComplete ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden />
                    {adresseComplete}
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
          {languesProposees.length > 1 ? (
            <nav
              aria-label={t.langue}
              className="mt-5 flex flex-wrap items-center gap-1.5 rounded-full bg-white/15 p-1 backdrop-blur"
            >
              {LANGUES_MENU.filter((entree) => languesProposees.includes(entree.cle)).map((entree) => (
                <Link
                  key={entree.cle}
                  href={`/m/${restaurant.slug}${entree.cle === "fr" ? "" : `?lang=${entree.cle}`}`}
                  aria-current={langue === entree.cle ? "true" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition",
                    langue === entree.cle ? "bg-white text-slate-900" : "text-white/85 hover:bg-white/15",
                  )}
                >
                  {entree.libelle}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl px-4 pb-16">
        <div
          className="rounded-3xl border p-4 shadow-sm sm:p-5"
          style={{ backgroundColor: c.carte, borderColor: c.bordure }}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-titre text-lg font-extrabold tracking-tight" style={{ color: c.texte }}>
                {t.notreCarte}
              </h2>
              <p className="text-xs" style={{ color: c.texteDoux }}>
                {t.sousTitreCarte}
              </p>
            </div>
          </div>
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
              {menu.map((categorie) => {
                const servie = estDisponibleMaintenant(categorie.disponibilite);
                const contrainte = disponibiliteContrainte(categorie.disponibilite);

                return (
                <section key={categorie.id} aria-labelledby={`categorie-${categorie.id}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id={`categorie-${categorie.id}`}
                      className="font-titre text-lg font-extrabold tracking-tight"
                      style={{ color: contrainte && !servie ? c.texteDoux : c.texte }}
                    >
                      {categorie.nom}
                    </h2>
                    {contrainte ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: servie ? `${restaurant.couleurPrincipale}1a` : c.carteDouce,
                          color: servie ? restaurant.couleurPrincipale : c.texteDoux,
                        }}
                      >
                        <Clock className="size-3" aria-hidden />
                        {t.serviDe} {resumeDisponibilite(categorie.disponibilite).replace("Tous les jours · ", "")}
                      </span>
                    ) : null}
                    {contrainte && !servie ? (
                      <Badge ton="neutre">{t.revientPlusTard}</Badge>
                    ) : null}
                  </div>

                  <ul className="mt-3 space-y-2.5">
                    {categorie.produits.map((produit) => (
                      <li
                        key={produit.id}
                        className={cn(
                          "flex items-start gap-3 rounded-2xl border p-3 shadow-sm",
                          (!produit.disponible || !servie) && "opacity-70",
                        )}
                        style={{ backgroundColor: c.carteDouce, borderColor: c.bordure }}
                      >
                        <PhotoPlat
                          src={produit.photo}
                          alt={produit.nom}
                          taille={80}
                          className="size-20 rounded-xl"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-bold" style={{ color: c.texte }}>
                            {produit.nom}
                            {!produit.disponible ? (
                              <Badge ton="danger" className="ms-2 align-middle">
                                {t.epuise}
                              </Badge>
                            ) : null}
                          </p>
                          {produit.description ? (
                            <p className="mt-0.5 text-sm" style={{ color: c.texteDoux }}>
                              {produit.description}
                            </p>
                          ) : null}
                          {produit.personnesMin || produit.personnesMax ? (
                            <p className="mt-1 text-xs font-semibold" style={{ color: c.texteDoux }}>
                              {produit.personnesMin && produit.personnesMax
                                ? `${produit.personnesMin} – ${produit.personnesMax} ${t.pourPersonnes}`
                                : produit.personnesMin
                                  ? `${produit.personnesMin}+ ${t.pourPersonnes}`
                                  : `≤ ${produit.personnesMax} ${t.pourPersonnes}`}
                            </p>
                          ) : null}
                          {produit.options.length > 0 ? (
                            <p className="mt-1 text-xs" style={{ color: c.texteDoux }}>
                              {t.options} :{" "}
                              {produit.options
                                .map(
                                  (option) =>
                                    `${option.nom}${option.supplementPrix > 0 ? ` (+${formatFcfa(option.supplementPrix, restaurant.devise)})` : ""}`,
                                )
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <p
                          className="chiffres shrink-0 font-titre font-extrabold"
                          style={{ color: restaurant.couleurPrincipale }}
                        >
                          {formatFcfa(produit.prix, restaurant.devise)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
                );
              })}
            </div>
          )}

          {/* ------------------------ Informations pratiques ------------------------ */}
          <div className="mt-8 border-t pt-6" style={{ borderColor: c.bordure }}>
            <h2 className="font-titre text-sm font-extrabold" style={{ color: c.texte }}>
              {t.infos}
            </h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {adresseComplete ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: c.texteDoux }} aria-hidden />
                  <div>
                    <dt className="font-semibold" style={{ color: c.texte }}>
                      {restaurant.nom}
                    </dt>
                    <dd style={{ color: c.texteDoux }}>{adresseComplete}</dd>
                  </div>
                </div>
              ) : null}
              {restaurant.telephone ? (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0" style={{ color: c.texteDoux }} aria-hidden />
                  <div>
                    <dt className="font-semibold" style={{ color: c.texte }}>
                      {t.appeler}
                    </dt>
                    <dd>
                      <a href={`tel:${restaurant.telephone.replace(/\s/g, "")}`} className="underline">
                        {restaurant.telephone}
                      </a>
                    </dd>
                  </div>
                </div>
              ) : null}
              {restaurant.horaires ? (
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 size-4 shrink-0" style={{ color: c.texteDoux }} aria-hidden />
                  <div>
                    <dt className="font-semibold" style={{ color: c.texte }}>
                      {t.surPlace} · {t.aEmporter}
                    </dt>
                    <dd style={{ color: c.texteDoux }}>{restaurant.horaires}</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {reseauxActifs.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: c.texteDoux }}>
                  {t.suivre}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reseauxActifs.map((reseau) => {
                    const Icone = ICONES_RESEAUX[reseau.cle as CleReseau];
                    return (
                      <a
                        key={reseau.cle}
                        href={restaurant.reseaux?.[reseau.cle]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80"
                        style={{ borderColor: c.bordure, color: c.texte }}
                      >
                        <Icone className="size-4" />
                        {reseau.libelle}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t pt-6" style={{ borderColor: c.bordure }}>
            <Link
              href={`/m/${restaurant.slug}/t/2`}
              className={classesBouton("contour", "md")}
            >
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
