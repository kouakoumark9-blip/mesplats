/**
 * Mini-maquettes d'écran pour la section « Votre menu en ligne en 3 étapes ».
 *
 * Trois scènes dessinées en HTML/CSS (aucune image à télécharger, poids nul,
 * netteté parfaite sur tous les écrans) :
 *  - `MaquetteCreation`  : ajout d'un plat dans le back-office ;
 *  - `MaquetteQrImprimes` : planche d'impression des QR codes de table ;
 *  - `MaquetteCommandeRecue` : commande reçue sur l'écran de service.
 *
 * Elles sont volontairement génériques : la couleur principale est celle
 * d'AfriMenu (marque), pour représenter le produit et non un restaurant précis.
 */
import { Bell, CheckCheck, ImagePlus, Plus, Printer, QrCode, ScanLine, Table2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

import photoAttieke from "@/public/plats/attieke-poisson.jpg";

/** Cadre commun : fond dégradé doux, centrage, arrondis. */
function Cadre({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* =========================== Étape 1 — créer le menu ======================== */

export function MaquetteCreation() {
  return (
    <Cadre>
      <div className="w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold text-slate-900">Ajouter un plat</p>
          <span className="rounded-full bg-marque-50 px-1.5 py-0.5 text-[8px] font-bold text-marque-700">
            Plats ivoiriens
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
            <Image
              src={photoAttieke}
              alt=""
              width={32}
              height={32}
              sizes="32px"
              className="size-8 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold text-slate-800">Attiéké poisson braisé</p>
              <p className="text-[9px] text-slate-500">2 500 FCFA</p>
            </div>
            <ImagePlus className="size-3.5 shrink-0 text-marque-500" aria-hidden />
          </div>

          <div className="space-y-1 rounded-lg border border-slate-200 px-2 py-1.5">
            <p className="text-[8px] font-bold tracking-wide text-slate-400 uppercase">Prix</p>
            <p className="text-[10px] font-semibold text-slate-700">2 500 FCFA</p>
          </div>

          <div className="space-y-1 rounded-lg border border-slate-200 px-2 py-1.5">
            <p className="text-[8px] font-bold tracking-wide text-slate-400 uppercase">
              Suppléments
            </p>
            <p className="flex flex-wrap gap-1">
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-medium text-slate-600">
                Piment +200
              </span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-medium text-slate-600">
                Poisson +1 500
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 rounded-lg bg-marque-500 px-2 py-1.5 text-[9.5px] font-bold text-white">
            <Plus className="size-3" aria-hidden />
            Ajouter au menu
          </div>
        </div>
      </div>
    </Cadre>
  );
}

/* ========================= Étape 2 — imprimer les QR ======================== */

export function MaquetteQrImprimes({ qrSvg }: { qrSvg: string }) {
  return (
    <Cadre>
      {/* Planche A4 avec deux cartes de table */}
      <div className="w-56 rotate-[-1deg] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold text-slate-900">Planche A4 · 5 tables</p>
          <Printer className="size-3.5 text-slate-400" aria-hidden />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {["Table 1", "Table 2"].map((numero) => (
            <div
              key={numero}
              className="flex flex-col items-center rounded-lg border border-slate-200 px-2 py-2"
            >
              <span className="text-[8px] font-extrabold tracking-wide text-marque-600 uppercase">
                {numero}
              </span>
              {/* Vrai QR code (généré au rendu), réduit à la taille d'une vignette */}
              <span
                role="img"
                aria-label={`QR code de la ${numero.toLowerCase()} du restaurant de démonstration`}
                className="mt-1 block size-12 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="mt-1 text-[7px] font-semibold text-slate-400">Scannez</span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 border-t border-dashed border-slate-200 pt-2">
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">
            <Table2 className="size-2.5" aria-hidden />
            PNG
          </span>
          <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[8px] font-bold text-white">
            <QrCode className="size-2.5" aria-hidden />
            À emporter
          </span>
        </div>
      </div>
    </Cadre>
  );
}

/* ======================= Étape 3 — commande reçue ========================== */

export function MaquetteCommandeRecue() {
  return (
    <Cadre>
      {/* Écran de service : bandeau de notification + carte commande */}
      <div className="w-60 space-y-1.5">
        <div className="flex items-center gap-2 rounded-xl border border-marque-200 bg-white px-2.5 py-2 shadow-lg">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-marque-50 text-marque-600">
            <Bell className="size-3.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold text-slate-900">
              Nouvelle commande · Table 4
            </span>
            <span className="block text-[8px] text-slate-500">il y a 4 secondes</span>
          </span>
          <span className="rounded-full bg-marque-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
            N° 14
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5">
            <span className="flex items-center gap-1 text-[9px] font-bold text-white">
              <Table2 className="size-3" aria-hidden />
              Table 4 · Sur place
            </span>
            <span className="text-[9px] font-extrabold text-feuille-400">6 000 FCFA</span>
          </div>

          <div className="space-y-1 px-2.5 py-2">
            <p className="flex items-center justify-between text-[9px] text-slate-600">
              <span>2 × Attiéké poisson braisé</span>
              <span className="font-semibold text-slate-800">5 000</span>
            </p>
            <p className="flex items-center justify-between text-[9px] text-slate-600">
              <span>1 × Bissap frais</span>
              <span className="font-semibold text-slate-800">500</span>
            </p>
            <p className="flex items-center justify-between text-[9px] text-slate-600">
              <span>1 × Alloco</span>
              <span className="font-semibold text-slate-800">500</span>
            </p>
            <p className="rounded-md bg-amber-50 px-1.5 py-1 text-[8px] font-semibold text-amber-800">
              Note de la cuisine : « pas trop de piment »
            </p>
            <p className="flex items-center gap-1 pt-0.5 text-[8px] font-bold text-orange-600">
              <ScanLine className="size-2.5" aria-hidden />
              Orange Money · paiement à valider
            </p>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-feuille-600 px-2 py-1.5 text-[9.5px] font-bold text-white">
              <CheckCheck className="size-3" aria-hidden />
              Marquer comme prête
            </div>
          </div>
        </div>
      </div>
    </Cadre>
  );
}
