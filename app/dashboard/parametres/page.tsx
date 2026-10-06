import {
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  MessageCircle,
  Palette,
  Server,
  Share2,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireCarte } from "@/components/dashboard/formulaire-carte";
import { FormulaireProfil } from "@/components/dashboard/formulaire-profil";
import { FormulaireReseaux } from "@/components/dashboard/formulaire-reseaux";
import { FormulaireVitrine } from "@/components/dashboard/formulaire-vitrine";
import { GestionPaiements } from "@/components/dashboard/gestion-paiements";
import { ZoneDanger } from "@/components/dashboard/zone-danger";
import { Bouton } from "@/components/ui/bouton";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteContenu, CarteEntete } from "@/components/ui/carte";
import { exigerRole } from "@/lib/auth/autorisation";
import {
  LIBELLES_PLAN,
  LIMITE_PRODUITS,
  TARIFS,
  type CouleurFondMenu,
  type Operateur,
  type PoliceMenu,
  type ThemeMenu,
} from "@/lib/constants";
import { compterProduits, moyensPaiementRestaurant, profilRestaurant } from "@/lib/db/catalogue";
import { blobToken, urlMenu } from "@/lib/env";
import { formatFcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Paramètres",
  description: "Vitrine, apparence de la carte, paiements et abonnement de votre restaurant.",
};

/** Sommaire ancré : évite de faire défiler une page longue pour retrouver un réglage. */
const SOMMAIRE = [
  { ancre: "#profil", libelle: "Établissement", icone: Store },
  { ancre: "#apparence", libelle: "Apparence", icone: ImageIcon },
  { ancre: "#carte", libelle: "Carte du client", icone: Palette },
  { ancre: "#reseaux", libelle: "Réseaux sociaux", icone: Share2 },
  { ancre: "#paiements", libelle: "Paiements", icone: Smartphone },
  { ancre: "#plan", libelle: "Abonnement", icone: CreditCard },
];

export default async function PageParametres() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [profil, moyens, nbProduits] = await Promise.all([
    profilRestaurant(restaurantId),
    moyensPaiementRestaurant(restaurantId),
    compterProduits(restaurantId),
  ]);

  const limite = LIMITE_PRODUITS[utilisateur.plan];
  const stockageImages = blobToken() !== null;
  const slug = profil?.slug ?? utilisateur.restaurantSlug ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
          <Palette className="size-6 text-marque-600" aria-hidden />
          Paramètres du restaurant
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tout ce que vos clients voient : nom, logo, bannière, apparence de la carte, réseaux
          sociaux, moyens de paiement et formule d&apos;abonnement.
        </p>
      </header>

      {/* ------------------------------ Sommaire ------------------------------ */}
      <nav
        aria-label="Sommaire des paramètres"
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {SOMMAIRE.map((element) => (
          <a
            key={element.ancre}
            href={element.ancre}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <element.icone className="size-3.5" aria-hidden />
            {element.libelle}
          </a>
        ))}
      </nav>

      {/* --------------------------- 1. Établissement --------------------------- */}
      <section id="profil" className="scroll-mt-24 space-y-4">
        <FormulaireProfil
          restaurant={{
            nom: profil?.nom ?? utilisateur.restaurantNom ?? "",
            slug,
            adresse: profil?.adresse ?? null,
            adresseComplement: profil?.adresseComplement ?? null,
            codePostal: profil?.codePostal ?? null,
            ville: profil?.ville ?? null,
            description: profil?.description ?? null,
            horaires: profil?.horaires ?? null,
            telephone: profil?.telephone ?? null,
            couleurPrincipale: profil?.couleurPrincipale ?? utilisateur.couleurPrincipale,
            devise: profil?.devise ?? utilisateur.devise,
          }}
        />
      </section>

      {/* ----------------------------- 2. Apparence ----------------------------- */}
      <section id="apparence" className="scroll-mt-24">
        <Carte>
          <CarteEntete
            titre="Apparence"
            description="Votre logo et une bannière : c'est la première chose que voit un client qui scanne votre QR code."
            icone={<ImageIcon className="size-4" aria-hidden />}
            action={
              <Link href={`/m/${slug}`} target="_blank">
                <Bouton
                  variante="contour"
                  taille="sm"
                  icone={<ExternalLink className="size-4" aria-hidden />}
                >
                  Voir la carte
                </Bouton>
              </Link>
            }
          />
          <CarteContenu>
            <FormulaireVitrine
              stockageImages={stockageImages}
              vitrine={{
                logo: profil?.logo ?? null,
                banniere: profil?.banniere ?? null,
                description: profil?.description ?? null,
                adresse: profil?.adresse ?? null,
                adresseComplement: profil?.adresseComplement ?? null,
                codePostal: profil?.codePostal ?? null,
                ville: profil?.ville ?? null,
                telephone: profil?.telephone ?? null,
              }}
            />
          </CarteContenu>
        </Carte>
      </section>

      {/* ------------------------- 3. Carte du client ------------------------- */}
      <section id="carte" className="scroll-mt-24">
        <Carte>
          <CarteEntete
            titre="Personnalisation de la carte"
            description="Thème, couleur de fond, police et langues de votre carte publique."
            icone={<LayoutDashboard className="size-4" aria-hidden />}
            action={
              <Link href="/dashboard/qr" className="hidden sm:block">
                <Bouton variante="fantome" taille="sm">
                  Régler mes QR codes
                </Bouton>
              </Link>
            }
          />
          <CarteContenu>
            <FormulaireCarte
              slug={slug}
              nomRestaurant={profil?.nom ?? utilisateur.restaurantNom ?? "Mon restaurant"}
              couleurPrincipale={profil?.couleurPrincipale ?? utilisateur.couleurPrincipale}
              reglages={{
                themeMenu: (profil?.themeMenu ?? "clair") as ThemeMenu,
                couleurFond: (profil?.couleurFond ?? "neutre") as CouleurFondMenu,
                policeMenu: (profil?.policeMenu ?? "moderne") as PoliceMenu,
                langues: profil?.langues ?? ["fr"],
              }}
            />
          </CarteContenu>
        </Carte>
      </section>

      {/* --------------------------- 4. Réseaux sociaux --------------------------- */}
      <section id="reseaux" className="scroll-mt-24">
        <Carte>
          <CarteEntete
            titre="Réseaux sociaux"
            description="Affichés en bas de votre carte : les clients vous suivent et reviennent plus facilement."
            icone={<Share2 className="size-4" aria-hidden />}
          />
          <CarteContenu>
            <FormulaireReseaux reseaux={profil?.reseaux ?? null} />
          </CarteContenu>
        </Carte>
      </section>

      {/* ----------------------------- 5. Paiements ----------------------------- */}
      <section id="paiements" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-titre text-xl font-extrabold text-slate-900 dark:text-white">
              <Smartphone className="size-5 text-marque-600" aria-hidden />
              Moyens de paiement mobile money
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ces numéros sont montrés au client au moment de payer, avec le montant exact. Vous
              validez ensuite le paiement reçu depuis l&apos;écran de service.
            </p>
          </div>
        </div>

        <GestionPaiements
          moyens={moyens.map((moyen) => ({
            operateur: moyen.operateur as Operateur,
            numero: moyen.numero,
            titulaire: moyen.titulaire,
            actif: moyen.actif,
          }))}
        />
      </section>

      {/* ---------------------------- 6. Abonnement ---------------------------- */}
      <section id="plan" className="scroll-mt-24">
        <Carte>
          <CarteEntete
            titre="Formule d'abonnement"
            description="Aucune commission n'est prélevée sur vos ventes, quelle que soit la formule."
            icone={<CreditCard className="size-4" aria-hidden />}
            action={
              <Badge ton={utilisateur.plan === "pro" ? "succes" : "neutre"}>
                Formule {LIBELLES_PLAN[utilisateur.plan]}
              </Badge>
            }
          />
          <CarteContenu className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Plats au menu
                </p>
                <p className="mt-1 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
                  {nbProduits}
                  <span className="text-base font-bold text-slate-400">
                    {" "}
                    / {limite ?? "∞"}
                  </span>
                </p>
                {limite !== null ? (
                  <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-marque-500"
                      style={{ width: `${Math.min(100, Math.round((nbProduits / limite) * 100))}%` }}
                    />
                  </div>
                ) : null}
              </div>

              {utilisateur.plan === "gratuit" ? (
                <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <li>✓ Menu QR, commandes sur place et à emporter, écran de service : inclus</li>
                  <li>✓ {limite ?? 20} plats maximum</li>
                  <li>
                    • Formule Pro ({formatFcfa(TARIFS.pro)} / mois) : plats, tables et comptes
                    illimités
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Votre plan Pro autorise un nombre illimité de plats, de tables et de comptes
                  d&apos;équipe.
                </p>
              )}
            </div>

            {utilisateur.plan === "gratuit" ? (
              <div className="space-y-2">
                <Link
                  href="/dashboard/abonnement"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-feuille-600 px-4 text-sm font-semibold text-white transition hover:bg-feuille-700"
                >
                  <Sparkles className="size-4" aria-hidden />
                  Voir les formules et m&apos;abonner
                </Link>
                <Link
                  href="https://wa.me/2250700000000?text=Bonjour%20Mesplats%2C%20je%20souhaite%20activer%20mon%20abonnement."
                  target="_blank"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Demander un rappel de l&apos;équipe
                </Link>
              </div>
            ) : (
              <Badge ton="succes">Merci de votre confiance</Badge>
            )}
          </CarteContenu>
        </Carte>
      </section>

      {/* ------------------------------ 7. Serveur ------------------------------ */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 font-titre text-base font-extrabold text-slate-900 dark:text-white">
          <Server className="size-4 text-slate-500" aria-hidden />
          Stockage des images
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {stockageImages ? (
            <>
              Vercel Blob est <strong>activé</strong> : vous pouvez téléverser directement vos photos
              de plats, votre logo et votre bannière depuis cet appareil.
            </>
          ) : (
            <>
              Vercel Blob n&apos;est pas encore configuré (<code className="font-mono text-xs">BLOB_READ_WRITE_TOKEN</code>).
              En attendant, collez l&apos;adresse https://… d&apos;une image hébergée ailleurs : tout
              fonctionne à l&apos;identique.
            </>
          )}
        </p>
        <Link href={urlMenu({ slug })} target="_blank" className="mt-3 inline-block">
          <Bouton variante="fantome" taille="sm" icone={<ExternalLink className="size-4" aria-hidden />}>
            Ouvrir ma carte publique
          </Bouton>
        </Link>
      </section>

      {/* ---------------------------- 8. Zone sensible ---------------------------- */}
      <section id="danger" className="scroll-mt-24">
        <h2 className="mb-3 flex items-center gap-2 font-titre text-base font-extrabold text-slate-900 dark:text-white">
          <ShieldAlert className="size-4 text-rose-600" aria-hidden />
          Zone sensible
        </h2>
        <ZoneDanger nomRestaurant={profil?.nom ?? utilisateur.restaurantNom ?? "Mon restaurant"} />
      </section>
    </div>
  );
}
