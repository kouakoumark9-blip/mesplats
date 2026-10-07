"use client";

/**
 * Suivi de commande côté client : frise de statuts, paiement mobile money avec
 * montant exact, bouton « Appeler le serveur » et liens WhatsApp / SMS.
 * ---------------------------------------------------------------------------
 * Le rafraîchissement se fait par polling toutes les 4 secondes vers
 * `/api/commande/[id]` (aucun WebSocket : le réseau mobile reste compatible).
 * Quand le statut change, une petite alerte visuelle et sonore prévient le
 * client — utile quand il regarde ailleurs.
 */
import {
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  Clipboard,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
  Send,
  ShoppingBag,
  Timer,
  Utensils,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alerte } from "@/components/ui/divers";
import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { LogoPaiement, type MarquePaiement } from "@/components/ui/logos-paiement";
import { appelerServeur } from "@/lib/actions/commandes";
import {
  CODES_PAIEMENT,
  LIBELLES_PAIEMENT,
  LIBELLES_STATUT,
  type ModePaiement,
  type Statut,
} from "@/lib/constants";
import { cn, formatFcfa, lienSms, lienTel, lienWhatsApp } from "@/lib/utils";

/** Intervalle de polling, en millisecondes (contrainte projet : 4 s). */
const INTERVALLE_POLLING = 4000;

const ETAPES: { statut: Statut; libelle: string; icone: typeof ChefHat }[] = [
  { statut: "nouvelle", libelle: "Commande reçue", icone: Clipboard },
  { statut: "acceptee", libelle: "Acceptée", icone: Check },
  { statut: "en_preparation", libelle: "En préparation", icone: ChefHat },
  { statut: "prete", libelle: "Prête", icone: Bell },
  { statut: "servie", libelle: "Servie", icone: Utensils },
];

export type CommandeSuivie = {
  id: string;
  numero: number;
  statut: Statut;
  paiementStatut: string;
  modePaiement: string | null;
  total: number;
  type: "sur_place" | "emporter";
  tableNumero: string | null;
  nomClient: string | null;
  heureRetrait: string | null;
  motifAnnulation: string | null;
  appelServeurAt: string | null;
  note: string | null;
  lignes: {
    id: string;
    nom: string;
    quantite: number;
    prixUnitaire: number;
    options: { nom: string; prix: number }[];
    note: string | null;
  }[];
};

export function SuiviCommande({
  commande: commandeInitiale,
  restaurant,
  moyensPaiement,
}: {
  commande: CommandeSuivie;
  restaurant: {
    nom: string;
    slug: string;
    telephone: string | null;
    couleur: string;
    devise: string;
  };
  moyensPaiement: { operateur: string; numero: string; titulaire: string | null }[];
}) {
  const [commande, setCommande] = useState(commandeInitiale);
  const [copie, setCopie] = useState(false);
  const [appelEnCours, setAppelEnCours] = useState(false);
  const [messageAppel, setMessageAppel] = useState<string | null>(null);
  const [nouveaute, setNouveaute] = useState(false);
  const statutPrecedent = useRef(commandeInitiale.statut);

  /* ------------------------------ Polling 4 s ------------------------------ */
  const rafraichir = useCallback(async () => {
    try {
      const reponse = await fetch(`/api/commande/${commandeInitiale.id}`, { cache: "no-store" });
      if (!reponse.ok) return;
      const donnees = (await reponse.json()) as Partial<CommandeSuivie>;

      setCommande((actuelle) => {
        if (donnees.statut && donnees.statut !== actuelle.statut) {
          statutPrecedent.current = actuelle.statut;
          setNouveaute(true);
          bipDiscret();
        }
        return { ...actuelle, ...donnees } as CommandeSuivie;
      });
    } catch {
      // Réseau instable : on retentera au prochain cycle, sans alarmer le client.
    }
  }, [commandeInitiale.id]);

  useEffect(() => {
    const minuteur = window.setInterval(() => void rafraichir(), INTERVALLE_POLLING);
    return () => window.clearInterval(minuteur);
  }, [rafraichir]);

  useEffect(() => {
    if (!nouveaute) return;
    const minuteur = window.setTimeout(() => setNouveaute(false), 6000);
    return () => window.clearTimeout(minuteur);
  }, [nouveaute]);

  const etapeCourante = ETAPES.findIndex((etape) => etape.statut === commande.statut);
  const annulee = commande.statut === "annulee";
  const terminee = commande.statut === "servie" || annulee;

  /* Le bouton « Appeler le serveur » se réarme au bout d'une minute. */
  const appelRecemment = Boolean(
    commande.appelServeurAt &&
      Date.now() - new Date(commande.appelServeurAt).getTime() < 60_000,
  );

  const moyen =
    moyensPaiement.find((entree) => entree.operateur === commande.modePaiement) ?? null;
  const paiementEnLigne = Boolean(moyen) && commande.modePaiement !== "especes";

  const messageWhatsApp = `Bonjour ${restaurant.nom}, je suis ${
    commande.nomClient ?? "un client"
  } — commande n° ${commande.numero}.`;

  async function rappelerServeur() {
    setAppelEnCours(true);
    const resultat = await appelerServeur(commande.id);
    setAppelEnCours(false);
    setMessageAppel(resultat.message ?? null);
    if (resultat.ok) setCommande((actuelle) => ({ ...actuelle, appelServeurAt: new Date().toISOString() }));
  }

  return (
    <div className="space-y-4">
      {nouveaute ? (
        <div className="animate-pulse">
          <Alerte ton="succes" titre="Votre commande avance !">
            Nouveau statut : <strong>{LIBELLES_STATUT[commande.statut]}</strong>.
          </Alerte>
        </div>
      ) : null}

      {annulee ? (
        <Alerte ton="erreur" titre="Commande refusée par l'établissement">
          {commande.motifAnnulation ?? "Contactez le restaurant pour en savoir plus."}
        </Alerte>
      ) : null}

      {/* ------------------------------ Statut ------------------------------ */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
            {commande.type === "sur_place"
              ? `Sur place · table ${commande.tableNumero ?? "—"}`
              : "À emporter"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              ton={annulee ? "danger" : commande.statut === "servie" ? "neutre" : "marque"}
            >
              {LIBELLES_STATUT[commande.statut]}
            </Badge>
            {commande.paiementStatut === "paye" ? (
              <Badge ton="succes">Payée</Badge>
            ) : (
              <Badge ton="alerte">Paiement en attente</Badge>
            )}
          </div>
        </div>

        {!annulee ? (
          <ol className="mt-5 space-y-3">
            {ETAPES.map((etape, index) => {
              const atteinte = index <= etapeCourante;
              const active = index === etapeCourante;
              return (
                <li key={etape.statut} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full border",
                      atteinte
                        ? "border-transparent text-white"
                        : "border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-800",
                    )}
                    style={atteinte ? { backgroundColor: restaurant.couleur } : undefined}
                  >
                    <etape.icone className="size-4" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      active
                        ? "text-slate-900 dark:text-white"
                        : atteinte
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {etape.libelle}
                    {active ? (
                      <span className="ms-2 text-xs font-normal text-slate-400">
                        en cours — mise à jour automatique
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}

        {commande.heureRetrait && commande.type === "emporter" ? (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Timer className="size-4" aria-hidden />
            Retrait prévu vers{" "}
            {new Date(commande.heureRetrait).toISOString().slice(11, 16)} (heure d&apos;Abidjan)
          </p>
        ) : null}
      </section>

      {/* ------------------------------ Paiement ------------------------------ */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
          Paiement
        </h2>

        {commande.paiementStatut === "paye" ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-feuille-700 dark:text-feuille-300">
            <CheckCircle2 className="size-4" aria-hidden />
            Paiement confirmé par l&apos;établissement. Merci !
          </p>
        ) : paiementEnLigne && moyen ? (
          <div className="mt-3 space-y-4">
            <div className="flex items-center gap-3">
              <LogoPaiement marque={moyen.operateur as MarquePaiement} taille="md" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {LIBELLES_PAIEMENT[moyen.operateur as ModePaiement]}
                </p>
                {moyen.titulaire ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{moyen.titulaire}</p>
                ) : null}
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  Numéro à créditer
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="chiffres font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                    {moyen.numero}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(moyen.numero.replace(/\s/g, "")).then(() => {
                        setCopie(true);
                        window.setTimeout(() => setCopie(false), 2500);
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    {copie ? (
                      <CheckCircle2 className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                    {copie ? "Copié" : "Copier"}
                  </button>
                </dd>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  Montant exact
                </dt>
                <dd className="chiffres mt-1 font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatFcfa(commande.total, restaurant.devise)}
                </dd>
              </div>
            </dl>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajoutez le numéro de commande <strong>n° {commande.numero}</strong> dans le motif du
              transfert, puis envoyez la capture au restaurant. Le personnel valide votre paiement
              depuis l&apos;écran de service — cette page se mettra à jour aussitôt.
            </p>

            <div className="flex flex-wrap gap-2">
              {restaurant.telephone ? (
                <a href={lienWhatsApp(messageWhatsApp, restaurant.telephone)} target="_blank" rel="noreferrer">
                  <Bouton
                    icone={<MessageCircle className="size-4" aria-hidden />}
                    className="bg-feuille-600 text-white hover:bg-feuille-700"
                  >
                    Envoyer la capture (WhatsApp)
                  </Bouton>
                </a>
              ) : null}
              <a
                href={`${ouvrirApplication(moyen.operateur as ModePaiement)}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                <ExternalLink className="size-4" aria-hidden />
                Ouvrir l&apos;application {CODES_PAIEMENT[moyen.operateur as ModePaiement]}
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Paiement en espèces : réglez{" "}
            <strong className="chiffres">{formatFcfa(commande.total, restaurant.devise)}</strong> au
            serveur, sur place. Le personnel marquera la commande comme payée.
          </p>
        )}
      </section>

      {/* ------------------------- Articles commandés ------------------------- */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
          Votre commande
        </h2>
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {commande.lignes.map((ligne) => (
            <li key={ligne.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {ligne.quantite} × {ligne.nom}
                </p>
                {ligne.options.length > 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {ligne.options
                      .map((option) =>
                        option.prix > 0
                          ? `${option.nom} (+${formatFcfa(option.prix, restaurant.devise)})`
                          : option.nom,
                      )
                      .join(" · ")}
                  </p>
                ) : null}
                {ligne.note ? (
                  <p className="text-xs text-slate-500 italic dark:text-slate-400">« {ligne.note} »</p>
                ) : null}
              </div>
              <p className="chiffres shrink-0 font-semibold text-slate-700 dark:text-slate-200">
                {formatFcfa(
                  (ligne.prixUnitaire + ligne.options.reduce((s, o) => s + o.prix, 0)) * ligne.quantite,
                  restaurant.devise,
                )}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Total</span>
          <span className="chiffres font-titre text-xl font-extrabold text-slate-900 dark:text-white">
            {formatFcfa(commande.total, restaurant.devise)}
          </span>
        </div>

        {commande.note ? (
          <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Message transmis : « {commande.note} »
          </p>
        ) : null}
      </section>

      {/* ---------------------- Aide : serveur, WhatsApp, SMS ---------------------- */}
      {!terminee ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
            Besoin de quelque chose ?
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Le bouton ci-dessous prévient le personnel : il fait sonner l&apos;écran de service et
            affiche votre numéro de table.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Bouton
              onClick={() => void rappelerServeur()}
              chargement={appelEnCours}
              libelleChargement="Appel en cours…"
              icone={<Bell className="size-4" aria-hidden />}
              disabled={appelRecemment}
            >
              {appelRecemment ? "Serveur prévenu…" : "Appeler le serveur"}
            </Bouton>

            {restaurant.telephone ? (
              <>
                <a href={lienTel(restaurant.telephone)}>
                  <Bouton variante="contour" icone={<Phone className="size-4" aria-hidden />}>
                    Téléphoner au restaurant
                  </Bouton>
                </a>
                <a href={lienSms(messageWhatsApp, restaurant.telephone)}>
                  <Bouton variante="contour" icone={<Send className="size-4" aria-hidden />}>
                    SMS pré-rempli
                  </Bouton>
                </a>
              </>
            ) : null}
          </div>

          {messageAppel ? (
            <p className="mt-3 text-sm font-semibold text-feuille-700 dark:text-feuille-300">
              {messageAppel}
            </p>
          ) : null}
        </section>
      ) : null}

      <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
        <ShoppingBag className="size-3.5" aria-hidden />
        Commande propulsée par Mesplats — suivi en direct, sans application à installer.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Détails                                  */
/* -------------------------------------------------------------------------- */

/** Petit bip de notification (Web Audio) : aucun fichier son à télécharger. */
function bipDiscret() {
  try {
    const ContexteAudio =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ContexteAudio) return;
    const contexte = new ContexteAudio();
    const oscillateur = contexte.createOscillator();
    const gain = contexte.createGain();
    oscillateur.type = "sine";
    oscillateur.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, contexte.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, contexte.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, contexte.currentTime + 0.35);
    oscillateur.connect(gain).connect(contexte.destination);
    oscillateur.start();
    oscillateur.stop(contexte.currentTime + 0.4);
    window.setTimeout(() => void contexte.close(), 600);
  } catch {
    // Un navigateur sans Web Audio n'empêche pas le suivi : on continue sans son.
  }
}

/** Schémas d'application mobile money (ouverte si l'app est installée). */
function ouvrirApplication(operateur: ModePaiement): string {
  switch (operateur) {
    case "orange":
      return "orangemoney://";
    case "moov":
      return "moovmoney://";
    case "mtn":
      return "mtnmomo://";
    case "wave":
      return "wave://";
    default:
      return "#";
  }
}
