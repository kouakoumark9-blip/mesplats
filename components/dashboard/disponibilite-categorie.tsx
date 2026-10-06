"use client";

/**
 * Sélecteur de disponibilité d'une catégorie.
 * ---------------------------------------------------------------------------
 * Cinq raccourcis (Toujours, Midi, Soir, Week-end, Personnalisé) puis, en mode
 * personnalisé, le choix des jours (L → D) et de un à trois créneaux horaires.
 *
 * Le résultat est envoyé dans un champ caché, sous forme de chaîne JSON (vide =
 * « disponible en permanence »). Le serveur revalide tout avec Zod : ces
 * contrôles ne sont qu'un confort de saisie.
 */
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Entree } from "@/components/ui/champ";
import {
  JOURS_SEMAINE,
  PRESETS_DISPONIBILITE,
  type DisponibiliteCategorie,
  type PresetDisponibilite,
} from "@/lib/constants";
import { cn, resumeDisponibilite } from "@/lib/utils";

type Creneau = { debut: string; fin: string };

/** Modèles appliqués par les raccourcis (jours : 0 = lundi … 6 = dimanche). */
const MODELES: Record<Exclude<PresetDisponibilite, "personnalise">, DisponibiliteCategorie> = {
  toujours: {},
  midi: { creneaux: [{ debut: "11:30", fin: "15:00" }] },
  soir: { creneaux: [{ debut: "18:00", fin: "23:00" }] },
  weekend: { jours: [5, 6] },
};

export function DisponibiliteCategorie({
  valeurInitiale,
}: {
  valeurInitiale: DisponibiliteCategorie | null;
}) {
  const [preset, setPreset] = useState<PresetDisponibilite>(() =>
    devinerPreset(valeurInitiale),
  );
  const [jours, setJours] = useState<number[]>(valeurInitiale?.jours ?? []);
  const [creneaux, setCreneaux] = useState<Creneau[]>(
    valeurInitiale?.creneaux?.length ? valeurInitiale.creneaux : [],
  );

  /** Valeur réellement enregistrée : rien pour « Toujours ». */
  const valeur: DisponibiliteCategorie | null =
    preset === "toujours"
      ? null
      : preset === "personnalise"
        ? {
            jours: jours.length ? [...jours].sort((a, b) => a - b) : undefined,
            creneaux: creneaux.length ? creneaux : undefined,
          }
        : MODELES[preset];

  const enCours = preset === "personnalise";
  const contenuJson = valeur ? JSON.stringify(valeur) : "";

  function choisir(choix: PresetDisponibilite) {
    setPreset(choix);
    if (choix === "personnalise") {
      // On part de ce qui était affiché pour éviter une page vide.
      const base = valeur ?? (creneaux.length ? { creneaux } : { jours });
      setJours(base.jours ?? []);
      setCreneaux(base.creneaux ?? []);
    }
  }

  function basculerJour(index: number) {
    setJours((liste) =>
      liste.includes(index) ? liste.filter((j) => j !== index) : [...liste, index],
    );
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="disponibilite" value={contenuJson} />

      <div className="flex flex-wrap gap-2">
        {PRESETS_DISPONIBILITE.map((entree) => {
          const actif = preset === entree.cle;
          return (
            <button
              key={entree.cle}
              type="button"
              onClick={() => choisir(entree.cle)}
              aria-pressed={actif}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-bold transition",
                actif
                  ? "border-marque-500 bg-marque-50 text-marque-700 ring-1 ring-marque-200 dark:bg-marque-950/40 dark:text-marque-300"
                  : "border-slate-200 text-slate-600 hover:border-marque-300 dark:border-slate-700 dark:text-slate-300",
              )}
            >
              {entree.libelle}
            </button>
          );
        })}
      </div>

      {enCours ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Jours concernés <span className="font-normal text-slate-400">(aucun coché = tous les jours)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {JOURS_SEMAINE.map((jour) => {
                const actif = jours.includes(jour.index);
                return (
                  <button
                    key={jour.index}
                    type="button"
                    onClick={() => basculerJour(jour.index)}
                    aria-pressed={actif}
                    aria-label={jour.libelle}
                    title={jour.libelle}
                    className={cn(
                      "size-9 rounded-xl border text-xs font-bold transition",
                      actif
                        ? "border-feuille-500 bg-feuille-50 text-feuille-700 dark:bg-feuille-500/10 dark:text-feuille-300"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
                    )}
                  >
                    {jour.court}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Créneaux horaires <span className="font-normal text-slate-400">(au plus 4)</span>
            </p>
            <div className="mt-2 space-y-2">
              {creneaux.map((creneau, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Entree
                    type="time"
                    value={creneau.debut}
                    onChange={(e) =>
                      setCreneaux((liste) =>
                        liste.map((c, i) => (i === index ? { ...c, debut: e.target.value } : c)),
                      )
                    }
                    aria-label="Heure de début"
                    className="h-10 w-28"
                  />
                  <span className="text-xs font-semibold text-slate-400">à</span>
                  <Entree
                    type="time"
                    value={creneau.fin}
                    onChange={(e) =>
                      setCreneaux((liste) =>
                        liste.map((c, i) => (i === index ? { ...c, fin: e.target.value } : c)),
                      )
                    }
                    aria-label="Heure de fin"
                    className="h-10 w-28"
                  />
                  <button
                    type="button"
                    aria-label="Supprimer ce créneau"
                    onClick={() => setCreneaux((liste) => liste.filter((_, i) => i !== index))}
                    className="rounded-lg border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}

              {creneaux.length < 4 ? (
                <button
                  type="button"
                  onClick={() => setCreneaux((liste) => [...liste, { debut: "11:30", fin: "15:00" }])}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-marque-400 hover:text-marque-600 dark:border-slate-600 dark:text-slate-300"
                >
                  <Plus className="size-3.5" aria-hidden />
                  Ajouter un créneau
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          {valeur
            ? `Sur la carte, cette catégorie s'affichera : ${resumeDisponibilite(valeur)}. Hors créneau, elle reste visible avec la mention « Revenez plus tard ».`
            : "Cette catégorie reste visible à toute heure, tous les jours."}
        </span>
      </p>
    </div>
  );
}

/** Retrouve le raccourci correspondant à un réglage existant. */
function devinerPreset(valeur: DisponibiliteCategorie | null): PresetDisponibilite {
  if (!valeur) return "toujours";
  const creneaux = valeur.creneaux ?? [];
  const jours = valeur.jours ?? [];
  const identique = (modele: DisponibiliteCategorie) =>
    JSON.stringify(modele) === JSON.stringify(valeur);

  if (identique({ creneaux: [{ debut: "11:30", fin: "15:00" }] })) return "midi";
  if (identique({ creneaux: [{ debut: "18:00", fin: "23:00" }] })) return "soir";
  if (jours.length === 2 && jours.includes(5) && jours.includes(6) && creneaux.length === 0) {
    return "weekend";
  }
  return "personnalise";
}
