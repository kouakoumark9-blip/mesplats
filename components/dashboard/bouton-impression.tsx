"use client";

/** Déclenche l'impression du navigateur (planche de QR codes, feuilles A4). */
import { Printer } from "lucide-react";

import { Bouton } from "@/components/ui/bouton";

export function BoutonImpression({ libelle = "Imprimer" }: { libelle?: string }) {
  return (
    <Bouton icone={<Printer className="size-4" aria-hidden />} onClick={() => window.print()}>
      {libelle}
    </Bouton>
  );
}
