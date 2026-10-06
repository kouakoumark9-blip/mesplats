import { Mail, MapPin, MessageCircle, Smartphone } from "lucide-react";
import Link from "next/link";

import { LogoAfriMenu } from "@/components/site/logo";
import { Badge } from "@/components/ui/badge";
import { LIBELLES_PAIEMENT } from "@/lib/constants";

const COLONNES = [
  {
    titre: "Produit",
    liens: [
      { libelle: "QR codes de table", href: "#qr" },
      { libelle: "Tarifs", href: "#tarifs" },
      { libelle: "Questions fréquentes", href: "#questions" },
    ],
  },
  {
    titre: "Restaurateurs",
    liens: [
      { libelle: "Créer mon menu", href: "/inscription" },
      { libelle: "Se connecter", href: "/connexion" },
      { libelle: "Écran de service", href: "/service" },
      { libelle: "Espace plateforme", href: "/admin" },
    ],
  },
  {
    titre: "Démonstration",
    liens: [
      { libelle: "Menu du Maquis Le Baoulé", href: "/m/maquis-le-baoule" },
      { libelle: "Menu de la table 2", href: "/m/maquis-le-baoule/t/2" },
      { libelle: "Chez Tantie Fanta", href: "/m/chez-tantie-fanta" },
    ],
  },
];

export function PiedDePage() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 pt-16 pb-28 sm:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <LogoAfriMenu />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Menu QR, commandes sur place et à emporter, écran de service en temps réel. Conçu à
              Abidjan pour les restaurants de Côte d&apos;Ivoire et d&apos;Afrique de l&apos;Ouest.
            </p>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <a
                href="mailto:support@afrimenu.app"
                className="flex items-center gap-2 transition hover:text-slate-900"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                support@afrimenu.app
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden />
                Abidjan, Côte d&apos;Ivoire
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="size-4 shrink-0" aria-hidden />
                Support WhatsApp du lundi au samedi
              </span>
            </div>
          </div>

          {COLONNES.map((colonne) => (
            <div key={colonne.titre}>
              <h3 className="font-titre text-sm font-bold tracking-wide text-slate-900 uppercase">
                {colonne.titre}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {colonne.liens.map((lien) => (
                  <li key={lien.href}>
                    <Link href={lien.href} className="text-slate-600 transition hover:text-slate-900">
                      {lien.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Moyens de paiement pris en charge
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["orange", "moov", "mtn", "especes"] as const).map((mode) => (
              <Badge key={mode} ton="neutre" className="bg-white ring-1 ring-slate-200">
                {LIBELLES_PAIEMENT[mode]}
              </Badge>
            ))}
            <Badge ton="neutre" className="bg-white ring-1 ring-slate-200">
              <Smartphone className="size-3.5" aria-hidden />
              Application PWA installable
            </Badge>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AfriMenu — Abidjan, Côte d&apos;Ivoire. Tous droits réservés.</p>
          <p>AfriMenu est un outil de gestion : aucune commission n&apos;est prélevée sur vos ventes.</p>
        </div>
      </div>
    </footer>
  );
}
