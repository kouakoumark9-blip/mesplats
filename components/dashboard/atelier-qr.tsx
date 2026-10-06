"use client";

/**
 * Atelier QR code — page « QR Code » du back-office.
 * ---------------------------------------------------------------------------
 * • aperçu en direct (SVG) qui suit chaque changement de style ou de couleur ;
 * • cinq styles prêts à imprimer, du plus sobre au plus décoratif ;
 * • logo du restaurant au centre (désactivé tant qu'aucun logo n'est défini) ;
 * • adresse encodée dans le code, avec copie en un clic ;
 * • export PNG 1024 px et SVG vectoriel pour l'imprimeur.
 *
 * La génération est locale (bibliothèque `qrcode`) : elle fonctionne même en
 * 3G, sans appel réseau.
 */
import {
  AlertTriangle,
  Check,
  Clipboard,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Palette,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Alerte } from "@/components/ui/divers";
import { Interrupteur } from "@/components/ui/interrupteur";
import { enregistrerPersonnalisationQr } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import { COULEURS_QR, STYLES_QR, type StyleQr } from "@/lib/constants";
import { dessinerQrCanvas, svgQrAvance } from "@/lib/qr-styles";
import { cn } from "@/lib/utils";

/** Fonds proposés pour le QR code (blanc obligatoire pour la fiabilité du scan). */
const FONDS_QR = ["#ffffff", "#f8fafc", "#fdf6ec", "#ecfdf5"] as const;

const LIBELLES_STYLE: Record<StyleQr, string> = {
  classique: "Référence sobre, lue par tous les téléphones",
  arrondi: "Coins adoucis, rendu moderne",
  points: "Pastilles rondes, idéales en grand format",
  chic: "Losanges décoratifs, pour les cartes de table",
  elegant: "Anneaux fins, à réserver aux grandes impressions",
};

export function AtelierQr({
  url,
  nomRestaurant,
  logo,
  qrOriginaux,
}: {
  url: string;
  nomRestaurant: string;
  /** Logo du restaurant, ou null : le QR reste alors sans logo central. */
  logo: string | null;
  qrOriginaux: { qrStyle: StyleQr; qrCouleur: string; qrFond: string; qrLogo: boolean };
}) {
  const [etat, action, enCours] = useActionState(enregistrerPersonnalisationQr, etatInitial);

  const [style, setStyle] = useState<StyleQr>(qrOriginaux.qrStyle);
  const [couleur, setCouleur] = useState(qrOriginaux.qrCouleur);
  const [fond, setFond] = useState(qrOriginaux.qrFond);
  const [avecLogo, setAvecLogo] = useState(qrOriginaux.qrLogo && Boolean(logo));
  const [copie, setCopie] = useState(false);
  const [exportEnCours, setExportEnCours] = useState<"png" | "svg" | null>(null);
  const [erreurExport, setErreurExport] = useState<string | null>(null);

  const parametres = { texte: url, style, fonce: couleur, clair: fond, marge: 2 };

  const apercu = useMemo(
    () =>
      svgQrAvance({
        ...parametres,
        logoUrl: avecLogo ? logo : null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, style, couleur, fond, avecLogo, logo],
  );

  const vignettes = useMemo(
    () =>
      STYLES_QR.map((entree) => ({
        ...entree,
        svg: svgQrAvance({
          texte: `mesplats:${entree.cle}`,
          style: entree.cle,
          fonce: couleur,
          clair: fond,
          marge: 1,
          correction: "L",
        }),
      })),
    [couleur, fond],
  );

  function telecharger(nom: string, contenu: string, type: string) {
    const lien = document.createElement("a");
    lien.href = contenu;
    lien.download = nom;
    if (type === "image/svg+xml") {
      lien.href = URL.createObjectURL(new Blob([contenu], { type }));
    }
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    if (type === "image/svg+xml") URL.revokeObjectURL(lien.href);
  }

  async function exporterPng() {
    setErreurExport(null);
    setExportEnCours("png");
    try {
      const png = await dessinerQrCanvas({ ...parametres, logoUrl: avecLogo ? logo : null, pixels: 1024 });
      telecharger(`qr-${nomRestaurant.toLowerCase().replace(/\s+/g, "-")}.png`, png, "image/png");
    } catch (erreur) {
      setErreurExport(erreur instanceof Error ? erreur.message : "Export PNG impossible.");
    } finally {
      setExportEnCours(null);
    }
  }

  function exporterSvg() {
    setErreurExport(null);
    telecharger(`qr-${nomRestaurant.toLowerCase().replace(/\s+/g, "-")}.svg`, apercu, "image/svg+xml");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ------------------------------ Aperçu ------------------------------ */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto w-full max-w-[280px] rounded-2xl bg-white p-3 shadow-inner ring-1 ring-slate-100">
            <div
              className="aspect-square w-full [&>svg]:block"
              dangerouslySetInnerHTML={{ __html: apercu }}
            />
          </div>

          <p className="mt-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            {nomRestaurant}
          </p>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Scannez pour ouvrir le menu
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Bouton
              variante="contour"
              taille="sm"
              icone={<Download className="size-4" aria-hidden />}
              chargement={exportEnCours === "png"}
              onClick={() => void exporterPng()}
            >
              PNG
            </Bouton>
            <Bouton
              variante="contour"
              taille="sm"
              icone={<Download className="size-4" aria-hidden />}
              onClick={exporterSvg}
            >
              SVG
            </Bouton>
          </div>

          {erreurExport ? (
            <p className="mt-3 text-center text-xs font-medium text-rose-600">{erreurExport}</p>
          ) : null}
        </div>

        {/* ---------------------------- Adresse ---------------------------- */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-titre text-sm font-extrabold text-slate-900 dark:text-white">
            Adresse encodée dans le code
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {url}
            </code>
            <Bouton
              variante="contour"
              taille="sm"
              icone={copie ? <Check className="size-4" aria-hidden /> : <Clipboard className="size-4" aria-hidden />}
              onClick={() => {
                void navigator.clipboard.writeText(url).then(() => {
                  setCopie(true);
                  window.setTimeout(() => setCopie(false), 2500);
                });
              }}
            >
              {copie ? "Copié" : "Copier"}
            </Bouton>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <Link
              href={url}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-marque-600 hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Tester le menu
            </Link>
            <Link
              href="/dashboard/tables"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:underline dark:text-slate-300"
            >
              <Sparkles className="size-3.5" aria-hidden />
              Créer un QR par table
            </Link>
          </div>
        </div>
      </div>

      {/* --------------------------- Personnalisation --------------------------- */}
      <form action={action} className="space-y-5">
        <input type="hidden" name="qrStyle" value={style} />
        <input type="hidden" name="qrCouleur" value={couleur} />
        <input type="hidden" name="qrFond" value={fond} />
        <input type="hidden" name="qrLogo" value={avecLogo ? "true" : "false"} />

        {etat.message ? (
          <Alerte ton={etat.ok ? "succes" : "erreur"} titre={etat.ok ? "Enregistré" : "À corriger"}>
            {etat.message}
          </Alerte>
        ) : null}

        {/* Styles */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 font-titre text-sm font-extrabold text-slate-900 dark:text-white">
            <Palette className="size-4 text-marque-600" aria-hidden />
            Style du QR code
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {vignettes.map((entree) => {
              const actif = entree.cle === style;
              return (
                <button
                  key={entree.cle}
                  type="button"
                  onClick={() => setStyle(entree.cle)}
                  aria-pressed={actif}
                  className={cn(
                    "group rounded-2xl border p-2.5 text-center transition",
                    actif
                      ? "border-marque-500 bg-marque-50 ring-2 ring-marque-200 dark:bg-marque-950/40 dark:ring-marque-900"
                      : "border-slate-200 hover:border-marque-300 dark:border-slate-700",
                  )}
                >
                  <span
                    className="mx-auto block aspect-square w-full max-w-[64px] rounded-lg bg-white p-1 [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: entree.svg }}
                  />
                  <span
                    className={cn(
                      "mt-2 block text-xs font-bold",
                      actif ? "text-marque-700 dark:text-marque-300" : "text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {entree.libelle}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{LIBELLES_STYLE[style]}</p>
        </section>

        {/* Couleurs */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-titre text-sm font-extrabold text-slate-900 dark:text-white">
            Couleurs
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Couleur du QR code
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {COULEURS_QR.map((valeur) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setCouleur(valeur)}
                    aria-label={`Couleur ${valeur}`}
                    aria-pressed={couleur.toLowerCase() === valeur.toLowerCase()}
                    className={cn(
                      "size-8 rounded-full border-2 transition",
                      couleur.toLowerCase() === valeur.toLowerCase()
                        ? "border-marque-500 ring-2 ring-marque-200"
                        : "border-white shadow dark:border-slate-700",
                    )}
                    style={{ backgroundColor: valeur }}
                  />
                ))}
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  <input
                    type="color"
                    value={couleur}
                    onChange={(e) => setCouleur(e.target.value.toUpperCase())}
                    className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Couleur personnalisée du QR code"
                  />
                  {couleur.toUpperCase()}
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Couleur du fond
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {FONDS_QR.map((valeur) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setFond(valeur)}
                    aria-label={`Fond ${valeur}`}
                    aria-pressed={fond.toLowerCase() === valeur.toLowerCase()}
                    className={cn(
                      "size-8 rounded-full border-2 transition",
                      fond.toLowerCase() === valeur.toLowerCase()
                        ? "border-marque-500 ring-2 ring-marque-200"
                        : "border-slate-200 dark:border-slate-700",
                    )}
                    style={{ backgroundColor: valeur }}
                  />
                ))}
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  <input
                    type="color"
                    value={fond}
                    onChange={(e) => setFond(e.target.value.toUpperCase())}
                    className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Couleur personnalisée du fond"
                  />
                  {fond.toUpperCase()}
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
            <p>
              Gardez un contraste fort entre le motif et le fond : un QR code sombre sur fond clair
              se scanne de loin, l&apos;inverse beaucoup moins.
            </p>
          </div>
        </section>

        {/* Logo */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-titre text-sm font-extrabold text-slate-900 dark:text-white">
            Logo au centre
          </h2>

          {logo ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt="Logo du restaurant"
                  className="size-12 rounded-xl border border-slate-200 object-contain p-1 dark:border-slate-700"
                />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Votre logo occupe 22 % du code : la correction d&apos;erreur est
                  automatiquement renforcée pour que le scan reste fiable.
                </p>
              </div>
              <Interrupteur
                actif={avecLogo}
                onChange={setAvecLogo}
                label="Afficher le logo au centre"
              />
            </div>
          ) : (
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
              <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-marque-600" aria-hidden />
              <span>
                Ajoutez un logo dans{" "}
                <Link href="/dashboard/parametres#apparence" className="font-bold text-marque-600 hover:underline">
                  vos paramètres
                </Link>{" "}
                pour pouvoir l&apos;afficher au centre du QR code.
              </span>
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Bouton
            type="submit"
            chargement={enCours}
            icone={<Save className="size-4" aria-hidden />}
          >
            Enregistrer ces réglages
          </Bouton>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ces réglages s&apos;appliquent aussi aux QR codes de vos tables.
          </p>
        </div>
      </form>
    </div>
  );
}
