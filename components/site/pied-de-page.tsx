import { Mail, MapPin, MessageCircle, Utensils } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { LIBELLES_PAIEMENT } from "@/lib/constants";

const COLONNES = [
  {
    titre: "Produit",
    liens: [
      { libelle: "Comment ça marche", href: "#fonctionnement" },
      { libelle: "Fonctionnalités", href: "#fonctionnalites" },
      { libelle: "QR codes de table", href: "#qr" },
      { libelle: "Tarifs", href: "#tarifs" },
    ],
  },
  {
    titre: "Restaurateurs",
    liens: [
      { libelle: "Créer mon restaurant", href: "/inscription" },
      { libelle: "Se connecter", href: "/connexion" },
      { libelle: "Écran de service", href: "/service" },
      { libelle: "Espace plateforme", href: "/admin" },
    ],
  },
  {
    titre: "Démo",
    liens: [
      { libelle: "Menu du Maquis Le Baoulé", href: "/m/maquis-le-baoule" },
      { libelle: "Menu de la table 2", href: "/m/maquis-le-baoule/t/2" },
      { libelle: "Chez Tantie Fanta", href: "/m/chez-tantie-fanta" },
    ],
  },
];

export function PiedDePage() {
  return (
    <footer className="bg-slate-950 pt-14 pb-28 text-slate-400 sm:pb-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Marque */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-marque-500 text-white">
                <Utensils className="size-5" aria-hidden />
              </span>
              <span className="font-titre text-lg font-extrabold tracking-tight text-white">
                AfriMenu
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Menu QR, commandes sur place et à emporter, écran de service en temps réel. Conçu pour
              les restaurants de Côte d&apos;Ivoire et d&apos;Afrique de l&apos;Ouest.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <a
                href="mailto:support@afrimenu.app"
                className="flex items-center gap-2 transition hover:text-white"
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

          {/* Colonnes de liens */}
          {COLONNES.map((colonne) => (
            <div key={colonne.titre}>
              <h3 className="font-titre text-sm font-bold tracking-wide text-white uppercase">
                {colonne.titre}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {colonne.liens.map((lien) => (
                  <li key={lien.href}>
                    <Link href={lien.href} className="transition hover:text-white">
                      {lien.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Paiements acceptés */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Moyens de paiement pris en charge
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["orange", "moov", "mtn", "especes"] as const).map((mode) => (
              <Badge key={mode} ton="neutre" className="bg-white/5 text-slate-300">
                {LIBELLES_PAIEMENT[mode]}
              </Badge>
            ))}
            <Badge ton="neutre" className="bg-white/5 text-slate-300">
              Prix affichés en FCFA (XOF)
            </Badge>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} AfriMenu — Abidjan, Côte d&apos;Ivoire. Tous droits réservés.
          </p>
          <p className="text-slate-500">
            AfriMenu est un outil de gestion : il ne prélève aucune commission sur vos ventes.
          </p>
        </div>
      </div>
    </footer>
  );
}
