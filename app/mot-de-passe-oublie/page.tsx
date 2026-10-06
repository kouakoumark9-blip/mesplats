import { MailQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CoqueAuth } from "@/components/auth/coque-auth";
import { FormulaireMotDePasseOublie } from "@/components/auth/formulaire-mot-de-passe-oublie";
import { utilisateurCourant } from "@/lib/auth/autorisation";
import { espaceParDefaut } from "@/lib/auth/roles";
import { emailConfigure } from "@/lib/email";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Recevez un lien sécurisé pour choisir un nouveau mot de passe Mesplats.",
  robots: { index: false },
};

export default async function PageMotDePasseOublie() {
  const utilisateur = await utilisateurCourant();
  if (utilisateur) redirect(espaceParDefaut(utilisateur.role));

  return (
    <CoqueAuth
      titre="Mot de passe oublié ?"
      sousTitre="Indiquez l'adresse email de votre compte : nous vous envoyons un lien valable 30 minutes pour choisir un nouveau mot de passe."
      pied={
        <>
          Vous vous en souvenez finalement ?{" "}
          <Link href="/connexion" className="font-bold text-marque-600 hover:underline">
            Revenir à la connexion
          </Link>
        </>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        <MailQuestion className="mt-0.5 size-4 shrink-0 text-marque-600" aria-hidden />
        <p>
          {emailConfigure()
            ? "Le message part du service d'e-mail de Mesplats. Pensez à regarder vos courriers indésirables."
            : "Cette installation n'a pas encore de service d'e-mail : le lien vous sera affiché directement après la demande."}
        </p>
      </div>

      <FormulaireMotDePasseOublie />
    </CoqueAuth>
  );
}
