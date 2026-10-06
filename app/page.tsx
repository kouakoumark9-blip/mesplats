import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  Flame,
  Globe,
  HandPlatter,
  LayoutDashboard,
  MessageCircle,
  Percent,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Utensils,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EnteteSite } from "@/components/site/entete-site";
import {
  CarteQrTable,
  MaquetteEcranService,
  MaquettePaiement,
  MaquetteTelephone,
} from "@/components/site/maquettes";
import { PiedDePage } from "@/components/site/pied-de-page";
import { QrCodeInline } from "@/components/site/qr-code";
import { Reveler } from "@/components/site/reveler";
import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { appUrl, urlMenu } from "@/lib/env";
import { qrSvg } from "@/lib/qr";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AfriMenu — Menu QR et commande en ligne pour restaurants en Afrique de l'Ouest",
  description:
    "Créez le menu QR de votre restaurant, recevez les commandes sur place et à emporter en temps réel, encaissez en Orange Money, Moov Money, MTN MoMo ou espèces. Prix en FCFA, rapide en 3G, sans commission.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AfriMenu — Menu QR et commande en ligne pour restaurants",
    description:
      "Menu QR sans application, commandes en temps réel, écran de service pour la salle et la cuisine. Pensé pour la Côte d'Ivoire et l'Afrique de l'Ouest.",
    type: "website",
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Contenus                                  */
/* -------------------------------------------------------------------------- */

const ETAPES = [
  {
    numero: "1",
    titre: "Créez votre compte",
    duree: "2 minutes",
    texte:
      "Le nom de votre restaurant, vos plats, vos prix. Tout se fait depuis un téléphone, sans formation.",
    icone: <Store className="size-6" aria-hidden />,
  },
  {
    numero: "2",
    titre: "Imprimez vos QR codes",
    duree: "1 clic",
    texte:
      "Une carte par table, prête à imprimer, plus un QR « À emporter » pour la devanture ou votre statut WhatsApp.",
    icone: <QrCode className="size-6" aria-hidden />,
  },
  {
    numero: "3",
    titre: "Servez les commandes",
    duree: "temps réel",
    texte:
      "Le client commande depuis son téléphone. Votre salle et votre cuisine reçoivent tout, avec alerte sonore.",
    icone: <Bell className="size-6" aria-hidden />,
  },
];

const SANS_AFRIMENU = [
  "Des menus imprimés à refaire à chaque changement de prix",
  "Les commandes criées entre la salle et la cuisine",
  "Des plats oubliés ou inversés pendant le coup de feu",
  "Le client attend qu'un serveur vienne prendre sa commande",
  "Aucune idée précise de la recette de la journée",
];

const AVEC_AFRIMENU = [
  "Un menu à jour en 30 secondes, sur tous les téléphones",
  "Chaque commande arrive écrite sur l'écran de service",
  "Les notes du client (« sans piment ») transmises telles quelles",
  "Le client commande dès qu'il est prêt, sans attendre",
  "Recettes, plats les plus vendus et commandes du jour en direct",
];

const FONCTIONNALITES = [
  {
    icone: <QrCode className="size-5" aria-hidden />,
    titre: "Menu QR sans application",
    texte:
      "Le client scanne et consulte votre menu dans son navigateur. Aucun téléchargement, aucune inscription, aucune donnée personnelle demandée.",
  },
  {
    icone: <HandPlatter className="size-5" aria-hidden />,
    titre: "Sur place ou à emporter",
    texte:
      "Table pré-remplie automatiquement selon le QR scanné, ou commande à retirer avec l'heure souhaitée.",
  },
  {
    icone: <Bell className="size-5" aria-hidden />,
    titre: "Écran de service en direct",
    texte:
      "Nouvelles commandes avec alerte sonore, mise à jour toutes les 4 secondes, filtres par statut et par type.",
  },
  {
    icone: <Wallet className="size-5" aria-hidden />,
    titre: "Paiement mobile money",
    texte:
      "Votre numéro Orange Money, Moov Money ou MTN MoMo s'affiche au client avec le montant exact et un bouton pour copier ou ouvrir l'application.",
  },
  {
    icone: <MessageCircle className="size-5" aria-hidden />,
    titre: "Prévenir le client",
    texte:
      "Un bouton ouvre WhatsApp ou les SMS avec un message déjà rédigé : commande acceptée, prête à retirer.",
  },
  {
    icone: <BarChart3 className="size-5" aria-hidden />,
    titre: "Statistiques du jour",
    texte:
      "Chiffre d'affaires, nombre de commandes, plats les plus vendus. Sans tableur ni calcul le soir.",
  },
  {
    icone: <ChefHat className="size-5" aria-hidden />,
    titre: "Salle et cuisine séparées",
    texte:
      "Comptes serveur et cuisine avec leurs propres accès : chacun voit uniquement ce qui le concerne.",
  },
  {
    icone: <Flame className="size-5" aria-hidden />,
    titre: "Plat épuisé en un clic",
    texte:
      "Un produit est terminé ? Un interrupteur le retire instantanément du menu client, sans le supprimer.",
  },
  {
    icone: <Globe className="size-5" aria-hidden />,
    titre: "Pensé pour l'Afrique de l'Ouest",
    texte:
      "Interface entièrement en français, prix en FCFA, indicatifs +225, +221, +223, +233… et connexion adaptée à la 3G.",
  },
];

const SCENARIOS = [
  {
    badge: "Maquis · 20 tables · Cocody",
    icone: <Utensils className="size-5" aria-hidden />,
    titre: "Le coup de feu du midi",
    texte:
      "Entre 12h et 14h, la salle se remplit d'un coup. Avec le QR de table, les clients commandent dès qu'ils sont installés : les serveurs portent les plats au lieu de prendre les commandes, et plus aucune table n'est oubliée pendant l'affluence.",
    chiffres: [
      { valeur: "40", libelle: "commandes sur 2 heures" },
      { valeur: "2", libelle: "serveurs suffisent" },
    ],
  },
  {
    badge: "Restaurant de quartier · Yopougon",
    icone: <Truck className="size-5" aria-hidden />,
    titre: "Les commandes à emporter",
    texte:
      "Un lien partagé sur WhatsApp, Facebook ou la bio Instagram : les clients annoncent l'heure de retrait, la cuisine prépare au bon moment et prévient par message quand c'est prêt. Plus de file d'attente devant le comptoir.",
    chiffres: [
      { valeur: "0", libelle: "appel téléphonique à décrocher" },
      { valeur: "13h00", libelle: "heure de retrait choisie par le client" },
    ],
  },
  {
    badge: "Bar-restaurant · Marcory",
    icone: <ChefHat className="size-5" aria-hidden />,
    titre: "Le service du soir",
    texte:
      "La cuisine voit les plats arriver au fil de l'eau, le serveur confirme d'un clic et le client suit l'avancement depuis son téléphone. Les boissons partent tout de suite, les grillades suivent leur rythme.",
    chiffres: [
      { valeur: "4 s", libelle: "entre la commande et l'écran" },
      { valeur: "100 %", libelle: "des commandes tracées" },
    ],
  },
];

const QUESTIONS = [
  {
    question: "Mes clients doivent-ils installer une application ?",
    reponse:
      "Non, jamais. Le client scanne le QR code avec l'appareil photo de son téléphone et votre menu s'ouvre dans son navigateur. Aucune application, aucun compte à créer, aucune donnée personnelle demandée en dehors d'un prénom et d'un numéro de téléphone pour la commande.",
  },
  {
    question: "Comment le client paie-t-il ?",
    reponse:
      "Il choisit Orange Money, Moov Money, MTN MoMo ou les espèces. Pour le mobile money, votre numéro s'affiche avec le montant exact et un bouton pour ouvrir l'application de paiement ou copier le numéro. Dès que vous recevez l'argent, vous validez la commande d'un clic depuis l'écran de service.",
  },
  {
    question: "Est-ce que ça fonctionne avec une connexion faible ?",
    reponse:
      "Oui, c'est une contrainte de conception. L'interface est volontairement légère (l'équivalent de quelques photos) : le menu s'affiche vite même en 3G, et une fois consulté il reste utilisable un moment même si le réseau se coupe. Le menu de votre restaurant s'ouvre en moins d'une seconde.",
  },
  {
    question: "Puis-je utiliser AfriMenu sans QR code ?",
    reponse:
      "Oui. Beaucoup de restaurants commencent par les commandes à emporter avec un simple lien partagé sur WhatsApp, Facebook ou Instagram. Les QR codes de table s'ajoutent quand vous le souhaitez, sans rien reconfigurer.",
  },
  {
    question: "Y a-t-il une commission sur mes ventes ?",
    reponse:
      "Aucune. AfriMenu est un abonnement, pas un intermédiaire : vous encaissez directement le client, en mobile money ou en espèces, et la totalité de la somme reste sur votre compte. Le plan gratuit ne prend lui non plus aucune commission.",
  },
  {
    question: "Ai-je besoin de matériel particulier ?",
    reponse:
      "Un téléphone suffit pour commencer. Une tablette ou un ordinateur d'occasion rend l'écran de service plus confortable en cuisine ou au comptoir. Il n'y a rien à installer : tout passe par le navigateur.",
  },
];

const AVANTAGES_GRATUIT = [
  "20 produits maximum",
  "Commandes illimitées",
  "Tables et QR codes (PNG + PDF)",
  "Écran de service temps réel",
  "Paiement mobile money",
  "Support par email",
];

const AVANTAGES_PRO = [
  "Produits illimités",
  "Catégories illimitées",
  "Comptes équipe illimités",
  "Statistiques avancées",
  "Support prioritaire WhatsApp",
  "Sauvegardes et export des commandes",
];

const TABLEAU_COMPARATIF: { libelle: string; gratuit: string | boolean; pro: string | boolean }[] = [
  { libelle: "Produits au menu", gratuit: "20 maximum", pro: "Illimité" },
  { libelle: "Commandes par mois", gratuit: "Illimitées", pro: "Illimitées" },
  { libelle: "Commandes sur place et à emporter", gratuit: true, pro: true },
  { libelle: "QR codes de table (PNG + planche PDF)", gratuit: true, pro: true },
  { libelle: "Écran de service temps réel", gratuit: true, pro: true },
  { libelle: "Orange Money, Moov Money, MTN MoMo, espèces", gratuit: true, pro: true },
  { libelle: "Comptes serveur et cuisine", gratuit: "1 compte", pro: "Illimités" },
  { libelle: "Statistiques et plats les plus vendus", gratuit: "Du jour", pro: "Avancées" },
  { libelle: "Support", gratuit: "Email", pro: "WhatsApp prioritaire" },
  { libelle: "Commission sur les ventes", gratuit: "0 %", pro: "0 %" },
];

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default async function PageAccueil() {
  const base = appUrl();

  /*
   * Vrais QR codes, générés au rendu et affichés en SVG : aucune image
   * externe à télécharger, poids minimal et netteté parfaite à l'impression.
   */
  const [svgTable, svgEmporter] = await Promise.all([
    qrSvg(urlMenu({ slug: "maquis-le-baoule" }, "4"), { marge: 2 }),
    qrSvg(urlMenu({ slug: "maquis-le-baoule" }), { marge: 2 }),
  ]);

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AfriMenu",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web (navigateur), Android, iOS",
    description:
      "Menu QR et prise de commande pour les restaurants de Côte d'Ivoire et d'Afrique de l'Ouest : commandes sur place et à emporter en temps réel, paiement Orange Money, Moov Money, MTN MoMo ou espèces.",
    inLanguage: "fr",
    areaServed: "Afrique de l'Ouest",
    offers: [
      {
        "@type": "Offer",
        name: "Gratuit",
        price: "0",
        priceCurrency: "XOF",
        description: "Jusqu'à 20 produits, commandes illimitées, QR codes de table.",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "9900",
        priceCurrency: "XOF",
        description: "Produits illimités, comptes équipe illimités, statistiques avancées.",
      },
    ],
  };

  return (
    <div className="min-h-dvh bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />

      <EnteteSite />

      {/* ================================ HÉRO ================================ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-32 size-[32rem] rounded-full bg-marque-100/70 blur-3xl" />
        <div className="pointer-events-none absolute top-52 -left-40 size-[26rem] rounded-full bg-feuille-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
          <div>
            <Badge ton="marque" icone={<Sparkles className="size-3.5" aria-hidden />}>
              Conçu à Abidjan pour les restaurants d&apos;Afrique de l&apos;Ouest
            </Badge>

            <h1 className="mt-5 font-titre text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-[3.4rem]">
              Votre menu en QR code,
              <br />
              <span className="text-marque-600">vos commandes en temps réel.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Vos clients scannent, consultent le menu en FCFA et commandent depuis leur téléphone —
              à leur table ou à emporter. Vous recevez chaque commande sur un écran, avec alerte
              sonore. <strong className="font-semibold text-slate-800">Sans application à
              installer, sans commission sur vos ventes.</strong>
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className={classesBouton("principal", "xl", "sm:w-auto")}>
                Créer mon menu gratuitement
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/m/maquis-le-baoule" className={classesBouton("contour", "xl", "sm:w-auto")}>
                <ScanLine className="size-5" aria-hidden />
                Voir un menu de démonstration
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              {[
                { icone: <BadgeCheck className="size-4" aria-hidden />, texte: "Sans carte bancaire" },
                { icone: <Smartphone className="size-4" aria-hidden />, texte: "Aucune appli à installer" },
                { icone: <Wifi className="size-4" aria-hidden />, texte: "Rapide même en 3G" },
                { icone: <Percent className="size-4" aria-hidden />, texte: "0 % de commission" },
              ].map((element) => (
                <li key={element.texte} className="inline-flex items-center gap-2">
                  <span className="text-feuille-600">{element.icone}</span>
                  {element.texte}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="flex -space-x-2">
                  {["MB", "TF", "AM"].map((initiales) => (
                    <span
                      key={initiales}
                      className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600"
                    >
                      {initiales}
                    </span>
                  ))}
                </span>
                Déjà utilisé par des maquis, bars et restaurants de quartier
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-feuille-600" aria-hidden />
                Données isolées par restaurant
              </span>
            </div>
          </div>

          {/*
            Composition visuelle : le téléphone du client à côté de la
            notification reçue par le restaurant et de la carte de table.
            Les trois blocs sont placés côte à côte plutôt qu'en superposition :
            aucune information n'est masquée, sur tous les écrans.
          */}
          <div className="relative mx-auto w-full max-w-[30rem]">
            <div className="pointer-events-none absolute inset-x-6 top-16 -z-10 h-80 rounded-[3rem] bg-marque-200/40 blur-3xl" />

            <div className="relative rounded-[2.5rem] border border-slate-200/80 bg-gradient-to-b from-marque-50 via-white to-marque-50/50 p-4 shadow-xl shadow-marque-900/5 sm:p-6">
              <MaquetteTelephone className="mx-auto max-w-[16.5rem] animate-flotte" />

              <div className="mt-5 grid grid-cols-2 gap-3">
                {/* Notification reçue par le restaurant */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-feuille-100 text-feuille-700">
                    <Bell className="size-4" aria-hidden />
                  </span>
                  <p className="mt-2.5 text-[11px] font-bold text-slate-900">
                    Nouvelle commande
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    Table 4 · 6 000 FCFA
                    <br />
                    Orange Money
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    <span className="size-1.5 animate-clignote rounded-full bg-amber-500" aria-hidden />
                    À accepter
                  </span>
                </div>

                {/* Carte de table imprimée */}
                <div className="-rotate-1 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                    Table 4
                  </p>
                  <QrCodeInline
                    svg={svgTable}
                    taille={92}
                    label="QR code de la table 4 du Maquis Le Baoulé"
                    className="mx-auto mt-1.5"
                  />
                  <p className="mt-1.5 text-[10px] leading-snug font-semibold text-slate-500">
                    Le client scanne
                    <br />
                    et commande
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ BANDEAU CHIFFRES ========================= */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl divide-slate-200 px-4 py-9 sm:grid-cols-2 sm:divide-x sm:px-6 lg:grid-cols-4">
          {[
            { valeur: "2 min", libelle: "pour publier votre menu", icone: <Clock className="size-4" aria-hidden /> },
            { valeur: "4 s", libelle: "entre la commande et l'écran", icone: <TrendingUp className="size-4" aria-hidden /> },
            { valeur: "0 %", libelle: "de commission sur vos ventes", icone: <Percent className="size-4" aria-hidden /> },
            { valeur: "100 %", libelle: "en français, prix en FCFA", icone: <Globe className="size-4" aria-hidden /> },
          ].map((element, index) => (
            <Reveler key={element.libelle} delai={index * 80} className="px-2 py-3 text-center sm:px-6 sm:text-left">
              <p className="inline-flex items-center gap-2 font-titre text-3xl font-extrabold text-slate-900">
                <span className="text-marque-500">{element.icone}</span>
                {element.valeur}
              </p>
              <p className="mt-1.5 text-sm text-slate-600">{element.libelle}</p>
            </Reveler>
          ))}
        </div>
      </section>

      {/* ========================= PROBLÈME / SOLUTION ========================= */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveler className="mx-auto max-w-3xl text-center">
          <Badge ton="neutre">Pourquoi changer</Badge>
          <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
            Le service se joue en quelques minutes
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Un menu papier ne suit pas vos prix, un carnet s&apos;égare et la cuisine ne sait jamais
            où en est la salle. Voici la différence, concrètement.
          </p>
        </Reveler>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveler>
            <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                  <X className="size-5" aria-hidden />
                </span>
                <h3 className="font-titre text-lg font-bold text-slate-700">
                  Le service sans AfriMenu
                </h3>
              </div>
              <ul className="mt-5 space-y-3.5">
                {SANS_AFRIMENU.map((element) => (
                  <li key={element} className="flex items-start gap-3 text-slate-600">
                    <X className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                    {element}
                  </li>
                ))}
              </ul>
            </div>
          </Reveler>

          <Reveler delai={100}>
            <div className="relative h-full overflow-hidden rounded-3xl border-2 border-marque-200 bg-marque-50/50 p-6 shadow-sm sm:p-7">
              <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-marque-200/40 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="fond-principal flex size-10 items-center justify-center rounded-2xl">
                  <Utensils className="size-5" aria-hidden />
                </span>
                <h3 className="font-titre text-lg font-bold text-slate-900">
                  Le service avec AfriMenu
                </h3>
              </div>
              <ul className="relative mt-5 space-y-3.5">
                {AVEC_AFRIMENU.map((element) => (
                  <li key={element} className="flex items-start gap-3 font-medium text-slate-800">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
                    {element}
                  </li>
                ))}
              </ul>
            </div>
          </Reveler>
        </div>
      </section>

      {/* ========================== COMMENT ÇA MARCHE ========================== */}
      <section id="fonctionnement" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveler className="mx-auto max-w-2xl text-center">
            <Badge ton="marque">Comment ça marche</Badge>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
              Trois étapes, et votre salle commande au téléphone
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Pas de matériel coûteux, rien à installer, aucune compétence technique.
            </p>
          </Reveler>

          <div className="relative mt-14">
            {/* Trait de liaison entre les étapes (desktop) */}
            <div
              className="absolute top-12 right-[12%] left-[12%] hidden h-0.5 bg-gradient-to-r from-marque-200 via-marque-300 to-marque-200 lg:block"
              aria-hidden
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {ETAPES.map((etape, index) => (
                <Reveler key={etape.numero} delai={index * 120}>
                  <Carte className="relative h-full p-6">
                    <div className="flex items-center justify-between">
                      <span className="fond-principal relative z-10 flex size-12 items-center justify-center rounded-2xl shadow-sm">
                        {etape.icone}
                      </span>
                      <span className="font-titre text-5xl font-extrabold text-slate-100">
                        {etape.numero}
                      </span>
                    </div>
                    <h3 className="mt-5 font-titre text-lg font-bold text-slate-900">
                      {etape.titre}
                    </h3>
                    <p className="mt-2 leading-relaxed text-slate-600">{etape.texte}</p>
                    <Badge ton="succes" className="mt-4">
                      {etape.duree}
                    </Badge>
                  </Carte>
                </Reveler>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== QR CODES ============================== */}
      <section id="qr" className="scroll-mt-24 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveler>
              <Badge ton="marque" icone={<QrCode className="size-3.5" aria-hidden />}>
                QR codes
              </Badge>
              <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
                Un QR code pour chaque table, un pour la devanture
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Chaque table possède son propre QR code : le client arrive directement sur votre menu,
                avec le numéro de table déjà rempli. Le bon plat part à la bonne place, sans question.
              </p>

              <ul className="mt-7 space-y-4">
                {[
                  {
                    icone: <Building2 className="size-5" aria-hidden />,
                    titre: "Une carte imprimable par table",
                    texte:
                      "Prête à poser sur la table ou à coller au mur. Format PNG pour vos impressions, planche PDF A4 pour tout sortir d'un coup.",
                  },
                  {
                    icone: <Truck className="size-5" aria-hidden />,
                    titre: "Un QR « À emporter »",
                    texte:
                      "À coller sur la vitrine, le comptoir ou votre statut WhatsApp : le client choisit son heure de retrait.",
                  },
                  {
                    icone: <ShieldCheck className="size-5" aria-hidden />,
                    titre: "Aucune donnée sensible dans le lien",
                    texte:
                      "Le QR contient uniquement l'adresse de votre menu. Les commandes et les coordonnées des clients restent dans votre back-office.",
                  },
                ].map((element) => (
                  <li key={element.titre} className="flex gap-4">
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-marque-50 text-marque-600">
                      {element.icone}
                    </span>
                    <div>
                      <p className="font-titre font-bold text-slate-900">{element.titre}</p>
                      <p className="mt-0.5 text-slate-600">{element.texte}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/inscription" className={classesBouton("principal", "lg")}>
                  Générer mes QR codes
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href="/m/maquis-le-baoule/t/2" className={classesBouton("contour", "lg")}>
                  Essayer le menu de la table 2
                </Link>
              </div>
            </Reveler>

            {/* Carte imprimée + QR « à emporter » */}
            <Reveler delai={120}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-6 top-10 -z-10 h-72 rounded-[3rem] bg-marque-100/70 blur-3xl" />

                <div className="mx-auto max-w-sm">
                  <CarteQrTable qrSvg={svgTable} url={`${base}/m/maquis-le-baoule/t/4`} />
                </div>

                <div className="mx-auto -mt-6 max-w-xs sm:absolute sm:-right-2 sm:bottom-0 sm:mx-0 sm:mt-0 sm:w-52 lg:-right-6">
                  <div className="rotate-[-3deg] rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-xl">
                    <p className="text-[11px] font-extrabold tracking-wide text-marque-600 uppercase">
                      À emporter
                    </p>
                    <QrCodeInline
                      svg={svgEmporter}
                      taille={120}
                      label="QR code pour les commandes à emporter"
                      className="mx-auto mt-2"
                    />
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      Scannez pour commander
                      <br />
                      avant d&apos;arriver
                    </p>
                  </div>
                </div>
              </div>
            </Reveler>
          </div>
        </div>
      </section>

      {/* ============================ FONCTIONNALITÉS ========================== */}
      <section id="fonctionnalites" className="scroll-mt-24 bg-slate-900 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveler className="mx-auto max-w-2xl text-center">
            <Badge ton="marque" className="bg-marque-500/15 text-marque-300">
              Fonctionnalités
            </Badge>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl">
              Tout ce qu&apos;il faut pour servir plus vite
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Conçu avec des restaurateurs ivoiriens : lecture au soleil, grosses cibles tactiles,
              fonctionnement sur téléphone d&apos;entrée de gamme.
            </p>
          </Reveler>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONNALITES.map((element, index) => (
              <Reveler key={element.titre} delai={(index % 3) * 90}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-marque-400/40 hover:bg-white/[0.08]">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-marque-500/20 text-marque-300">
                    {element.icone}
                  </span>
                  <h3 className="mt-4 font-titre font-bold text-white">{element.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{element.texte}</p>
                </div>
              </Reveler>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== ÉCRAN DE SERVICE ========================== */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
            <Reveler>
              <Badge ton="marque" icone={<ChefHat className="size-3.5" aria-hidden />}>
                Écran de service
              </Badge>
              <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
                La salle et la cuisine voient la même commande
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Chaque nouvelle commande apparaît en haut de l&apos;écran avec une alerte sonore.
                Un clic pour accepter, un clic quand c&apos;est prêt, un clic quand c&apos;est payé.
              </p>

              <ul className="mt-7 space-y-3.5">
                {[
                  "Filtres par statut et par type (sur place / à emporter)",
                  "Numéro de table, articles, suppléments et notes du client bien visibles",
                  "Refus ou annulation avec motif, conservé dans l'historique",
                  "Mode sombre et grands caractères pour la cuisine",
                  "Alerte « Appeler le serveur » envoyée par le client",
                ].map((element) => (
                  <li key={element} className="flex items-start gap-3 text-slate-700">
                    <Check className="mt-1 size-4 shrink-0 text-feuille-600" aria-hidden />
                    {element}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/connexion" className={classesBouton("sombre", "lg")}>
                  <LayoutDashboard className="size-4" aria-hidden />
                  Voir l&apos;écran de démonstration
                </Link>
                <Link href="/inscription" className={classesBouton("contour", "lg")}>
                  Créer mon compte
                </Link>
              </div>
            </Reveler>

            <Reveler delai={120}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[3rem] bg-slate-900/5 blur-2xl" />
                <MaquetteEcranService />
                <p className="mt-4 text-center text-sm text-slate-500">
                  Aperçu de l&apos;écran de service — identique sur téléphone, tablette et ordinateur.
                </p>
              </div>
            </Reveler>
          </div>
        </div>
      </section>

      {/* ====================== MENU CLIENT + PAIEMENT ====================== */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveler className="mx-auto max-w-2xl text-center">
            <Badge ton="marque" icone={<Smartphone className="size-3.5" aria-hidden />}>
              Côté client
            </Badge>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
              Un menu beau à voir et simple à utiliser
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Grandes photos, prix en FCFA bien lisibles, boutons larges : le client commande seul,
              même s&apos;il n&apos;a jamais utilisé ce genre d&apos;outil.
            </p>
          </Reveler>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <Reveler className="order-2 lg:order-1">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <MaquetteTelephone mode="sur_place" numeroTable="4" />
                  <p className="mt-4 text-center text-sm font-semibold text-slate-600">
                    Sur place — QR de la table 4
                  </p>
                </div>
                <div className="hidden sm:block">
                  <MaquettePaiement />
                  <p className="mt-4 text-center text-sm font-semibold text-slate-600">
                    Paiement mobile money
                  </p>
                </div>
              </div>
            </Reveler>

            <Reveler delai={120} className="order-1 lg:order-2">
              <h3 className="font-titre text-2xl font-extrabold tracking-tight text-slate-900">
                Ce que vit votre client
              </h3>
              <ol className="mt-6 space-y-5">
                {[
                  {
                    icone: <ScanLine className="size-5" aria-hidden />,
                    titre: "Il scanne le QR code",
                    texte:
                      "Son appareil photo fait le reste : le menu s'ouvre en moins d'une seconde, sans rien installer.",
                  },
                  {
                    icone: <ClipboardList className="size-5" aria-hidden />,
                    titre: "Il compose sa commande",
                    texte:
                      "Il coche les suppléments, ajoute une note (« sans piment ») et vérifie le total en FCFA.",
                  },
                  {
                    icone: <Banknote className="size-5" aria-hidden />,
                    titre: "Il paie comme il veut",
                    texte:
                      "Orange Money, Moov Money, MTN MoMo avec votre numéro et le montant exact affichés, ou espèces à table.",
                  },
                  {
                    icone: <Clock className="size-5" aria-hidden />,
                    titre: "Il suit sa commande",
                    texte:
                      "Une page de suivi lui montre l'avancement en direct : acceptée, en préparation, prête.",
                  },
                ].map((element, index) => (
                  <li key={element.titre} className="flex gap-4">
                    <span className="fond-principal flex size-11 shrink-0 items-center justify-center rounded-2xl">
                      {element.icone}
                    </span>
                    <div>
                      <p className="font-titre font-bold text-slate-900">
                        {index + 1}. {element.titre}
                      </p>
                      <p className="mt-0.5 text-slate-600">{element.texte}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/m/maquis-le-baoule/t/2" className={classesBouton("principal", "lg")}>
                  Ouvrir un menu de démonstration
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Reveler>
          </div>
        </div>
      </section>

      {/* ================================ TARIFS ================================ */}
      <section id="tarifs" className="scroll-mt-24 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveler className="mx-auto max-w-2xl text-center">
            <Badge ton="marque">Tarifs</Badge>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
              Des prix simples, en francs CFA
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Commencez gratuitement. Passez au plan Pro le jour où votre carte devient trop longue.
              Sans engagement, sans commission.
            </p>
          </Reveler>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <Reveler>
              <Carte className="flex h-full flex-col p-6">
                <h3 className="font-titre text-xl font-extrabold text-slate-900">Gratuit</h3>
                <p className="mt-1 text-sm text-slate-500">Pour tester et démarrer</p>
                <p className="mt-5 font-titre text-4xl font-extrabold text-slate-900">
                  0 FCFA
                  <span className="ml-1 text-base font-semibold text-slate-500">/ mois</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">Pour toujours, sans condition</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {AVANTAGES_GRATUIT.map((avantage) => (
                    <li key={avantage} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
                      {avantage}
                    </li>
                  ))}
                </ul>

                <Link href="/inscription" className={classesBouton("contour", "lg", "mt-6 w-full")}>
                  Commencer gratuitement
                </Link>
              </Carte>
            </Reveler>

            <Reveler delai={100}>
              <Carte className="relative flex h-full flex-col border-marque-300 p-6 ring-2 ring-marque-500/20">
                <Badge ton="marque" className="absolute -top-3 left-6">
                  Recommandé pour les restaurants
                </Badge>
                <h3 className="font-titre text-xl font-extrabold text-slate-900">Pro</h3>
                <p className="mt-1 text-sm text-slate-500">Pour un service complet</p>
                <p className="mt-5 font-titre text-4xl font-extrabold text-slate-900">
                  9 900 FCFA
                  <span className="ml-1 text-base font-semibold text-slate-500">/ mois</span>
                </p>
                <p className="mt-1 text-sm text-slate-500">Sans engagement, résiliable à tout moment</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {AVANTAGES_PRO.map((avantage) => (
                    <li key={avantage} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
                      {avantage}
                    </li>
                  ))}
                </ul>

                <Link href="/inscription" className={classesBouton("principal", "lg", "mt-6 w-full")}>
                  Passer au plan Pro
                </Link>
              </Carte>
            </Reveler>
          </div>

          {/* Tableau comparatif */}
          <Reveler className="mt-12">
            <Carte className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <caption className="sr-only">
                    Comparaison détaillée des plans Gratuit et Pro d&apos;AfriMenu
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th scope="col" className="px-5 py-3.5 font-titre font-bold text-slate-900">
                        Ce qui est inclus
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-center font-titre font-bold text-slate-900">
                        Gratuit
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-center font-titre font-bold text-marque-600">
                        Pro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {TABLEAU_COMPARATIF.map((ligne) => (
                      <tr key={ligne.libelle} className="hover:bg-slate-50/70">
                        <th scope="row" className="px-5 py-3 text-left font-medium text-slate-700">
                          {ligne.libelle}
                        </th>
                        {[ligne.gratuit, ligne.pro].map((valeur, index) => (
                          <td key={index} className="px-5 py-3 text-center">
                            {valeur === true ? (
                              <Check className="mx-auto size-4 text-feuille-600" aria-hidden />
                            ) : (
                              <span
                                className={cn(
                                  "text-sm",
                                  index === 1 ? "font-semibold text-slate-900" : "text-slate-500",
                                )}
                              >
                                {valeur}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Carte>
          </Reveler>
        </div>
      </section>

      {/* ============================ SCÉNARIOS ============================ */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveler className="mx-auto max-w-2xl text-center">
            <Badge ton="neutre">Cas d&apos;usage</Badge>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
              Trois situations que vous reconnaîtrez
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Des exemples concrets de ce que change AfriMenu au quotidien.
            </p>
          </Reveler>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {SCENARIOS.map((scenario, index) => (
              <Reveler key={scenario.titre} delai={index * 110}>
                <Carte className="flex h-full flex-col p-6">
                  <span className="fond-principal flex size-11 items-center justify-center rounded-2xl">
                    {scenario.icone}
                  </span>
                  <Badge ton="neutre" className="mt-4 self-start">
                    {scenario.badge}
                  </Badge>
                  <h3 className="mt-3 font-titre text-lg font-bold text-slate-900">
                    {scenario.titre}
                  </h3>
                  <p className="mt-2 flex-1 leading-relaxed text-slate-600">{scenario.texte}</p>

                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                    {scenario.chiffres.map((chiffre) => (
                      <div key={chiffre.libelle}>
                        <dt className="font-titre text-2xl font-extrabold text-marque-600">
                          {chiffre.valeur}
                        </dt>
                        <dd className="mt-0.5 text-xs text-slate-500">{chiffre.libelle}</dd>
                      </div>
                    ))}
                  </dl>
                </Carte>
              </Reveler>
            ))}
          </div>

          <Reveler className="mt-8">
            <p className="text-center text-sm text-slate-500">
              Exemples illustratifs construits à partir d&apos;un service classique de maquis et de
              restaurant de quartier. Vos chiffres dépendront de votre établissement.
            </p>
          </Reveler>
        </div>
      </section>

      {/* ============================== QUESTIONS ============================== */}
      <section id="questions" className="scroll-mt-24 py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveler className="text-center">
            <Badge ton="neutre">Questions fréquentes</Badge>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl">
              Ce que les restaurateurs nous demandent
            </h2>
          </Reveler>

          <div className="mt-10 space-y-3">
            {QUESTIONS.map((element, index) => (
              <Reveler key={element.question} delai={index * 60}>
                <details className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-marque-200 open:shadow-sm">
                  <summary className="cursor-pointer list-none font-titre font-bold text-slate-900 marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {element.question}
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 group-open:bg-marque-100 group-open:text-marque-600">
                        <span className="text-lg leading-none">+</span>
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-slate-600">{element.reponse}</p>
                </details>
              </Reveler>
            ))}
          </div>

          <Reveler className="mt-10">
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-slate-50 p-6 text-center sm:flex-row sm:text-left">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-marque-600 shadow-sm">
                <MessageCircle className="size-6" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="font-titre font-bold text-slate-900">
                  Une autre question ? Écrivez-nous.
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Nous répondons en français, du lundi au samedi.
                </p>
              </div>
              <a
                href="mailto:support@afrimenu.app"
                className={classesBouton("contour", "md", "shrink-0")}
              >
                support@afrimenu.app
              </a>
            </div>
          </Reveler>
        </div>
      </section>

      {/* ============================ APPEL FINAL ============================ */}
      <section className="relative overflow-hidden bg-marque-600 py-16 text-white lg:py-20">
        <div className="pointer-events-none absolute -top-20 -left-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-black/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-titre text-3xl leading-tight font-extrabold sm:text-4xl">
              Votre premier QR code est à deux minutes d&apos;ici
            </h2>
            <p className="mt-4 max-w-xl text-lg text-marque-50">
              Créez votre compte, ajoutez vos plats, imprimez vos cartes de table. Gratuit, sans carte
              bancaire et sans commission sur vos ventes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-lg font-bold text-marque-700 shadow-sm transition hover:bg-marque-50"
              >
                Créer mon restaurant
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link
                href="/m/maquis-le-baoule"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/40 px-6 text-lg font-bold text-white transition hover:bg-white/10"
              >
                Voir la démonstration
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-marque-50">
              {["Gratuit pour démarrer", "Aucune commission", "Support en français"].map((element) => (
                <li key={element} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4" aria-hidden />
                  {element}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[16rem]">
            <div className="rounded-3xl bg-white p-5 text-center shadow-2xl">
              <QrCodeInline
                svg={svgEmporter}
                taille={200}
                label="QR code du menu de démonstration"
                className="mx-auto"
              />
              <p className="mt-3 text-sm font-bold text-slate-900">Essayez maintenant</p>
              <p className="mt-1 text-xs text-slate-500">
                Scannez avec l&apos;appareil photo de votre téléphone
              </p>
            </div>
          </div>
        </div>
      </section>

      <PiedDePage />

      {/* ======================== BARRE D'ACTION MOBILE ======================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-safe backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Link href="/m/maquis-le-baoule" className={classesBouton("contour", "lg", "flex-1")}>
            Voir la démo
          </Link>
          <Link href="/inscription" className={classesBouton("principal", "lg", "flex-1")}>
            Créer mon menu
          </Link>
        </div>
      </div>
    </div>
  );
}
