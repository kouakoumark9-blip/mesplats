"use client";

/**
 * Réseaux sociaux affichés en bas de la carte publique.
 *
 * Le champ accepte un pseudonyme (« @maquisbaoule ») ou une adresse complète :
 * la normalisation est faite côté serveur, dans l'action `enregistrerReseaux`.
 */
import { Save } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { ICONES_RESEAUX, type CleReseau } from "@/components/ui/icones-reseaux";
import { useToasts } from "@/components/ui/toast";
import { enregistrerReseaux } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import { RESEAUX_SOCIAUX } from "@/lib/constants";

export function FormulaireReseaux({
  reseaux,
}: {
  reseaux: Record<string, string> | null;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerReseaux, etatInitial);
  const dejaSignale = useRef<typeof etat | null>(null);

  useEffect(() => {
    if (!etat.message || dejaSignale.current === etat) return;
    dejaSignale.current = etat;
    notifier({
      titre: etat.ok ? "Réseaux enregistrés" : "Enregistrement impossible",
      description: etat.message,
      ton: etat.ok ? "succes" : "erreur",
    });
  }, [etat, notifier]);

  return (
    <form action={action} className="space-y-4">
      {etat.message ? (
        <Alerte ton={etat.ok ? "succes" : "erreur"} titre={etat.ok ? "Enregistré" : "À corriger"}>
          {etat.message}
        </Alerte>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {RESEAUX_SOCIAUX.map((reseau) => (
          <Champ
            key={reseau.cle}
            label={reseau.libelle}
            htmlFor={`reseau-${reseau.cle}`}
            aide={reseau.gabarit}
            erreur={etat.erreurs?.[`reseau-${reseau.cle}`]}
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                {(() => {
                  const Icone = ICONES_RESEAUX[reseau.cle as CleReseau];
                  return <Icone className="size-4" />;
                })()}
              </span>
              <Entree
                id={`reseau-${reseau.cle}`}
                name="reseauUrl"
                defaultValue={reseaux?.[reseau.cle] ?? ""}
                placeholder={`@${reseau.cle === "x" ? "monrestaurant" : "mon_restaurant"}`}
                className="pl-10"
              />
              <input type="hidden" name="reseauCle" value={reseau.cle} />
            </div>
          </Champ>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Laissez vide pour masquer une icône. Les liens s&apos;ouvrent dans un nouvel onglet depuis la
        carte publique.
      </p>

      <Bouton type="submit" chargement={enCours} icone={<Save className="size-4" aria-hidden />}>
        Enregistrer les réseaux
      </Bouton>
    </form>
  );
}
