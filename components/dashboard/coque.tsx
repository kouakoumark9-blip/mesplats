"use client";

/**
 * Coque du back-office : barre latérale sur ordinateur, tiroir sur mobile.
 *
 * La couleur principale du restaurant est injectée ici sous forme de variables
 * CSS : tous les boutons et accents de l'espace restaurateur prennent
 * automatiquement la teinte choisie dans les paramètres.
 */
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu as IconeMenu,
  QrCode,
  Receipt,
  Settings,
  Smartphone,
  Table2,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn, contrasteSur, initiales } from "@/lib/utils";

type ElementNavigation = {
  href: string;
  libelle: string;
  icone: ReactNode;
  /** Étape de construction à venir : l'entrée est affichée mais inactive. */
  aVenir?: string;
  exact?: boolean;
};

const NAVIGATION: ElementNavigation[] = [
  {
    href: "/dashboard",
    libelle: "Vue d'ensemble",
    icone: <LayoutDashboard className="size-5" aria-hidden />,
    exact: true,
  },
  { href: "/dashboard/menu", libelle: "Mon menu", icone: <UtensilsCrossed className="size-5" aria-hidden /> },
  { href: "/dashboard/tables", libelle: "Tables & QR", icone: <QrCode className="size-5" aria-hidden />, aVenir: "étape 3" },
  { href: "/dashboard/commandes", libelle: "Commandes", icone: <Receipt className="size-5" aria-hidden />, aVenir: "étape 5" },
  { href: "/dashboard/equipe", libelle: "Équipe", icone: <Wallet className="size-5" aria-hidden />, aVenir: "étape 7" },
  { href: "/dashboard/paiements", libelle: "Paiements", icone: <Smartphone className="size-5" aria-hidden />, aVenir: "étape 6" },
  {
    href: "/dashboard/parametres",
    libelle: "Paramètres",
    icone: <Settings className="size-5" aria-hidden />,
  },
];

export function Coque({
  nomRestaurant,
  slug,
  plan,
  nomUtilisateur,
  email,
  couleurPrincipale,
  nbProduits,
  limiteProduits,
  children,
}: {
  nomRestaurant: string;
  slug: string;
  plan: string;
  nomUtilisateur: string;
  email: string;
  couleurPrincipale: string;
  nbProduits: number;
  limiteProduits: number | null;
  children: ReactNode;
}) {
  const chemin = usePathname();
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  // Fermeture du tiroir mobile à chaque changement de page.
  useEffect(() => setTiroirOuvert(false), [chemin]);

  // Échap ferme le tiroir (accessibilité clavier).
  useEffect(() => {
    if (!tiroirOuvert) return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setTiroirOuvert(false);
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [tiroirOuvert]);

  const variables = {
    "--couleur-principale": couleurPrincipale,
    "--couleur-sur-principale": contrasteSur(couleurPrincipale),
  } as React.CSSProperties;

  const estActif = (element: ElementNavigation) =>
    element.exact ? chemin === element.href : chemin.startsWith(element.href);

  return (
    <div className="min-h-dvh bg-slate-50 lg:flex dark:bg-slate-950" style={variables}>
      {/* ------------------------------- En-tête mobile ------------------------------ */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setTiroirOuvert(true)}
          aria-label="Ouvrir le menu du back-office"
          className="rounded-xl border border-slate-300 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          <IconeMenu className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-titre text-sm font-extrabold text-slate-900 dark:text-white">
            {nomRestaurant}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {nbProduits} plat{nbProduits > 1 ? "s" : ""} au menu
          </p>
        </div>
        <span
          className="flex size-9 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: couleurPrincipale, color: contrasteSur(couleurPrincipale) }}
          aria-hidden
        >
          {initiales(nomRestaurant) || "AF"}
        </span>
      </header>

      {/* --------------------------------- Tiroir mobile -------------------------------- */}
      {tiroirOuvert ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            tabIndex={-1}
            aria-hidden
            onClick={() => setTiroirOuvert(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="font-titre text-base font-extrabold text-slate-900 dark:text-white">
                AfriMenu
              </p>
              <button
                type="button"
                onClick={() => setTiroirOuvert(false)}
                aria-label="Fermer le menu du back-office"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ContenuBarreLatele
              nomRestaurant={nomRestaurant}
              slug={slug}
              plan={plan}
              nomUtilisateur={nomUtilisateur}
              email={email}
              couleurPrincipale={couleurPrincipale}
              nbProduits={nbProduits}
              limiteProduits={limiteProduits}
              estActif={estActif}
            />
          </div>
        </div>
      ) : null}

      {/* ----------------------------- Barre latérale (lg) ---------------------------- */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <ContenuBarreLatele
          nomRestaurant={nomRestaurant}
          slug={slug}
          plan={plan}
          nomUtilisateur={nomUtilisateur}
          email={email}
          couleurPrincipale={couleurPrincipale}
          nbProduits={nbProduits}
          limiteProduits={limiteProduits}
          estActif={estActif}
        />
      </aside>

      {/* ---------------------------------- Contenu --------------------------------- */}
      <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
    </div>
  );
}

function ContenuBarreLatele({
  nomRestaurant,
  slug,
  plan,
  nomUtilisateur,
  email,
  couleurPrincipale,
  nbProduits,
  limiteProduits,
  estActif,
}: {
  nomRestaurant: string;
  slug: string;
  plan: string;
  nomUtilisateur: string;
  email: string;
  couleurPrincipale: string;
  nbProduits: number;
  limiteProduits: number | null;
  estActif: (element: ElementNavigation) => boolean;
}) {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 lg:h-full">
      <Link href="/dashboard" className="hidden items-center gap-2 lg:flex">
        <span
          className="flex size-9 items-center justify-center rounded-xl font-titre text-sm font-extrabold"
          style={{ backgroundColor: couleurPrincipale, color: contrasteSur(couleurPrincipale) }}
          aria-hidden
        >
          {initiales(nomRestaurant) || "AF"}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-titre text-sm font-extrabold text-slate-900 dark:text-white">
            {nomRestaurant}
          </span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            Espace restaurateur
          </span>
        </span>
      </Link>

      <nav className="space-y-1" aria-label="Navigation du back-office">
        {NAVIGATION.map((element) =>
          element.aVenir ? (
            <span
              key={element.href}
              aria-disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-600"
            >
              {element.icone}
              <span className="flex-1">{element.libelle}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {element.aVenir}
              </span>
            </span>
          ) : (
            <Link
              key={element.href}
              href={element.href}
              aria-current={estActif(element) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                estActif(element)
                  ? "fond-principal-clair texte-principal"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {element.icone}
              {element.libelle}
            </Link>
          ),
        )}
      </nav>

      <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Plan {plan === "pro" ? "Pro" : "Gratuit"}
          </span>
          {plan === "pro" ? (
            <Badge ton="succes">Illimité</Badge>
          ) : (
            <Badge ton="neutre">
              {nbProduits}/{limiteProduits ?? 20}
            </Badge>
          )}
        </div>
        {plan !== "pro" ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {limiteProduits !== null && nbProduits >= limiteProduits
              ? "Limite de plats atteinte."
              : `${(limiteProduits ?? 20) - nbProduits} plat(s) encore disponible(s).`}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Plats, tables et comptes illimités.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Link
          href={`/m/${slug}`}
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ExternalLink className="size-4" aria-hidden />
          Voir mon menu public
        </Link>
        <Link
          href="/service"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Table2 className="size-4" aria-hidden />
          Écran de service
        </Link>
        <Link
          href="/mon-compte"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <BarChart3 className="size-4" aria-hidden />
          Mon compte
        </Link>
      </div>

      <div className="mt-auto space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${couleurPrincipale} 15%, white)`,
              color: couleurPrincipale,
            }}
            aria-hidden
          >
            {initiales(nomUtilisateur) || "AF"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {nomUtilisateur}
            </span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              {email}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/connexion" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOut className="size-4" aria-hidden />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
