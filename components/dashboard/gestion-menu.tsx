"use client";

/**
 * Gestion complète du menu : catégories, plats, options, ordre et « épuisé ».
 *
 * Le composant reçoit l'état initial du serveur (déjà filtré par restaurant) et
 * applique les mutations via des Server Actions. Les bascules (disponibilité,
 * visibilité) et les déplacements sont optimistes : l'affichage change
 * immédiatement, puis on rafraîchit les données serveur. En cas d'échec, l'état
 * revient en arrière et un message explique pourquoi.
 */
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

import { FormulaireProduit, type PlatModifiable } from "@/components/dashboard/formulaire-produit";
import { PhotoPlat } from "@/components/site/photo-plat";
import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteEntete } from "@/components/ui/carte";
import { Entree } from "@/components/ui/champ";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { Interrupteur } from "@/components/ui/interrupteur";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import {
  basculerDisponibilite,
  basculerVisibiliteCategorie,
  deplacerCategorie,
  deplacerProduit,
  dupliquerProduit,
  enregistrerCategorie,
  supprimerCategorie,
  supprimerProduit,
  type ResultatAction,
} from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import { cn, formatFcfa } from "@/lib/utils";

export type OptionAffichee = { id: string; nom: string; supplementPrix: number };

export type PlatAffiche = {
  id: string;
  categoryId: string;
  nom: string;
  description: string | null;
  prix: number;
  photo: string | null;
  disponible: boolean;
  options: OptionAffichee[];
};

export type CategorieAffichee = {
  id: string;
  nom: string;
  visible: boolean;
  produits: PlatAffiche[];
};

export function GestionMenu({
  categories: categoriesServeur,
  limiteProduits,
  devise,
  slug,
}: {
  categories: CategorieAffichee[];
  /** null = plan Pro (illimité). */
  limiteProduits: number | null;
  devise: string;
  slug: string;
}) {
  const router = useRouter();
  const { notifier } = useToasts();
  const [enTransition, demarrer] = useTransition();

  const [categories, setCategories] = useState(categoriesServeur);
  const [recherche, setRecherche] = useState("");

  const [modaleCategorie, setModaleCategorie] = useState<{ categorie?: CategorieAffichee } | null>(
    null,
  );
  const [modaleProduit, setModaleProduit] = useState<{
    plat?: PlatModifiable | null;
    categorieParDefaut?: string;
  } | null>(null);
  const [suppression, setSuppression] = useState<
    | { type: "categorie"; categorie: CategorieAffichee }
    | { type: "produit"; plat: PlatAffiche }
    | null
  >(null);

  // Les données serveur font autorité dès qu'elles arrivent (après refresh).
  useEffect(() => setCategories(categoriesServeur), [categoriesServeur]);

  const nbProduits = useMemo(
    () => categories.reduce((total, categorie) => total + categorie.produits.length, 0),
    [categories],
  );
  const limiteAtteinte = limiteProduits !== null && nbProduits >= limiteProduits;

  const filtre = recherche.trim().toLowerCase();
  const categoriesFiltrees = useMemo(() => {
    if (!filtre) return categories;
    return categories
      .map((categorie) => ({
        ...categorie,
        produits: categorie.produits.filter(
          (plat) =>
            plat.nom.toLowerCase().includes(filtre) ||
            (plat.description ?? "").toLowerCase().includes(filtre) ||
            categorie.nom.toLowerCase().includes(filtre),
        ),
      }))
      .filter((categorie) => categorie.produits.length > 0);
  }, [categories, filtre]);

  /* ------------------------------------------------------------------------ */
  /*                    Exécution d'une action avec retour visuel              */
  /* ------------------------------------------------------------------------ */

  function executer(
    action: () => Promise<ResultatAction>,
    options: { optimiste?: () => void; retour?: () => void; succes?: string } = {},
  ) {
    options.optimiste?.();
    demarrer(async () => {
      const resultat = await action();
      if (resultat.ok) {
        if (options.succes) {
          notifier({ titre: options.succes, ton: "succes" });
        }
        router.refresh();
      } else {
        options.retour?.();
        notifier({
          titre: "Action impossible",
          description: resultat.message,
          ton: "erreur",
        });
      }
    });
  }

  const majCategorie = (id: string, changement: Partial<CategorieAffichee>) =>
    setCategories((liste) =>
      liste.map((categorie) => (categorie.id === id ? { ...categorie, ...changement } : categorie)),
    );

  const majPlat = (id: string, changement: Partial<PlatAffiche>) =>
    setCategories((liste) =>
      liste.map((categorie) => ({
        ...categorie,
        produits: categorie.produits.map((plat) =>
          plat.id === id ? { ...plat, ...changement } : plat,
        ),
      })),
    );

  /** Échange deux catégories dans l'ordre affiché (retour visuel immédiat). */
  function deplacerCategorieLocalement(id: string, sens: "haut" | "bas") {
    const index = categories.findIndex((categorie) => categorie.id === id);
    const cible = sens === "haut" ? index - 1 : index + 1;
    if (index === -1 || cible < 0 || cible >= categories.length) return false;
    const copie = [...categories];
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
    setCategories(copie);
    return true;
  }

  function deplacerPlatLocalement(platId: string, sens: "haut" | "bas") {
    const categorie = categories.find((c) => c.produits.some((p) => p.id === platId));
    if (!categorie) return false;
    const index = categorie.produits.findIndex((p) => p.id === platId);
    const cible = sens === "haut" ? index - 1 : index + 1;
    if (cible < 0 || cible >= categorie.produits.length) return false;
    const produits = [...categorie.produits];
    [produits[index], produits[cible]] = [produits[cible], produits[index]];
    majCategorie(categorie.id, { produits });
    return true;
  }

  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-5">
      {/* Bandeau de limite du plan gratuit */}
      {limiteAtteinte && limiteProduits !== null ? (
        <Alerte
          ton="alerte"
          titre={`Limite du plan Gratuit atteinte (${nbProduits}/${limiteProduits} plats)`}
          icone={<TriangleAlert className="size-5" aria-hidden />}
        >
          Passez au plan Pro pour un menu illimité.{" "}
          <a className="font-bold underline" href="/dashboard/parametres#plan">
            Voir les options
          </a>
        </Alerte>
      ) : null}

      {/* Barre d'outils */}
      <Carte className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge ton="neutre">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""}
          </Badge>
          <Badge ton={limiteAtteinte ? "danger" : "succes"}>
            {nbProduits} plat{nbProduits > 1 ? "s" : ""}
            {limiteProduits !== null ? ` / ${limiteProduits}` : ""}
          </Badge>
          {enTransition ? (
            <span className="text-xs font-semibold text-slate-400">Enregistrement…</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Entree
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un plat…"
              aria-label="Rechercher un plat"
              className="pl-9"
            />
          </div>
          <Bouton
            variante="contour"
            icone={<FolderPlus className="size-4" aria-hidden />}
            onClick={() => setModaleCategorie({})}
          >
            Nouvelle catégorie
          </Bouton>
          <Bouton
            icone={<Plus className="size-4" aria-hidden />}
            disabled={categories.length === 0 || limiteAtteinte}
            onClick={() => setModaleProduit({ categorieParDefaut: categories[0]?.id })}
          >
            Ajouter un plat
          </Bouton>
        </div>
      </Carte>

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <EtatVide
          icone={<UtensilsCrossed className="size-6" aria-hidden />}
          titre="Votre menu est vide"
          description="Commencez par créer une catégorie (« Plats ivoiriens », « Grillades », « Boissons »…), puis ajoutez vos plats avec leur prix en FCFA."
          action={
            <Bouton
              icone={<FolderPlus className="size-4" aria-hidden />}
              onClick={() => setModaleCategorie({})}
            >
              Créer ma première catégorie
            </Bouton>
          }
        />
      ) : null}

      {categories.length > 0 && categoriesFiltrees.length === 0 ? (
        <EtatVide
          icone={<Search className="size-6" aria-hidden />}
          titre="Aucun plat ne correspond"
          description={`Aucun résultat pour « ${recherche} ». Essayez un autre mot-clé.`}
          action={
            <Bouton variante="contour" onClick={() => setRecherche("")}>
              Effacer la recherche
            </Bouton>
          }
        />
      ) : null}

      {categoriesFiltrees.map((categorie) => {
        const positionReelle = categories.findIndex((c) => c.id === categorie.id);
        return (
          <Carte key={categorie.id}>
            <CarteEntete
              titre={categorie.nom}
              description={`${categorie.produits.length} plat${categorie.produits.length > 1 ? "s" : ""}${
                categorie.visible ? "" : " · masquée du menu public"
              }`}
              icone={<UtensilsCrossed className="size-4" aria-hidden />}
              action={
                <>
                  <button
                    type="button"
                    aria-label={`Monter la catégorie ${categorie.nom}`}
                    disabled={positionReelle <= 0}
                    onClick={() =>
                      executer(() => deplacerCategorie(categorie.id, "haut"), {
                        optimiste: () => deplacerCategorieLocalement(categorie.id, "haut"),
                        retour: () => deplacerCategorieLocalement(categorie.id, "bas"),
                      })
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre la catégorie ${categorie.nom}`}
                    disabled={positionReelle === categories.length - 1}
                    onClick={() =>
                      executer(() => deplacerCategorie(categorie.id, "bas"), {
                        optimiste: () => deplacerCategorieLocalement(categorie.id, "bas"),
                        retour: () => deplacerCategorieLocalement(categorie.id, "haut"),
                      })
                    }
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={categorie.visible ? "Masquer la catégorie" : "Afficher la catégorie"}
                    title={categorie.visible ? "Visible sur le menu public" : "Masquée"}
                    onClick={() =>
                      executer(() => basculerVisibiliteCategorie(categorie.id, !categorie.visible), {
                        optimiste: () =>
                          majCategorie(categorie.id, { visible: !categorie.visible }),
                        retour: () => majCategorie(categorie.id, { visible: categorie.visible }),
                      })
                    }
                    className={cn(
                      "rounded-lg border p-2 transition",
                      categorie.visible
                        ? "border-feuille-200 bg-feuille-50 text-feuille-700"
                        : "border-slate-200 text-slate-400 dark:border-slate-800",
                    )}
                  >
                    {categorie.visible ? (
                      <Eye className="size-4" aria-hidden />
                    ) : (
                      <EyeOff className="size-4" aria-hidden />
                    )}
                  </button>
                  <Bouton
                    variante="contour"
                    taille="sm"
                    icone={<Pencil className="size-4" aria-hidden />}
                    onClick={() => setModaleCategorie({ categorie })}
                  >
                    Renommer
                  </Bouton>
                  <button
                    type="button"
                    aria-label={`Supprimer la catégorie ${categorie.nom}`}
                    onClick={() => setSuppression({ type: "categorie", categorie })}
                    className="rounded-lg border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </>
              }
            />

            {categorie.produits.length === 0 ? (
              <div className="px-4 py-6 text-center sm:px-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucun plat dans cette catégorie.
                </p>
                <Bouton
                  variante="contour"
                  taille="sm"
                  className="mt-3"
                  icone={<Plus className="size-4" aria-hidden />}
                  disabled={limiteAtteinte}
                  onClick={() => setModaleProduit({ categorieParDefaut: categorie.id })}
                >
                  Ajouter un plat
                </Bouton>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {categorie.produits.map((plat, indexPlat) => (
                  <li key={plat.id} className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
                    <PhotoPlat
                      src={plat.photo}
                      alt={plat.nom}
                      taille={64}
                      className="size-16 rounded-xl"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-titre font-bold text-slate-900 dark:text-white">
                          {plat.nom}
                        </p>
                        <span className="font-titre font-extrabold text-marque-600">
                          {formatFcfa(plat.prix, devise)}
                        </span>
                        {plat.disponible ? (
                          <Badge ton="succes">Disponible</Badge>
                        ) : (
                          <Badge ton="danger">Épuisé</Badge>
                        )}
                      </div>
                      {plat.description ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {plat.description}
                        </p>
                      ) : null}
                      {plat.options.length > 0 ? (
                        <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                          {plat.options.map((option) => (
                            <span
                              key={option.id}
                              className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {option.nom}
                              {option.supplementPrix > 0
                                ? ` +${formatFcfa(option.supplementPrix)}`
                                : " (offert)"}
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                      <Interrupteur
                        taille="sm"
                        actif={plat.disponible}
                        onChange={(valeur) =>
                          executer(() => basculerDisponibilite(plat.id, valeur), {
                            optimiste: () => majPlat(plat.id, { disponible: valeur }),
                            retour: () => majPlat(plat.id, { disponible: plat.disponible }),
                            succes: valeur ? "Plat remis en vente" : "Plat marqué épuisé",
                          })
                        }
                        label={plat.disponible ? "Marquer épuisé" : "Remettre en vente"}
                      />
                      <button
                        type="button"
                        aria-label={`Monter ${plat.nom}`}
                        disabled={indexPlat === 0}
                        onClick={() =>
                          executer(() => deplacerProduit(plat.id, "haut"), {
                            optimiste: () => deplacerPlatLocalement(plat.id, "haut"),
                            retour: () => deplacerPlatLocalement(plat.id, "bas"),
                          })
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-800"
                      >
                        <ArrowUp className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Descendre ${plat.nom}`}
                        disabled={indexPlat === categorie.produits.length - 1}
                        onClick={() =>
                          executer(() => deplacerProduit(plat.id, "bas"), {
                            optimiste: () => deplacerPlatLocalement(plat.id, "bas"),
                            retour: () => deplacerPlatLocalement(plat.id, "haut"),
                          })
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-800"
                      >
                        <ArrowDown className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Dupliquer ${plat.nom}`}
                        title="Dupliquer ce plat"
                        onClick={() =>
                          executer(() => dupliquerProduit(plat.id), {
                            succes: "Plat dupliqué",
                          })
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                      >
                        <Copy className="size-4" aria-hidden />
                      </button>
                      <Bouton
                        variante="contour"
                        taille="sm"
                        icone={<Pencil className="size-4" aria-hidden />}
                        onClick={() =>
                          setModaleProduit({
                            plat: {
                              id: plat.id,
                              categoryId: plat.categoryId,
                              nom: plat.nom,
                              description: plat.description,
                              prix: plat.prix,
                              photo: plat.photo,
                              disponible: plat.disponible,
                              options: plat.options,
                            },
                          })
                        }
                      >
                        Modifier
                      </Bouton>
                      <button
                        type="button"
                        aria-label={`Supprimer ${plat.nom}`}
                        onClick={() => setSuppression({ type: "produit", plat })}
                        className="rounded-lg border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        );
      })}

      {/* Aperçu du menu public */}
      {categories.length > 0 ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Vos modifications sont publiées aussitôt sur{" "}
          <a
            href={`/m/${slug}`}
            target="_blank"
            className="font-semibold text-marque-600 hover:underline"
          >
            votre menu public
          </a>
          .
        </p>
      ) : null}

      {/* ---------------------------- Modales ---------------------------- */}

      {modaleCategorie ? (
        <FormulaireCategorie
          categorie={modaleCategorie.categorie}
          onFermer={() => setModaleCategorie(null)}
        />
      ) : null}

      {modaleProduit ? (
        <FormulaireProduit
          ouverte
          onFermer={() => {
            setModaleProduit(null);
            router.refresh();
          }}
          categories={categories.map((categorie) => ({ id: categorie.id, nom: categorie.nom }))}
          devise={devise}
          plat={modaleProduit.plat}
          categorieParDefaut={modaleProduit.categorieParDefaut}
        />
      ) : null}

      {suppression ? (
        <Modale
          ouverte
          onFermer={() => setSuppression(null)}
          titre={suppression.type === "categorie" ? "Supprimer la catégorie" : "Supprimer le plat"}
          description={
            suppression.type === "categorie"
              ? "Cette action est définitive."
              : "Le plat disparaîtra du menu public."
          }
          piedPage={
            <>
              <Bouton variante="contour" onClick={() => setSuppression(null)}>
                Annuler
              </Bouton>
              <Bouton
                variante="danger"
                chargement={enTransition}
                libelleChargement="Suppression…"
                onClick={() => {
                  const cible = suppression;
                  setSuppression(null);
                  if (cible.type === "categorie") {
                    const nombre = cible.categorie.produits.length;
                    executer(() => supprimerCategorie(cible.categorie.id, nombre > 0), {
                      optimiste: () =>
                        setCategories((liste) =>
                          liste.filter((c) => c.id !== cible.categorie.id),
                        ),
                      succes:
                        nombre > 0
                          ? `Catégorie et ${nombre} plat(s) supprimés`
                          : "Catégorie supprimée",
                    });
                  } else {
                    executer(() => supprimerProduit(cible.plat.id), {
                      optimiste: () =>
                        setCategories((liste) =>
                          liste.map((categorie) => ({
                            ...categorie,
                            produits: categorie.produits.filter((p) => p.id !== cible.plat.id),
                          })),
                        ),
                      succes: "Plat supprimé",
                    });
                  }
                }}
              >
                Supprimer définitivement
              </Bouton>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {suppression.type === "categorie" ? (
              <>
                Vous allez supprimer la catégorie{" "}
                <strong className="text-slate-900 dark:text-white">
                  {suppression.categorie.nom}
                </strong>
                {suppression.categorie.produits.length > 0 ? (
                  <>
                    {" "}
                    ainsi que les <strong>{suppression.categorie.produits.length} plat(s)</strong>{" "}
                    qu&apos;elle contient
                  </>
                ) : null}
                .
              </>
            ) : (
              <>
                Vous allez supprimer{" "}
                <strong className="text-slate-900 dark:text-white">{suppression.plat.nom}</strong>.
                Pour le retirer temporairement du menu, marquez-le plutôt « épuisé ».
              </>
            )}
          </p>
        </Modale>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Modale d'ajout / renommage                          */
/* -------------------------------------------------------------------------- */

export function FormulaireCategorie({
  categorie,
  onFermer,
}: {
  categorie?: CategorieAffichee;
  onFermer: () => void;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerCategorie, etatInitial);
  const [nom, setNom] = useState(categorie?.nom ?? "");
  const [signale, setSignale] = useState(false);

  useEffect(() => {
    if (!etat.ok || signale) return;
    setSignale(true);
    notifier({ titre: categorie ? "Catégorie renommée" : "Catégorie créée", ton: "succes" });
    onFermer();
  }, [etat, notifier, onFermer, categorie, signale]);

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={categorie ? "Renommer la catégorie" : "Nouvelle catégorie"}
      description="Exemples : « Plats ivoiriens », « Grillades & braisés », « Boissons fraîches »."
      taille="sm"
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton
            type="submit"
            form="formulaire-categorie"
            chargement={enCours}
            libelleChargement="Enregistrement…"
          >
            {categorie ? "Renommer" : "Créer la catégorie"}
          </Bouton>
        </>
      }
    >
      <form id="formulaire-categorie" action={action} className="space-y-4">
        <input type="hidden" name="id" value={categorie?.id ?? ""} />
        <input type="hidden" name="visible" value={String(categorie?.visible ?? true)} />
        <div>
          <label
            htmlFor="categorie-nom"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Nom de la catégorie <span className="text-rose-500">*</span>
          </label>
          <Entree
            id="categorie-nom"
            name="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Plats ivoiriens"
            maxLength={40}
            autoFocus
            className="mt-1.5"
            erreur={Boolean(etat.erreurs?.nom)}
          />
          {etat.erreurs?.nom ? (
            <p role="alert" className="mt-1 text-sm font-medium text-rose-600">
              {etat.erreurs.nom}
            </p>
          ) : null}
        </div>
      </form>
    </Modale>
  );
}
