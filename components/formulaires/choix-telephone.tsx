"use client";

/**
 * Sélecteur d'indicatif + numéro de téléphone, avec pays d'Afrique de l'Ouest.
 * La Côte d'Ivoire (+225) est sélectionnée par défaut.
 *
 * Le numéro complet (format international, sans « + ») est envoyé dans un champ
 * caché nommé `nomChamp` : le serveur reçoit ainsi une valeur unique à valider.
 */
import { ChevronDown, Phone } from "lucide-react";
import { useId, useState } from "react";

import { PAYS_AFRIQUE_OUEST, PAYS_DEFAUT, type Pays } from "@/lib/constants";
import { classesEntree } from "@/components/ui/champ";
import { normaliserTelephone } from "@/lib/utils";

export function ChoixTelephone({
  nomChamp = "telephone",
  valeurInitiale = "",
  paysInitial,
  erreur,
  obligatoire = true,
  label = "Numéro de téléphone",
}: {
  nomChamp?: string;
  valeurInitiale?: string;
  paysInitial?: Pays;
  erreur?: string;
  obligatoire?: boolean;
  label?: string;
}) {
  const id = useId();
  const [pays, setPays] = useState<Pays>(paysInitial ?? PAYS_DEFAUT);
  const [numero, setNumero] = useState(valeurInitiale);
  const valeurComplete = numero.trim() ? normaliserTelephone(numero, pays.indicatif) : "";

  return (
    <div className="space-y-1.5">
      <label htmlFor={`${id}-numero`} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
        {obligatoire ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>

      <div
        className={
          "flex items-stretch overflow-hidden rounded-xl border bg-white shadow-sm focus-within:ring-2 focus-within:ring-marque-500 dark:bg-slate-900 " +
          (erreur ? "border-rose-400" : "border-slate-300 dark:border-slate-700")
        }
      >
        <div className="relative flex items-center border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <span className="pointer-events-none flex items-center gap-1.5 pl-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span aria-hidden>{pays.drapeau}</span>
            {pays.indicatif}
          </span>
          <ChevronDown className="size-4 pr-1 text-slate-400" aria-hidden />
          <select
            aria-label="Indicatif du pays"
            value={pays.code}
            onChange={(evenement) => {
              const choisi = PAYS_AFRIQUE_OUEST.find((p) => p.code === evenement.target.value);
              if (choisi) setPays(choisi);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {PAYS_AFRIQUE_OUEST.map((option) => (
              <option key={option.code} value={option.code}>
                {option.drapeau} {option.nom} ({option.indicatif})
              </option>
            ))}
          </select>
        </div>

        <input
          id={`${id}-numero`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="07 07 12 34 56"
          value={numero}
          onChange={(evenement) => setNumero(evenement.target.value)}
          aria-invalid={erreur ? true : undefined}
          className={classesEntree(false, "h-11 rounded-none border-0 shadow-none focus:ring-0")}
        />
      </div>

      {/* Valeur réellement transmise au serveur (format international). */}
      <input type="hidden" name={nomChamp} value={valeurComplete} />

      {erreur ? (
        <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {erreur}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Phone className="size-3.5" aria-hidden />
          Le restaurant vous appellera ou vous enverra un SMS/WhatsApp sur ce numéro.
        </p>
      )}
    </div>
  );
}
