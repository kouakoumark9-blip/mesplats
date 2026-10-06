/**
 * Composition visuelle du héro : trois écrans du produit + éléments flottants.
 *
 * Tout est construit en HTML/CSS avec les **vraies photos de plats** de la
 * démonstration :
 *  - l'accueil du menu client (photo, catégories, plats, panier) ;
 *  - la fiche d'un plat avec ses suppléments ;
 *  - la page d'accueil du restaurant (profil public).
 *
 * Les images passent par `next/image` (WebP automatique, chargement paresseux),
 * et une carte de plat + une pastille QR flottent autour des écrans, comme sur
 * les sites SaaS modernes.
 */
import { BadgeCheck, ChefHat, Clock, MapPin, Phone, Plus, Search, Star, Wifi } from "lucide-react";
import Image from "next/image";

import { QrCodeInline } from "@/components/site/qr-code";
import { cn } from "@/lib/utils";

import photoAlloco from "@/public/plats/alloco.jpg";
import photoAttieke from "@/public/plats/attieke-poisson.jpg";
import photoBissap from "@/public/plats/bissap.jpg";
import photoKedjenou from "@/public/plats/kedjenou-poulet.jpg";

/* -------------------------------------------------------------------------- */
/*                              Éléments communs                              */
/* -------------------------------------------------------------------------- */

/** Coque de téléphone réutilisable (aussi utilisée par les maquettes d'étapes). */
export function Telephone({
  children,
  className,
  taille = "md",
}: {
  children: React.ReactNode;
  className?: string;
  /** Largeur prédéfinie. Ignorée si `className` impose sa propre largeur. */
  taille?: "sm" | "md" | "lg";
}) {
  const largeurs = {
    sm: "",
    md: "w-[15rem] sm:w-[16.5rem]",
    lg: "w-[16.5rem] sm:w-[19rem]",
  };

  return (
    <div className={cn("relative shrink-0", largeurs[taille], className)}>
      <div className="overflow-hidden rounded-[2.2rem] border-[9px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/25">
        <div className="flex items-center justify-between bg-slate-900 px-5 pt-1.5 pb-1 text-[9px] font-semibold text-white/90">
          <span>12:42</span>
          <span className="flex items-center gap-1">
            <Wifi className="size-2.5" aria-hidden />
            <span className="inline-block h-2 w-4 rounded-[2px] border border-white/60 p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-white/90" />
            </span>
          </span>
        </div>
        <div className="overflow-hidden rounded-[1.6rem] bg-white">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                Écran 1 — accueil du menu (le plus visible)                  */
/* -------------------------------------------------------------------------- */

const PLATS = [
  { photo: photoAttieke, nom: "Attiéké poisson braisé", prix: "2 500", desc: "Poisson entier, oignons" },
  { photo: photoKedjenou, nom: "Kedjenou de poulet", prix: "3 000", desc: "Mijoté au canari" },
  { photo: photoAlloco, nom: "Alloco", prix: "500", desc: "Plantain frit, sauce piment" },
];

export function EcranMenu() {
  return (
    <Telephone taille="lg">
      {/* Bandeau du restaurant par-dessus la photo */}
      <div className="relative h-40">
        <Image
          src={photoKedjenou}
          alt="Kedjenou de poulet servi dans son canari"
          fill
          priority
          sizes="(max-width: 640px) 264px, 304px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-white/25 text-[10px] font-extrabold backdrop-blur">
              MB
            </span>
            <div className="min-w-0">
              <p className="truncate font-titre text-[13px] font-extrabold">Maquis Le Baoulé</p>
              <p className="flex items-center gap-1 text-[9.5px] text-white/80">
                <Clock className="size-2.5" aria-hidden />
                Ouvert · 11h – 23h
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold backdrop-blur">
              4,8
              <Star className="size-2.5 fill-amber-300 text-amber-300" aria-hidden />
            </span>
          </div>
        </div>

        <span className="absolute top-2.5 left-2.5 rounded-full bg-marque-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
          Table 4
        </span>
      </div>

      {/* Recherche */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-400">
          <Search className="size-3.5" aria-hidden />
          <span className="text-[10.5px]">Rechercher un plat…</span>
        </div>
      </div>

      {/* Catégories */}
      <div className="masquer-defilement flex gap-1.5 overflow-x-auto px-3 py-2.5">
        {["Tout", "Plats ivoiriens", "Grillades", "Boissons"].map((categorie, index) => (
          <span
            key={categorie}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-bold whitespace-nowrap",
              index === 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {categorie}
          </span>
        ))}
      </div>

      {/* Plats */}
      <div className="space-y-2 px-3">
        {PLATS.map((plat) => (
          <div key={plat.nom} className="flex items-center gap-2.5 rounded-2xl border border-slate-100 p-1.5 shadow-sm">
            <Image
              src={plat.photo}
              alt={plat.nom}
              width={96}
              height={96}
              sizes="48px"
              className="size-12 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-slate-900">{plat.nom}</p>
              <p className="truncate text-[9px] text-slate-500">{plat.desc}</p>
              <p className="text-[11px] font-extrabold text-marque-600">{plat.prix} FCFA</p>
            </div>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-marque-500 text-white">
              <Plus className="size-3.5" aria-hidden />
            </span>
          </div>
        ))}
      </div>

      {/* Panier */}
      <div className="m-3 flex items-center justify-between gap-2 rounded-2xl bg-slate-900 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[10px] font-bold whitespace-nowrap text-white">
          3 art. · 6 000 FCFA
        </span>
        <span className="shrink-0 rounded-xl bg-marque-500 px-2.5 py-1.5 text-[10px] font-bold whitespace-nowrap text-white">
          Commander
        </span>
      </div>
    </Telephone>
  );
}

/* -------------------------------------------------------------------------- */
/*            Écran 2 — fiche produit avec suppléments (à gauche)             */
/* -------------------------------------------------------------------------- */

export function EcranFicheProduit() {
  return (
    <Telephone>
      <div className="relative h-32">
        <Image
          src={photoAttieke}
          alt="Attiéké poisson braisé"
          fill
          sizes="264px"
          className="object-cover"
        />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-extrabold text-slate-700">
          ← Retour
        </span>
      </div>

      <div className="p-3">
        <p className="font-titre text-[12.5px] font-extrabold text-slate-900">
          Attiéké poisson braisé
        </p>
        <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
          Poisson braisé au charbon, attiéké frais, oignons et tomates.
        </p>
        <p className="mt-1.5 text-[13px] font-extrabold text-marque-600">2 500 FCFA</p>

        <p className="mt-3 text-[9px] font-bold tracking-wide text-slate-400 uppercase">
          Suppléments
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {[
            { nom: "Piment vert écrasé", prix: "+200", coche: true },
            { nom: "Supplément poisson", prix: "+1 500", coche: false },
            { nom: "Alloco en plus", prix: "+500", coche: false },
          ].map((option) => (
            <li key={option.nom} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded border",
                    option.coche
                      ? "border-marque-500 bg-marque-500 text-white"
                      : "border-slate-300",
                  )}
                >
                  {option.coche ? (
                    <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
                      <path d="M1 5l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ) : null}
                </span>
                <span className="truncate text-slate-700">{option.nom}</span>
              </span>
              <span className="shrink-0 font-bold text-slate-900">{option.prix}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 rounded-xl bg-slate-50 p-2">
          <p className="text-[9px] font-bold text-slate-500">Note pour la cuisine</p>
          <p className="text-[9.5px] text-slate-700 italic">« Pas trop de piment »</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-3 py-2">
          <span className="text-[10px] font-bold whitespace-nowrap text-white">Ajouter · 2 700 FCFA</span>
          <span className="flex size-6 items-center justify-center rounded-lg bg-marque-500 text-white">
            <Plus className="size-3" aria-hidden />
          </span>
        </div>
      </div>
    </Telephone>
  );
}

/* -------------------------------------------------------------------------- */
/*           Écran 3 — profil public du restaurant (à droite)                 */
/* -------------------------------------------------------------------------- */

export function EcranProfilRestaurant() {
  return (
    <Telephone>
      <div className="relative h-24">
        <Image
          src={photoAlloco}
          alt="Alloco servi au Maquis Le Baoulé"
          fill
          sizes="264px"
          className="object-cover"
        />
      </div>

      <div className="-mt-6 px-3 pb-3">
        <span className="flex size-12 items-center justify-center rounded-2xl border-4 border-white bg-marque-600 text-[13px] font-extrabold text-white shadow-sm">
          MB
        </span>

        <p className="mt-1.5 font-titre text-[12.5px] font-extrabold text-slate-900">
          Maquis Le Baoulé
        </p>
        <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
          Cuisine ivoirienne maison, grillades au charbon et jus frais pressés.
        </p>

        <div className="mt-2 space-y-1 text-[9.5px] text-slate-600">
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3 shrink-0 text-slate-400" aria-hidden />
            Rue des Jardins, Cocody — Abidjan
          </p>
          <p className="flex items-center gap-1.5">
            <Phone className="size-3 shrink-0 text-slate-400" aria-hidden />
            +225 07 07 12 34 56
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="size-3 shrink-0 text-slate-400" aria-hidden />
            Tous les jours · 11h – 23h
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {["Sur place", "À emporter", "Mobile money"].map((etiquette) => (
            <span
              key={etiquette}
              className="rounded-full bg-marque-50 px-2 py-0.5 text-[8.5px] font-bold text-marque-700"
            >
              {etiquette}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          {["Plats ivoiriens", "Grillades & braisés", "Boissons fraîches"].map((rubrique) => (
            <div
              key={rubrique}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-2.5 py-2"
            >
              <span className="text-[10px] font-semibold text-slate-700">{rubrique}</span>
              <span className="text-[9px] text-slate-400">Voir</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-feuille-50 px-3 py-2 text-[9.5px] font-bold text-feuille-700">
          <BadgeCheck className="size-3.5" aria-hidden />
          Commande reçue par la cuisine
        </div>
      </div>
    </Telephone>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Carte de plat flottante                            */
/* -------------------------------------------------------------------------- */

export function CartePlatFlottante({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-52 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-900/10",
        className,
      )}
    >
      <div className="flex gap-2.5">
        <Image
          src={photoAttieke}
          alt="Attiéké poisson braisé"
          width={128}
          height={128}
          sizes="56px"
          className="size-14 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-[11px] leading-tight font-extrabold text-slate-900">
            Attiéké poisson braisé
          </p>
          <p className="mt-0.5 text-[8.5px] text-slate-500">Poisson entier, oignons, tomate</p>
          <p className="mt-1 text-[10.5px] font-extrabold text-slate-900">
            2 500 FCFA
            <span className="ml-1 text-[9px] font-medium text-slate-400 line-through">3 000</span>
          </p>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        <span className="rounded-full bg-marque-50 px-1.5 py-0.5 text-[8.5px] font-bold text-marque-700">
          Chef&apos;s choice
        </span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-600">
          Nouveau
        </span>
      </div>
    </div>
  );
}

export function CarteBoissonFlottante({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-44 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-900/10",
        className,
      )}
    >
      <div className="flex gap-2.5">
        <Image
          src={photoBissap}
          alt="Jus de bissap frais"
          width={112}
          height={112}
          sizes="48px"
          className="size-12 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-[10.5px] leading-tight font-extrabold text-slate-900">Bissap frais</p>
          <p className="mt-0.5 text-[8.5px] text-slate-500">Infusion d&apos;hibiscus glacée</p>
          <p className="mt-1 text-[10px] font-extrabold text-slate-900">500 FCFA</p>
        </div>
      </div>
      <span className="mt-2 inline-block rounded-full bg-feuille-50 px-1.5 py-0.5 text-[8.5px] font-bold text-feuille-700">
        Sans alcool
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                 Pastille ronde « Scannez pour découvrir »                  */
/* -------------------------------------------------------------------------- */

export function PastilleQr({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex size-28 items-center justify-center rounded-full bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <path
            id="cercle-texte"
            d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
            fill="none"
          />
        </defs>
        <text className="fill-slate-500 text-[8.6px] font-bold tracking-[0.18em] uppercase">
          <textPath href="#cercle-texte" startOffset="2%">
            Scannez pour découvrir le menu ·
          </textPath>
        </text>
      </svg>

      <QrCodeInline svg={svg} taille={58} label="QR code du menu de démonstration" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Bandeau « équipe » flottant                       */
/* -------------------------------------------------------------------------- */

export function BandeauCuisineFlottant({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xl shadow-slate-900/10",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <ChefHat className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-[10.5px] font-extrabold whitespace-nowrap text-slate-900">
          Prête à servir · Table 4
        </p>
        <p className="text-[9px] whitespace-nowrap text-slate-500">Cuisine avertie il y a 30 s</p>
      </div>
    </div>
  );
}
