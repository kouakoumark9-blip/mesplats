import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  ChefHat,
  Clock,
  MessageCircle,
  QrCode,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Utensils,
  Wifi,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { classesBouton } from "@/components/ui/bouton";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AfriMenu — Menu QR et commande en ligne pour restaurants en Afrique de l'Ouest",
  description:
    "Créez le menu QR de votre restaurant, recevez les commandes sur place et à emporter en temps réel, encaissez en Orange Money, Moov Money, MTN MoMo ou espèces. Prix en FCFA, léger en 3G.",
  alternates: { canonical: "/" },
};

const ETAPES = [
  {
    numero: "1",
    titre: "Créez votre compte",
    texte: "Nom du restaurant, vos plats, vos prix. Tout se fait depuis votre téléphone.",
    icone: <Store className="size-6" aria-hidden />,
  },
  {
    numero: "2",
    titre: "Imprimez vos QR codes",
    texte: "Une carte par table à coller sur le menu, plus un QR « À emporter » pour la vitrine.",
    icone: <QrCode className="size-6" aria-hidden />,
  },
  {
    numero: "3",
    titre: "Servez les commandes",
    texte: "Le client commande au téléphone, votre équipe reçoit tout en temps réel.",
    icone: <Bell className="size-6" aria-hidden />,
  },
];

const FONCTIONNALITES = [
  {
    icone: <QrCode className="size-5" aria-hidden />,
    titre: "Menu QR sans application",
    texte:
      "Le client scanne et consulte votre menu dans son navigateur. Aucun téléchargement, aucune inscription.",
  },
  {
    icone: <Utensils className="size-5" aria-hidden />,
    titre: "Commandes sur place et à emporter",
    texte: "Table pré-remplie automatiquement selon le QR scanné, ou retrait avec heure souhaitée.",
  },
  {
    icone: <Bell className="size-5" aria-hidden />,
    titre: "Écran de service en direct",
    texte: "Nouvelles commandes avec alerte sonore, mise à jour toutes les 4 secondes.",
  },
  {
    icone: <Banknote className="size-5" aria-hidden />,
    titre: "Mobile money intégré",
    texte:
      "Affichez votre numéro Orange Money, Moov Money ou MTN MoMo avec le montant exact à payer.",
  },
  {
    icone: <MessageCircle className="size-5" aria-hidden />,
    titre: "Suivi client par WhatsApp ou SMS",
    texte: "Prévenez le client d'un clic quand sa commande est confirmée ou prête.",
  },
  {
    icone: <BarChart3 className="size-5" aria-hidden />,
    titre: "Statistiques du jour",
    texte: "Chiffre d'affaires, nombre de commandes et plats les plus vendus, sans tableur.",
  },
  {
    icone: <ChefHat className="size-5" aria-hidden />,
    titre: "Cuisine et salle séparées",
    texte: "Comptes serveur et cuisine avec leurs propres accès, chacun voit ce qui le concerne.",
  },
  {
    icone: <Clock className="size-5" aria-hidden />,
    titre: "Produits épuisés en un clic",
    texte: "Un plat est terminé ? Masquez-le instantanément, il disparaît du menu client.",
  },
  {
    icone: <TrendingUp className="size-5" aria-hidden />,
    titre: "Pensé pour l'Afrique de l'Ouest",
    texte: "Prix en FCFA, indicatifs +225, +221, +223… interface 100 % en français.",
  },
];

const TARIFS = [
  {
    nom: "Gratuit",
    prix: "0 FCFA",
    detail: "Pour toujours",
    avantages: [
      "20 produits maximum",
      "Commandes illimitées",
      "Tables et QR codes en PNG + PDF",
      "Écran de service temps réel",
      "Paiement mobile money manuel",
    ],
    principal: false,
  },
  {
    nom: "Pro",
    prix: "9 900 FCFA",
    detail: "par mois, sans engagement",
    avantages: [
      "Produits illimités",
      "Catégories illimitées",
      "Comptes équipe illimités",
      "Statistiques avancées",
      "Support prioritaire WhatsApp",
    ],
    principal: true,
  },
];

const QUESTIONS = [
  {
    question: "Mes clients doivent-ils installer une application ?",
    reponse:
      "Non. Le client scanne le QR code avec l'appareil photo de son téléphone et le menu s'ouvre dans son navigateur. Aucune application, aucun compte, aucune donnée personnelle demandée.",
  },
  {
    question: "Comment le client paie-t-il ?",
    reponse:
      "Le client choisit Orange Money, Moov Money, MTN MoMo ou les espèces. Pour le mobile money, votre numéro et le montant exact s'affichent avec un bouton pour ouvrir l'application de paiement ou copier le numéro. Vous validez le paiement reçu en un clic depuis l'écran de service.",
  },
  {
    question: "Est-ce que ça marche avec une connexion faible ?",
    reponse:
      "Oui. L'interface est volontairement légère : elle s'affiche vite et reste utilisable en 3G ou en 4G instable. Le menu client est mis en cache sur le téléphone.",
  },
  {
    question: "Puis-je utiliser le système sans QR code ?",
    reponse:
      "Oui. Vous pouvez partager un simple lien sur WhatsApp, Instagram ou Facebook pour les commandes à emporter.",
  },
];

export default function PageAccueil() {
  return (
    <div className="min-h-dvh bg-white">
      {/* --------------------------------- Navbar -------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-slate-900">
            <span className="flex size-9 items-center justify-center rounded-xl bg-marque-500 text-white">
              <Utensils className="size-5" aria-hidden />
            </span>
            <span className="font-titre text-lg">AfriMenu</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#fonctionnalites" className="transition hover:text-slate-900">
              Fonctionnalités
            </a>
            <a href="#fonctionnement" className="transition hover:text-slate-900">
              Comment ça marche
            </a>
            <a href="#tarifs" className="transition hover:text-slate-900">
              Tarifs
            </a>
            <Link href="/m/maquis-le-baoule" className="transition hover:text-slate-900">
              Menu démo
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/connexion" className={classesBouton("fantome", "md", "hidden sm:inline-flex")}>
              Connexion
            </Link>
            <Link href="/inscription" className={classesBouton("principal", "md")}>
              Créer mon restaurant
            </Link>
          </div>
        </nav>
      </header>

      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-40 top-0 size-[28rem] rounded-full bg-marque-100/70 blur-3xl" />
        <div className="absolute -left-32 top-40 size-80 rounded-full bg-feuille-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge ton="marque" icone={<Sparkles className="size-3.5" aria-hidden />}>
              Nouveau en Côte d&apos;Ivoire
            </Badge>

            <h1 className="mt-5 font-titre text-3xl leading-[1.1] font-extrabold text-slate-900 sm:text-5xl">
              Votre menu en QR code,
              <br />
              <span className="text-marque-600">vos commandes en temps réel.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Les clients scannent, consultent votre menu en FCFA et commandent depuis leur téléphone —
              sur place à leur table ou à emporter. Vous recevez tout sur un écran, sans papier ni
              application à installer.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className={classesBouton("principal", "xl", "sm:w-auto")}>
                Créer mon menu gratuitement
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/m/maquis-le-baoule" className={classesBouton("contour", "xl", "sm:w-auto")}>
                Voir un menu de démonstration
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              <li className="inline-flex items-center gap-2">
                <BadgeCheck className="size-4 text-feuille-600" aria-hidden />
                Sans carte bancaire
              </li>
              <li className="inline-flex items-center gap-2">
                <Smartphone className="size-4 text-feuille-600" aria-hidden />
                Aucune appli à installer
              </li>
              <li className="inline-flex items-center gap-2">
                <Wifi className="size-4 text-feuille-600" aria-hidden />
                Rapide en 3G
              </li>
            </ul>
          </div>

          <MaquetteTelephone />
        </div>
      </section>

      {/* ------------------------------- Bienfaits ------------------------------- */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { valeur: "2 min", libelle: "pour publier votre menu" },
            { valeur: "4 s", libelle: "entre la commande et l'écran" },
            { valeur: "0 %", libelle: "de commission sur vos ventes" },
            { valeur: "100 %", libelle: "en français, prix en FCFA" },
          ].map((element) => (
            <div key={element.libelle} className="text-center sm:text-left">
              <p className="font-titre text-3xl font-extrabold text-marque-600">{element.valeur}</p>
              <p className="mt-1 text-sm text-slate-600">{element.libelle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ Fonctionnement --------------------------- */}
      <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-titre text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Trois étapes, et votre salle commande au téléphone
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Pas de matériel coûteux, pas d&apos;installation technique. Un téléphone ou une tablette
            suffit.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {ETAPES.map((etape) => (
            <Carte key={etape.numero} className="relative p-6">
              <span className="absolute right-5 top-5 font-titre text-5xl font-extrabold text-slate-100">
                {etape.numero}
              </span>
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-marque-50 text-marque-600">
                {etape.icone}
              </span>
              <h3 className="relative mt-4 font-titre text-lg font-bold text-slate-900">{etape.titre}</h3>
              <p className="relative mt-2 text-slate-600">{etape.texte}</p>
            </Carte>
          ))}
        </div>
      </section>

      {/* ------------------------------ Fonctionnalités -------------------------- */}
      <section id="fonctionnalites" className="bg-slate-900 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-titre text-3xl font-extrabold text-white sm:text-4xl">
              Tout ce qu&apos;il faut pour servir plus vite
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Conçu avec des restaurateurs ivoiriens : lecture au soleil, grosses cibles tactiles,
              fonctionnement sur téléphone d&apos;entrée de gamme.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONNALITES.map((element) => (
              <div
                key={element.titre}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-marque-400/40 hover:bg-white/10"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-marque-500/20 text-marque-300">
                  {element.icone}
                </span>
                <h3 className="mt-4 font-titre font-bold text-white">{element.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{element.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- Tarifs -------------------------------- */}
      <section id="tarifs" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-titre text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Des tarifs simples, en francs CFA
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Commencez gratuitement. Passez au plan Pro le jour où votre carte devient trop longue.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {TARIFS.map((offre) => (
            <Carte
              key={offre.nom}
              className={cn(
                "relative flex flex-col p-6",
                offre.principal && "border-marque-300 ring-2 ring-marque-500/20",
              )}
            >
              {offre.principal ? (
                <Badge ton="marque" className="absolute -top-3 left-6">
                  Le plus choisi
                </Badge>
              ) : null}
              <h3 className="font-titre text-xl font-extrabold text-slate-900">{offre.nom}</h3>
              <p className="mt-3 font-titre text-3xl font-extrabold text-slate-900">{offre.prix}</p>
              <p className="text-sm text-slate-500">{offre.detail}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {offre.avantages.map((avantage) => (
                  <li key={avantage} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
                    {avantage}
                  </li>
                ))}
              </ul>

              <Link
                href="/inscription"
                className={classesBouton(offre.principal ? "principal" : "contour", "lg", "mt-6 w-full")}
              >
                {offre.principal ? "Passer au plan Pro" : "Commencer gratuitement"}
              </Link>
            </Carte>
          ))}
        </div>
      </section>

      {/* ---------------------------------- FAQ ---------------------------------- */}
      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-titre text-3xl font-extrabold text-slate-900">
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {QUESTIONS.map((element) => (
              <details
                key={element.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-titre font-bold text-slate-900 marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {element.question}
                    <span className="text-marque-500 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-slate-600">{element.reponse}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- Appel final ----------------------------- */}
      <section className="bg-marque-600 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-titre text-3xl font-extrabold sm:text-4xl">
            Votre premier QR code est à 2 minutes d&apos;ici
          </h2>
          <p className="mt-4 text-lg text-marque-50">
            Créez votre compte, ajoutez vos plats, imprimez vos cartes de table. Gratuit, sans
            engagement.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-lg font-bold text-marque-700 shadow-sm transition hover:bg-marque-50"
            >
              Créer mon restaurant
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link
              href="/connexion"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/40 px-6 text-lg font-bold text-white transition hover:bg-white/10"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------- Footer -------------------------------- */}
      <footer className="bg-slate-900 py-10 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 font-extrabold text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-marque-500">
                <Utensils className="size-4" aria-hidden />
              </span>
              AfriMenu
            </span>
            <p className="mt-2 text-sm">
              Menu QR et commande pour les restaurants d&apos;Afrique de l&apos;Ouest.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/inscription" className="transition hover:text-white">
              Créer un compte
            </Link>
            <Link href="/connexion" className="transition hover:text-white">
              Connexion
            </Link>
            <Link href="/m/maquis-le-baoule" className="transition hover:text-white">
              Menu démo
            </Link>
            <a href="mailto:support@afrimenu.app" className="transition hover:text-white">
              support@afrimenu.app
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 px-4 pt-6 text-xs sm:px-6">
          © {new Date().getFullYear()} AfriMenu — Abidjan, Côte d&apos;Ivoire. Prix affichés en FCFA.
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*           Maquette de téléphone affichée dans la section héro              */
/* -------------------------------------------------------------------------- */

function MaquetteTelephone() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 -z-10 translate-y-6 rounded-[2.5rem] bg-marque-200/50 blur-2xl" />
      <div className="rounded-[2.25rem] border-8 border-slate-900 bg-slate-900 p-0.5 shadow-2xl">
        <div className="overflow-hidden rounded-[1.8rem] bg-white">
          {/* En-tête du menu */}
          <div className="degrade-principal px-4 pb-5 pt-6 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Table 4 · Sur place
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                Maquis Le Baoulé
              </span>
            </div>
            <p className="mt-3 font-titre text-xl font-extrabold">Que voulez-vous manger ?</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-slate-500">
              <span className="text-sm">Rechercher un plat…</span>
            </div>
          </div>

          {/* Catégories */}
          <div className="flex gap-2 overflow-hidden px-4 py-3">
            {["Plats ivoiriens", "Grillades", "Boissons"].map((categorie, index) => (
              <span
                key={categorie}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold",
                  index === 0 ? "bg-marque-500 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {categorie}
              </span>
            ))}
          </div>

          {/* Produits */}
          <div className="space-y-2.5 px-4 pb-4">
            {[
              { nom: "Attiéké poisson braisé", prix: "2 500 FCFA", emoji: "🐟" },
              { nom: "Kedjenou de poulet", prix: "3 000 FCFA", emoji: "🍗" },
              { nom: "Alloco", prix: "500 FCFA", emoji: "🍌" },
            ].map((produit) => (
              <div
                key={produit.nom}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                  {produit.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{produit.nom}</p>
                  <p className="text-sm font-bold text-marque-600">{produit.prix}</p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-xl bg-marque-500 text-lg font-bold text-white">
                  +
                </span>
              </div>
            ))}
          </div>

          {/* Panier */}
          <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-sm font-bold">3 articles · 6 000 FCFA</span>
            <span className="rounded-xl bg-marque-500 px-3 py-1.5 text-xs font-bold">
              Commander
            </span>
          </div>
        </div>
      </div>

      {/* Notification flottante : nouvelle commande côté serveur */}
      <div className="absolute -bottom-4 -left-4 hidden w-60 animate-apparition rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:block dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-feuille-100 text-feuille-700">
            <Bell className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">Nouvelle commande · Table 4</p>
            <p className="text-xs text-slate-500">3 articles · 6 000 FCFA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
