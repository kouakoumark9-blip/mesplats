"use client";

/**
 * Personnalisation de la carte numérique.
 * ---------------------------------------------------------------------------
 * Thème (clair/sombre), couleur de fond, police et langues. Chaque réglage est
 * répercuté immédiatement dans l'aperçu de droite, puis enregistré côté serveur
 * (l'aperçu réel s'ouvre ensuite dans un nouvel onglet, sur la vraie carte).
 *
 * Les polices proviennent de `next/font` : changer de police ne déclenche donc
 * aucun téléchargement supplémentaire, même sur un téléphone en 3G.
 */
import { Check, ExternalLink, Eye, Languages, Palette, Save, Type } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Alerte } from "@/components/ui/divers";
import { useToasts } from "@/components/ui/toast";
import { enregistrerCarte } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import {
  COULEURS_FOND_MENU,
  LANGUES_MENU,
  POLICES_MENU,
  THEMES_MENU,
  type CouleurFondMenu,
  type PoliceMenu,
  type ThemeMenu,
} from "@/lib/constants";
import { cn, formatFcfa } from "@/lib/utils";

/** Deux plats d'exemple : suffisent pour juger une police et un thème. */
const EXEMPLES = [
  { nom: "Poulet braisé", description: "Attiéké, alloco, sauce piment maison", prix: 3500 },
  { nom: "Jus de bissap", description: "Fait maison, servi frais", prix: 1000 },
];

export function FormulaireCarte({
  reglages,
  slug,
  nomRestaurant,
  couleurPrincipale,
}: {
  reglages: {
    themeMenu: ThemeMenu;
    couleurFond: CouleurFondMenu;
    policeMenu: PoliceMenu;
    langues: string[];
  };
  slug: string;
  nomRestaurant: string;
  couleurPrincipale: string;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerCarte, etatInitial);

  const [theme, setTheme] = useState<ThemeMenu>(reglages.themeMenu);
  const [fond, setFond] = useState<CouleurFondMenu>(reglages.couleurFond);
  const [police, setPolice] = useState<PoliceMenu>(reglages.policeMenu);
  const [langues, setLangues] = useState<string[]>(reglages.langues.length ? reglages.langues : ["fr"]);
  const dejaSignale = useRef<typeof etat | null>(null);

  useEffect(() => {
    if (!etat.message || dejaSignale.current === etat) return;
    dejaSignale.current = etat;
    notifier({
      titre: etat.ok ? "Carte personnalisée" : "Enregistrement impossible",
      description: etat.message,
      ton: etat.ok ? "succes" : "erreur",
    });
  }, [etat, notifier]);

  const couleurFond = COULEURS_FOND_MENU.find((c) => c.cle === fond) ?? COULEURS_FOND_MENU[0];
  const policeChoisie = POLICES_MENU.find((p) => p.cle === police) ?? POLICES_MENU[0];
  const sombre = theme === "sombre";

  const apercu = useMemo(
    () => ({
      fond: sombre ? "#0f172a" : couleurFond.couleur,
      carte: sombre ? "#1e293b" : "#ffffff",
      texte: sombre ? "#f8fafc" : "#0f172a",
      texteDoux: sombre ? "#94a3b8" : "#64748b",
      bordure: sombre ? "#334155" : "#e2e8f0",
      police: policeChoisie.variable,
    }),
    [sombre, couleurFond, policeChoisie],
  );

  function basculerLangue(cle: string) {
    if (cle === "fr") return; // Le français reste la langue principale.
    setLangues((actuelles) =>
      actuelles.includes(cle) ? actuelles.filter((l) => l !== cle) : [...actuelles, cle],
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="themeMenu" value={theme} />
      <input type="hidden" name="couleurFond" value={fond} />
      <input type="hidden" name="policeMenu" value={police} />
      {langues.map((code) => (
        <input key={code} type="hidden" name="langues" value={code} />
      ))}

      <div className="space-y-6">
        {etat.message ? (
          <Alerte ton={etat.ok ? "succes" : "erreur"} titre={etat.ok ? "Enregistré" : "À corriger"}>
            {etat.message}
          </Alerte>
        ) : null}

        {/* --------------------------------- Thème --------------------------------- */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Eye className="size-4 text-marque-600" aria-hidden />
            Thème
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {THEMES_MENU.map((valeur) => {
              const actif = theme === valeur;
              return (
                <button
                  key={valeur}
                  type="button"
                  onClick={() => setTheme(valeur)}
                  aria-pressed={actif}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition",
                    actif
                      ? "border-marque-500 ring-2 ring-marque-200"
                      : "border-slate-200 hover:border-marque-300 dark:border-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "mb-2 flex h-12 w-full flex-col justify-center gap-1 rounded-xl px-3",
                      valeur === "clair" ? "bg-slate-50" : "bg-slate-900",
                    )}
                  >
                    <span className={cn("h-1.5 w-2/3 rounded-full", valeur === "clair" ? "bg-slate-300" : "bg-slate-600")} />
                    <span className={cn("h-1.5 w-1/2 rounded-full", valeur === "clair" ? "bg-slate-200" : "bg-slate-700")} />
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {valeur === "clair" ? "Clair" : "Sombre"}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {valeur === "clair" ? "Recommandé en journée" : "Ambiance soirée et bar"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------ Couleur de fond ------------------------------ */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Palette className="size-4 text-marque-600" aria-hidden />
            Couleur de fond
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COULEURS_FOND_MENU.map((entree) => {
              const actif = fond === entree.cle;
              return (
                <button
                  key={entree.cle}
                  type="button"
                  onClick={() => setFond(entree.cle)}
                  aria-pressed={actif}
                  title={entree.libelle}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    actif
                      ? "border-marque-500 ring-2 ring-marque-200"
                      : "border-slate-200 hover:border-marque-300 dark:border-slate-700",
                  )}
                >
                  <span
                    className="size-5 rounded-full border border-slate-200"
                    style={{ backgroundColor: entree.couleur }}
                  />
                  <span className="text-slate-700 dark:text-slate-200">{entree.libelle}</span>
                  {actif ? <Check className="size-3.5 text-marque-600" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Le fond s&apos;applique derrière vos catégories et vos plats ; vos photos restent
            inchangées.
          </p>
        </div>

        {/* --------------------------------- Police --------------------------------- */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Type className="size-4 text-marque-600" aria-hidden />
            Police d&apos;écriture de la carte
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {POLICES_MENU.map((entree) => {
              const actif = police === entree.cle;
              return (
                <button
                  key={entree.cle}
                  type="button"
                  onClick={() => setPolice(entree.cle)}
                  aria-pressed={actif}
                  className={cn(
                    "rounded-2xl border px-2 py-3 text-center transition",
                    actif
                      ? "border-marque-500 ring-2 ring-marque-200"
                      : "border-slate-200 hover:border-marque-300 dark:border-slate-700",
                  )}
                >
                  <span
                    className="block text-2xl leading-none text-slate-800 dark:text-slate-100"
                    style={{ fontFamily: entree.variable }}
                  >
                    {entree.exemple}
                  </span>
                  <span className="mt-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    {entree.libelle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --------------------------------- Langues --------------------------------- */}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Languages className="size-4 text-marque-600" aria-hidden />
            Langues du menu
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Français
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Langue principale
              </span>
            </label>
            {LANGUES_MENU.filter((l) => l.cle !== "fr").map((entree) => {
              const actif = langues.includes(entree.cle);
              return (
                <label
                  key={entree.cle}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-2.5 transition hover:border-marque-300 dark:border-slate-700"
                >
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {entree.libelle}
                  </span>
                  <input
                    type="checkbox"
                    checked={actif}
                    onChange={() => basculerLangue(entree.cle)}
                    className="size-4 accent-marque-500"
                  />
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Les visiteurs choisissent leur langue depuis la carte. Vos plats restent saisis dans
            votre langue : les libellés de l&apos;interface (panier, commande, paiement) sont
            traduits automatiquement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Bouton type="submit" chargement={enCours} icone={<Save className="size-4" aria-hidden />}>
            Enregistrer l&apos;apparence
          </Bouton>
          <Link
            href={`/m/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-marque-600 hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden />
            Prévisualiser la carte
          </Link>
        </div>
      </div>

      {/* -------------------------------- Aperçu -------------------------------- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Aperçu
        </p>
        <div
          className="overflow-hidden rounded-3xl border shadow-sm"
          style={{ backgroundColor: apercu.fond, borderColor: apercu.bordure }}
        >
          <div className="flex items-center gap-3 px-4 pt-4">
            <span
              className="flex size-10 items-center justify-center rounded-xl text-sm font-extrabold text-white"
              style={{ backgroundColor: couleurPrincipale }}
            >
              {nomRestaurant.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-extrabold"
                style={{ color: apercu.texte, fontFamily: apercu.police }}
              >
                {nomRestaurant}
              </p>
              <p className="text-xs" style={{ color: apercu.texteDoux, fontFamily: apercu.police }}>
                {langues.length > 1 ? `${langues.length} langues` : "Menu en ligne"}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {EXEMPLES.map((plat) => (
              <div
                key={plat.nom}
                className="flex items-start justify-between gap-3 rounded-2xl border p-3"
                style={{
                  backgroundColor: apercu.carte,
                  borderColor: apercu.bordure,
                  fontFamily: apercu.police,
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: apercu.texte }}>
                    {plat.nom}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: apercu.texteDoux }}>
                    {plat.description}
                  </p>
                </div>
                <p className="chiffres shrink-0 text-sm font-extrabold" style={{ color: couleurPrincipale }}>
                  {formatFcfa(plat.prix)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          L&apos;aperçu utilise deux plats d&apos;exemple. « Prévisualiser la carte » ouvre votre
          vraie carte, avec vos plats.
        </p>
      </aside>
    </form>
  );
}
