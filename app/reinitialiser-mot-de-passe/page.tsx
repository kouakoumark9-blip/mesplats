import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CoqueAuth } from "@/components/auth/coque-auth";
import { FormulaireReinitialisation } from "@/components/auth/formulaire-reinitialisation";
import { jetonValide } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false },
};

export default async function PageReinitialisation({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string }>;
}) {
  const { jeton = "" } = await searchParams;
  const valide = await jetonValide(jeton);

  if (!valide) {
    return (
      <CoqueAuth
        titre="Lien expiré ou déjà utilisé"
        sousTitre="Par sécurité, les liens de réinitialisation ne sont valables que 30 minutes et ne fonctionnent qu'une seule fois."
        pied={
          <>
            Besoin d&apos;un nouveau lien ?{" "}
            <Link href="/mot-de-passe-oublie" className="font-bold text-marque-600 hover:underline">
              Refaire la demande
            </Link>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Vérifiez que le lien reçu est complet (il tient parfois sur deux lignes dans les
            applications de messagerie), puis demandez-en un nouveau si besoin.
          </p>
        </div>
      </CoqueAuth>
    );
  }

  return (
    <CoqueAuth
      titre="Choisissez un nouveau mot de passe"
      sousTitre="Il remplacera immédiatement l'ancien : vous pourrez vous connecter avec dès l'enregistrement."
      pied={
        <>
          <Link href="/connexion" className="font-bold text-marque-600 hover:underline">
            Retour à la connexion
          </Link>
        </>
      }
    >
      <FormulaireReinitialisation jeton={jeton} />
    </CoqueAuth>
  );
}
