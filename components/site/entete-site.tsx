"use client";

/**
 * En-tête du site public : bandeau d'annonce, navigation centrale,
 * bouton d'action « pilule » et menu mobile plein écran.
 */
import { ArrowRight, LogIn, Menu, QrCode, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BoutonPilule } from "@/components/site/bouton-pilule";
import { LogoAfriMenu } from "@/components/site/logo";
import { classesBouton } from "@/components/ui/bouton";
import { cn } from "@/lib/utils";

const LIENS = [
  { href: "#etapes", libelle: "Étapes" },
  { href: "#qr", libelle: "QR codes" },
  { href: "#tarifs", libelle: "Tarifs" },
  { href: "#questions", libelle: "Questions" },
];

export function EnteteSite() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Bloque le défilement derrière le menu mobile et permet de le fermer avec Échap.
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
      {/* Bandeau d'annonce */}
      <div className="bg-gradient-to-r from-marque-600 via-marque-500 to-slate-900 px-4 py-2.5 text-center text-xs font-medium text-white sm:text-sm">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          Créez votre menu cette semaine et recevez vos cartes QR de table imprimées
          <a
            href="#qr"
            className="inline-flex items-center gap-1 font-bold text-white underline underline-offset-4 hover:text-marque-100"
          >
            En savoir plus
            <ArrowRight className="size-3.5" aria-hidden />
          </a>
        </span>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-lg">
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link href="/" aria-label="AfriMenu — accueil">
            <LogoAfriMenu />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LIENS.map((lien) => (
              <a
                key={lien.href}
                href={lien.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {lien.libelle}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <LogIn className="size-4" aria-hidden />
              Connexion
            </Link>
            <BoutonPilule href="/inscription" className="hidden sm:inline-flex">
              Créer mon menu
            </BoutonPilule>
            <button
              type="button"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOuvert}
              className="inline-flex size-11 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      {/* Menu mobile */}
      <div
        className={cn("fixed inset-0 z-[60] lg:hidden", menuOuvert ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!menuOuvert}
      >
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
            <LogoAfriMenu />
            <button
              type="button"
              onClick={() => setMenuOuvert(false)}
              aria-label="Fermer le menu"
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
              Créer mon menu
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
