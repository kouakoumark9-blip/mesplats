/**
 * Maquettes illustratives de la page d'accueil : interface client (téléphone),
 * écran de service (tablette, mode sombre) et carte de table imprimée.
 *
 * Ce sont de vraies maquettes HTML/CSS — aucune capture d'écran, donc :
 *  - poids négligeable (essentiel en 3G) ;
 *  - netteté parfaite sur tous les écrans ;
 *  - cohérence automatique avec la charte de couleurs du produit.
 *
 * Le QR code affiché sur la carte de table est un **vrai** QR code, généré au
 * rendu par `lib/qr.ts` et pointant vers le menu de démonstration.
 */
import {
  Bell,
  CheckCheck,
  ChefHat,
  Clock,
  Copy,
  Flame,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Timer,
  Volume2,
  Wifi,
} from "lucide-react";

import { QrCodeInline } from "@/components/site/qr-code";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                        Menu client dans un téléphone                       */
/* -------------------------------------------------------------------------- */

const PLATS_MAQUETTE = [
  { emoji: "🐟", nom: "Attiéké poisson", prix: "2 500", options: "Piment vert · +200" },
  { emoji: "🍗", nom: "Kedjenou poulet", prix: "3 000", options: "Attiéké en plus · +500" },
  { emoji: "🍌", nom: "Alloco", prix: "500", options: null },
];

export function MaquetteTelephone({
  mode = "sur_place",
  numeroTable = "4",
  className,
}: {
  mode?: "sur_place" | "emporter";
  numeroTable?: string;
  className?: string;
}) {
  const total = "6 000";

  return (
    <div className={cn("relative mx-auto w-full max-w-[19rem]", className)}>
      {/* Cadre du téléphone */}
      <div className="rounded-[2.6rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/25">
        <div className="overflow-hidden rounded-[2rem] bg-white">
          {/* Barre d'état */}
          <div className="flex items-center justify-between bg-slate-900 px-5 pt-2 pb-1 text-[10px] font-semibold text-white/90">
            <span>12:42</span>
            <span className="flex items-center gap-1.5">
              <Wifi className="size-3" aria-hidden />
              <span className="inline-block h-2.5 w-5 rounded-[3px] border border-white/60 p-[1.5px]">
                <span className="block h-full w-3/4 rounded-[1px] bg-white/90" />
              </span>
            </span>
          </div>

          {/* En-tête du menu aux couleurs du restaurant */}
          <div className="degrade-principal px-4 pb-4 text-white">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                MB
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold">Maquis Le Baoulé</p>
                <p className="text-[10px] text-white/75">Cocody · Abidjan</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="font-titre text-[15px] leading-tight font-extrabold">
                {mode === "sur_place" ? `Table ${numeroTable}` : "À emporter"}
              </p>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
                {mode === "sur_place" ? "Sur place" : "Retrait 13h00"}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-slate-400 shadow-sm">
              <Search className="size-3.5" aria-hidden />
              <span className="text-[11px]">Rechercher un plat…</span>
            </div>
          </div>

          {/* Catégories */}
          <div className="masquer-defilement flex gap-1.5 overflow-x-auto px-3 py-2.5">
            {["Plats ivoiriens", "Grillades", "Boissons"].map((categorie, index) => (
              <span
                key={categorie}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap",
                  index === 0 ? "fond-principal" : "bg-slate-100 text-slate-600",
                )}
              >
                {categorie}
              </span>
            ))}
          </div>

          {/* Produits */}
          <div className="space-y-2 px-3 pb-3">
            {PLATS_MAQUETTE.map((plat) => (
              <div
                key={plat.nom}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-marque-50 to-marque-100 text-lg">
                  {plat.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] leading-tight font-bold text-slate-900">
                    {plat.nom}
                  </p>
                  {plat.options ? (
                    <p className="truncate text-[9.5px] text-slate-500">{plat.options}</p>
                  ) : null}
                  <p className="text-[11.5px] font-extrabold text-marque-600">{plat.prix} FCFA</p>
                </div>
                <span className="fond-principal flex size-7 shrink-0 items-center justify-center rounded-xl">
                  <Plus className="size-4" aria-hidden />
                </span>
              </div>
            ))}
          </div>

          {/* Barre de panier */}
          <div className="mx-3 mb-3 flex items-center justify-between gap-2 rounded-2xl bg-slate-900 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] font-bold whitespace-nowrap text-white">
              <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
              3 art. · {total} FCFA
            </span>
            <span className="fond-principal shrink-0 rounded-xl px-2.5 py-1.5 text-[10.5px] font-bold whitespace-nowrap">
              Commander
            </span>
          </div>

          {/* Indicateur d'accueil du téléphone */}
          <div className="flex justify-center pb-1.5">
            <span className="h-1 w-24 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                    Écran de service (tablette, mode sombre)                 */
/* -------------------------------------------------------------------------- */

const COMMANDES_MAQUETTE = [
  {
    numero: "N° 12",
    table: "Table 4",
    heure: "12:41",
    minutes: "il y a 1 min",
    articles: ["2 × Attiéké poisson braisé", "1 × Bissap frais"],
    note: "Sans piment s'il vous plaît",
    paiement: "Orange Money",
    statut: "nouvelle" as const,
  },
  {
    numero: "N° 11",
    table: "À emporter",
    heure: "12:36",
    minutes: "il y a 6 min",
    articles: ["1 × Kedjenou de poulet", "1 × Alloco"],
    note: null,
    paiement: "Espèces",
    statut: "en_preparation" as const,
  },
];

export function MaquetteEcranService({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950 shadow-2xl shadow-slate-950/40",
        className,
      )}
    >
      {/* Barre supérieure */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-marque-500/20 text-marque-300">
            <ChefHat className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-titre text-sm font-bold text-white">Écran de service</p>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="size-1.5 animate-clignote rounded-full bg-emerald-400" aria-hidden />
              En direct · actualisé toutes les 4 s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">
            <Bell className="size-3.5" aria-hidden />
            2 à traiter
          </span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
            <Volume2 className="size-4" aria-hidden />
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 px-4 py-3">
        {["Toutes", "Nouvelles", "Sur place", "À emporter"].map((filtre, index) => (
          <span
            key={filtre}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap",
              index === 0
                ? "bg-white text-slate-900"
                : "bg-slate-800/70 text-slate-400",
            )}
          >
            {filtre}
          </span>
        ))}
      </div>

      {/* Cartes de commande */}
      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
        {COMMANDES_MAQUETTE.map((commande) => (
          <div
            key={commande.numero}
            className={cn(
              "relative rounded-2xl border bg-slate-900 p-3.5",
              commande.statut === "nouvelle"
                ? "border-amber-500/40 shadow-lg shadow-amber-500/5"
                : "border-slate-800",
            )}
          >
            {commande.statut === "nouvelle" ? (
              <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
                <Flame className="size-3" aria-hidden />
                NOUVELLE
              </span>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-titre text-sm font-extrabold text-white">
                  {commande.numero} · {commande.table}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="size-3" aria-hidden />
                  {commande.heure} · {commande.minutes}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  commande.statut === "nouvelle"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-violet-500/15 text-violet-300",
                )}
              >
                {commande.statut === "nouvelle" ? "Nouvelle" : "En préparation"}
              </span>
            </div>

            <ul className="mt-2.5 space-y-1">
              {commande.articles.map((article) => (
                <li key={article} className="flex items-start gap-1.5 text-[12px] text-slate-200">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-500" aria-hidden />
                  {article}
                </li>
              ))}
            </ul>

            {commande.note ? (
              <p className="mt-2 rounded-lg bg-slate-800/80 px-2 py-1.5 text-[11px] text-amber-200 italic">
                « {commande.note} »
              </p>
            ) : null}

            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{commande.paiement}</span>
              <span className="font-bold text-emerald-300">6 000 FCFA</span>
            </div>

            <div className="mt-3 flex gap-2">
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11.5px] font-bold text-white">
                <CheckCheck className="size-3.5" aria-hidden />
                {commande.statut === "nouvelle" ? "Accepter" : "Marquer prête"}
              </span>
              <span className="flex size-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                <MessageCircle className="size-3.5" aria-hidden />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Carte de table imprimée + QR                        */
/* -------------------------------------------------------------------------- */

export function CarteQrTable({
  qrSvg,
  nomRestaurant = "Maquis Le Baoulé",
  numeroTable = "4",
  url,
  compact = false,
}: {
  /** Balisage SVG du QR code (voir `lib/qr.ts`). */
  qrSvg: string;
  nomRestaurant?: string;
  numeroTable?: string;
  url: string;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      {/* Effet de pile de cartes imprimées */}
      <div className="absolute inset-x-4 -bottom-2 h-full rounded-3xl bg-white/60 shadow-lg" aria-hidden />
      <div className="absolute inset-x-2 -bottom-1 h-full rounded-3xl bg-white/80 shadow-lg" aria-hidden />

      <div
        className={cn(
          "relative flex flex-col items-center rounded-3xl border border-slate-200 bg-white text-center shadow-xl",
          compact ? "p-5" : "p-6 sm:p-7",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <span className="flex size-7 items-center justify-center rounded-lg bg-marque-500 text-[11px] font-bold text-white">
            MB
          </span>
          {nomRestaurant}
        </span>

        <p className="mt-4 font-titre text-3xl font-extrabold text-slate-900">
          Table {numeroTable}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Scannez avec l&apos;appareil photo pour commander
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <QrCodeInline
            svg={qrSvg}
            taille={compact ? 140 : 168}
            label={`QR code de la table ${numeroTable} du restaurant ${nomRestaurant} — ${url}`}
          />
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          <Smartphone className="size-3.5" aria-hidden />
          Aucune application à installer
        </p>

        <p className="mt-3 max-w-full truncate font-mono text-[10px] text-slate-400">{url}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Paiement mobile money côté client                   */
/* -------------------------------------------------------------------------- */

export function MaquettePaiement({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-4 shadow-lg",
        className,
      )}
    >
      <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
        Paiement à effectuer
      </p>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-sm font-extrabold text-white">
          OM
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-orange-800">Orange Money</p>
          <p className="font-mono text-[13px] font-extrabold tracking-tight text-slate-900">
            +225 07 07 12 34 56
          </p>
        </div>
        <span className="flex size-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          <Copy className="size-3.5" aria-hidden />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-900 px-3.5 py-3 text-white">
        <span className="text-[11px] font-semibold text-slate-300">Montant exact</span>
        <span className="font-titre text-lg font-extrabold">6 000 FCFA</span>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-2.5 text-[11px] text-slate-500">
        <Timer className="size-3.5 shrink-0 text-marque-500" aria-hidden />
        Le restaurant valide le paiement à la réception
      </div>
    </div>
  );
}
