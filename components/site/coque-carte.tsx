/**
 * Coque de la carte publique : en-tête (bannière, logo, présentation,
 * coordonnées, sélecteur de langue) puis pied (informations pratiques,
 * réseaux sociaux). Le contenu commandable — recherche, plats, panier — est
 * fourni par `MenuCommande` via `children`.
 *
 * Composant serveur : aucun JavaScript n'est envoyé pour ces parties, ce qui
 * compte pour un client qui scanne un QR code en 3G.
 */
import { ArrowLeft, Clock, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

import { ICONES_RESEAUX, type CleReseau } from "@/components/ui/icones-reseaux";
import {
  COULEURS_FOND_MENU,
  LANGUES_MENU,
  POLICES_MENU,
  RESEAUX_SOCIAUX,
  type CouleurFondMenu,
  type PoliceMenu,
} from "@/lib/constants";
import type { RestaurantPublic } from "@/lib/db/public";
import type { CodeLangue } from "@/lib/i18n-public";
import { LIBELLES_PUBLICS } from "@/lib/i18n-public";
import { cn, contrasteSur } from "@/lib/utils";

export type PalettePublique = {
  fond: string;
  carte: string;
  carteDouce: string;
  bordure: string;
  texte: string;
  texteDoux: string;
};

/** Palette dérivée du thème choisi par le restaurateur. */
export function palettePublique(restaurant: RestaurantPublic): {
  palette: PalettePublique;
  police: string;
  fond: (typeof COULEURS_FOND_MENU)[number];
} {
  const sombre = restaurant.themeMenu === "sombre";
  const fond =
    COULEURS_FOND_MENU.find((c) => c.cle === (restaurant.couleurFond as CouleurFondMenu)) ??
    COULEURS_FOND_MENU[0];
  const police =
    POLICES_MENU.find((p) => p.cle === (restaurant.policeMenu as PoliceMenu)) ?? POLICES_MENU[0];

  return {
    palette: {
      fond: sombre ? "#0f172a" : fond.couleur,
      carte: sombre ? "#1b2637" : "#ffffff",
      carteDouce: sombre ? "#16202f" : "#f8fafc",
      bordure: sombre ? "#2c3a4f" : "#e8edf3",
      texte: sombre ? "#f8fafc" : "#0f172a",
      texteDoux: sombre ? "#9fb0c6" : "#5a6b80",
    },
    police: police.variable,
    fond,
  };
}

export function CoqueCarte({
  restaurant,
  langue,
  tableNumero,
  children,
  palette,
  police,
}: {
  restaurant: RestaurantPublic;
  langue: CodeLangue;
  /** Numéro de table quand la page vient d'un QR code de table. */
  tableNumero?: string | null;
  children: ReactNode;
  palette: PalettePublique;
  police: string;
}) {
  const t = LIBELLES_PUBLICS[langue];
  const surCouleur = contrasteSur(restaurant.couleurPrincipale);
  const languesProposees = restaurant.langues?.length ? restaurant.langues : ["fr"];
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
      dir={langue === "ar" ? "rtl" : "ltr"}
      className="min-h-dvh"
      style={{
        ["--couleur-principale" as string]: restaurant.couleurPrincipale,
        ["--couleur-sur-principale" as string]: surCouleur,
        backgroundColor: palette.fond,
        fontFamily: police,
        color: palette.texte,
      }}
    >
      {/* ------------------------------ En-tête ------------------------------ */}
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
            href={`/m/${restaurant.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Mesplats
          </Link>

          {tableNumero ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">
              <MapPin className="size-3.5" aria-hidden />
              {t.surPlace} · {tableNumero}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-4">
            {restaurant.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo}
                alt={`Logo de ${restaurant.nom}`}
                className="size-14 rounded-2xl border-2 border-white/30 bg-white/10 object-contain p-1"
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

      <main className="mx-auto -mt-6 max-w-3xl px-4 pb-28">
        <div
          className="rounded-3xl border p-4 shadow-sm sm:p-5"
          style={{ backgroundColor: palette.carte, borderColor: palette.bordure }}
        >
          {children}
        </div>

        {/* ------------------------- Informations pratiques ------------------------- */}
        <div
          className="mt-4 rounded-3xl border p-4 shadow-sm sm:p-5"
          style={{ backgroundColor: palette.carte, borderColor: palette.bordure }}
        >
          <h2 className="font-titre text-sm font-extrabold" style={{ color: palette.texte }}>
            {t.infos}
          </h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {adresseComplete ? (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: palette.texteDoux }} aria-hidden />
                <div>
                  <dt className="font-semibold" style={{ color: palette.texte }}>
                    {restaurant.nom}
                  </dt>
                  <dd style={{ color: palette.texteDoux }}>{adresseComplete}</dd>
                </div>
              </div>
            ) : null}
            {restaurant.telephone ? (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" style={{ color: palette.texteDoux }} aria-hidden />
                <div>
                  <dt className="font-semibold" style={{ color: palette.texte }}>
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
                <Clock className="mt-0.5 size-4 shrink-0" style={{ color: palette.texteDoux }} aria-hidden />
                <div>
                  <dt className="font-semibold" style={{ color: palette.texte }}>
                    {t.surPlace} · {t.aEmporter}
                  </dt>
                  <dd style={{ color: palette.texteDoux }}>{restaurant.horaires}</dd>
                </div>
              </div>
            ) : null}
          </dl>

          {reseauxActifs.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-bold tracking-wide uppercase" style={{ color: palette.texteDoux }}>
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
                      style={{ borderColor: palette.bordure, color: palette.texte }}
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

        <p className="mt-4 text-center text-xs" style={{ color: palette.texteDoux }}>
          Menu propulsé par{" "}
          <Link href="/" className="font-bold underline">
            Mesplats
          </Link>{" "}
          — <Link href="/inscription" className="underline">créez le vôtre</Link>
        </p>
      </main>
    </div>
  );
}
