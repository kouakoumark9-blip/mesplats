"use client";

/**
 * Carte publique commandable : recherche, fiche plat (options + précision),
 * panier en session, coordonnées du client et envoi de la commande.
 * ---------------------------------------------------------------------------
 * • le panier vit dans `sessionStorage` : le client peut fermer son onglet ou
 *   perdre le réseau, il retrouve sa sélection en revenant ;
 * • les montants affichés ici sont indicatifs : la Server Action recalcule tout
 *   à partir de la base (prix, options, disponibilité) avant d'enregistrer ;
 * • aucune étape n'exige de compte : prénom + téléphone suffisent, comme dans
 *   un maquis.
 */
import {
  Clock,
  Minus,
  Plus,
  Search,
  SearchX,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { ChoixTelephone } from "@/components/formulaires/choix-telephone";
import { PhotoPlat } from "@/components/site/photo-plat";
import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree, ZoneTexte } from "@/components/ui/champ";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { LogoPaiement, type MarquePaiement } from "@/components/ui/logos-paiement";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import { creerCommande } from "@/lib/actions/commandes";
import { etatCommandeInitial } from "@/lib/actions/etat";
import { LIBELLES_PAIEMENT, type ModePaiement } from "@/lib/constants";
import type { PalettePublique } from "@/components/site/coque-carte";
import type { CodeLangue } from "@/lib/i18n-public";
import { LIBELLES_PUBLICS } from "@/lib/i18n-public";
import { cn, formatFcfa } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OptionPublique = { id: string; nom: string; supplementPrix: number };

export type PlatPublique = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  photo: string | null;
  disponible: boolean;
  personnesMin: number | null;
  personnesMax: number | null;
  options: OptionPublique[];
};

export type CategoriePublique = {
  id: string;
  nom: string;
  /** false = hors créneau : la catégorie reste visible mais non commandable. */
  servie: boolean;
  disponibiliteTexte: string | null;
  produits: PlatPublique[];
};

export type MoyenPaiementPublique = {
  operateur: ModePaiement;
  numero: string;
  titulaire: string | null;
};

type LignePanier = {
  /** Clé de regroupement : même plat + mêmes options + même note. */
  cle: string;
  productId: string;
  nom: string;
  prixUnitaire: number;
  options: { nom: string; prix: number }[];
  note: string | null;
  quantite: number;
  photo: string | null;
};

/* -------------------------------------------------------------------------- */
/*                              Composant principal                           */
/* -------------------------------------------------------------------------- */

export function MenuCommande({
  restaurant,
  table,
  categories,
  moyensPaiement,
  palette,
  langue,
}: {
  restaurant: { id: string; slug: string; nom: string; couleur: string; devise: string };
  table: { id: string; numero: string } | null;
  categories: CategoriePublique[];
  moyensPaiement: MoyenPaiementPublique[];
  palette: PalettePublique;
  langue: CodeLangue;
}) {
  const t = LIBELLES_PUBLICS[langue];
  const { notifier } = useToasts();
  const router = useRouter();
  const cleSession = `mesplats.panier.${restaurant.slug}`;

  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [recherche, setRecherche] = useState("");
  const [fiche, setFiche] = useState<PlatPublique | null>(null);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [restaure, setRestaure] = useState(false);

  /* --------------------------- Persistance (session) --------------------------- */
  useEffect(() => {
    try {
      const memoire = window.sessionStorage.getItem(cleSession);
      if (memoire) setPanier(JSON.parse(memoire) as LignePanier[]);
    } catch {
      // sessionStorage indisponible (navigation privée stricte) : on continue sans.
    }
    setRestaure(true);
  }, [cleSession]);

  useEffect(() => {
    if (!restaure) return;
    try {
      window.sessionStorage.setItem(cleSession, JSON.stringify(panier));
    } catch {
      // Ignoré : le panier reste en mémoire pour la session en cours.
    }
  }, [panier, cleSession, restaure]);

  /* ------------------------------ Recherche ------------------------------ */
  const filtre = recherche.trim().toLowerCase();
  const categoriesFiltrees = useMemo(() => {
    if (!filtre) return categories;
    return categories
      .map((categorie) => ({
        ...categorie,
        produits: categorie.produits.filter(
          (plat) =>
            plat.nom.toLowerCase().includes(filtre) ||
            (plat.description ?? "").toLowerCase().includes(filtre),
        ),
      }))
      .filter((categorie) => categorie.produits.length > 0);
  }, [categories, filtre]);

  const nbArticles = panier.reduce((somme, ligne) => somme + ligne.quantite, 0);
  const total = panier.reduce(
    (somme, ligne) =>
      somme + (ligne.prixUnitaire + ligne.options.reduce((s, o) => s + o.prix, 0)) * ligne.quantite,
    0,
  );

  /* -------------------------------- Panier -------------------------------- */
  function ajouter(ligne: Omit<LignePanier, "cle">) {
    const cle = [
      ligne.productId,
      ligne.options.map((o) => o.nom).sort().join("|"),
      ligne.note ?? "",
    ].join("::");

    setPanier((liste) => {
      const existante = liste.find((l) => l.cle === cle);
      if (existante) {
        return liste.map((l) =>
          l.cle === cle ? { ...l, quantite: Math.min(20, l.quantite + ligne.quantite) } : l,
        );
      }
      return [...liste, { ...ligne, cle }];
    });

    notifier({
      titre: "Ajouté à votre commande",
      description: ligne.nom,
      ton: "succes",
    });
  }

  function changerQuantite(cle: string, delta: number) {
    setPanier((liste) =>
      liste
        .map((l) => (l.cle === cle ? { ...l, quantite: l.quantite + delta } : l))
        .filter((l) => l.quantite > 0),
    );
  }

  function retirer(cle: string) {
    setPanier((liste) => liste.filter((l) => l.cle !== cle));
  }

  return (
    <div className="relative">
      {/* ------------------------------ Recherche ------------------------------ */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-titre text-lg font-extrabold tracking-tight" style={{ color: palette.texte }}>
            {t.notreCarte}
          </h2>
          <p className="text-xs" style={{ color: palette.texteDoux }}>
            {t.sousTitreCarte}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Entree
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            placeholder={t.recherche}
            aria-label={t.recherche}
            className="pl-9"
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <EtatVide
          icone={<UtensilsCrossed className="size-7" aria-hidden />}
          titre={t.vide}
          description={t.videDetail}
        />
      ) : null}

      {categories.length > 0 && categoriesFiltrees.length === 0 ? (
        <EtatVide
          icone={<SearchX className="size-7" aria-hidden />}
          titre={t.rienTrouve}
          description={`« ${recherche} » — essayez un autre mot, ou parcourez les catégories.`}
          action={
            <Bouton variante="contour" onClick={() => setRecherche("")}>
              Effacer la recherche
            </Bouton>
          }
        />
      ) : null}

      {/* -------------------------------- Menu -------------------------------- */}
      <div className="space-y-8">
        {categoriesFiltrees.map((categorie) => (
          <section key={categorie.id} aria-labelledby={`categorie-${categorie.id}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`categorie-${categorie.id}`}
                className="font-titre text-lg font-extrabold tracking-tight"
                style={{ color: categorie.servie ? palette.texte : palette.texteDoux }}
              >
                {categorie.nom}
              </h3>
              {categorie.disponibiliteTexte ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: categorie.servie ? `${restaurant.couleur}1a` : palette.carteDouce,
                    color: categorie.servie ? restaurant.couleur : palette.texteDoux,
                  }}
                >
                  <Clock className="size-3" aria-hidden />
                  {t.serviDe} {categorie.disponibiliteTexte}
                </span>
              ) : null}
              {!categorie.servie ? <Badge ton="neutre">{t.revientPlusTard}</Badge> : null}
            </div>

            <ul className="mt-3 space-y-2.5">
              {categorie.produits.map((plat) => (
                <li
                  key={plat.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3 shadow-sm",
                    (!plat.disponible || !categorie.servie) && "opacity-70",
                  )}
                  style={{ backgroundColor: palette.carteDouce, borderColor: palette.bordure }}
                >
                  <PhotoPlat src={plat.photo} alt={plat.nom} taille={80} className="size-20 rounded-xl" />

                  <div className="min-w-0 flex-1">
                    <p className="font-bold" style={{ color: palette.texte }}>
                      {plat.nom}
                      {!plat.disponible ? (
                        <Badge ton="danger" className="ms-2 align-middle">
                          {t.epuise}
                        </Badge>
                      ) : null}
                    </p>
                    {plat.description ? (
                      <p className="mt-0.5 text-sm" style={{ color: palette.texteDoux }}>
                        {plat.description}
                      </p>
                    ) : null}
                    {plat.personnesMin || plat.personnesMax ? (
                      <p className="mt-1 text-xs font-semibold" style={{ color: palette.texteDoux }}>
                        {plat.personnesMin && plat.personnesMax
                          ? `${plat.personnesMin} – ${plat.personnesMax} ${t.pourPersonnes}`
                          : plat.personnesMin
                            ? `${plat.personnesMin}+ ${t.pourPersonnes}`
                            : `≤ ${plat.personnesMax} ${t.pourPersonnes}`}
                      </p>
                    ) : null}
                    {plat.options.length > 0 ? (
                      <p className="mt-1 text-xs" style={{ color: palette.texteDoux }}>
                        {t.options} :{" "}
                        {plat.options
                          .map(
                            (option) =>
                              `${option.nom}${option.supplementPrix > 0 ? ` (+${formatFcfa(option.supplementPrix, restaurant.devise)})` : ""}`,
                          )
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p
                      className="chiffres font-titre font-extrabold"
                      style={{ color: restaurant.couleur }}
                    >
                      {formatFcfa(plat.prix, restaurant.devise)}
                    </p>
                    {plat.disponible && categorie.servie ? (
                      <Bouton
                        taille="sm"
                        icone={<Plus className="size-4" aria-hidden />}
                        onClick={() => setFiche(plat)}
                      >
                        Ajouter
                      </Bouton>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ---------------------------- Barre de panier ---------------------------- */}
      {nbArticles > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 print:hidden">
          <button
            type="button"
            onClick={() => setPanierOuvert(true)}
            className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white shadow-lg transition hover:opacity-95"
            style={{ backgroundColor: restaurant.couleur, color: "#ffffff" }}
          >
            <span className="flex items-center gap-2 font-bold">
              <ShoppingCart className="size-5" aria-hidden />
              {nbArticles} article{nbArticles > 1 ? "s" : ""}
            </span>
            <span className="chiffres font-titre text-lg font-extrabold">
              {formatFcfa(total, restaurant.devise)}
            </span>
            <span className="hidden text-sm font-semibold sm:inline">Voir le panier →</span>
          </button>
        </div>
      ) : null}

      {fiche ? (
        <FichePlat
          plat={fiche}
          devise={restaurant.devise}
          couleur={restaurant.couleur}
          onFermer={() => setFiche(null)}
          onAjouter={(ligne) => {
            ajouter(ligne);
            setFiche(null);
          }}
        />
      ) : null}

      <Panier
        ouverte={panierOuvert}
        onFermer={() => setPanierOuvert(false)}
        panier={panier}
        total={total}
        restaurant={restaurant}
        table={table}
        moyensPaiement={moyensPaiement}
        onQuantite={changerQuantite}
        onRetirer={retirer}
        onVide={() => setPanier([])}
        onEnvoyee={(id) => {
          setPanier([]);
          setPanierOuvert(false);
          try {
            window.sessionStorage.removeItem(cleSession);
          } catch {
            // Sans conséquence.
          }
          router.push(`/commande/${id}`);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Fiche d'un plat (options, note)                     */
/* -------------------------------------------------------------------------- */

function FichePlat({
  plat,
  devise,
  couleur,
  onFermer,
  onAjouter,
}: {
  plat: PlatPublique;
  devise: string;
  couleur: string;
  onFermer: () => void;
  onAjouter: (ligne: Omit<LignePanier, "cle">) => void;
}) {
  const [choisies, setChoisies] = useState<string[]>([]);
  const [quantite, setQuantite] = useState(1);
  const [note, setNote] = useState("");

  const supplement = plat.options
    .filter((option) => choisies.includes(option.id))
    .reduce((somme, option) => somme + option.supplementPrix, 0);
  const total = (plat.prix + supplement) * quantite;

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={plat.nom}
      description={plat.description ?? undefined}
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton
            icone={<ShoppingCart className="size-4" aria-hidden />}
            onClick={() =>
              onAjouter({
                productId: plat.id,
                nom: plat.nom,
                prixUnitaire: plat.prix,
                photo: plat.photo,
                options: plat.options
                  .filter((option) => choisies.includes(option.id))
                  .map((option) => ({ nom: option.nom, prix: option.supplementPrix })),
                note: note.trim() || null,
                quantite,
              })
            }
          >
            Ajouter — <span className="chiffres">{formatFcfa(total, devise)}</span>
          </Bouton>
        </>
      }
    >
      <div className="space-y-5">
        {plat.personnesMin || plat.personnesMax ? (
          <p className="text-sm text-slate-500">
            {plat.personnesMin && plat.personnesMax
              ? `Plat à partager : ${plat.personnesMin} à ${plat.personnesMax} personnes.`
              : plat.personnesMin
                ? `À partir de ${plat.personnesMin} personne(s).`
                : `Jusqu'à ${plat.personnesMax} personne(s).`}
          </p>
        ) : null}

        <p className="chiffres font-titre text-2xl font-extrabold" style={{ color: couleur }}>
          {formatFcfa(plat.prix, devise)}
        </p>

        {plat.options.length > 0 ? (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Options et suppléments
            </legend>
            <div className="mt-2 space-y-2">
              {plat.options.map((option) => {
                const active = choisies.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition",
                      active ? "border-marque-400 bg-marque-50" : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="size-4 accent-marque-500"
                        checked={active}
                        onChange={() =>
                          setChoisies((liste) =>
                            active ? liste.filter((id) => id !== option.id) : [...liste, option.id],
                          )
                        }
                      />
                      <span className="text-sm font-medium text-slate-800">{option.nom}</span>
                    </span>
                    <span className="chiffres text-sm font-semibold text-slate-600">
                      {option.supplementPrix > 0 ? `+ ${formatFcfa(option.supplementPrix, devise)}` : "offert"}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <Champ
          label="Une précision pour la cuisine ?"
          htmlFor="plat-note"
          aide="Ex. « sans piment », « bien cuit », « à emporter séparément »."
        >
          <Entree
            id="plat-note"
            value={note}
            maxLength={140}
            onChange={(evenement) => setNote(evenement.target.value)}
            placeholder="Sans piment"
          />
        </Champ>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">Quantité</span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Retirer un exemplaire"
              onClick={() => setQuantite((valeur) => Math.max(1, valeur - 1))}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="chiffres w-8 text-center font-titre text-lg font-extrabold text-slate-900">
              {quantite}
            </span>
            <button
              type="button"
              aria-label="Ajouter un exemplaire"
              onClick={() => setQuantite((valeur) => Math.min(20, valeur + 1))}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </span>
        </div>
      </div>
    </Modale>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Panier                                    */
/* -------------------------------------------------------------------------- */

/** Créneaux de retrait proposés : de +15 min à +2 h, par pas de 15 minutes. */
function creneauxRetrait(): { valeur: string; libelle: string }[] {
  const creneaux: { valeur: string; libelle: string }[] = [];
  const base = new Date();
  base.setSeconds(0, 0);
  for (let minutes = 15; minutes <= 120; minutes += 15) {
    const date = new Date(base.getTime() + minutes * 60_000);
    const valeur = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
    creneaux.push({ valeur, libelle: `vers ${valeur}` });
  }
  return creneaux;
}

function Panier({
  ouverte,
  onFermer,
  panier,
  total,
  restaurant,
  table,
  moyensPaiement,
  onQuantite,
  onRetirer,
  onVide,
  onEnvoyee,
}: {
  ouverte: boolean;
  onFermer: () => void;
  panier: LignePanier[];
  total: number;
  restaurant: { id: string; nom: string; couleur: string; devise: string };
  table: { id: string; numero: string } | null;
  moyensPaiement: MoyenPaiementPublique[];
  onQuantite: (cle: string, delta: number) => void;
  onRetirer: (cle: string) => void;
  onVide: () => void;
  onEnvoyee: (commandeId: string) => void;
}) {
  const [etat, action, enCours] = useActionState(creerCommande, etatCommandeInitial);
  const [modePaiement, setModePaiement] = useState<ModePaiement | "">(
    moyensPaiement[0]?.operateur ?? "especes",
  );
  const [type, setType] = useState<"sur_place" | "emporter">(table ? "sur_place" : "emporter");
  const [heureRetrait, setHeureRetrait] = useState("");
  const dejaRedirige = useRef(false);
  const creneaux = useMemo(() => creneauxRetrait(), []);

  useEffect(() => {
    if (!etat.ok || !etat.commandeId || dejaRedirige.current) return;
    dejaRedirige.current = true;
    onEnvoyee(etat.commandeId);
  }, [etat, onEnvoyee]);

  const moyenChoisi = moyensPaiement.find((moyen) => moyen.operateur === modePaiement);

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre="Votre commande"
      description={
        table
          ? `Vous commandez à la table ${table.numero} — le serveur vous apporte les plats.`
          : "Commande à emporter : indiquez votre prénom et un numéro pour être prévenu."
      }
      taille="lg"
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Continuer à choisir
          </Bouton>
          <Bouton
            type="submit"
            form="formulaire-commande"
            chargement={enCours}
            libelleChargement="Envoi en cuisine…"
            disabled={panier.length === 0}
            icone={<ShoppingBag className="size-4" aria-hidden />}
          >
            Envoyer — <span className="chiffres">{formatFcfa(total, restaurant.devise)}</span>
          </Bouton>
        </>
      }
    >
      {panier.length === 0 ? (
        <EtatVide
          icone={<ShoppingCart className="size-7" aria-hidden />}
          titre="Votre commande est vide"
          description="Ajoutez des plats depuis la carte, puis validez ici."
        />
      ) : (
        <form id="formulaire-commande" action={action} className="space-y-5" noValidate>
          <input type="hidden" name="restaurantId" value={restaurant.id} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="tableId" value={table?.id ?? ""} />
          <input type="hidden" name="heureRetrait" value={type === "emporter" ? heureRetrait : ""} />
          <input type="hidden" name="modePaiement" value={modePaiement} />
          <input
            type="hidden"
            name="lignes"
            value={JSON.stringify(
              panier.map((ligne) => ({
                productId: ligne.productId,
                quantite: ligne.quantite,
                options: ligne.options,
                note: ligne.note ?? "",
              })),
            )}
          />

          {etat.message ? (
            <Alerte ton="erreur" titre="Commande non envoyée">
              {etat.message}
            </Alerte>
          ) : null}

          {/* ------------------------------- Articles ------------------------------- */}
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {panier.map((ligne) => (
              <li key={ligne.cle} className="flex items-start gap-3 p-3">
                <PhotoPlat src={ligne.photo} alt={ligne.nom} taille={48} className="size-12 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{ligne.nom}</p>
                  {ligne.options.length > 0 ? (
                    <p className="text-xs text-slate-500">
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
                    <p className="text-xs text-slate-500 italic">« {ligne.note} »</p>
                  ) : null}
                  <p className="chiffres mt-0.5 text-sm font-bold text-slate-700">
                    {formatFcfa(
                      (ligne.prixUnitaire + ligne.options.reduce((s, o) => s + o.prix, 0)) *
                        ligne.quantite,
                      restaurant.devise,
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Retirer un ${ligne.nom}`}
                    onClick={() => onQuantite(ligne.cle, -1)}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="chiffres w-6 text-center font-bold">{ligne.quantite}</span>
                  <button
                    type="button"
                    aria-label={`Ajouter un ${ligne.nom}`}
                    onClick={() => onQuantite(ligne.cle, 1)}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Retirer ${ligne.nom} de la commande`}
                    onClick={() => onRetirer(ligne.cle)}
                    className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {(type === "sur_place" && !table) ? (
            <Alerte ton="alerte" titre="Table non identifiée" icone={<TriangleAlert className="size-4" aria-hidden />}>
              Scannez le QR code posé sur votre table pour commander sur place, ou choisissez
              « À emporter ».
            </Alerte>
          ) : null}

          {/* ------------------------------ Mode de service ------------------------------ */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Service</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={!table}
                onClick={() => setType("sur_place")}
                aria-pressed={type === "sur_place"}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  type === "sur_place"
                    ? "border-marque-500 bg-marque-50 text-marque-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                🍽️ Sur place
                <span className="block text-xs font-normal text-slate-500">
                  {table ? `Table ${table.numero}` : "Scannez le QR code de votre table"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("emporter")}
                aria-pressed={type === "emporter"}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                  type === "emporter"
                    ? "border-marque-500 bg-marque-50 text-marque-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                🛍️ À emporter
                <span className="block text-xs font-normal text-slate-500">
                  Vous récupérez au comptoir
                </span>
              </button>
            </div>

            {type === "emporter" ? (
              <div className="mt-3">
                <Champ label="Heure de retrait souhaitée" htmlFor="commande-retrait" aide="Nous préparons pour l'heure choisie.">
                  <select
                    id="commande-retrait"
                    value={heureRetrait}
                    onChange={(evenement) => setHeureRetrait(evenement.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-marque-500"
                  >
                    <option value="">Le plus tôt possible</option>
                    {creneaux.map((creneau) => (
                      <option key={creneau.valeur} value={creneau.valeur}>
                        {creneau.libelle}
                      </option>
                    ))}
                  </select>
                </Champ>
              </div>
            ) : null}
          </fieldset>

          {/* --------------------------- Coordonnées client --------------------------- */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Votre prénom" htmlFor="commande-nom" obligatoire erreur={etat.erreurs?.nomClient}>
              <Entree
                id="commande-nom"
                name="nomClient"
                autoComplete="given-name"
                placeholder="Awa"
                maxLength={60}
                erreur={Boolean(etat.erreurs?.nomClient)}
              />
            </Champ>

            <ChoixTelephone
              nomChamp="telephoneClient"
              label="Votre numéro (pour vous prévenir)"
              erreur={etat.erreurs?.telephoneClient}
            />
          </div>

          {/* ------------------------------ Paiement ------------------------------ */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Comment souhaitez-vous payer ?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {moyensPaiement.map((moyen) => {
                const actif = modePaiement === moyen.operateur;
                return (
                  <button
                    key={moyen.operateur}
                    type="button"
                    onClick={() => setModePaiement(moyen.operateur)}
                    aria-pressed={actif}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      actif ? "border-marque-500 bg-marque-50" : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <LogoPaiement marque={moyen.operateur as MarquePaiement} taille="sm" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">
                        {LIBELLES_PAIEMENT[moyen.operateur]}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {moyen.operateur === "especes" ? "Au serveur, en fin de repas" : moyen.numero}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {moyenChoisi ? (
              <p className="mt-2 text-xs text-slate-500">
                Le numéro exact et le montant apparaîtront sur la page de suivi, une fois la
                commande envoyée : vous pourrez copier le numéro ou ouvrir l&apos;application.
              </p>
            ) : null}
          </fieldset>

          <Champ
            label="Un message pour l'équipe ? (facultatif)"
            htmlFor="commande-note"
            erreur={etat.erreurs?.note}
          >
            <ZoneTexte
              id="commande-note"
              name="note"
              rows={2}
              maxLength={240}
              placeholder="Nous sommes 4, deux chaises bébé si possible."
            />
          </Champ>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-sm font-semibold text-white/80">Total à payer</span>
            <span className="chiffres font-titre text-xl font-extrabold">
              {formatFcfa(total, restaurant.devise)}
            </span>
          </div>

          <button
            type="button"
            onClick={onVide}
            className="text-xs font-semibold text-slate-400 underline hover:text-rose-600"
          >
            Vider ma commande
          </button>
        </form>
      )}
    </Modale>
  );
}
