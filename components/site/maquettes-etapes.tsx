/**
 * Mini-maquettes d'écran pour la section « Votre menu en ligne en 3 étapes ».
 *
 * Trois scènes dessinées en HTML/CSS (aucune capture d'écran, donc poids nul et
 * netteté parfaite sur tous les écrans) :
 *  - `MaquetteCreation`      : ajout d'un plat dans le back-office, sur téléphone ;
 *  - `MaquetteQrImprimes`    : planche d'impression des QR codes de table ;
 *  - `MaquetteCommandeRecue` : commande reçue sur l'écran de service, sur tablette.
 *
 * Les cadres de téléphone/tablette réutilisent `Telephone` (composant du héro)
 * pour que toute la page parle le même langage visuel. La couleur principale est
 * celle d'AfriMenu : ces maquettes montrent le produit, pas un restaurant précis.
 */
import Image from "next/image";
import {
  Bell,
  CheckCheck,
  ImagePlus,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Table2,
  Wifi,
} from "lucide-react";

import { Telephone } from "@/components/site/hero-phones";
import { cn } from "@/lib/utils";

import photoAttieke from "@/public/plats/attieke-poisson.jpg";

/** Cadre commun : fond dégradé doux et centrage. */
function Cadre({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[23rem] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200/70",
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
      <Telephone className="w-[13.5rem] sm:w-[14rem]">
        {/* Barre supérieure de l'application, aux couleurs de la marque */}
        <div className="flex items-center gap-2 bg-marque-500 px-3 py-2 text-white">
          <span className="flex size-6 items-center justify-center rounded-lg bg-white/20 text-[8px] font-extrabold">
            MB
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[9.5px] font-extrabold">Mon menu</span>
            <span className="block text-[8px] text-white/80">3 catégories · 10 plats</span>
          </span>
          <Plus className="ml-auto size-3.5" aria-hidden />
        </div>

        <div className="space-y-1.5 p-2.5">
          <p className="text-[10px] font-extrabold text-slate-900">Ajouter un plat</p>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5">
            <Image
              src={photoAttieke}
              alt=""
              width={28}
              height={28}
              sizes="28px"
              className="size-7 shrink-0 rounded-md object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[9px] font-bold text-slate-800">
                Attiéké poisson braisé
              </span>
              <span className="block text-[8px] text-slate-500">2 500 FCFA</span>
            </span>
            <ImagePlus className="size-3 shrink-0 text-marque-500" aria-hidden />
          </div>

          <div className="rounded-lg border border-slate-200 px-2 py-1">
            <p className="text-[7px] font-bold tracking-wide text-slate-400 uppercase">Prix</p>
            <p className="text-[9px] font-semibold text-slate-700">2 500 FCFA</p>
          </div>

          <div className="rounded-lg border border-slate-200 px-2 py-1">
            <p className="text-[7px] font-bold tracking-wide text-slate-400 uppercase">
              Suppléments
            </p>
            <p className="flex flex-wrap gap-1 pt-0.5">
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[7.5px] font-medium text-slate-600">
                Piment +200
              </span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[7.5px] font-medium text-slate-600">
                Poisson +1 500
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-1 rounded-lg bg-marque-500 px-2 py-1.5 text-[8.5px] font-bold text-white">
            <Plus className="size-2.5" aria-hidden />
            Ajouter au menu
          </div>
        </div>
      </Telephone>
    </Cadre>
  );
}

/* ========================= Étape 2 — imprimer les QR ======================== */

export function MaquetteQrImprimes({ qrSvg }: { qrSvg: string }) {
  return (
    <Cadre>
      <div className="w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
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
      {/* Tablette de service : écran plus large, posé sur le comptoir */}
      <div className="relative w-[16.5rem] shrink-0 sm:w-[17.5rem]">
        <div className="overflow-hidden rounded-[1.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/25">
          <div className="flex items-center justify-between bg-slate-900 px-4 pt-1 pb-1 text-[8px] font-semibold text-white/90">
            <span>Écran de service</span>
            <span className="flex items-center gap-1">
              <Wifi className="size-2.5" aria-hidden />
              <span className="inline-block h-2 w-4 rounded-[2px] border border-white/60 p-[1px]">
                <span className="block h-full w-3/4 rounded-[1px] bg-white/90" />
              </span>
            </span>
          </div>

          <div className="space-y-1.5 rounded-[1rem] bg-slate-100 p-2">
            {/* Notification d'arrivée */}
            <div className="flex items-center gap-1.5 rounded-lg border border-marque-200 bg-white px-2 py-1.5 shadow-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-marque-50 text-marque-600">
                <Bell className="size-3" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[9px] font-extrabold text-slate-900">
                  Nouvelle commande
                </span>
                <span className="block text-[7px] text-slate-500">il y a 4 secondes</span>
              </span>
              <span className="rounded-full bg-marque-500 px-1.5 py-0.5 text-[7px] font-bold text-white">
                N° 14
              </span>
            </div>

            {/* Carte de la commande */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-slate-900 px-2 py-1">
                <span className="flex items-center gap-1 text-[8px] font-bold text-white">
                  <Table2 className="size-2.5" aria-hidden />
                  Table 4 · Sur place
                </span>
                <span className="text-[8px] font-extrabold text-feuille-400">6 000 FCFA</span>
              </div>

              <div className="space-y-1 px-2 py-1.5">
                {[
                  ["1 × Attiéké poisson braisé", "2 500"],
                  ["1 × Poulet braisé entier", "5 000"],
                  ["1 × Bissap frais", "500"],
                ].map(([libelle, montant]) => (
                  <p key={libelle} className="flex items-center justify-between text-[8px] text-slate-600">
                    <span className="truncate">{libelle}</span>
                    <span className="ml-2 shrink-0 font-semibold text-slate-800">{montant}</span>
                  </p>
                ))}

                <p className="rounded bg-amber-50 px-1.5 py-0.5 text-[7px] font-semibold text-amber-800">
                  Note : « pas trop de piment »
                </p>
                <p className="flex items-center gap-1 text-[7px] font-bold text-orange-600">
                  <ScanLine className="size-2.5" aria-hidden />
                  Orange Money · paiement à valider
                </p>
                <div className="flex items-center justify-center gap-1 rounded bg-feuille-600 px-2 py-1 text-[8.5px] font-bold text-white">
                  <CheckCheck className="size-2.5" aria-hidden />
                  Marquer comme prête
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Cadre>
  );
}
