import { ArrowLeft, Utensils } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormulaireConnexion } from "@/components/auth/formulaire-connexion";
import { utilisateurCourant } from "@/lib/auth/autorisation";
import { espaceParDefaut } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre back-office Mesplats.",
  robots: { index: false },
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ inscription?: string; reinitialise?: string }>;
}) {
  const parametres = await searchParams;

  // Un utilisateur déjà connecté n'a rien à faire ici.
  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect(espaceParDefaut(utilisateur.role));

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Panneau gauche : présentation (masqué sur mobile pour aller droit au but) */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-marque-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-feuille-500/15 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2 text-lg font-extrabold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-marque-500">
            <Utensils className="size-5" aria-hidden />
          </span>
          Mesplats
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-titre text-4xl leading-tight font-extrabold">
            Vos commandes arrivent plus vite que vous ne pouvez les servir.
          </h2>
          <p className="mt-4 text-slate-300">
            Menu QR, commandes sur place et à emporter, écran de service en temps réel et paiement
            mobile money. Pensé pour les restaurants de Côte d&apos;Ivoire et d&apos;Afrique de
            l&apos;Ouest.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[
              { valeur: "FCFA", libelle: "Prix affichés" },
              { valeur: "< 1 s", libelle: "Menu en 3G" },
              { valeur: "0", libelle: "Appli à installer" },
            ].map((element) => (
              <div key={element.libelle}>
                <dt className="font-titre text-2xl font-extrabold text-marque-300">{element.valeur}</dt>
                <dd className="mt-1 text-xs text-slate-400">{element.libelle}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative text-sm text-slate-400">
          Exemple de menu :{" "}
          <Link href="/m/maquis-le-baoule" className="font-semibold text-white underline">
            Maquis Le Baoulé
          </Link>
        </p>
      </section>

      {/* Panneau droit : formulaire */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800 lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour à l&apos;accueil
          </Link>

          <div className="mb-7 lg:hidden">
            <span className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span className="flex size-8 items-center justify-center rounded-lg bg-marque-500 text-white">
                <Utensils className="size-4" aria-hidden />
              </span>
              Mesplats
            </span>
          </div>

          <h1 className="font-titre text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Bon retour au restaurant
          </h1>
          <p className="mt-2 mb-6 text-slate-600">
            Connectez-vous pour gérer votre menu, vos tables et vos commandes.
          </p>

          <FormulaireConnexion
            messageInscription={parametres.inscription}
            messageReinitialise={parametres.reinitialise}
          />

          <div className="mt-8 rounded-2xl bg-slate-100 p-4 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            <p className="font-bold text-slate-800 dark:text-slate-200">Comptes de démonstration</p>
            <p className="mt-1">
              Propriétaire : <code className="font-mono">admin@demo.ci</code> /{" "}
              <code className="font-mono">Demo1234</code>
              <br />
              Serveur : <code className="font-mono">serveur@demo.ci</code> /{" "}
              <code className="font-mono">Demo1234</code>
              <br />
              Plateforme : <code className="font-mono">superadmin@mesplats.app</code> /{" "}
              <code className="font-mono">Super1234</code>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
