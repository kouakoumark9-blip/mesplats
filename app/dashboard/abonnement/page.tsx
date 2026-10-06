import { Check, CreditCard, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BasculeTarifs } from "@/components/site/bascule-tarifs";
import { Bouton } from "@/components/ui/bouton";
import { Alerte } from "@/components/ui/divers";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteContenu, CarteEntete } from "@/components/ui/carte";
import { RangeeLogosPaiement } from "@/components/ui/logos-paiement";
import { exigerRole } from "@/lib/auth/autorisation";
import { LIBELLES_PLAN, TARIFS } from "@/lib/constants";
import { formatFcfa, lienSms, lienWhatsApp } from "@/lib/utils";

export const metadata: Metadata = {
  title: "S'abonner",
  description: "Formules Mesplats : Pro à 9 900 FCFA par mois ou Multi-établissements à 19 900 FCFA.",
};

const MESSAGE_ABONNEMENT = (plans: string) =>
  `Bonjour Mesplats, je souhaite activer la formule ${plans}. Merci de m'indiquer les modalités de paiement.`;

const CONTENU = [
  "Menu QR illimité (plats, catégories, photos, options et tailles)",
  "Commandes sur place et à emporter, écran de service en temps réel",
  "QR codes personnalisables : styles, couleurs, logo au centre, PNG, SVG et PDF",
  "Paiement mobile money affiché au client et validé en un clic",
  "Comptes d'équipe : serveurs et cuisine, chacun son accès",
  "Statistiques du jour et plats les plus vendus",
  "Assistance WhatsApp en français, 7 jours sur 7",
];

export default async function PageAbonnement() {
  const utilisateur = await exigerRole("admin");
  const formule = LIBELLES_PLAN[utilisateur.plan];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
          <CreditCard className="size-6 text-marque-600" aria-hidden />
          Formules Mesplats
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Un abonnement simple, sans commission sur vos ventes. Vous payez par mobile money, et votre
          menu est actif dans la minute qui suit la validation.
        </p>
      </header>

      {utilisateur.plan === "pro" ? (
        <Alerte ton="succes" titre="Votre formule Pro est active">
          Merci ! Vous bénéficiez d&apos;un nombre illimité de plats, de tables et de comptes
          d&apos;équipe. Pour passer à plusieurs établissements, parlez-nous de votre projet sur
          WhatsApp.
        </Alerte>
      ) : (
        <Alerte ton="info" titre={`Votre formule actuelle : ${formule}`}>
          Votre établissement fonctionne en mode découverte : {formatFcfa(TARIFS.pro)} par mois
          débloquent les plats, les tables et les comptes d&apos;équipe en illimité.
        </Alerte>
      )}

      {/* ---------------------------- Comparatif ---------------------------- */}
      <BasculeTarifs />

      {/* ------------------------- Ce qui est inclus ------------------------- */}
      <Carte>
        <CarteEntete
          titre="Ce que votre abonnement couvre"
          description="Le même socle pour les deux formules ; seule la notion d'établissement change."
          icone={<Sparkles className="size-4" aria-hidden />}
          action={<Badge ton={utilisateur.plan === "pro" ? "succes" : "neutre"}>{formule}</Badge>}
        />
        <CarteContenu>
          <ul className="grid gap-2 sm:grid-cols-2">
            {CONTENU.map((element) => (
              <li key={element} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
                {element}
              </li>
            ))}
          </ul>
        </CarteContenu>
      </Carte>

      {/* ------------------------------ Paiement ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Carte>
          <CarteEntete
            titre="Payer par mobile money"
            description="Réglez le montant exact depuis votre téléphone, puis envoyez-nous la capture."
            icone={<Phone className="size-4" aria-hidden />}
          />
          <CarteContenu className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Mesplats — Abidjan</p>
              <p className="mt-1">Orange Money · Wave · MTN MoMo · Moov Money</p>
              <p className="mt-1 chiffres font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                +225 07 00 00 00 00
              </p>
            </div>
            <RangeeLogosPaiement taille="md" />
            <div className="flex flex-wrap gap-2">
              <Link href={lienWhatsApp(MESSAGE_ABONNEMENT("Pro à 9 900 FCFA"), null)} target="_blank">
                <Bouton icone={<MessageCircle className="size-4" aria-hidden />}>
                  J&apos;ai payé — envoyer la preuve
                </Bouton>
              </Link>
              <Link href={lienSms(MESSAGE_ABONNEMENT("Pro à 9 900 FCFA"), null)}>
                <Bouton variante="contour" icone={<Send className="size-4" aria-hidden />}>
                  Envoyer un SMS
                </Bouton>
              </Link>
            </div>
          </CarteContenu>
        </Carte>

        <Carte>
          <CarteEntete
            titre="Combien de temps pour l'activation ?"
            description="Notre équipe vérifie le paiement, puis vous notifie."
            icone={<Sparkles className="size-4" aria-hidden />}
          />
          <CarteContenu className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-800 dark:text-slate-100">1.</strong> Vous réglez la
              formule choisie par mobile money.
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-100">2.</strong> Vous nous envoyez la
              capture de paiement sur WhatsApp (ou un SMS avec la référence).
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-100">3.</strong> Votre compte passe
              en « Pro » dans la minute et reste actif jusqu&apos;à la prochaine échéance.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Annulation libre à tout moment : votre menu reste en ligne jusqu&apos;à la fin de la
              période payée.
            </p>
          </CarteContenu>
        </Carte>
      </div>

      <Carte>
        <CarteEntete
          titre="Multi-établissements"
          description="Plusieurs maquis, un restaurant et un food-truck, une franchise ?"
          icone={<CreditCard className="size-4" aria-hidden />}
        />
        <CarteContenu className="flex flex-wrap items-center justify-between gap-4">
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            <li>• {formatFcfa(TARIFS.multi)} par mois, soit le 2ᵉ établissement à moitié prix.</li>
            <li>• Un menu, des tables et des statistiques par établissement.</li>
            <li>• Bascule d&apos;un établissement à l&apos;autre en un clic depuis le sélecteur.</li>
          </ul>
          <Link
            href={lienWhatsApp(MESSAGE_ABONNEMENT("Multi-établissements à 19 900 FCFA"), null)}
            target="_blank"
          >
            <Bouton variante="succes" icone={<MessageCircle className="size-4" aria-hidden />}>
              Demander la formule multi
            </Bouton>
          </Link>
        </CarteContenu>
      </Carte>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Les prix sont exprimés en francs CFA, toutes taxes comprises. Aucune commission n&apos;est
        prélevée sur vos ventes, ni sur les paiements mobile money de vos clients.
      </p>
    </div>
  );
}
