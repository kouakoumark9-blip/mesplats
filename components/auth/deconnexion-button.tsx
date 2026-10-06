"use client";

/**
 * Bouton de déconnexion réutilisable.
 * `signOut` d'Auth.js vide le cookie de session puis renvoie vers l'accueil.
 */
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

import { cn } from "@/lib/utils";

export function DeconnexionButton({
  libelle = "Déconnexion",
  className,
  compact = false,
}: {
  libelle?: string;
  className?: string;
  compact?: boolean;
}) {
  const [enCours, demarrer] = useTransition();
  const [dejaParti, setDejaParti] = useState(false);

  return (
    <button
      type="button"
      disabled={enCours || dejaParti}
      onClick={() => {
        setDejaParti(true);
        demarrer(async () => {
          await signOut({ callbackUrl: "/connexion" });
        });
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-60",
        compact ? "px-3 py-2" : "px-4 py-2.5",
        className ?? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      <LogOut className="size-4" aria-hidden />
      {dejaParti ? "Déconnexion…" : libelle}
    </button>
  );
}
