"use client";

/**
 * Système de notifications légères (toasts) — sans dépendance externe.
 * Usage : `const { notifier } = useToasts(); notifier({ titre, ton })`.
 */
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TonToast = "succes" | "erreur" | "alerte" | "info";

type Toast = {
  id: string;
  titre: string;
  description?: string;
  ton: TonToast;
};

type ContexteToasts = { notifier: (toast: Omit<Toast, "id">) => void };

const Contexte = createContext<ContexteToasts | null>(null);

export function useToasts(): ContexteToasts {
  const contexte = useContext(Contexte);
  if (!contexte) {
    throw new Error("useToasts doit être utilisé à l'intérieur de <FournisseurToasts>.");
  }
  return contexte;
}

const STYLES: Record<TonToast, { bordure: string; icone: ReactNode }> = {
  succes: {
    bordure: "border-l-feuille-500",
    icone: <CheckCircle2 className="size-5 text-feuille-600" aria-hidden />,
  },
  erreur: { bordure: "border-l-rose-500", icone: <XCircle className="size-5 text-rose-600" aria-hidden /> },
  alerte: {
    bordure: "border-l-amber-500",
    icone: <TriangleAlert className="size-5 text-amber-600" aria-hidden />,
  },
  info: { bordure: "border-l-blue-500", icone: <Info className="size-5 text-blue-600" aria-hidden /> },
};

export function FournisseurToasts({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const retirer = useCallback((id: string) => {
    setToasts((liste) => liste.filter((t) => t.id !== id));
  }, []);

  const notifier = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((liste) => [...liste.slice(-3), { ...toast, id }]);
      setTimeout(() => retirer(id), toast.ton === "erreur" ? 7000 : 4000);
    },
    [retirer],
  );

  const valeur = useMemo(() => ({ notifier }), [notifier]);

  return (
    <Contexte.Provider value={valeur}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-apparition items-start gap-3 rounded-2xl border border-slate-200 border-l-4 bg-white px-4 py-3 shadow-lg",
              "dark:border-slate-700 dark:bg-slate-900",
              STYLES[toast.ton].bordure,
            )}
          >
            <span className="mt-0.5 shrink-0">{STYLES[toast.ton].icone}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{toast.titre}</p>
              {toast.description ? (
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => retirer(toast.id)}
              aria-label="Fermer la notification"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </Contexte.Provider>
  );
}
