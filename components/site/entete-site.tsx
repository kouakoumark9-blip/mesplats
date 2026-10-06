"use client";

/**
 * En-tête du site public : barre d'annonce, navigation collante, menu mobile.
 */
import { ArrowRight, LogIn, Menu, QrCode, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { classesBouton } from "@/components/ui/bouton";
import { cn } from "@/lib/utils";

const LIENS = [
  { href: "#fonctionnement", libelle: "Comment ça marche" },
  { href: "#fonctionnalites", libelle: "Fonctionnalités" },
  { href: "#qr", libelle: "QR codes" },
  { href: "#tarifs", libelle: "Tarifs" },
  { href: "#questions", libelle: "Questions" },
];

export function EnteteSite() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Empêche le défilement de la page derrière le menu mobile ouvert
  // et permet de le refermer avec la touche Échap.
  useEffect(() => {
    document.body.style.overflow = menuOuvert ? "hidden" : "";

    if (!menuOuvert) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setMenuOuvert(false);
    };
    document.addEventListener("keydown", surTouche);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", surTouche);
    };
  }, [menuOuvert]);

  return (
    <>
      {/* Barre d'annonce — défile avec la page, ne gêne pas la navigation */}
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-medium text-slate-300 sm:text-sm">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="rounded-full bg-marque-500/20 px-2 py-0.5 text-[11px] font-bold text-marque-300 uppercase">
            Nouveau
          </span>
          Paiement Orange Money, Moov Money et MTN MoMo affiché directement au client
          <Link
            href="/m/maquis-le-baoule"
            className="inline-flex items-center gap-1 font-bold text-white underline underline-offset-4 hover:text-marque-300"
          >
            voir un menu
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </span>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link href="/" className="inline-flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-marque-500 text-white shadow-sm">
              <Utensils className="size-5" aria-hidden />
            </span>
            <span className="font-titre text-lg font-extrabold tracking-tight text-slate-900">
              AfriMenu
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LIENS.map((lien) => (
              <a
                key={lien.href}
                href={lien.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {lien.libelle}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              <LogIn className="size-4" aria-hidden />
              Connexion
            </Link>
            <Link href="/inscription" className={classesBouton("principal", "md", "shadow-sm")}>
              Créer mon restaurant
            </Link>
            <button
              type="button"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOuvert}
              className="inline-flex size-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      {/* Menu mobile plein écran */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          menuOuvert ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOuvert}
      >
        {/* Voile : ferme au clic, mais reste hors du parcours clavier
            (la croix et la touche Échap sont les commandes accessibles). */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setMenuOuvert(false)}
          className={cn(
            "absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300",
            menuOuvert ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-full max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
            menuOuvert ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <span className="inline-flex items-center gap-2 font-titre font-extrabold text-slate-900">
              <span className="flex size-8 items-center justify-center rounded-lg bg-marque-500 text-white">
                <Utensils className="size-4" aria-hidden />
              </span>
              AfriMenu
            </span>
            <button
              type="button"
              onClick={() => setMenuOuvert(false)}
              aria-label="Fermer le menu"
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {LIENS.map((lien) => (
              <a
                key={lien.href}
                href={lien.href}
                onClick={() => setMenuOuvert(false)}
                className="block rounded-xl px-4 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {lien.libelle}
              </a>
            ))}
            <Link
              href="/m/maquis-le-baoule"
              onClick={() => setMenuOuvert(false)}
              className="mt-2 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5 font-semibold text-slate-700"
            >
              <QrCode className="size-4 shrink-0 text-marque-500" aria-hidden />
              Voir un menu de démonstration
            </Link>
          </div>

          <div className="space-y-2 border-t border-slate-100 p-4 pb-safe">
            <Link
              href="/inscription"
              onClick={() => setMenuOuvert(false)}
              className={classesBouton("principal", "lg", "w-full")}
            >
              Créer mon restaurant
            </Link>
            <Link
              href="/connexion"
              onClick={() => setMenuOuvert(false)}
              className={classesBouton("contour", "lg", "w-full")}
            >
              Je me connecte
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
