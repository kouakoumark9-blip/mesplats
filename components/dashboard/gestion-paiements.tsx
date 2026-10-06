"use client";

/**
 * Moyens de paiement mobile money du restaurant.
 *
 * Le propriétaire enregistre les numéros sur lesquels ses clients envoient
 * l'argent (Orange Money, Moov Money, MTN MoMo). Ces numéros sont affichés au
 * client à l'étape 4 (paiement) avec le montant exact, et le restaurateur
 * valide ensuite le paiement reçu depuis l'écran de service.
 */
import { Save, Smartphone, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteContenu } from "@/components/ui/carte";
import { Entree } from "@/components/ui/champ";
import { useToasts } from "@/components/ui/toast";
import { enregistrerMoyenPaiement, supprimerMoyenPaiement } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import { LIBELLES_PAIEMENT, OPERATEURS, type Operateur } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type MoyenPaiementAffiche = {
  operateur: Operateur;
  numero: string;
  titulaire: string | null;
  actif: boolean;
};

/** Couleurs officielles approximatives des opérateurs (repères visuels). */
const COULEURS_OPERATEUR: Record<Operateur, string> = {
  orange: "#FF7900",
  moov: "#0072BC",
  mtn: "#FFCC00",
};

export function GestionPaiements({ moyens }: { moyens: MoyenPaiementAffiche[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {OPERATEURS.map((operateur) => (
        <LigneMoyenPaiement
          key={operateur}
          operateur={operateur}
          moyen={moyens.find((m) => m.operateur === operateur) ?? null}
        />
      ))}
    </div>
  );
}

function LigneMoyenPaiement({
  operateur,
  moyen,
}: {
  operateur: Operateur;
  moyen: MoyenPaiementAffiche | null;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerMoyenPaiement, etatInitial);

  const [actif, setActif] = useState(moyen?.actif ?? true);
  const [numero, setNumero] = useState(moyen?.numero ?? "");
  const [titulaire, setTitulaire] = useState(moyen?.titulaire ?? "");
  // Évite de notifier deux fois pour le même enregistrement.
  const notifie = useRef<unknown>(null);

  useEffect(() => {
    if (!etat.ok || notifie.current === etat) return;
    notifie.current = etat;
    notifier({ titre: `${LIBELLES_PAIEMENT[operateur]} enregistré`, ton: "succes" });
  }, [etat, notifier, operateur]);

  return (
    <Carte>
      <CarteContenu className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-10 items-center justify-center rounded-xl text-xs font-extrabold text-slate-900"
              style={{ backgroundColor: COULEURS_OPERATEUR[operateur] }}
              aria-hidden
            >
              {operateur === "orange" ? "OM" : operateur === "moov" ? "MOOV" : "MTN"}
            </span>
            <div>
              <p className="font-titre text-sm font-bold text-slate-900 dark:text-white">
                {LIBELLES_PAIEMENT[operateur]}
              </p>
              {moyen ? (
                <Badge ton={moyen.actif ? "succes" : "neutre"}>
                  {moyen.actif ? "Proposé au client" : "Désactivé"}
                </Badge>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">Non renseigné</span>
              )}
            </div>
          </div>
          <Smartphone className="size-4 text-slate-400" aria-hidden />
        </div>

        <form action={action} className="space-y-2.5">
          <input type="hidden" name="operateur" value={operateur} />
          <input type="hidden" name="actif" value={String(actif)} />

          <label className="sr-only" htmlFor={`numero-${operateur}`}>
            Numéro {LIBELLES_PAIEMENT[operateur]}
          </label>
          <Entree
            id={`numero-${operateur}`}
            name="numero"
            type="tel"
            inputMode="tel"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="+225 07 07 12 34 56"
            erreur={Boolean(etat.erreurs?.numero)}
          />

          <label className="sr-only" htmlFor={`titulaire-${operateur}`}>
            Titulaire du compte
          </label>
          <Entree
            id={`titulaire-${operateur}`}
            name="titulaire"
            value={titulaire}
            onChange={(e) => setTitulaire(e.target.value)}
            placeholder="Nom du titulaire (ex. Awa Konan)"
            maxLength={80}
          />

          {etat.erreurs?.numero ? (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {etat.erreurs.numero}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Bouton
              type="button"
              variante="contour"
              taille="sm"
              onClick={() => setActif((valeur) => !valeur)}
              className={cn(actif && "border-feuille-300 bg-feuille-50 text-feuille-800")}
            >
              {actif ? "Proposé au client" : "Désactivé"}
            </Bouton>

            <div className="flex items-center gap-2">
              {moyen ? (
                <button
                  type="button"
                  aria-label={`Retirer le numéro ${LIBELLES_PAIEMENT[operateur]}`}
                  onClick={async () => {
                    const resultat = await supprimerMoyenPaiement(operateur);
                    if (resultat.ok) {
                      notifier({ titre: "Numéro retiré", ton: "succes" });
                      setNumero("");
                      setTitulaire("");
                    } else {
                      notifier({
                        titre: "Suppression impossible",
                        description: resultat.message,
                        ton: "erreur",
                      });
                    }
                  }}
                  className="rounded-lg border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              ) : null}
              <Bouton
                type="submit"
                taille="sm"
                chargement={enCours}
                libelleChargement="…"
                icone={<Save className="size-4" aria-hidden />}
              >
                Enregistrer
              </Bouton>
            </div>
          </div>
        </form>
      </CarteContenu>
    </Carte>
  );
}
