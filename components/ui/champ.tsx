/**
 * Champs de formulaire : enveloppe `Champ` (libellé, aide, erreur) + `Entree`,
 * `ZoneTexte` et `Selecteur`. Les messages d'erreur proviennent de Zod côté
 * serveur, ce qui garantit un affichage cohérent.
 */
import type {
  ComponentPropsWithRef,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

const CLASSES_BASE =
  "w-full rounded-xl border bg-white px-3.5 text-slate-900 shadow-sm transition " +
  "placeholder:text-slate-400 " +
  "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-marque-500 " +
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 " +
  "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

const ETAT_NORMAL = "border-slate-300 dark:border-slate-700";
const ETAT_ERREUR = "border-rose-400 dark:border-rose-500";

export function classesEntree(erreur?: boolean, className?: string) {
  return cn(CLASSES_BASE, erreur ? ETAT_ERREUR : ETAT_NORMAL, "h-11", className);
}

export function Champ({
  label,
  htmlFor,
  aide,
  erreur,
  obligatoire,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  aide?: string;
  erreur?: string;
  obligatoire?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
          {obligatoire ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {erreur ? (
        <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {erreur}
        </p>
      ) : aide ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{aide}</p>
      ) : null}
    </div>
  );
}

export function Entree({
  erreur,
  className,
  ...reste
}: ComponentPropsWithRef<"input"> & { erreur?: boolean }) {
  return <input {...reste} aria-invalid={erreur || undefined} className={classesEntree(erreur, className)} />;
}

export function ZoneTexte({
  erreur,
  className,
  ...reste
}: ComponentPropsWithRef<"textarea"> & { erreur?: boolean }) {
  return (
    <textarea
      {...reste}
      aria-invalid={erreur || undefined}
      className={cn(classesEntree(erreur, className), "h-auto min-h-24 py-2.5 leading-relaxed")}
    />
  );
}

export function Selecteur({
  erreur,
  className,
  children,
  ...reste
}: ComponentPropsWithRef<"select"> & { erreur?: boolean }) {
  return (
    <select
      {...reste}
      aria-invalid={erreur || undefined}
      className={cn(classesEntree(erreur, className), "cursor-pointer pr-9")}
    >
      {children}
    </select>
  );
}

/** Groupe préfixe + champ (ex. indicatif téléphonique + numéro). */
export function GroupeChamp({
  prefixe,
  children,
  className,
}: {
  prefixe: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm " +
          "focus-within:ring-2 focus-within:ring-marque-500 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {prefixe}
      </span>
      {children}
    </div>
  );
}
