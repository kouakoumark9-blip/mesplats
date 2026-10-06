import { CreditCard, MessageCircle, Palette, Sparkles, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FormulaireProfil } from "@/components/dashboard/formulaire-profil";
import { GestionPaiements } from "@/components/dashboard/gestion-paiements";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteContenu, CarteEntete } from "@/components/ui/carte";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIBELLES_PLAN, LIMITE_PRODUITS, TARIFS, type Operateur } from "@/lib/constants";
import { compterProduits, moyensPaiementRestaurant, profilRestaurant } from "@/lib/db/catalogue";
import { formatFcfa, lienSms, lienWhatsApp } from "@/lib/utils";

export const metadata: Metadata = { title: "Paramètres" };

const MESSAGE_PRO =
  "Bonjour Mesplats, je souhaite activer la formule Pro de mon restaurant (9 900 FCFA par mois).";

export default async function PageParametres() {
  const utilisateur = await exigerRole("admin");
  const restaurantId = utilisateur.restaurantId!;

  const [profil, moyens, nbProduits] = await Promise.all([
    profilRestaurant(restaurantId),
    moyensPaiementRestaurant(restaurantId),
    compterProduits(restaurantId),
  ]);

  const limite = LIMITE_PRODUITS[utilisateur.plan];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
          <Palette className="size-6 text-marque-600" aria-hidden />
          Paramètres du restaurant
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Profil public, couleur de marque, moyens de paiement mobile money et formule
          d&apos;abonnement.
        </p>
      </header>

      <FormulaireProfil
        restaurant={{
          nom: profil?.nom ?? utilisateur.restaurantNom ?? "",
          slug: profil?.slug ?? utilisateur.restaurantSlug ?? "",
          adresse: profil?.adresse ?? null,
          horaires: profil?.horaires ?? null,
          telephone: profil?.telephone ?? null,
          couleurPrincipale: profil?.couleurPrincipale ?? utilisateur.couleurPrincipale,
          devise: profil?.devise ?? utilisateur.devise,
        }}
      />

      {/* ---------------------------- Moyens de paiement --------------------------- */}
      <section id="paiements" className="space-y-4">
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

      {/* ---------------------------------- Plan ---------------------------------- */}
      <section id="plan">
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
                  <li>
                    ✓ Menu QR, commandes sur place et à emporter, écran de service : inclus
                  </li>
                  <li>✓ {limite ?? 20} plats maximum</li>
                  <li>• Formule Pro (9 900 FCFA / mois) : plats, tables et comptes illimités</li>
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
                  href={lienWhatsApp(MESSAGE_PRO, null)}
                  target="_blank"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-feuille-600 px-4 text-sm font-semibold text-white transition hover:bg-feuille-700"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Activer la formule Pro — {formatFcfa(TARIFS.pro)} / mois
                </Link>
                <Link
                  href={lienWhatsApp(
                    "Bonjour Mesplats, pouvez-vous m'appeler pour activer mon abonnement ?",
                    null,
                  )}
                  target="_blank"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  <Sparkles className="size-4" aria-hidden />
                  Demander un rappel de l&apos;équipe
                </Link>
                <Link
                  href={lienSms(
                    "Bonjour Mesplats, je souhaite activer mon abonnement (9 900 FCFA par mois).",
                    null,
                  )}
                  className="block text-center text-xs font-semibold text-slate-500 hover:underline dark:text-slate-400"
                >
                  … ou envoyer un SMS pré-rempli
                </Link>
              </div>
            ) : (
              <Badge ton="succes">Merci de votre confiance</Badge>
            )}
          </CarteContenu>
        </Carte>
      </section>
    </div>
  );
}
