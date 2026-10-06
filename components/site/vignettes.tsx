/**
 * Vignettes illustratives pour la grille de fonctionnalités.
 *
 * Chaque vignette est une **miniature d'interface réelle** (HTML/CSS), pas une
 * capture d'écran : le poids reste négligeable et les couleurs suivent la
 * charte du produit.
 */
import {
  BadgeCheck,
  BarChart3,
  Bell,
  ChefHat,
  Check,
  ChefHat as CuisineIcon,
  HandPlatter,
  Plus,
  QrCode,
  Shield,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

import photoKedjenou from "@/public/plats/kedjenou-poulet.jpg";
import photoAttieke from "@/public/plats/attieke-poisson.jpg";

/** Cadre gris clair contenant une miniature centrée. */
function Cadre({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------- Créer son menu en quelques clics ----------------- */

export function VignetteCreation() {
  return (
    <Cadre>
      <div className="w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-[11px] font-extrabold text-slate-900">Ajoutons vos plats</p>
        <p className="mt-0.5 text-[9px] text-slate-500">
          Nom, prix, photo, suppléments — en quelques secondes.
        </p>

        <div className="mt-2.5 space-y-1.5">
          <div className="rounded-lg border border-dashed border-marque-300 bg-marque-50/60 px-2 py-2 text-center">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-marque-700">
              <Plus className="size-3" aria-hidden />
              Ajouter une photo
            </span>
          </div>
          <div className="space-y-1 rounded-lg border border-slate-200 px-2 py-1.5">
            <p className="text-[8px] font-bold text-slate-400">Nom du plat</p>
            <p className="text-[10px] text-slate-700">Kedjenou de poulet</p>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 space-y-1 rounded-lg border border-slate-200 px-2 py-1.5">
              <p className="text-[8px] font-bold text-slate-400">Prix</p>
              <p className="text-[10px] text-slate-700">3 000 FCFA</p>
            </div>
            <div className="flex-1 space-y-1 rounded-lg border border-slate-200 px-2 py-1.5">
              <p className="text-[8px] font-bold text-slate-400">Catégorie</p>
              <p className="text-[10px] text-slate-700">Plats</p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-900 px-2 py-1.5 text-center text-[9.5px] font-bold text-white">
            Enregistrer le plat
          </div>
        </div>
      </div>
    </Cadre>
  );
}

/* ------------------------------ Temps réel --------------------------------- */

export function VignetteTempsReel() {
  const rubriques = [
    { nom: "Plats ivoiriens", actif: true },
    { nom: "Grillades & braisés", actif: true },
    { nom: "Boissons fraîches", actif: true },
    { nom: "Desserts", actif: false },
  ];

  return (
    <Cadre>
      <div className="w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-slate-900">Vos catégories</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
            <span className="size-1.5 animate-clignote rounded-full bg-emerald-500" aria-hidden />
            En direct
          </span>
        </div>

        <ul className="mt-2.5 space-y-1.5">
          {rubriques.map((rubrique) => (
            <li
              key={rubrique.nom}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2 py-1.5"
            >
              <span className="truncate text-[9.5px] font-semibold text-slate-700">{rubrique.nom}</span>
              <span
                className={cn(
                  "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  rubrique.actif ? "bg-emerald-500" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "size-3 rounded-full bg-white shadow transition-transform",
                    rubrique.actif && "translate-x-3",
                  )}
                />
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2.5 text-center text-[8.5px] text-slate-400">
          Toute modification est visible immédiatement par le client
        </p>
      </div>
    </Cadre>
  );
}

/* ---------------------------- Parfait sur mobile ---------------------------- */

export function VignetteMobile() {
  return (
    <Cadre>
      <div className="w-40 overflow-hidden rounded-[1.6rem] border-[7px] border-slate-900 bg-slate-900 shadow-xl">
        <div className="rounded-[1.1rem] bg-white">
          <div className="relative h-20">
            <Image src={photoKedjenou} alt="Plat du jour" fill sizes="160px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            <p className="absolute bottom-1.5 left-2 font-titre text-[10px] font-extrabold text-white">
              Maquis Le Baoulé
            </p>
          </div>
          <div className="space-y-1.5 p-2">
            {[
              { photo: photoAttieke, nom: "Attiéké poisson", prix: "2 500" },
              { photo: photoKedjenou, nom: "Kedjenou", prix: "3 000" },
            ].map((plat) => (
              <div key={plat.nom} className="flex items-center gap-1.5 rounded-lg border border-slate-100 p-1">
                <Image
                  src={plat.photo}
                  alt={plat.nom}
                  width={64}
                  height={64}
                  sizes="32px"
                  className="size-8 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[8.5px] font-bold text-slate-900">{plat.nom}</p>
                  <p className="text-[8.5px] font-extrabold text-marque-600">{plat.prix} FCFA</p>
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-slate-900 py-1.5 text-center text-[8.5px] font-bold text-white">
              Commander
            </div>
          </div>
        </div>
      </div>
    </Cadre>
  );
}

/* ------------------------------ Statuts cuisine ---------------------------- */

export function VignetteStatuts() {
  const colonnes = [
    { titre: "Nouvelles", ton: "bg-amber-100 text-amber-800", cartes: ["N° 12 · Table 4", "N° 13 · Emporter"] },
    { titre: "En préparation", ton: "bg-violet-100 text-violet-800", cartes: ["N° 11 · Table 2"] },
    { titre: "Prêtes", ton: "bg-emerald-100 text-emerald-800", cartes: ["N° 10 · Table 7"] },
  ];

  return (
    <Cadre className="items-start pt-5">
      <div className="flex w-full max-w-xs gap-2 px-3">
        {colonnes.map((colonne) => (
          <div key={colonne.titre} className="flex-1">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[8.5px] font-bold", colonne.ton)}>
              {colonne.titre}
            </span>
            <div className="mt-2 space-y-1.5">
              {colonne.cartes.map((carte) => (
                <div
                  key={carte}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[8.5px] font-semibold text-slate-700 shadow-sm"
                >
                  {carte}
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-slate-200 py-2 text-center text-[8px] text-slate-400">
                glisser
              </div>
            </div>
          </div>
        ))}
      </div>
    </Cadre>
  );
}

/* --------------------------------- Équipe --------------------------------- */

export function VignetteEquipe() {
  const comptes = [
    { initiales: "AK", nom: "Awa Konan", role: "Propriétaire", icone: <Shield className="size-3" aria-hidden />, ton: "bg-marque-100 text-marque-700" },
    { initiales: "YS", nom: "Yao Serge", role: "Serveur", icone: <HandPlatter className="size-3" aria-hidden />, ton: "bg-blue-100 text-blue-700" },
    { initiales: "AT", nom: "Aya Traoré", role: "Cuisine", icone: <CuisineIcon className="size-3" aria-hidden />, ton: "bg-violet-100 text-violet-700" },
  ];

  return (
    <Cadre>
      <div className="w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-slate-900">Comptes de l&apos;équipe</p>
          <span className="flex size-5 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Plus className="size-3" aria-hidden />
          </span>
        </div>

        <ul className="mt-2.5 space-y-1.5">
          {comptes.map((compte) => (
            <li key={compte.nom} className="flex items-center gap-2 rounded-lg border border-slate-100 p-1.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-600">
                {compte.initiales}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9.5px] font-bold text-slate-800">{compte.nom}</p>
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                    compte.ton,
                  )}
                >
                  {compte.icone}
                  {compte.role}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Cadre>
  );
}

/* ------------------------------ Statistiques ------------------------------ */

export function VignetteStats() {
  const barres = [42, 68, 55, 90, 74, 96, 61];

  return (
    <Cadre>
      <div className="w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-slate-900">Aujourd&apos;hui</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
            <TrendingUp className="size-2.5" aria-hidden />
            +18 %
          </span>
        </div>

        <p className="mt-2 font-titre text-[19px] leading-none font-extrabold text-slate-900">
          186 500 FCFA
        </p>
        <p className="mt-0.5 text-[8.5px] text-slate-500">74 commandes servies</p>

        <div className="mt-3 flex h-16 items-end gap-1.5">
          {barres.map((hauteur, index) => (
            <span
              key={index}
              style={{ height: `${hauteur}%` }}
              className={cn(
                "flex-1 rounded-sm",
                index === 5 ? "bg-marque-500" : "bg-marque-200",
              )}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[8.5px]">
          <span className="flex items-center gap-1 text-slate-500">
            <BarChart3 className="size-2.5" aria-hidden />
            Plat le plus vendu
          </span>
          <span className="font-bold text-slate-800">Attiéké poisson</span>
        </div>
      </div>
    </Cadre>
  );
}

/* --------------------------- Alertes & suivi client ------------------------ */

export function VignetteNotifications() {
  return (
    <Cadre className="items-start justify-center pt-6">
      <div className="w-56 space-y-2">
        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-lg">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Bell className="size-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-extrabold text-slate-900">Nouvelle commande · Table 4</p>
            <p className="text-[8.5px] text-slate-500">3 articles · 6 000 FCFA</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-lg">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <BadgeCheck className="size-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-extrabold text-slate-900">Commande prête</p>
            <p className="text-[8.5px] text-slate-500">Message WhatsApp pré-rempli au client</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-900 p-2.5 shadow-lg">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <p className="text-[9.5px] font-bold text-white">
            Le client suit sa commande en direct
          </p>
        </div>
      </div>
    </Cadre>
  );
}

/* ------------------------------- QR codes --------------------------------- */

export function VignetteQr({ svg }: { svg: string }) {
  return (
    <Cadre>
      <div className="flex items-center gap-3">
        <div className="w-28 rounded-2xl border border-slate-200 bg-white p-2.5 text-center shadow-lg">
          <p className="text-[8px] font-bold tracking-wide text-slate-500 uppercase">Table 4</p>
          <span
            role="img"
            aria-label="QR code de la table 4"
            className="mx-auto mt-1.5 block size-20 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-1 text-[8px] font-semibold text-slate-500">Scannez et commandez</p>
        </div>

        <div className="space-y-1.5">
          {["Une carte par table", "Planche PDF A4", "Export PNG"].map((element) => (
            <span
              key={element}
              className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[8.5px] font-bold text-slate-600 ring-1 ring-slate-200"
            >
              <Check className="size-2.5 text-emerald-600" aria-hidden />
              {element}
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-full bg-slate-900 px-2 py-1 text-[8.5px] font-bold text-white">
            <QrCode className="size-2.5" aria-hidden />
            QR « À emporter »
          </span>
        </div>
      </div>
    </Cadre>
  );
}

/* -------------------------------- Icônes ---------------------------------- */

export const ICONES_VIGNETTES = {
  creation: <Plus className="size-4" aria-hidden />,
  cuisine: <ChefHat className="size-4" aria-hidden />,
  client: <UserRound className="size-4" aria-hidden />,
};
