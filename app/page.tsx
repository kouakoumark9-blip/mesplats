import {
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  ClipboardList,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  Percent,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  Truck,
  Utensils,
  Wifi,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BasculeTarifs } from "@/components/site/bascule-tarifs";
import { BoutonPilule } from "@/components/site/bouton-pilule";
import { EnteteSite } from "@/components/site/entete-site";
import { Etapes } from "@/components/site/etapes";
import {
  BandeauCuisineFlottant,
  CarteBoissonFlottante,
  CartePlatFlottante,
  EcranFicheProduit,
  EcranMenu,
  EcranProfilRestaurant,
  PastilleQr,
} from "@/components/site/hero-phones";
import { CarteQrTable } from "@/components/site/maquettes";
import { PiedDePage } from "@/components/site/pied-de-page";
import { SectionBoutique } from "@/components/site/section-boutique";
import { Reveler } from "@/components/site/reveler";
import { TitreSouligne } from "@/components/site/titre-souligne";
import {
  VignetteCreation,
  VignetteMobile,
  VignetteTempsReel,
} from "@/components/site/vignettes";
import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { RangeeLogosPaiement } from "@/components/ui/logos-paiement";
import { urlMenu } from "@/lib/env";
import { qrSvg } from "@/lib/qr";


export const metadata: Metadata = {
  title: "Mesplats — Créez votre menu QR code pour restaurant en Afrique de l'Ouest",
  description:
    "Menu QR code pour restaurant : vos clients scannent, consultent la carte en FCFA et commandent depuis leur téléphone. Commandes sur place et à emporter en temps réel, paiement Orange Money, Moov Money, MTN MoMo ou espèces. Sans application, sans commission.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Mesplats — Menu QR code et commande en ligne pour restaurants",
    description:
      "Menu QR sans application, commandes en temps réel, écran de service pour la salle et la cuisine. Conçu pour la Côte d'Ivoire et l'Afrique de l'Ouest.",
    type: "website",
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Contenus                                  */
/* -------------------------------------------------------------------------- */

const CHIFFRES = [
  { valeur: "2 min", libelle: "pour publier votre menu", icone: <Clock className="size-4" aria-hidden /> },
  { valeur: "4 s", libelle: "entre la commande et l'écran", icone: <TrendingUp className="size-4" aria-hidden /> },
  { valeur: "0 %", libelle: "de commission sur vos ventes", icone: <Percent className="size-4" aria-hidden /> },
  { valeur: "100 %", libelle: "en français, prix en FCFA", icone: <Globe className="size-4" aria-hidden /> },
];

const POURQUOI = [
  {
    titre: "Créez votre menu en quelques minutes",
    texte:
      "Vous ajoutez vos plats, leurs prix et leurs photos depuis votre téléphone. Aucune compétence technique, aucune formation, aucun matériel à acheter.",
    vignette: <VignetteCreation />,
  },
  {
    titre: "Toujours à jour, en temps réel",
    texte:
      "Un plat est épuisé, un prix change ? L'interrupteur suffit : le menu client est modifié instantanément, sans réimprimer quoi que ce soit.",
    vignette: <VignetteTempsReel />,
  },
  {
    titre: "Parfait sur mobile",
    texte:
      "Le menu s'ouvre en moins d'une seconde, reste lisible au soleil et fonctionne même avec une connexion 3G instable, sur un téléphone d'entrée de gamme.",
    vignette: <VignetteMobile />,
  },
];

const FAQ = [
  {
    question: "Mes clients doivent-ils installer une application ?",
    reponse:
      "Non, jamais. Le client scanne le QR code avec l'appareil photo de son téléphone et votre menu s'ouvre dans son navigateur. Aucun téléchargement, aucun compte à créer : seuls un prénom et un numéro de téléphone sont demandés pour la commande.",
  },
  {
    question: "Comment le client paie-t-il ?",
    reponse:
      "Il choisit Orange Money, Moov Money, MTN MoMo ou les espèces. Pour le mobile money, votre numéro s'affiche avec le montant exact et un bouton pour ouvrir l'application de paiement ou copier le numéro. Dès que vous recevez l'argent, vous validez la commande d'un clic depuis l'écran de service.",
  },
  {
    question: "Est-ce que ça fonctionne avec une connexion faible ?",
    reponse:
      "Oui, c'est une contrainte de conception. L'interface est volontairement légère : le menu s'affiche vite même en 3G et reste consultable quelques instants si le réseau coupe. C'est l'une des raisons pour lesquelles nous n'utilisons pas de vidéos ni de cartes interactives.",
  },
  {
    question: "Puis-je utiliser Mesplats sans QR code ?",
    reponse:
      "Oui. Beaucoup de restaurants commencent par les commandes à emporter avec un simple lien partagé sur WhatsApp, Facebook ou Instagram. Les QR codes de table s'ajoutent quand vous le souhaitez, sans rien reconfigurer.",
  },
  {
    question: "Y a-t-il une commission sur mes ventes ?",
    reponse:
      "Aucune. Mesplats est un abonnement, pas un intermédiaire : vous encaissez directement le client, en mobile money ou en espèces, et la totalité de la somme reste chez vous. Aucune commission n'est prélevée sur vos ventes, quel que soit le plan choisi.",
  },
  {
    question: "Comment se règle l'abonnement ?",
    reponse:
      "Par mobile money, en Côte d'Ivoire comme dans la sous-région : Orange Money, Moov Money ou MTN MoMo. Vous créez votre compte, vous choisissez votre formule (Pro à 9 900 FCFA par mois, ou Multi-établissements à 19 900 FCFA par mois), vous réglez le premier mois et votre espace s'active. Aucune carte bancaire, aucun prélèvement automatique, aucun engagement.",
  },
  {
    question: "Ai-je besoin de matériel particulier ?",
    reponse:
      "Un téléphone suffit pour commencer. Une tablette ou un ordinateur d'occasion rend l'écran de service plus confortable en cuisine ou au comptoir. Rien à installer : tout fonctionne dans le navigateur, et l'application peut s'ajouter à l'écran d'accueil.",
  },
];

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default async function PageAccueil() {

  /*
   * Vrais QR codes générés au rendu, en SVG : aucune image externe à
   * télécharger, poids minimal et netteté parfaite à l'impression.
   */
  const [svgTable, svgEmporter, svgTable1, svgTable2] = await Promise.all([
    qrSvg(urlMenu({ slug: "maquis-le-baoule" }, "4"), { marge: 2 }),
    qrSvg(urlMenu({ slug: "maquis-le-baoule" }), { marge: 2 }),
    qrSvg(urlMenu({ slug: "maquis-le-baoule" }, "1"), { marge: 2 }),
    qrSvg(urlMenu({ slug: "maquis-le-baoule" }, "2"), { marge: 2 }),
  ]);

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mesplats",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web (navigateur), Android, iOS",
    description:
      "Menu QR et prise de commande pour les restaurants de Côte d'Ivoire et d'Afrique de l'Ouest : commandes sur place et à emporter en temps réel, paiement Orange Money, Moov Money, MTN MoMo ou espèces.",
    inLanguage: "fr",
    areaServed: "Afrique de l'Ouest",
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "37" },
    offers: [
      {
        "@type": "Offer",
        name: "Pro",
        price: "9900",
        priceCurrency: "XOF",
        description: "9 900 FCFA par mois, un restaurant : produits et tables illimités, QR codes, écran de service, comptes équipe illimités, statistiques.",
      },
      {
        "@type": "Offer",
        name: "Multi-établissements",
        price: "19900",
        priceCurrency: "XOF",
        description: "19 900 FCFA par mois : jusqu'à 5 établissements, tableau de bord consolidé, export des commandes.",
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

      {/* ================================= HÉRO ================================= */}
      <section className="relative overflow-hidden">
        {/* Halos de couleur derrière le contenu */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[70rem] -translate-x-1/2 rounded-full bg-marque-100/60 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-24 size-80 rounded-full bg-feuille-100/50 blur-3xl" />
        <div className="pointer-events-none absolute top-24 -right-24 size-80 rounded-full bg-marque-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:pt-20">
          {/* Texte centré */}
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              ton="marque"
              className="mx-auto max-w-full whitespace-normal text-center sm:whitespace-nowrap"
            >
              Conçu à Abidjan pour les restaurants d&apos;Afrique de l&apos;Ouest
            </Badge>

            <TitreSouligne
              niveau="h1"
              avant="Votre menu"
              accent="QR code"
              apres="pour restaurant"
              className="mt-6"
            />

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Vos clients scannent, consultent la carte en FCFA et commandent depuis leur téléphone —
              à leur table ou à emporter. Vous recevez chaque commande en temps réel,{" "}
              <strong className="font-semibold text-slate-800">
                sans application à installer et sans commission sur vos ventes.
              </strong>
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BoutonPilule href="/m/maquis-le-baoule" variante="clair" taille="lg">
                Voir un menu
              </BoutonPilule>
              <BoutonPilule href="/inscription" variante="sombre" taille="lg">
                Créer mon menu
              </BoutonPilule>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-600">
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-feuille-600" aria-hidden />
                À partir de 9 900 FCFA / mois
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-feuille-600" aria-hidden />
                Paiement mobile money
              </li>
            </ul>

            <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-slate-500 sm:flex-row sm:gap-4">
              <span className="inline-flex items-center gap-1 text-amber-500">
                {[0, 1, 2, 3, 4].map((etoile) => (
                  <Star key={etoile} className="size-4 fill-current" aria-hidden />
                ))}
                <span className="ml-1 font-bold text-slate-700">4,8 / 5</span>
              </span>
              <span>
                Déjà adopté par des maquis, bars et restaurants de quartier à Abidjan et Yopougon
              </span>
            </div>
          </div>

          {/* ---------------- Composition : trois écrans + éléments flottants ---------------- */}
          <div className="relative mx-auto mt-14 max-w-6xl pb-20 lg:mt-20">
            {/* Écrans secondaires (masqués sur mobile et tablette) */}
            <div className="pointer-events-none absolute inset-x-0 top-8 hidden justify-between px-2 lg:flex">
              <div className="pointer-events-auto mt-10 hidden xl:block">
                <EcranFicheProduit />
              </div>
              <div className="pointer-events-auto" />
              <div className="pointer-events-auto mt-14 hidden xl:block">
                <EcranProfilRestaurant />
              </div>
            </div>

            {/* Écran principal */}
            <div className="relative z-10 flex justify-center">
              <EcranMenu />
            </div>

            {/* Éléments flottants */}
            <CartePlatFlottante className="absolute top-24 -left-2 hidden animate-flotte lg:block xl:-left-10 xl:top-28" />
            <CarteBoissonFlottante className="absolute bottom-16 -right-2 hidden animate-flotte lg:block xl:-right-8" />
            <PastilleQr
              svg={svgEmporter}
              className="absolute bottom-4 left-1/2 hidden -translate-x-[19rem] lg:flex xl:-translate-x-[23rem]"
            />
            <BandeauCuisineFlottant className="absolute -bottom-2 left-1/2 hidden -translate-x-1/2 sm:flex" />
          </div>
        </div>
      </section>

      {/* ============================ BANDEAU CHIFFRES =========================== */}
      <section className="border-y border-slate-200 bg-slate-50/80">
        <div className="mx-auto grid max-w-7xl divide-slate-200 px-4 py-9 sm:grid-cols-2 sm:divide-x sm:px-6 lg:grid-cols-4">
          {CHIFFRES.map((element, index) => (
            <Reveler key={element.libelle} delai={index * 70} className="px-2 py-3 text-center sm:px-6 sm:text-left">
              <p className="inline-flex items-center gap-2 font-titre text-3xl font-extrabold text-slate-900">
                <span className="text-marque-500">{element.icone}</span>
                {element.valeur}
              </p>
              <p className="mt-1.5 text-sm text-slate-600">{element.libelle}</p>
            </Reveler>
          ))}
        </div>
      </section>

      {/* =========================== POURQUOI AFRIMENU =========================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveler className="mx-auto max-w-3xl text-center">
          <TitreSouligne avant="Pourquoi choisir" accent="Mesplats" className="justify-center" />
          <p className="mt-5 text-lg text-slate-600">
            La solution la plus simple pour passer au menu numérique : votre carte se met à jour en
            temps réel, vos clients commandent seuls, et votre équipe arrête de courir après les
            commandes.
          </p>
        </Reveler>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {POURQUOI.map((element, index) => (
            <Reveler key={element.titre} delai={index * 100}>
              <Carte className="flex h-full flex-col overflow-hidden">
                <div className="p-4 pb-0">{element.vignette}</div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-titre text-lg font-bold text-slate-900">{element.titre}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{element.texte}</p>
                </div>
              </Carte>
            </Reveler>
          ))}
        </div>
      </section>

      {/* ================================= QR CODES ================================= */}
      <section id="qr" className="scroll-mt-24 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
                      "Prête à poser sur la table ou à coller au mur. Export PNG pour vos impressions, planche PDF A4 pour tout sortir d'un coup.",
                  },
                  {
                    icone: <Truck className="size-5" aria-hidden />,
                    titre: "Un QR « À emporter »",
                    texte:
                      "À coller sur la vitrine, le comptoir ou votre statut WhatsApp : le client choisit son heure de retrait avant même d'arriver.",
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
                <BoutonPilule href="/inscription" variante="marque">
                  Générer mes QR codes
                </BoutonPilule>
                <Link href="/m/maquis-le-baoule/t/2" className={classesBouton("contour", "lg")}>
                  <ScanLine className="size-4" aria-hidden />
                  Essayer le menu de la table 2
                </Link>
              </div>
            </Reveler>

            <Reveler delai={120}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-6 top-10 -z-10 h-72 rounded-[3rem] bg-marque-100/70 blur-3xl" />

                <div className="mx-auto max-w-sm">
                  <CarteQrTable qrSvg={svgTable} url="mesplats.app/m/maquis-le-baoule/t/4" />
                </div>

                <div className="mx-auto -mt-6 max-w-xs sm:absolute sm:-right-2 sm:bottom-0 sm:mx-0 sm:mt-0 sm:w-52 lg:-right-4">
                  <div className="rotate-[-3deg] rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-xl">
                    <p className="text-[11px] font-extrabold tracking-wide text-marque-600 uppercase">
                      À emporter
                    </p>
                    <span
                      role="img"
                      aria-label="QR code pour les commandes à emporter"
                      className="mx-auto mt-2 block size-30 [&>svg]:size-full"
                      dangerouslySetInnerHTML={{ __html: svgEmporter }}
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

      {/* ================================= BOUTIQUE ================================ */}
      <SectionBoutique />

      {/* ================================== ÉTAPES ================================== */}
      <Etapes
        qrSvgParTable={{
          "Table 1": svgTable1,
          "Table 2": svgTable2,
        }}
      />

      {/* ================================== TARIFS ================================== */}
      <section
        id="tarifs"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveler className="mx-auto max-w-3xl text-center">
            <TitreSouligne avant="Un plan pour" accent="chaque restaurant" />
            <p className="mt-5 text-lg text-slate-600">
              Deux formules, un seul tarif tout compris : 9 900 FCFA par mois pour un restaurant,
              19 900 FCFA par mois si vous gérez plusieurs adresses. Aucune commission sur vos
              ventes, aucun engagement.
            </p>
          </Reveler>

          <Reveler className="mt-10">
            <BasculeTarifs />
          </Reveler>
        </div>
      </section>

      {/* =================================== FAQ =================================== */}
      <section id="questions" className="scroll-mt-24 py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveler className="text-center">
            <TitreSouligne avant="Ce que les restaurateurs" accent="nous demandent" />
          </Reveler>

          <div className="mt-10 space-y-3">
            {FAQ.map((element, index) => (
              <Reveler key={element.question} delai={index * 50}>
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
                <p className="font-titre font-bold text-slate-900">Une autre question ? Écrivez-nous.</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Nous répondons en français, du lundi au samedi.
                </p>
              </div>
              <a href="mailto:support@mesplats.app" className={classesBouton("contour", "md", "shrink-0")}>
                support@mesplats.app
              </a>
            </div>
          </Reveler>
        </div>
      </section>

      {/* ================================ APPEL FINAL ================================ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Reveler>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-marque-500 via-marque-600 to-slate-900 px-6 py-12 text-white sm:px-12 lg:py-16">
            <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 -bottom-24 size-80 rounded-full bg-black/25 blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
              <div>
                <h2 className="font-titre text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
                  Créez votre menu dès 9 900 FCFA par mois
                </h2>
                <p className="mt-4 max-w-xl text-lg text-white/90">
                  Menu illustré, QR codes de table, commandes en temps réel, paiement mobile
                  money : tout est inclus pour 9 900 FCFA par mois, sans commission sur vos
                  ventes. Vous réglez par Orange Money, Moov Money ou MTN MoMo.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <BoutonPilule href="/inscription" variante="clair" taille="lg">
                    Créer mon menu
                  </BoutonPilule>
                  <Link
                    href="/m/maquis-le-baoule"
                    className="inline-flex h-[3.25rem] items-center gap-2 rounded-full border border-white/35 px-6 font-bold text-white transition hover:bg-white/10"
                  >
                    Voir un menu de démonstration
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-white/85">Paiements acceptés :</span>
                  <RangeeLogosPaiement taille="md" />
                </div>

                <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                  {[
                    { icone: <BadgeCheck className="size-4" aria-hidden />, texte: "Sans carte bancaire" },
                    { icone: <Banknote className="size-4" aria-hidden />, texte: "0 % de commission" },
                    { icone: <Smartphone className="size-4" aria-hidden />, texte: "Aucune appli à installer" },
                  ].map((element) => (
                    <li key={element.texte} className="inline-flex items-center gap-2">
                      {element.icone}
                      {element.texte}
                    </li>
                  ))}
                </ul>
              </div>

              {/*
                Écran complet, posé dans la carte : le cadre du téléphone doit
                rester entièrement visible. Décalé vers le bas et recouvert d'un
                dégradé, il apparaissait coupé par la carte et le voile rendait
                le bouton « Commander » illisible — la maquette semblait cassée.
              */}
              <div className="relative mx-auto hidden w-full max-w-[19rem] sm:block">
                <EcranMenu />
              </div>
            </div>
          </div>
        </Reveler>
      </section>

      {/* ========================== BANDEAU DE CONFIANCE ========================== */}
      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 text-sm font-semibold text-slate-500 sm:px-6">
          {[
            { icone: <ShieldCheck className="size-4" aria-hidden />, texte: "Données isolées par restaurant" },
            { icone: <Wifi className="size-4" aria-hidden />, texte: "Rapide en 3G comme en 4G" },
            { icone: <ClipboardList className="size-4" aria-hidden />, texte: "Commandes illimitées dès le premier jour" },
            { icone: <Utensils className="size-4" aria-hidden />, texte: "Support en français à Abidjan" },
            { icone: <MapPin className="size-4" aria-hidden />, texte: "Pensé pour la Côte d'Ivoire" },
          ].map((element) => (
            <span key={element.texte} className="inline-flex items-center gap-2">
              <span className="text-marque-500">{element.icone}</span>
              {element.texte}
            </span>
          ))}
        </div>
      </section>

      <PiedDePage />

      {/* ============================ BARRE D'ACTION MOBILE ============================ */}
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
