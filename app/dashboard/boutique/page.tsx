import { Check, ExternalLink, MessageCircle, Package, Printer, Sparkles, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Bouton } from "@/components/ui/bouton";
import { Badge } from "@/components/ui/badge";
import { Carte, CarteContenu, CarteEntete } from "@/components/ui/carte";
import { exigerRole } from "@/lib/auth/autorisation";
import { formatFcfa, lienWhatsApp } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Chevalets, stickers et supports imprimés pour vos QR codes Mesplats.",
};

/**
 * Boutique : les supports physiques autour du menu QR.
 * Aucun paiement en ligne ici : la commande part par WhatsApp, l'équipe Mesplats
 * confirme le prix et la livraison (Abidjan et intérieur du pays). C'est le
 * fonctionnement attendu en Côte d'Ivoire, sans passerelle de paiement.
 */
const PRODUITS = [
  {
    nom: "Chevalet de table en plexiglas",
    description: "Format A6, QR code imprimé sur mesure, nettoyage facile. Idéal pour la salle.",
    prix: 4_500,
    unite: "l'unité",
    delai: "3 jours ouvrés",
  },
  {
    nom: "Sticker QR autocollant",
    description: "Adhésif résistant à l'eau, à coller sur la vitrine, le comptoir ou les glacières.",
    prix: 1_500,
    unite: "l'unité",
    delai: "24 heures",
  },
  {
    nom: "Affiche A3 plastifiée",
    description: "Pour l'entrée, le mur du maquis ou le stand à emporter. QR en grand format.",
    prix: 6_000,
    unite: "l'affiche",
    delai: "3 jours ouvrés",
  },
  {
    nom: "Lot 10 chevalets + 10 stickers",
    description: "La dotation complète pour un maquis de 10 tables, à prix groupé.",
    prix: 49_000,
    unite: "le lot",
    delai: "5 jours ouvrés",
  },
];

const INCLUS = [
  "QR code généré depuis vos réglages Mesplats (style, couleurs, logo)",
  "Vérification du scan sur 3 téléphones avant expédition",
  "Livraison à Abidjan sous 72 h, expédition en province par transporteur",
  "Remplacement gratuit en cas de défaut d'impression",
];

export default async function PageBoutique() {
  const utilisateur = await exigerRole("admin");
  const nom = utilisateur.restaurantNom ?? "mon restaurant";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
          <Store className="size-6 text-marque-600" aria-hidden />
          Boutique Mesplats
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Imprimez vos QR codes sur des supports qui tiennent dans la durée : chevalets de table,
          stickers pour la vitrine et affiches pour l&apos;entrée. Nous imprimons à partir des
          réglages de votre compte, puis nous vous livrons.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {PRODUITS.map((produit) => (
          <Carte key={produit.nom}>
            <CarteContenu className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-titre text-base font-extrabold text-slate-900 dark:text-white">
                    {produit.nom}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {produit.description}
                  </p>
                </div>
                <Badge ton="neutre">{produit.delai}</Badge>
              </div>

              <p className="chiffres font-titre text-xl font-extrabold text-slate-900 dark:text-white">
                {formatFcfa(produit.prix)}
                <span className="ml-1 text-xs font-semibold text-slate-500">/ {produit.unite}</span>
              </p>

              <Link
                href={lienWhatsApp(
                  `Bonjour Mesplats, je souhaite commander « ${produit.nom} » (${formatFcfa(produit.prix)} ${produit.unite}) pour ${nom}.`,
                  null,
                )}
                target="_blank"
                className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-feuille-600 px-4 text-sm font-semibold text-white transition hover:bg-feuille-700"
              >
                <MessageCircle className="size-4" aria-hidden />
                Commander par WhatsApp
              </Link>
            </CarteContenu>
          </Carte>
        ))}
      </div>

      <Carte>
        <CarteEntete
          titre="Ce qui est inclus dans chaque commande"
          description="Nous imprimons vos QR codes à partir de vos réglages, nous les testons, puis nous vous les livrons."
          icone={<Package className="size-4" aria-hidden />}
        />
        <CarteContenu>
          <ul className="grid gap-2 sm:grid-cols-2">
            {INCLUS.map((element) => (
              <li key={element} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Check className="mt-0.5 size-4 shrink-0 text-feuille-600" aria-hidden />
                {element}
              </li>
            ))}
          </ul>
        </CarteContenu>
      </Carte>

      <div className="grid gap-4 sm:grid-cols-2">
        <Carte>
          <CarteEntete
            titre="Imprimer vous-même"
            description="Vous avez déjà une imprimante ? Exportez vos QR codes en PNG ou en SVG, sans frais."
            icone={<Printer className="size-4" aria-hidden />}
          />
          <CarteContenu>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• Planche PDF A4 prête à imprimer : une carte par table.</li>
              <li>• Styles, couleurs et logo gérés depuis l&apos;écran « QR Code ».</li>
              <li>• Aucune limite : réimprimez autant de fois que nécessaire.</li>
            </ul>
            <Link href="/dashboard/tables/impression" className="mt-4 inline-block">
              <Bouton variante="contour" icone={<ExternalLink className="size-4" aria-hidden />}>
                Ouvrir la planche à imprimer
              </Bouton>
            </Link>
          </CarteContenu>
        </Carte>

        <Carte>
          <CarteEntete
            titre="Un besoin particulier ?"
            description="Format sur mesure, signalétique complète, plusieurs établissements ?"
            icone={<Sparkles className="size-4" aria-hidden />}
          />
          <CarteContenu>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Décrivez votre projet : nous vous répondons avec un devis et un délai ferme, par
              WhatsApp ou par téléphone.
            </p>
            <Link
              href={lienWhatsApp(
                "Bonjour Mesplats, j'ai un projet d'impression sur mesure à vous décrire :",
                null,
              )}
              target="_blank"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
            >
              <MessageCircle className="size-4" aria-hidden />
              Décrire mon projet
            </Link>
          </CarteContenu>
        </Carte>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Les tarifs ci-dessus couvrent l&apos;impression et la livraison à Abidjan. Pour la province,
        les frais de transport sont confirmés avant la fabrication.
      </p>
    </div>
  );
}
