"use client";

/**
 * Tableau de suivi des établissements (super-admin).
 * ---------------------------------------------------------------------------
 * Recherche, tri et actions : activer / suspendre un restaurant, changer sa
 * formule. Chaque action appelle une Server Action réservée au rôle
 * `superadmin` ; la suspension coupe immédiatement l'accès du restaurateur et
 * de son équipe (les gardes de `lib/auth/autorisation` revérifient l'état du
 * restaurant à chaque requête).
 */
import {
  ArrowUpDown,
  Ban,
  Building2,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Search,
  ShoppingBag,
  Sparkles,
  Table2,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteContenu } from "@/components/ui/carte";
import { Champ, Entree } from "@/components/ui/champ";
import { EtatVide } from "@/components/ui/divers";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import {
  basculerActivationRestaurant,
  changerFormuleRestaurant,
} from "@/lib/actions/plateforme";
import { LIBELLES_PLAN } from "@/lib/constants";
import type { RestaurantPlateforme, TriPlateforme } from "@/lib/db/plateforme";
import { cn, formatDate, initiales } from "@/lib/utils";

const TRIS: { cle: TriPlateforme; libelle: string }[] = [
  { cle: "recent", libelle: "Plus récents" },
  { cle: "nom", libelle: "Nom (A→Z)" },
  { cle: "commandes", libelle: "Commandes" },
];

export function TableauPlateforme({ restaurants }: { restaurants: RestaurantPlateforme[] }) {
  const { notifier } = useToasts();
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<TriPlateforme>("recent");
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "suspendus">("tous");
  const [aSuspendre, setASuspendre] = useState<RestaurantPlateforme | null>(null);
  const [aChanger, setAChanger] = useState<RestaurantPlateforme | null>(null);
  const [enCours, demarrer] = useTransition();

  const [donnees, setDonnees] = useState(restaurants);

  const liste = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const filtree = donnees.filter((restaurant) => {
      if (filtreActif === "actifs" && !restaurant.actif) return false;
      if (filtreActif === "suspendus" && restaurant.actif) return false;
      if (!terme) return true;
      return (
        restaurant.nom.toLowerCase().includes(terme) ||
        restaurant.slug.toLowerCase().includes(terme) ||
        (restaurant.ville ?? "").toLowerCase().includes(terme)
      );
    });

    switch (tri) {
      case "nom":
        return [...filtree].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      case "commandes":
        return [...filtree].sort((a, b) => b.commandes - a.commandes);
      default:
        return [...filtree].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }, [donnees, recherche, tri, filtreActif]);

  function agir(action: () => Promise<{ ok: boolean; message?: string }>, id: string, maj: Partial<RestaurantPlateforme>) {
    demarrer(async () => {
      const resultat = await action();
      notifier({
        titre: resultat.ok ? (resultat.message ?? "C'est fait") : "Action impossible",
        description: resultat.ok ? undefined : resultat.message,
        ton: resultat.ok ? "succes" : "erreur",
      });
      if (resultat.ok) {
        setDonnees((actuelles) =>
          actuelles.map((restaurant) =>
            restaurant.id === id ? { ...restaurant, ...maj } : restaurant,
          ),
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Champ label="Rechercher" htmlFor="recherche-restaurant">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Entree
                id="recherche-restaurant"
                value={recherche}
                onChange={(evenement) => setRecherche(evenement.target.value)}
                placeholder="Nom, identifiant public ou ville"
                className="ps-9"
              />
            </div>
          </Champ>
        </div>

        <div className="flex flex-wrap gap-1.5 pb-1">
          {(
            [
              { cle: "tous", libelle: "Tous" },
              { cle: "actifs", libelle: "Actifs" },
              { cle: "suspendus", libelle: "Suspendus" },
            ] as const
          ).map((filtre) => (
            <button
              key={filtre.cle}
              type="button"
              onClick={() => setFiltreActif(filtre.cle)}
              aria-pressed={filtreActif === filtre.cle}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                filtreActif === filtre.cle
                  ? "border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
              )}
            >
              {filtre.libelle}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-1">
          <ArrowUpDown className="size-4 text-slate-400" aria-hidden />
          {TRIS.map((option) => (
            <button
              key={option.cle}
              type="button"
              onClick={() => setTri(option.cle)}
              aria-pressed={tri === option.cle}
              className={cn(
                "text-xs font-bold transition",
                tri === option.cle
                  ? "text-slate-900 underline dark:text-white"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              {option.libelle}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {liste.length} établissement{liste.length > 1 ? "s" : ""} affiché
        {liste.length > 1 ? "s" : ""} sur {donnees.length}.
      </p>

      {liste.length === 0 ? (
        <EtatVide
          icone={<Building2 className="size-6" aria-hidden />}
          titre="Aucun établissement pour cette recherche"
          description="Effacez la recherche ou changez de filtre pour revoir la liste complète."
        />
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {liste.map((restaurant) => (
            <li key={restaurant.id}>
              <Carte className={cn("h-full", !restaurant.actif && "border-rose-200 dark:border-rose-500/30")}>
                <CarteContenu className="flex h-full flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-titre text-sm font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {initiales(restaurant.nom)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {restaurant.nom}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        /m/{restaurant.slug}
                        {restaurant.ville ? ` · ${restaurant.ville}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge ton={restaurant.plan === "pro" ? "marque" : "neutre"}>
                        {restaurant.plan === "pro" ? "Pro" : "À activer"}
                      </Badge>
                      {restaurant.actif ? (
                        <Badge ton="succes">Actif</Badge>
                      ) : (
                        <Badge ton="danger">Suspendu</Badge>
                      )}
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Indicateur icone={<ShoppingBag className="size-3.5" aria-hidden />} libelle="Commandes" valeur={restaurant.commandes} detail={`${restaurant.commandes30j} sur 30 j`} />
                    <Indicateur icone={<UtensilsCrossed className="size-3.5" aria-hidden />} libelle="Plats" valeur={restaurant.produits} />
                    <Indicateur icone={<Table2 className="size-3.5" aria-hidden />} libelle="Tables" valeur={restaurant.tables} />
                    <Indicateur icone={<Users className="size-3.5" aria-hidden />} libelle="Comptes" valeur={restaurant.comptes} />
                  </dl>

                  <p className="text-xs text-slate-400">Créé le {formatDate(restaurant.createdAt)}</p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <a
                      href={`/m/${restaurant.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      <QrCode className="size-3.5" aria-hidden />
                      Voir la carte
                      <ExternalLink className="size-3" aria-hidden />
                    </a>

                    <Bouton
                      taille="sm"
                      variante={restaurant.actif ? "contour" : "succes"}
                      className={restaurant.actif ? "text-rose-600 dark:text-rose-400" : undefined}
                      disabled={enCours}
                      icone={
                        restaurant.actif ? (
                          <Ban className="size-3.5" aria-hidden />
                        ) : (
                          <CheckCircle2 className="size-3.5" aria-hidden />
                        )
                      }
                      onClick={() => {
                        if (restaurant.actif) {
                          setASuspendre(restaurant);
                        } else {
                          agir(
                            () => basculerActivationRestaurant(restaurant.id, true),
                            restaurant.id,
                            { actif: true },
                          );
                        }
                      }}
                    >
                      {restaurant.actif ? "Suspendre" : "Réactiver"}
                    </Bouton>

                    <Bouton
                      taille="sm"
                      variante="contour"
                      disabled={enCours}
                      icone={<Sparkles className="size-3.5" aria-hidden />}
                      onClick={() => setAChanger(restaurant)}
                    >
                      Formule
                    </Bouton>
                  </div>
                </CarteContenu>
              </Carte>
            </li>
          ))}
        </ul>
      )}

      {/* --------------------------- Suspension (motif) --------------------------- */}
      {aSuspendre ? (
        <Modale
          ouverte
          onFermer={() => setASuspendre(null)}
          titre={`Suspendre ${aSuspendre.nom} ?`}
          description="Le menu public, la prise de commande et l'accès de l'équipe seront immédiatement coupés. Les données sont conservées."
          taille="sm"
          piedPage={
            <>
              <Bouton variante="contour" onClick={() => setASuspendre(null)}>
                Annuler
              </Bouton>
              <Bouton
                variante="danger"
                chargement={enCours}
                icone={<Ban className="size-4" aria-hidden />}
                onClick={() => {
                  const cible = aSuspendre;
                  setASuspendre(null);
                  agir(() => basculerActivationRestaurant(cible.id, false), cible.id, {
                    actif: false,
                  });
                }}
              >
                Suspendre l&apos;établissement
              </Bouton>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            À utiliser en cas d&apos;impayé ou de demande du restaurateur. Vous pourrez réactiver le
            compte à tout moment depuis ce même écran.
          </p>
        </Modale>
      ) : null}

      {/* ---------------------------- Changement de formule ---------------------------- */}
      {aChanger ? (
        <Modale
          ouverte
          onFermer={() => setAChanger(null)}
          titre={`Formule de ${aChanger.nom}`}
          description="La formule détermine le nombre de plats, de tables et de comptes d'équipe autorisés."
          taille="md"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(["gratuit", "pro"] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                disabled={enCours || aChanger.plan === plan}
                onClick={() => {
                  const cible = aChanger;
                  setAChanger(null);
                  agir(() => changerFormuleRestaurant(cible.id, plan), cible.id, { plan });
                }}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  aChanger.plan === plan
                    ? "border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800"
                    : "border-slate-200 hover:border-slate-400 dark:border-slate-700",
                )}
              >
                <p className="font-titre font-extrabold text-slate-900 dark:text-white">
                  {LIBELLES_PLAN[plan]}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {plan === "pro" ? "19 900 FCFA / mois" : "9 900 FCFA / mois"}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {plan === "pro"
                    ? "Plats, tables et comptes illimités."
                    : "20 plats, 5 tables, 3 comptes d'équipe."}
                </p>
                {aChanger.plan === plan ? (
                  <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                    Formule actuelle
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </Modale>
      ) : null}
    </div>
  );
}

function Indicateur({
  icone,
  libelle,
  valeur,
  detail,
}: {
  icone: React.ReactNode;
  libelle: string;
  valeur: number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800">
      <dt className="flex items-center gap-1 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
        {icone}
        {libelle}
      </dt>
      <dd className="chiffres mt-0.5 font-titre text-base font-extrabold text-slate-800 dark:text-slate-100">
        {valeur}
        {detail ? <span className="ms-1 text-[11px] font-semibold text-slate-400">{detail}</span> : null}
      </dd>
    </div>
  );
}
