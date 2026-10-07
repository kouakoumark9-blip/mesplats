/**
 * Journal des commandes du restaurant — /dashboard/commandes
 *
 * Vue de gestion (le suivi en direct reste sur /service) : historique du jour et
 * des jours précédents, filtres par statut et par type, encaissements, et
 * export CSV pour la comptabilité. Chaque ligne ouvre le suivi client et donne
 * accès direct au client par WhatsApp, SMS ou téléphone.
 */
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  LayoutList,
  MessageCircle,
  Phone,
  Receipt,
  Send,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Carte, CarteContenu, CarteEntete, CarteStat } from "@/components/ui/carte";
import { EtatVide } from "@/components/ui/divers";
import { exigerRole } from "@/lib/auth/autorisation";
import {
  LIBELLES_PAIEMENT,
  LIBELLES_PAIEMENT_STATUT,
  LIBELLES_STATUT,
  LIBELLES_TYPE_COMMANDE,
  STATUTS,
  type ModePaiement,
  type Statut,
  type TypeCommande,
} from "@/lib/constants";
import { commandesHistorique, statsJour, topProduitsJour } from "@/lib/db/commandes";
import { cn, formatDateHeure, formatFcfa, formatHeure, lienSms, lienTel, lienWhatsApp } from "@/lib/utils";

export const metadata: Metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

type Proprietes = {
  searchParams: Promise<{ statut?: string; type?: string }>;
};

export default async function PageCommandes({ searchParams }: Proprietes) {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;
  const { statut, type } = await searchParams;

  const statutFiltre = STATUTS.includes(statut as Statut) ? (statut as Statut) : undefined;
  const typeFiltre =
    type === "sur_place" || type === "emporter" ? (type as TypeCommande) : undefined;

  const [commandes, stats, top] = await Promise.all([
    commandesHistorique(restaurantId, { statut: statutFiltre, type: typeFiltre, limite: 120 }),
    statsJour(restaurantId),
    topProduitsJour(restaurantId, 5),
  ]);

  const lienExport = `/api/dashboard/commandes/export${
    statutFiltre || typeFiltre
      ? `?${new URLSearchParams({
          ...(statutFiltre ? { statut: statutFiltre } : {}),
          ...(typeFiltre ? { type: typeFiltre } : {}),
        }).toString()}`
      : ""
  }`;

  const maximum = top[0]?.quantite ?? 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
            Commandes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Journal des commandes reçues par {utilisateur.restaurantNom}. Le suivi en direct se fait
            sur l&apos;écran de service.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/service"
            className={classesBouton("principal", "md")}
            target="_blank"
            rel="noreferrer"
          >
            <LayoutList className="size-4" aria-hidden />
            Ouvrir l&apos;écran de service
          </Link>
          <a href={lienExport} className={classesBouton("contour", "md")}>
            <Download className="size-4" aria-hidden />
            Exporter en CSV
          </a>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat
          libelle="Chiffre d'affaires du jour"
          valeur={formatFcfa(stats.chiffre, utilisateur.devise)}
          detail={`Panier moyen ${formatFcfa(stats.panierMoyen, utilisateur.devise)}`}
          icone={<TrendingUp className="size-5" aria-hidden />}
        />
        <CarteStat
          libelle="Commandes du jour"
          valeur={stats.commandes}
          detail={`${stats.enCours} encore en cours`}
          icone={<Receipt className="size-5" aria-hidden />}
        />
        <CarteStat
          libelle="Encaissé aujourd'hui"
          valeur={formatFcfa(stats.encaisse, utilisateur.devise)}
          detail="Paiements validés manuellement"
          icone={<Receipt className="size-5" aria-hidden />}
        />
        <CarteStat
          libelle="Commandes refusées"
          valeur={stats.annulees}
          detail="Motif visible par le client"
          icone={<Receipt className="size-5" aria-hidden />}
        />
      </div>

      {top.length > 0 ? (
        <Carte>
          <CarteEntete
            titre="Plats les plus vendus aujourd'hui"
            description="Quantités commandées depuis minuit."
            icone={<TrendingUp className="size-5" aria-hidden />}
          />
          <CarteContenu className="space-y-3">
            {top.map((plat) => (
              <div key={plat.nom} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{plat.nom}</span>
                  <span className="chiffres text-slate-500 dark:text-slate-400">
                    {plat.quantite} × · {formatFcfa(plat.montant, utilisateur.devise)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, Math.round((plat.quantite / maximum) * 100))}%`,
                      backgroundColor: utilisateur.couleurPrincipale,
                    }}
                  />
                </div>
              </div>
            ))}
          </CarteContenu>
        </Carte>
      ) : null}

      {/* ------------------------------- Filtres ------------------------------- */}
      <div className="flex flex-wrap gap-2">
        <FiltreLien
          actif={!statutFiltre}
          href={construireLien({ type: typeFiltre })}
          libelle="Tous les statuts"
        />
        {STATUTS.map((valeur) => (
          <FiltreLien
            key={valeur}
            actif={statutFiltre === valeur}
            href={construireLien({ statut: valeur, type: typeFiltre })}
            libelle={LIBELLES_STATUT[valeur]}
          />
        ))}
        <span className="mx-1 hidden w-px bg-slate-200 sm:block dark:bg-slate-800" />
        {(["sur_place", "emporter"] as const).map((valeur) => (
          <FiltreLien
            key={valeur}
            actif={typeFiltre === valeur}
            href={construireLien({ statut: statutFiltre, type: typeFiltre === valeur ? undefined : valeur })}
            libelle={LIBELLES_TYPE_COMMANDE[valeur]}
          />
        ))}
      </div>

      {commandes.length === 0 ? (
        <EtatVide
          icone={<Receipt className="size-6" aria-hidden />}
          titre="Aucune commande pour ce filtre"
          description="Dès qu'un client commande depuis son téléphone, la commande apparaît ici et sur l'écran de service."
          action={
            <Link href={`/m/${utilisateur.restaurantSlug}`} className={classesBouton("principal", "md")} target="_blank">
              <ArrowUpRight className="size-4" aria-hidden />
              Ouvrir ma carte publique
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {commandes.map((commande) => (
            <li key={commande.id}>
              <Carte className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl font-titre text-sm font-extrabold text-white"
                      style={{ backgroundColor: utilisateur.couleurPrincipale }}
                      aria-hidden
                    >
                      {commande.numero}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {commande.type === "sur_place"
                          ? `Sur place · table ${commande.tableNumero ?? "—"}`
                          : "À emporter"}
                        {commande.nomClient ? (
                          <span className="font-normal text-slate-500 dark:text-slate-400">
                            {" "}
                            — {commande.nomClient}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateHeure(commande.createdAt)}
                        {commande.heureRetrait
                          ? ` · retrait ${formatHeure(commande.heureRetrait)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      ton={
                        commande.statut === "annulee"
                          ? "danger"
                          : commande.statut === "servie"
                            ? "neutre"
                            : commande.statut === "prete"
                              ? "succes"
                              : "alerte"
                      }
                    >
                      {LIBELLES_STATUT[commande.statut]}
                    </Badge>
                    <Badge ton={commande.paiementStatut === "paye" ? "succes" : "neutre"}>
                      {LIBELLES_PAIEMENT_STATUT[commande.paiementStatut as "en_attente" | "paye"]}
                    </Badge>
                    {commande.modePaiement ? (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {LIBELLES_PAIEMENT[commande.modePaiement as ModePaiement]}
                      </span>
                    ) : null}
                  </div>
                </div>

                <CarteContenu className="flex flex-wrap items-start justify-between gap-4">
                  <ul className="min-w-52 flex-1 space-y-1 text-sm">
                    {commande.lignes.map((ligne) => (
                      <li key={ligne.id} className="text-slate-700 dark:text-slate-200">
                        <span className="chiffres font-semibold">{ligne.quantite}×</span> {ligne.nom}
                        {ligne.options.length > 0 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {" "}
                            ({ligne.options.map((option) => option.nom).join(", ")})
                          </span>
                        ) : null}
                        {ligne.note ? (
                          <span className="text-xs italic text-slate-500 dark:text-slate-400">
                            {" "}
                            — « {ligne.note} »
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="chiffres font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatFcfa(commande.total, utilisateur.devise)}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/commande/${commande.id}`}
                        target="_blank"
                        className={classesBouton("contour", "sm")}
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                        Suivi client
                      </Link>
                      {commande.telephoneClient ? (
                        <>
                          <a
                            href={lienWhatsApp(
                              `Bonjour ${commande.nomClient ?? ""}, au sujet de votre commande n° ${commande.numero}`,
                              commande.telephoneClient,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            title="Écrire sur WhatsApp"
                            className={cn(classesBouton("succes", "sm"), "px-2.5")}
                          >
                            <MessageCircle className="size-3.5" aria-hidden />
                          </a>
                          <a
                            href={lienSms(
                              `Votre commande n° ${commande.numero} chez ${utilisateur.restaurantNom}`,
                              commande.telephoneClient,
                            )}
                            title="Envoyer un SMS"
                            className={cn(classesBouton("contour", "sm"), "px-2.5")}
                          >
                            <Send className="size-3.5" aria-hidden />
                          </a>
                          <a
                            href={lienTel(commande.telephoneClient)}
                            title="Appeler le client"
                            className={cn(classesBouton("contour", "sm"), "px-2.5")}
                          >
                            <Phone className="size-3.5" aria-hidden />
                          </a>
                        </>
                      ) : null}
                    </div>
                  </div>
                </CarteContenu>
              </Carte>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        {commandes.length} commande{commandes.length > 1 ? "s" : ""} affichée
        {commandes.length > 1 ? "s" : ""} (120 au maximum) · les plus récentes en premier.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FiltreLien({
  href,
  libelle,
  actif,
}: {
  href: string;
  libelle: string;
  actif: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
        actif
          ? "border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
      )}
    >
      {libelle}
    </Link>
  );
}

function construireLien(filtres: { statut?: Statut; type?: TypeCommande }): string {
  const parametres = new URLSearchParams();
  if (filtres.statut) parametres.set("statut", filtres.statut);
  if (filtres.type) parametres.set("type", filtres.type);
  const chaine = parametres.toString();
  return chaine ? `/dashboard/commandes?${chaine}` : "/dashboard/commandes";
}
