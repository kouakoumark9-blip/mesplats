"use client";

/**
 * Écran de service (serveurs et cuisine) — pensé pour une tablette posée au
 * comptoir ou en cuisine.
 * ---------------------------------------------------------------------------
 * • mise à jour par polling toutes les 4 secondes (pas de WebSocket) ;
 * • alerte sonore + animation quand une nouvelle commande arrive ;
 * • un bouton par étape : accepter → en préparation → prête → servie ;
 * • refus avec motif (le client le voit sur sa page de suivi) ;
 * • « marquer comme payé » en un clic pour les paiements mobile money ;
 * • filtres par statut et par type, et liens WhatsApp / SMS vers le client.
 *
 * Thème sombre par défaut : l'écran est souvent lu dans une cuisine peu éclairée
 * ou derrière un comptoir en plein soleil.
 */
import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChefHat,
  FlameKindling,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  ShoppingBag,
  Utensils,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree } from "@/components/ui/champ";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import {
  changerStatutCommande,
  marquerCommandePayee,
  refuserCommande,
} from "@/lib/actions/commandes";
import {
  LIBELLES_PAIEMENT,
  LIBELLES_STATUT,
  LIBELLES_TYPE_COMMANDE,
  type ModePaiement,
  type Statut,
  type TypeCommande,
} from "@/lib/constants";
import { cn, formatFcfa, formatHeure, lienSms, lienWhatsApp } from "@/lib/utils";

const INTERVALLE_POLLING = 4000;

export type CommandeService = {
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
  heureRetrait: string | null;
  note: string | null;
  motifAnnulation: string | null;
  appelServeurAt: string | null;
  createdAt: string;
  updatedAt: string;
  lignes: {
    id: string;
    nom: string;
    quantite: number;
    prixUnitaire: number;
    options: { nom: string; prix: number }[];
    note: string | null;
  }[];
};

/** Étapes suivies par l'écran, dans l'ordre. */
const PROCHAINE: Partial<Record<Statut, { statut: Statut; libelle: string }>> = {
  nouvelle: { statut: "acceptee", libelle: "Accepter" },
  acceptee: { statut: "en_preparation", libelle: "En préparation" },
  en_preparation: { statut: "prete", libelle: "Marquer prête" },
  prete: { statut: "servie", libelle: "Servie" },
};

const FILTRES_STATUT: { cle: Statut | "toutes"; libelle: string }[] = [
  { cle: "toutes", libelle: "Toutes" },
  { cle: "nouvelle", libelle: "Nouvelles" },
  { cle: "acceptee", libelle: "Acceptées" },
  { cle: "en_preparation", libelle: "En préparation" },
  { cle: "prete", libelle: "Prêtes" },
  { cle: "servie", libelle: "Servies" },
  { cle: "annulee", libelle: "Refusées" },
];

export function EcranService({
  commandesInitiales,
  devise,
  nomRestaurant,
  slug,
  couleur,
  role,
}: {
  commandesInitiales: CommandeService[];
  devise: string;
  nomRestaurant: string;
  slug: string;
  couleur: string;
  /** Rôle de la personne connectée : la cuisine ne valide pas les paiements. */
  role: "admin" | "serveur" | "cuisine";
}) {
  /* Seuls le propriétaire et les serveurs refusent une commande ou encaissent. */
  const peutEncaisser = role === "admin" || role === "serveur";
  const { notifier } = useToasts();
  const [commandes, setCommandes] = useState(commandesInitiales);
  const [filtreStatut, setFiltreStatut] = useState<Statut | "toutes">("toutes");
  const [filtreType, setFiltreType] = useState<TypeCommande | "tous">("tous");
  const [enTransition, setEnTransition] = useState<string | null>(null);
  const [refus, setRefus] = useState<CommandeService | null>(null);
  const [motif, setMotif] = useState("");
  const [sonActif, setSonActif] = useState(true);

  const numerosConnus = useRef(new Set(commandesInitiales.map((c) => c.id)));
  const premiereCharge = useRef(true);

  /* ---------------------- Alertes visuelles et sonores ---------------------- */
  const [nouvellesEnSurbrillance, setNouvellesEnSurbrillance] = useState<string[]>([]);

  const signalerNouvelles = useCallback(
    (liste: CommandeService[]) => {
      const arrivees = liste.filter(
        (commande) => !numerosConnus.current.has(commande.id) && commande.statut === "nouvelle",
      );
      if (arrivees.length === 0) return;

      arrivees.forEach((commande) => numerosConnus.current.add(commande.id));
      setNouvellesEnSurbrillance(arrivees.map((c) => c.id));
      window.setTimeout(() => setNouvellesEnSurbrillance([]), 12_000);

      if (sonActif) carillon();
      notifier({
        titre:
          arrivees.length === 1
            ? `Nouvelle commande n° ${arrivees[0].numero}`
            : `${arrivees.length} nouvelles commandes`,
        description: arrivees
          .map((commande) =>
            commande.type === "sur_place" ? `Table ${commande.tableNumero}` : "À emporter",
          )
          .join(" · "),
        ton: "info",
      });
    },
    [notifier, sonActif],
  );

  /* ------------------------------- Polling 4 s ------------------------------- */
  const rafraichir = useCallback(async () => {
    try {
      const reponse = await fetch("/api/service/commandes", { cache: "no-store" });
      if (!reponse.ok) return;
      const donnees = (await reponse.json()) as { commandes: CommandeService[] };
      setCommandes(donnees.commandes);
      signalerNouvelles(donnees.commandes);
    } catch {
      // Réseau instable : nouvel essai au cycle suivant.
    } finally {
      premiereCharge.current = false;
    }
  }, [signalerNouvelles]);

  useEffect(() => {
    const minuteur = window.setInterval(() => void rafraichir(), INTERVALLE_POLLING);
    return () => window.clearInterval(minuteur);
  }, [rafraichir]);

  /* --------------------------- Actions sur commande --------------------------- */
  async function executer(
    commande: CommandeService,
    action: () => Promise<{ ok: boolean; message?: string }>,
    statutLocal?: Statut,
    paiementLocal?: string,
  ) {
    setEnTransition(commande.id);
    const resultat = await action();
    setEnTransition(null);

    if (resultat.ok) {
      if (statutLocal || paiementLocal) {
        setCommandes((liste) =>
          liste.map((element) =>
            element.id === commande.id
              ? {
                  ...element,
                  statut: statutLocal ?? element.statut,
                  paiementStatut: paiementLocal ?? element.paiementStatut,
                }
              : element,
          ),
        );
      }
      notifier({ titre: resultat.message ?? "Commande mise à jour", ton: "succes" });
      void rafraichir();
    } else {
      notifier({
        titre: "Action impossible",
        description: resultat.message,
        ton: "erreur",
      });
    }
  }

  /* -------------------------------- Filtres -------------------------------- */
  const filtrees = useMemo(() => {
    return commandes.filter((commande) => {
      if (filtreStatut !== "toutes" && commande.statut !== filtreStatut) return false;
      if (filtreType !== "tous" && commande.type !== filtreType) return false;
      return true;
    });
  }, [commandes, filtreStatut, filtreType]);

  const compteurs = useMemo(
    () => ({
      nouvelles: commandes.filter((c) => c.statut === "nouvelle").length,
      actives: commandes.filter(
        (c) => c.statut === "nouvelle" || c.statut === "acceptee" || c.statut === "en_preparation",
      ).length,
      appels: commandes.filter(
        (c) =>
          c.appelServeurAt &&
          Date.now() - new Date(c.appelServeurAt).getTime() < 5 * 60 * 1000 &&
          c.statut !== "servie" &&
          c.statut !== "annulee",
      ).length,
    }),
    [commandes],
  );

  return (
    <div className="min-h-dvh bg-slate-950 pb-24 text-slate-100">
      {/* --------------------------------- Barre --------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl font-titre text-sm font-extrabold text-white"
              style={{ backgroundColor: couleur }}
              aria-hidden
            >
              {nomRestaurant.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-titre text-lg font-extrabold text-white">Écran de service</p>
              <p className="text-xs text-slate-400">
                {nomRestaurant} · mise à jour toutes les 4 s
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge ton={compteurs.nouvelles > 0 ? "danger" : "neutre"}>
              {compteurs.nouvelles} nouvelle{compteurs.nouvelles > 1 ? "s" : ""}
            </Badge>
            <Badge ton="info">{compteurs.actives} en cours</Badge>
            {compteurs.appels > 0 ? (
              <Badge ton="alerte" icone={<BellRing className="size-3.5" aria-hidden />}>
                {compteurs.appels} appel{compteurs.appels > 1 ? "s" : ""} client
              </Badge>
            ) : null}

            <button
              type="button"
              onClick={() => setSonActif((actif) => !actif)}
              aria-pressed={sonActif}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition",
                sonActif
                  ? "border-feuille-600 bg-feuille-600/20 text-feuille-300"
                  : "border-slate-700 text-slate-400",
              )}
            >
              {sonActif ? <Bell className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
              Alerte sonore {sonActif ? "activée" : "coupée"}
            </button>

            <Bouton
              variante="contour"
              taille="sm"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              icone={<RefreshCw className="size-4" aria-hidden />}
              onClick={() => void rafraichir()}
            >
              Actualiser
            </Bouton>
          </div>
        </div>

        {/* Filtres */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTRES_STATUT.map((filtre) => (
              <button
                key={filtre.cle}
                type="button"
                onClick={() => setFiltreStatut(filtre.cle)}
                aria-pressed={filtreStatut === filtre.cle}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                  filtreStatut === filtre.cle
                    ? "border-transparent bg-white text-slate-900"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800",
                )}
              >
                {filtre.libelle}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1.5">
            {(["tous", "sur_place", "emporter"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFiltreType(type)}
                aria-pressed={filtreType === type}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                  filtreType === type
                    ? "border-transparent bg-white text-slate-900"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800",
                )}
              >
                {type === "tous" ? "Tous types" : LIBELLES_TYPE_COMMANDE[type]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* -------------------------------- Liste -------------------------------- */}
      <main className="mx-auto max-w-7xl px-4 py-5">
        {filtrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 py-16 text-center">
            <Inbox className="size-10 text-slate-600" aria-hidden />
            <p className="mt-4 font-titre text-lg font-bold text-slate-300">
              Aucune commande dans ce filtre
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Les nouvelles commandes apparaissent ici automatiquement, avec une alerte sonore.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtrees.map((commande) => (
              <CarteCommande
                key={commande.id}
                commande={commande}
                devise={devise}
                couleur={couleur}
                enTransition={enTransition === commande.id}
                nouvelle={nouvellesEnSurbrillance.includes(commande.id)}
                peutEncaisser={peutEncaisser}
                onStatut={(statut) =>
                  executer(
                    commande,
                    () => changerStatutCommande(commande.id, statut as "acceptee" | "en_preparation" | "prete" | "servie"),
                    statut,
                  )
                }
                onPaiement={(paye) =>
                  executer(
                    commande,
                    () => marquerCommandePayee(commande.id, paye),
                    undefined,
                    paye ? "paye" : "en_attente",
                  )
                }
                onRefuser={() => {
                  setMotif("");
                  setRefus(commande);
                }}
              />
            ))}
          </ul>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Menu public :{" "}
          <a href={`/m/${slug}`} target="_blank" className="font-semibold underline">
            /m/{slug}
          </a>{" "}
          · Les commandes de la journée restent affichées ici après avoir été servies.
        </p>
      </main>

      {/* ------------------------------ Refus (motif) ------------------------------ */}
      {refus ? (
        <Modale
          ouverte
          onFermer={() => setRefus(null)}
          titre={`Refuser la commande n° ${refus.numero}`}
          description="Le motif est affiché au client sur sa page de suivi et lui est envoyé par WhatsApp si vous le souhaitez."
          taille="sm"
          piedPage={
            <>
              <Bouton variante="contour" onClick={() => setRefus(null)} type="button">
                Annuler
              </Bouton>
              <Bouton
                variante="danger"
                disabled={motif.trim().length < 3}
                icone={<XCircle className="size-4" aria-hidden />}
                onClick={() =>
                  void executer(refus, () => refuserCommande(refus.id, motif), "annulee").then(() =>
                    setRefus(null),
                  )
                }
              >
                Refuser la commande
              </Bouton>
            </>
          }
        >
          <Champ
            label="Motif du refus"
            htmlFor="motif-refus"
            obligatoire
            aide="Ex. « rupture de poisson », « nous fermons dans 10 minutes »."
          >
            <Entree
              id="motif-refus"
              value={motif}
              maxLength={160}
              onChange={(evenement) => setMotif(evenement.target.value)}
              placeholder="Rupture de poisson braisé"
            />
          </Champ>

          {refus.telephoneClient ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={lienWhatsApp(
                  `Bonjour ${refus.nomClient ?? ""}, votre commande n° ${refus.numero} chez nous ne peut pas être honorée : ${motif || "…"}`,
                  refus.telephoneClient,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-feuille-600 px-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="size-4" aria-hidden />
                Prévenir par WhatsApp
              </a>
              <a
                href={lienSms(
                  `Votre commande n° ${refus.numero} ne peut pas être honorée : ${motif || "…"}`,
                  refus.telephoneClient,
                )}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700"
              >
                <Send className="size-4" aria-hidden />
                Envoyer un SMS
              </a>
            </div>
          ) : null}
        </Modale>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Carte d'une commande                           */
/* -------------------------------------------------------------------------- */

function CarteCommande({
  commande,
  devise,
  couleur,
  enTransition,
  nouvelle,
  peutEncaisser,
  onStatut,
  onPaiement,
  onRefuser,
}: {
  commande: CommandeService;
  devise: string;
  couleur: string;
  enTransition: boolean;
  nouvelle: boolean;
  peutEncaisser: boolean;
  onStatut: (statut: Statut) => void;
  onPaiement: (paye: boolean) => void;
  onRefuser: () => void;
}) {
  const prochaine = PROCHAINE[commande.statut];
  const annulee = commande.statut === "annulee";
  const appeleRecent =
    commande.appelServeurAt &&
    Date.now() - new Date(commande.appelServeurAt).getTime() < 5 * 60 * 1000;

  const accents: Record<Statut, string> = {
    nouvelle: "border-l-amber-400",
    acceptee: "border-l-blue-400",
    en_preparation: "border-l-violet-400",
    prete: "border-l-emerald-400",
    servie: "border-l-slate-500",
    annulee: "border-l-rose-500",
  };

  return (
    <li
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-slate-800 border-l-4 bg-slate-900",
        accents[commande.statut],
        nouvelle && "animate-[pulse_2s_ease-in-out_3] ring-2 ring-amber-400/70",
      )}
    >
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div>
          <p className="font-titre text-2xl font-extrabold text-white">n° {commande.numero}</p>
          <p className="text-sm font-semibold text-slate-300">
            {commande.type === "sur_place"
              ? `Table ${commande.tableNumero ?? "—"}`
              : "À emporter"}
            {commande.heureRetrait ? (
              <span className="ms-2 text-xs font-normal text-amber-300">
                retrait {new Date(commande.heureRetrait).toISOString().slice(11, 16)}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-slate-500">
            {formatHeure(commande.createdAt)}
            {commande.nomClient ? ` · ${commande.nomClient}` : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              commande.statut === "nouvelle"
                ? "bg-amber-400 text-slate-900"
                : commande.statut === "prete"
                  ? "bg-emerald-400 text-slate-900"
                  : annulee
                    ? "bg-rose-500 text-white"
                    : "bg-slate-700 text-slate-100",
            )}
          >
            {LIBELLES_STATUT[commande.statut]}
          </span>
          {commande.paiementStatut === "paye" ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-feuille-400">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Payée
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-300">Paiement en attente</span>
          )}
        </div>
      </div>

      {appeleRecent && !annulee && commande.statut !== "servie" ? (
        <p className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-xs font-bold text-amber-300">
          <BellRing className="size-3.5 animate-pulse" aria-hidden />
          Le client demande le serveur
        </p>
      ) : null}

      <ul className="mx-4 space-y-1.5 border-y border-slate-800 py-3">
        {commande.lignes.map((ligne) => (
          <li key={ligne.id} className="text-sm">
            <span className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-100">
                <span className="chiffres me-1.5 inline-block rounded bg-slate-800 px-1.5 font-bold">
                  {ligne.quantite}×
                </span>
                {ligne.nom}
              </span>
              <span className="chiffres shrink-0 text-slate-400">
                {formatFcfa(
                  (ligne.prixUnitaire + ligne.options.reduce((s, o) => s + o.prix, 0)) * ligne.quantite,
                  devise,
                )}
              </span>
            </span>
            {ligne.options.length > 0 ? (
              <span className="block text-xs text-slate-400">
                {ligne.options.map((option) => option.nom).join(" · ")}
              </span>
            ) : null}
            {ligne.note ? (
              <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-300">
                <FlameKindling className="size-3" aria-hidden />
                {ligne.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {commande.note ? (
        <p className="mx-4 mt-3 rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-300">
          Message client : « {commande.note} »
        </p>
      ) : null}

      {annulee && commande.motifAnnulation ? (
        <p className="mx-4 mt-3 rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300">
          Refusée : {commande.motifAnnulation}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 p-4 pt-3">
        <p className="chiffres mr-auto font-titre text-lg font-extrabold text-white">
          {formatFcfa(commande.total, devise)}
        </p>

        {prochaine && !annulee ? (
          <Bouton
            taille="lg"
            chargement={enTransition}
            libelleChargement="…"
            onClick={() => onStatut(prochaine.statut)}
            icone={
              prochaine.statut === "servie" ? (
                <Utensils className="size-4" aria-hidden />
              ) : prochaine.statut === "en_preparation" ? (
                <ChefHat className="size-4" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )
            }
            className="text-white"
            style={{ backgroundColor: couleur }}
          >
            {prochaine.libelle}
          </Bouton>
        ) : null}

        {!annulee && peutEncaisser ? (
          <>
            <Bouton
              taille="lg"
              variante={commande.paiementStatut === "paye" ? "contour" : "succes"}
              className={cn(
                commande.paiementStatut === "paye" && "border-slate-700 bg-slate-900 text-slate-200",
              )}
              disabled={enTransition}
              onClick={() => onPaiement(commande.paiementStatut !== "paye")}
              icone={<ShoppingBag className="size-4" aria-hidden />}
            >
              {commande.paiementStatut === "paye" ? "Paiement reçu ✓" : "Marquer payé"}
            </Bouton>

            <button
              type="button"
              onClick={onRefuser}
              className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-slate-700 px-3 text-sm font-semibold text-slate-300 transition hover:border-rose-500 hover:text-rose-300"
            >
              <XCircle className="size-4" aria-hidden />
              Refuser
            </button>
          </>
        ) : null}

        {commande.telephoneClient ? (
          <>
            <a
              href={lienWhatsApp(
                `Bonjour ${commande.nomClient ?? ""}, votre commande n° ${commande.numero} est en cours chez nous.`,
                commande.telephoneClient,
              )}
              target="_blank"
              rel="noreferrer"
              title="Écrire au client sur WhatsApp"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-feuille-600 text-white transition hover:bg-feuille-700"
            >
              <MessageCircle className="size-4" aria-hidden />
            </a>
            <a
              href={lienSms(
                `Votre commande n° ${commande.numero} est prête.`,
                commande.telephoneClient,
              )}
              title="Envoyer un SMS au client"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800"
            >
              <Send className="size-4" aria-hidden />
            </a>
            <a
              href={`tel:${commande.telephoneClient.replace(/\s/g, "")}`}
              title="Appeler le client"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-slate-800"
            >
              <Phone className="size-4" aria-hidden />
            </a>
          </>
        ) : null}
      </div>

      {commande.modePaiement ? (
        <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
          Paiement choisi : {LIBELLES_PAIEMENT[commande.modePaiement as ModePaiement]}
        </p>
      ) : null}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Son                                     */
/* -------------------------------------------------------------------------- */

/**
 * Carillon de nouvelle commande (Web Audio) : deux notes courtes, aucune
 * ressource externe à télécharger — l'écran fonctionne même hors ligne.
 */
function carillon() {
  try {
    const ContexteAudio =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ContexteAudio) return;

    const contexte = new ContexteAudio();
    const notes = [
      { frequence: 880, debut: 0 },
      { frequence: 1320, debut: 0.18 },
    ];

    for (const note of notes) {
      const oscillateur = contexte.createOscillator();
      const gain = contexte.createGain();
      oscillateur.type = "triangle";
      oscillateur.frequency.value = note.frequence;
      const depart = contexte.currentTime + note.debut;
      gain.gain.setValueAtTime(0.0001, depart);
      gain.gain.exponentialRampToValueAtTime(0.25, depart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, depart + 0.35);
      oscillateur.connect(gain).connect(contexte.destination);
      oscillateur.start(depart);
      oscillateur.stop(depart + 0.4);
    }

    window.setTimeout(() => void contexte.close(), 1200);
  } catch {
    // Sans Web Audio (navigateur ancien), l'alerte visuelle reste suffisante.
  }
}
