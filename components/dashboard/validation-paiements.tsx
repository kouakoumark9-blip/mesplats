"use client";

/**
 * Validation manuelle des paiements mobile money.
 * ---------------------------------------------------------------------------
 * Aucune API de paiement payante n'est branchée : le client envoie l'argent sur
 * le numéro du restaurant, puis le personnel vérifie la réception sur son
 * téléphone et valide ici. La validation met à jour le suivi du client, qui
 * affiche alors « Paiement confirmé ».
 *
 * La liste est rafraîchie toutes les 4 secondes (même contrat de polling que
 * l'écran de service) pour voir arriver les commandes en attente de paiement.
 */
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Copy,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteContenu } from "@/components/ui/carte";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { useToasts } from "@/components/ui/toast";
import { marquerCommandePayee } from "@/lib/actions/commandes";
import {
  LIBELLES_PAIEMENT,
  LIBELLES_STATUT,
  type ModePaiement,
  type Statut,
  type TypeCommande,
} from "@/lib/constants";
import { cn, formatFcfa, formatHeure, lienSms, lienWhatsApp } from "@/lib/utils";

const INTERVALLE_POLLING = 4000;

type CommandePaiement = {
  id: string;
  numero: number;
  type: TypeCommande;
  statut: Statut;
  tableNumero: string | null;
  nomClient: string | null;
  telephoneClient: string | null;
  total: number;
  modePaiement: string | null;
  paiementStatut: string;
  createdAt: string;
};

export function ValidationPaiements({
  commandesInitiales,
  devise,
  peutValider,
}: {
  commandesInitiales: CommandePaiement[];
  devise: string;
  peutValider: boolean;
}) {
  const { notifier } = useToasts();
  const [commandes, setCommandes] = useState(commandesInitiales);
  const [filtre, setFiltre] = useState<"en_attente" | "paye">("en_attente");
  const [enCours, setEnCours] = useState<string | null>(null);

  const rafraichir = useCallback(async () => {
    try {
      const reponse = await fetch("/api/service/commandes", { cache: "no-store" });
      if (!reponse.ok) return;
      const donnees = (await reponse.json()) as { commandes: CommandePaiement[] };
      setCommandes(
        donnees.commandes.map((commande) => ({
          id: commande.id,
          numero: commande.numero,
          type: commande.type,
          statut: commande.statut,
          tableNumero: commande.tableNumero,
          nomClient: commande.nomClient,
          telephoneClient: commande.telephoneClient,
          total: commande.total,
          modePaiement: commande.modePaiement,
          paiementStatut: commande.paiementStatut,
          createdAt: commande.createdAt,
        })),
      );
    } catch {
      // Réseau instable : nouvel essai au prochain cycle.
    }
  }, []);

  useEffect(() => {
    const minuteur = window.setInterval(() => void rafraichir(), INTERVALLE_POLLING);
    return () => window.clearInterval(minuteur);
  }, [rafraichir]);

  /* Les paiements en espèces se règlent au comptoir : on ne les liste pas ici. */
  const concernees = useMemo(
    () => commandes.filter((commande) => commande.modePaiement && commande.modePaiement !== "especes"),
    [commandes],
  );

  const enAttente = concernees.filter(
    (commande) => commande.paiementStatut !== "paye" && commande.statut !== "annulee",
  );
  const encaissees = concernees.filter((commande) => commande.paiementStatut === "paye");

  const montantEnAttente = enAttente.reduce((total, commande) => total + commande.total, 0);
  const montantEncaisse = encaissees.reduce((total, commande) => total + commande.total, 0);

  const liste = filtre === "en_attente" ? enAttente : encaissees;

  async function valider(commande: CommandePaiement, paye: boolean) {
    setEnCours(commande.id);
    const resultat = await marquerCommandePayee(commande.id, paye);
    setEnCours(null);
    notifier({
      titre: resultat.ok ? (resultat.message ?? "Paiement mis à jour") : "Action impossible",
      description: resultat.ok ? undefined : resultat.message,
      ton: resultat.ok ? "succes" : "erreur",
    });
    if (resultat.ok) {
      setCommandes((listeActuelle) =>
        listeActuelle.map((element) =>
          element.id === commande.id
            ? { ...element, paiementStatut: paye ? "paye" : "en_attente" }
            : element,
        ),
      );
      void rafraichir();
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Carte className="border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CarteContenu className="flex items-center gap-3">
            <Smartphone className="size-6 text-amber-600" aria-hidden />
            <div>
              <p className="text-xs font-bold tracking-wide text-amber-700 uppercase">
                À valider
              </p>
              <p className="chiffres font-titre text-xl font-extrabold text-amber-900 dark:text-amber-200">
                {enAttente.length} · {formatFcfa(montantEnAttente, devise)}
              </p>
            </div>
          </CarteContenu>
        </Carte>
        <Carte className="border-feuille-200 bg-feuille-50/60 dark:border-feuille-500/30 dark:bg-feuille-500/10">
          <CarteContenu className="flex items-center gap-3">
            <BadgeCheck className="size-6 text-feuille-600" aria-hidden />
            <div>
              <p className="text-xs font-bold tracking-wide text-feuille-700 uppercase">
                Encaissé (jour)
              </p>
              <p className="chiffres font-titre text-xl font-extrabold text-feuille-900 dark:text-feuille-200">
                {encaissees.length} · {formatFcfa(montantEncaisse, devise)}
              </p>
            </div>
          </CarteContenu>
        </Carte>
      </div>

      <div className="flex gap-2">
        {(["en_attente", "paye"] as const).map((valeur) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setFiltre(valeur)}
            aria-pressed={filtre === valeur}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
              filtre === valeur
                ? "border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
            )}
          >
            {valeur === "en_attente" ? `À valider (${enAttente.length})` : `Déjà validés (${encaissees.length})`}
          </button>
        ))}
      </div>

      {!peutValider ? (
        <Alerte ton="info">
          Votre rôle ne permet pas de valider un paiement : demandez au propriétaire ou à un serveur.
        </Alerte>
      ) : null}

      {liste.length === 0 ? (
        <EtatVide
          icone={<Banknote className="size-6" aria-hidden />}
          titre={
            filtre === "en_attente"
              ? "Aucun paiement en attente de validation"
              : "Aucun paiement validé pour l'instant"
          }
          description={
            filtre === "en_attente"
              ? "Quand un client choisit Orange Money, Moov, MTN ou Wave, sa commande apparaît ici dès qu'il confirme."
              : "Les paiements que vous validez aujourd'hui sont listés ici, avec leur montant."
          }
        />
      ) : (
        <ul className="space-y-3">
          {liste.map((commande) => (
            <li key={commande.id}>
              <Carte>
                <CarteContenu className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      n° {commande.numero} ·{" "}
                      {commande.modePaiement
                        ? LIBELLES_PAIEMENT[commande.modePaiement as ModePaiement]
                        : "Mobile money"}
                      <span className="ms-2 text-xs font-normal text-slate-400">
                        {formatHeure(commande.createdAt)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {commande.type === "sur_place"
                        ? `Table ${commande.tableNumero ?? "—"}`
                        : "À emporter"}
                      {commande.nomClient ? ` · ${commande.nomClient}` : ""}
                      {" · "}
                      {LIBELLES_STATUT[commande.statut]}
                    </p>
                    <p className="chiffres mt-1 font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatFcfa(commande.total, devise)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {commande.telephoneClient ? (
                      <>
                        <Bouton
                          variante="contour"
                          taille="sm"
                          icone={<Copy className="size-3.5" aria-hidden />}
                          onClick={() => {
                            void navigator.clipboard.writeText(
                              commande.telephoneClient!.replace(/\s/g, ""),
                            );
                            notifier({ titre: "Numéro copié", ton: "info" });
                          }}
                        >
                          Copier le numéro
                        </Bouton>
                        <a
                          href={lienWhatsApp(
                            `Bonjour ${commande.nomClient ?? ""}, nous vérifions votre paiement de ${formatFcfa(commande.total, devise)} pour la commande n° ${commande.numero}.`,
                            commande.telephoneClient,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-feuille-600 px-3 text-sm font-semibold text-white transition hover:bg-feuille-700"
                        >
                          <MessageCircle className="size-3.5" aria-hidden />
                          WhatsApp
                        </a>
                        <a
                          href={lienSms(
                            `Paiement de la commande n° ${commande.numero} bien reçu, merci !`,
                            commande.telephoneClient,
                          )}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                        >
                          <Send className="size-3.5" aria-hidden />
                          SMS
                        </a>
                        <a
                          href={`tel:${commande.telephoneClient.replace(/\s/g, "")}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                        >
                          <Phone className="size-3.5" aria-hidden />
                          Appeler
                        </a>
                      </>
                    ) : null}

                    {peutValider ? (
                      commande.paiementStatut === "paye" ? (
                        <Bouton
                          variante="contour"
                          taille="sm"
                          chargement={enCours === commande.id}
                          icone={<RotateCcw className="size-3.5" aria-hidden />}
                          onClick={() => void valider(commande, false)}
                        >
                          Remettre en attente
                        </Bouton>
                      ) : (
                        <Bouton
                          variante="succes"
                          taille="md"
                          chargement={enCours === commande.id}
                          libelleChargement="Validation…"
                          icone={<CheckCircle2 className="size-4" aria-hidden />}
                          onClick={() => void valider(commande, true)}
                        >
                          Marquer le paiement reçu
                        </Bouton>
                      )
                    ) : null}
                  </div>
                </CarteContenu>
              </Carte>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
