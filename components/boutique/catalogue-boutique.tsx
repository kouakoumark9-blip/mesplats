"use client";

/**
 * Catalogue Boutique Mesplats — supports imprimés autour du menu QR.
 * ---------------------------------------------------------------------------
 * Deux usages, un seul composant :
 *  • `mode="interne"` (par défaut) → espace restaurateur : chiffres du compte,
 *    historique des devis, commande directe ;
 *  • `mode="public"` → vitrine du site : un prospect parcourt les supports,
 *    compose son tirage et met des articles au panier ; pour envoyer la
 *    commande, il crée son compte (le panier reste dans sa session).
 * Le restaurateur compose son tirage comme chez un imprimeur :
 *  • catalogue illustré avec le prix unitaire dès le premier palier ;
 *  • fiche « Composez votre tirage » : quantité (avec le pas conseillé), prix
 *    unitaire qui baisse par palier, options payantes ;
 *  • panier vivant dans `sessionStorage` (le prix définitif est toujours
 *    recalculé par le serveur à l'envoi) ;
 *  • envoi de la commande → référence lisible, puis transmission à l'équipe
 *    Mesplats par WhatsApp pré-rempli (aucune passerelle de paiement requise).
 */
import {
  BadgeCheck,
  Boxes,
  Check,
  ChevronDown,
  Clock,
  Minus,
  Package,
  Plus,
  Printer,
  Ruler,
  Send,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { ChoixTelephone } from "@/components/formulaires/choix-telephone";
import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree, ZoneTexte } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import { commanderSupports } from "@/lib/actions/boutique";
import { etatBoutiqueInitial } from "@/lib/actions/etat";
import {
  CATALOGUE_BOUTIQUE,
  DELAI_DEFAUT,
  prochainPalier,
  prixUnitairePour,
  type ArticleBoutique,
  type LignePanier,
} from "@/lib/boutique";
import { LIBELLES_STATUT_BOUTIQUE, type StatutBoutique } from "@/lib/constants";
import { cn, formatFcfa, formatNombre } from "@/lib/utils";

const CLE_PANIER = "mesplats.boutique.panier";

export type CommandeSupportsAffichee = {
  id: string;
  reference: string;
  total: number;
  ville: string;
  statut: StatutBoutique;
  createdAt: string;
  articles: { nom: string; quantite: number }[];
};

export function CatalogueBoutique({
  commandes,
  profil,
  chiffres,
  mode = "interne",
  connecte = true,
}: {
  commandes: CommandeSupportsAffichee[];
  profil: {
    nomRestaurant: string;
    ville: string | null;
    adresse: string | null;
    telephone: string | null;
  };
  chiffres: { total: number; enCours: number; montant: number };
  /** « public » = vitrine du site ; « interne » = espace restaurateur. */
  mode?: "public" | "interne";
  /** Seul un propriétaire connecté peut envoyer une commande. */
  connecte?: boolean;
}) {
  const estPublic = mode === "public";
  const { notifier } = useToasts();
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [fiche, setFiche] = useState<ArticleBoutique | null>(null);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [etat, action, enCours] = useActionState(commanderSupports, etatBoutiqueInitial);
  /** Commande envoyée : affichée dans sa propre fenêtre, avec sa référence. */
  const [confirmation, setConfirmation] = useState<{
    reference?: string;
    total?: number;
    lienWhatsApp?: string;
    message?: string;
  } | null>(null);

  /* Le panier survit à un rechargement de page (sessionStorage). */
  useEffect(() => {
    try {
      const brut = window.sessionStorage.getItem(CLE_PANIER);
      if (brut) setPanier(JSON.parse(brut) as LignePanier[]);
    } catch {
      // Panier illisible : on repart d'un panier vide, sans bloquer la page.
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CLE_PANIER, JSON.stringify(panier));
    } catch {
      // Mode navigation privée saturé : le panier reste en mémoire.
    }
  }, [panier]);

  /*
   * Commande envoyée : on ferme le formulaire, on vide le panier et on affiche
   * la confirmation (référence lisible + total recalculé + lien WhatsApp).
   */
  useEffect(() => {
    if (!etat.ok) return;
    setConfirmation({
      reference: etat.reference,
      total: etat.total,
      lienWhatsApp: etat.lienWhatsApp,
      message: etat.message,
    });
    setPanier([]);
    setPanierOuvert(false);
    setFiche(null);
    window.sessionStorage.removeItem(CLE_PANIER);
  }, [etat]);

  const total = panier.reduce((somme, ligne) => somme + ligne.total, 0);
  const exemplaires = panier.reduce((somme, ligne) => somme + ligne.quantite, 0);

  function ajouter(ligne: LignePanier) {
    setPanier((actuel) => {
      const index = actuel.findIndex(
        (element) =>
          element.articleId === ligne.articleId &&
          element.optionsIds.join("|") === ligne.optionsIds.join("|"),
      );
      if (index === -1) return [...actuel, ligne];
      const copie = [...actuel];
      copie[index] = ligne; // même article + mêmes options : la quantité est remplacée
      return copie;
    });
    notifier({
      titre: `${ligne.quantite} × ${ligne.nom}`,
      description: `Ajouté au panier — ${formatFcfa(ligne.total)}`,
      ton: "succes",
    });
    setFiche(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* --------------------------------- En-tête --------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-marque-50 px-3 py-1 text-xs font-bold tracking-wide text-marque-700 uppercase dark:bg-marque-500/15 dark:text-marque-300">
            <Store className="size-3.5" aria-hidden />
            Boutique
          </p>
          <h1 className="mt-3 font-titre text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            Vos supports imprimés, <span className="text-marque-600">QR menu intégré.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Stickers, chevalets, sous-bocks, sets de table… Nous imprimons vos QR codes sur des
            supports qui tiennent dans le temps, à partir des réglages de votre compte. Livraison à
            Abidjan sous 72 h, expédition en province.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/boutique/catalogue" target={estPublic ? undefined : "_blank"}>
            <Bouton variante="contour" icone={<Printer className="size-4" aria-hidden />}>
              Catalogue à imprimer
            </Bouton>
          </Link>
          {estPublic ? (
            <Link href="/inscription">
              <Bouton variante="contour" icone={<Sparkles className="size-4" aria-hidden />}>
                Créer mon compte
              </Bouton>
            </Link>
          ) : (
            <Link href="/dashboard/qr">
              <Bouton variante="contour" icone={<Printer className="size-4" aria-hidden />}>
                Imprimer moi-même
              </Bouton>
            </Link>
          )}
          <Bouton
            icone={<ShoppingCart className="size-4" aria-hidden />}
            onClick={() => setPanierOuvert(true)}
            disabled={panier.length === 0}
          >
            Mon panier{panier.length > 0 ? ` (${exemplaires})` : ""}
          </Bouton>
        </div>
      </header>

      {/* --------------------------- Bandeau de chiffres --------------------------- */}
      {!estPublic ? (
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicateur
          icone={<Package className="size-4" aria-hidden />}
          libelle="Devis passés"
          valeur={String(chiffres.total)}
        />
        <Indicateur
          icone={<Clock className="size-4" aria-hidden />}
          libelle="En cours de production"
          valeur={String(chiffres.enCours)}
        />
        <Indicateur
          icone={<BadgeCheck className="size-4" aria-hidden />}
          libelle="Montant commandé"
          valeur={formatFcfa(chiffres.montant)}
        />
      </div>
      ) : null}

      {/* ------------------------------- Catalogue ------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {CATALOGUE_BOUTIQUE.map((article) => (
            <CarteArticle
              key={article.id}
              article={article}
              onComposer={() => setFiche(article)}
              quantiteAuPanier={panier
                .filter((ligne) => ligne.articleId === article.id)
                .reduce((somme, ligne) => somme + ligne.quantite, 0)}
            />
          ))}
        </div>

        {/* ------------------------------ Panier (lg) ------------------------------ */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <PanneauPanier
              panier={panier}
              total={total}
              exemplaires={exemplaires}
              onRetirer={(index) =>
                setPanier((actuel) => actuel.filter((_, position) => position !== index))
              }
              onVider={() => setPanier([])}
              onCommander={() => setPanierOuvert(true)}
            />

            {estPublic ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Votre panier est conservé pendant que vous créez votre compte : vous le retrouverez
                tel quel dans votre espace.
              </p>
            ) : commandes.length > 0 ? (
              <Historique commandes={commandes} />
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Aucun devis pour l&apos;instant. Composez votre tirage puis envoyez-le : il
                apparaîtra ici avec sa référence.
              </p>
            )}
          </div>
        </aside>
      </div>

      {!estPublic && commandes.length > 0 ? (
        <div className="lg:hidden">
          <Historique commandes={commandes} />
        </div>
      ) : null}

      {/* -------------------------------- Ce qui est inclus -------------------------------- */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 font-titre text-lg font-extrabold text-slate-900 dark:text-white">
          <Sparkles className="size-5 text-marque-600" aria-hidden />
          Inclus dans chaque tirage
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            "QR code généré depuis vos réglages Mesplats (style, couleurs, logo)",
            "Vérification du scan sur 3 téléphones avant expédition",
            "Livraison à Abidjan sous 72 h, expédition en province par transporteur",
            "Remplacement gratuit en cas de défaut d'impression",
          ].map((element) => (
            <li key={element} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Check className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
              {element}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Les tarifs couvrent l&apos;impression et la livraison à Abidjan. Pour la province, les frais
        de transport sont confirmés dans le devis avant fabrication. Un délai de {DELAI_DEFAUT} est
        appliqué à la préparation.
      </p>

      {/* ----------------------------- Fiche « composer » ----------------------------- */}
      {fiche ? (
        <FicheSupport
          article={fiche}
          onFermer={() => setFiche(null)}
          onAjouter={ajouter}
        />
      ) : null}

      {/* --------------------------- Panier (mobile et envoi) --------------------------- */}
      {panier.length > 0 && !panierOuvert ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setPanierOuvert(true)}
            className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg"
          >
            <span className="flex items-center gap-2 font-bold">
              <ShoppingCart className="size-5" aria-hidden />
              {exemplaires} exemplaire{exemplaires > 1 ? "s" : ""}
            </span>
            <span className="chiffres font-titre text-lg font-extrabold">{formatFcfa(total)}</span>
            <span className="text-sm font-semibold">Voir le panier →</span>
          </button>
        </div>
      ) : null}

      {panierOuvert ? (
        <Modale
          ouverte
          onFermer={() => setPanierOuvert(false)}
          titre="Valider ma commande de supports"
          description="Nous confirmons le devis et le délai avant toute impression. Aucun paiement en ligne n'est demandé ici."
          taille="lg"
        >
          <form action={action} className="space-y-5" noValidate>
              {etat.message && !etat.ok ? <Alerte ton="erreur">{etat.message}</Alerte> : null}

              <PanierRecapitulatif
                panier={panier}
                total={total}
                onRetirer={(index) =>
                  setPanier((actuel) => actuel.filter((_, position) => position !== index))
                }
              />

              {/* Le panier part en JSON ; le serveur relit prix, options et minimums. */}
              {connecte ? null : (
                <Alerte ton="info" titre="Dernière étape : votre compte">
                  La boutique est réservée aux restaurants équipés de Mesplats. Créez votre compte
                  (2 minutes) : vous retrouverez le panier tel quel, puis nous confirmons le devis
                  sur WhatsApp.
                </Alerte>
              )}

              <input
                type="hidden"
                name="lignes"
                value={JSON.stringify(
                  panier.map((ligne) => ({
                    articleId: ligne.articleId,
                    quantite: ligne.quantite,
                    options: ligne.optionsIds,
                  })),
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Champ label="Votre nom" htmlFor="boutique-nom" obligatoire erreur={etat.erreurs?.nomClient}>
                  <Entree
                    id="boutique-nom"
                    name="nomClient"
                    defaultValue={profil.nomRestaurant}
                    required
                    placeholder="Awa Traoré"
                  />
                </Champ>

                <ChoixTelephone
                  nomChamp="telephoneClient"
                  label="Votre numéro (WhatsApp de préférence)"
                  valeurInitiale={profil.telephone ?? ""}
                  erreur={etat.erreurs?.telephoneClient}
                />
              </div>

              <Champ
                label="Adresse de livraison"
                htmlFor="boutique-adresse"
                obligatoire
                erreur={etat.erreurs?.adresse}
                aide="Rue, repère ou quartier : le livreur vous appelle en arrivant."
              >
                <Entree
                  id="boutique-adresse"
                  name="adresse"
                  defaultValue={profil.adresse ?? ""}
                  required
                  placeholder="Rue des Jardins, en face de la pharmacie"
                />
              </Champ>

              <Champ label="Ville" htmlFor="boutique-ville" obligatoire erreur={etat.erreurs?.ville}>
                <Entree
                  id="boutique-ville"
                  name="ville"
                  defaultValue={profil.ville ?? "Abidjan"}
                  required
                  placeholder="Abidjan"
                />
              </Champ>

              <Champ
                label="Précisions pour l'atelier (facultatif)"
                htmlFor="boutique-note"
                erreur={etat.erreurs?.note}
              >
                <ZoneTexte
                  id="boutique-note"
                  name="note"
                  rows={2}
                  maxLength={300}
                  placeholder="Ex. livrer avant vendredi, l'enseigne s'appelle désormais « Chez Awa »."
                />
              </Champ>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total recalculé à l&apos;envoi :{" "}
                  <strong className="chiffres text-slate-900 dark:text-white">{formatFcfa(total)}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Bouton type="button" variante="contour" onClick={() => setPanierOuvert(false)}>
                    Continuer mes achats
                  </Bouton>
                  {connecte ? (
                    <Bouton
                      type="submit"
                      chargement={enCours}
                      libelleChargement="Envoi…"
                      icone={<Send className="size-4" aria-hidden />}
                    >
                      Envoyer la commande
                    </Bouton>
                  ) : (
                    <Link href="/inscription">
                      <Bouton icone={<Sparkles className="size-4" aria-hidden />}>
                        Créer mon compte pour commander
                      </Bouton>
                    </Link>
                  )}
                </div>
              </div>
          </form>
        </Modale>
      ) : null}

      {/* ------------------------------ Confirmation ------------------------------ */}
      {confirmation ? (
        <Modale
          ouverte
          onFermer={() => setConfirmation(null)}
          titre="Demande enregistrée"
          description="Nous confirmons le devis et le délai avant impression."
          taille="md"
        >
          <ConfirmationBoutique etat={confirmation} onFermer={() => setConfirmation(null)} />
        </Modale>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Carte d'un article                            */
/* -------------------------------------------------------------------------- */

function CarteArticle({
  article,
  onComposer,
  quantiteAuPanier,
}: {
  article: ArticleBoutique;
  onComposer: () => void;
  quantiteAuPanier: number;
}) {
  const dernierPalier = article.paliers[article.paliers.length - 1];

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr]">
        {/* Photo produit (photo de catalogue, chargée normalement) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.photo}
          alt={article.nom}
          className="h-44 w-full object-cover sm:h-full"
          loading="lazy"
        />

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge ton="marque">{article.accroche}</Badge>
            {article.miseEnAvant ? <Badge ton="succes">{article.miseEnAvant}</Badge> : null}
            {quantiteAuPanier > 0 ? (
              <Badge ton="info" icone={<ShoppingCart className="size-3.5" aria-hidden />}>
                {quantiteAuPanier} au panier
              </Badge>
            ) : null}
          </div>

          <div>
            <h2 className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
              {article.nom}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{article.description}</p>
          </div>

          <ul className="grid gap-1 sm:grid-cols-2">
            {article.specifications.map((specification) => (
              <li
                key={specification}
                className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"
              >
                <Ruler className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {specification}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
            <p className="chiffres">
              <span className="font-titre text-xl font-extrabold text-slate-900 dark:text-white">
                {formatFcfa(article.prixUnitaire)}
              </span>
              <span className="ml-1 text-xs font-semibold text-slate-500">/ unité</span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                dès {article.minimum} ex.
                {dernierPalier && dernierPalier.prixUnitaire < article.prixUnitaire
                  ? ` · ${formatFcfa(dernierPalier.prixUnitaire)} dès ${dernierPalier.aPartirDe} ex.`
                  : ""}
              </span>
            </p>

            <Bouton
              onClick={onComposer}
              icone={<Plus className="size-4" aria-hidden />}
              className="shrink-0"
            >
              Composer mon tirage
            </Bouton>
          </div>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Fiche « composer mon tirage »                       */
/* -------------------------------------------------------------------------- */

function FicheSupport({
  article,
  onFermer,
  onAjouter,
}: {
  article: ArticleBoutique;
  onFermer: () => void;
  onAjouter: (ligne: LignePanier) => void;
}) {
  const [quantite, setQuantite] = useState(article.minimum);
  const [options, setOptions] = useState<string[]>([]);

  const prixUnitaire = prixUnitairePour(article, quantite);
  const supplement = article.options
    .filter((option) => options.includes(option.id))
    .reduce((somme, option) => somme + option.prix, 0);
  const total = (prixUnitaire + supplement) * quantite;
  const suivant = prochainPalier(article, quantite);

  const ajuster = (delta: number) => {
    const valeur = quantite + delta;
    if (valeur < article.minimum) return;
    if (valeur > article.maximum) return;
    setQuantite(valeur);
  };

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={article.nom}
      description={article.accroche}
      taille="lg"
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton
            icone={<ShoppingCart className="size-4" aria-hidden />}
            onClick={() =>
              onAjouter({
                articleId: article.id,
                nom: article.nom,
                photo: article.photo,
                quantite,
                prixUnitaire,
                options: article.options
                  .filter((option) => options.includes(option.id))
                  .map((option) => ({ nom: option.nom, prix: option.prix })),
                optionsIds: [...options],
                total,
              })
            }
          >
            Ajouter — <span className="chiffres">{formatFcfa(total)}</span>
          </Bouton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.photo}
            alt={article.nom}
            className="h-32 w-full rounded-2xl object-cover sm:h-full"
          />
          <p className="text-sm text-slate-600 dark:text-slate-300">{article.description}</p>
        </div>

        {/* Quantité */}
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quantité du tirage</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-300 p-1 dark:border-slate-700">
              <button
                type="button"
                onClick={() => ajuster(-article.pas)}
                disabled={quantite <= article.minimum}
                aria-label="Diminuer la quantité"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <input
                type="number"
                value={quantite}
                min={article.minimum}
                max={article.maximum}
                step={article.pas}
                onChange={(evenement) => {
                  const valeur = Number(evenement.target.value);
                  if (Number.isFinite(valeur)) setQuantite(Math.max(article.minimum, Math.min(article.maximum, Math.round(valeur))));
                }}
                aria-label="Nombre d'exemplaires"
                className="chiffres h-9 w-20 border-0 bg-transparent text-center font-titre text-lg font-extrabold text-slate-900 focus:outline-none dark:text-white"
              />
              <button
                type="button"
                onClick={() => ajuster(article.pas)}
                disabled={quantite >= article.maximum}
                aria-label="Augmenter la quantité"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Minimum {article.minimum} ex. · pas de {article.pas} ex.
            </span>
          </div>

          {/* Grille dégressive */}
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {article.paliers.map((palier) => {
              const actif = prixUnitaire === palier.prixUnitaire && quantite >= palier.aPartirDe;
              return (
                <li
                  key={palier.aPartirDe}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs",
                    actif
                      ? "border-marque-500 bg-marque-50 dark:bg-marque-500/15"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  <span className="block font-semibold text-slate-700 dark:text-slate-200">
                    dès {palier.aPartirDe} ex.
                  </span>
                  <span className="chiffres block font-titre text-base font-extrabold text-slate-900 dark:text-white">
                    {formatFcfa(palier.prixUnitaire)}
                    <span className="text-[11px] font-medium text-slate-500"> / unité</span>
                  </span>
                </li>
              );
            })}
          </ul>

          {suivant ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-feuille-700 dark:text-feuille-300">
              <ChevronDown className="size-3.5" aria-hidden />
              Passez à {suivant.aPartirDe} ex. et le prix unitaire tombe à{" "}
              {formatFcfa(suivant.prixUnitaire)}.
            </p>
          ) : null}
        </div>

        {/* Options */}
        {article.options.length > 0 ? (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Options d&apos;impression
            </legend>
            <div className="mt-2 space-y-2">
              {article.options.map((option) => {
                const active = options.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                      active
                        ? "border-marque-400 bg-marque-50 dark:bg-marque-500/10"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() =>
                          setOptions((actuelles) =>
                            active
                              ? actuelles.filter((id) => id !== option.id)
                              : [...actuelles, option.id],
                          )
                        }
                        className="size-4 accent-marque-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200">{option.nom}</span>
                    </span>
                    <span className="chiffres shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
                      +{formatFcfa(option.prix)} / unité
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {/* Total détaillé */}
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>
              {quantite} ex. × {formatFcfa(prixUnitaire)}
            </span>
            <span className="chiffres">{formatFcfa(prixUnitaire * quantite)}</span>
          </div>
          {supplement > 0 ? (
            <div className="mt-1 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>Options ({formatFcfa(supplement)} / unité)</span>
              <span className="chiffres">{formatFcfa(supplement * quantite)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Total du tirage</span>
            <span className="chiffres font-titre text-xl font-extrabold text-slate-900 dark:text-white">
              {formatFcfa(total)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatNombre(quantite)} exemplaire{quantite > 1 ? "s" : ""} · impression et livraison à
            Abidjan incluses.
          </p>
        </div>
      </div>
    </Modale>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Panier                                    */
/* -------------------------------------------------------------------------- */

function PanneauPanier({
  panier,
  total,
  exemplaires,
  onRetirer,
  onVider,
  onCommander,
}: {
  panier: LignePanier[];
  total: number;
  exemplaires: number;
  onRetirer: (index: number) => void;
  onVider: () => void;
  onCommander: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <p className="flex items-center gap-2 font-titre font-extrabold text-slate-900 dark:text-white">
          <ShoppingCart className="size-4" aria-hidden />
          Mon panier
        </p>
        {panier.length > 0 ? (
          <button
            type="button"
            onClick={onVider}
            className="text-xs font-semibold text-slate-400 underline hover:text-rose-500"
          >
            Vider
          </button>
        ) : null}
      </div>

      {panier.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Votre panier est vide. Choisissez un support puis composez votre tirage.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {panier.map((ligne, index) => (
              <li key={`${ligne.articleId}-${index}`} className="flex gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ligne.photo} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {ligne.nom}
                  </p>
                  <p className="chiffres text-xs text-slate-500 dark:text-slate-400">
                    {ligne.quantite} ex. × {formatFcfa(ligne.prixUnitaire)}
                  </p>
                  {ligne.options.length > 0 ? (
                    <p className="text-xs text-slate-400">
                      {ligne.options.map((option) => option.nom).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="chiffres text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatFcfa(ligne.total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRetirer(index)}
                    aria-label={`Retirer ${ligne.nom}`}
                    className="text-slate-400 transition hover:text-rose-500"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Livraison Abidjan</span>
              <span className="font-semibold text-feuille-700 dark:text-feuille-300">Offerte</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Total ({exemplaires} ex.)
              </span>
              <span className="chiffres font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                {formatFcfa(total)}
              </span>
            </p>
            <Bouton pleineLargeur onClick={onCommander} icone={<Send className="size-4" aria-hidden />}>
              Commander ces supports
            </Bouton>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Truck className="size-3.5" aria-hidden />
              Devis confirmé et délai annoncé avant impression.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function PanierRecapitulatif({
  panier,
  total,
  onRetirer,
}: {
  panier: LignePanier[];
  total: number;
  onRetirer: (index: number) => void;
}) {
  if (panier.length === 0) {
    return <Alerte ton="alerte">Votre panier est vide : ajoutez au moins un support.</Alerte>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {panier.map((ligne, index) => (
          <li key={`${ligne.articleId}-${index}`} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {ligne.quantite} × {ligne.nom}
              </p>
              {ligne.options.length > 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ligne.options.map((option) => option.nom).join(" · ")}
                </p>
              ) : null}
            </div>
            <span className="chiffres shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200">
              {formatFcfa(ligne.total)}
            </span>
            <button
              type="button"
              onClick={() => onRetirer(index)}
              aria-label={`Retirer ${ligne.nom}`}
              className="text-slate-400 transition hover:text-rose-500"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 dark:border-slate-800">
        <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
        <span className="chiffres font-titre text-lg font-extrabold text-slate-900 dark:text-white">
          {formatFcfa(total)}
        </span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Confirmation                                 */
/* -------------------------------------------------------------------------- */

function ConfirmationBoutique({
  etat,
  onFermer,
}: {
  etat: { reference?: string; total?: number; lienWhatsApp?: string; message?: string };
  onFermer: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-feuille-200 bg-feuille-50 p-4 dark:border-feuille-500/30 dark:bg-feuille-500/10">
        <BadgeCheck className="mt-0.5 size-6 shrink-0 text-feuille-600" aria-hidden />
        <div>
          <p className="font-titre font-extrabold text-feuille-900 dark:text-feuille-200">
            Commande {etat.reference} enregistrée
          </p>
          <p className="mt-1 text-sm text-feuille-800 dark:text-feuille-300">
            {etat.message}
          </p>
          {etat.total ? (
            <p className="chiffres mt-2 font-titre text-lg font-extrabold text-feuille-900 dark:text-feuille-200">
              {formatFcfa(etat.total)}
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Pour accélérer la fabrication, transmettez la commande à l&apos;équipe Mesplats : le message
        WhatsApp est déjà rédigé avec le détail des supports, le total et votre adresse.
      </p>

      <div className="flex flex-wrap gap-2">
        {etat.lienWhatsApp ? (
          <a
            href={etat.lienWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-feuille-600 px-4 text-sm font-semibold text-white transition hover:bg-feuille-700"
          >
            <Send className="size-4" aria-hidden />
            Transmettre par WhatsApp
          </a>
        ) : null}
        <Bouton variante="contour" onClick={onFermer}>
          Fermer
        </Bouton>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Votre commande apparaît aussi dans l&apos;historique de la boutique, avec sa référence.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Historique des devis                           */
/* -------------------------------------------------------------------------- */

function Historique({ commandes }: { commandes: CommandeSupportsAffichee[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <p className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-titre font-extrabold text-slate-900 dark:border-slate-800 dark:text-white">
        <Boxes className="size-4" aria-hidden />
        Mes devis de supports
      </p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {commandes.map((commande) => (
          <li key={commande.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-titre text-sm font-extrabold text-slate-900 dark:text-white">
                {commande.reference}
              </span>
              <Badge
                ton={
                  commande.statut === "annulee"
                    ? "danger"
                    : commande.statut === "nouvelle"
                      ? "alerte"
                      : "succes"
                }
              >
                {LIBELLES_STATUT_BOUTIQUE[commande.statut]}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {commande.articles
                .map((article) => `${article.quantite} × ${article.nom}`)
                .join(" · ")}
            </p>
            <p className="chiffres mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {new Date(commande.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                · {commande.ville}
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {formatFcfa(commande.total)}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Indicateur({
  icone,
  libelle,
  valeur,
}: {
  icone: React.ReactNode;
  libelle: string;
  valeur: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        {icone}
      </span>
      <div>
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{libelle}</p>
        <p className="chiffres font-titre text-base font-extrabold text-slate-900 dark:text-white">
          {valeur}
        </p>
      </div>
    </div>
  );
}
