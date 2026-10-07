/**
 * Suivi de commande côté client : /commande/[id]
 *
 * La page est publique (l'identifiant est un UUID imprévisible) et se met à jour
 * par polling toutes les 4 secondes. Elle affiche :
 *  • l'avancement en cuisine (frise de statuts) ;
 *  • les instructions de paiement mobile money avec le montant exact ;
 *  • les liens WhatsApp/SMS pré-remplis et le bouton « Appeler le serveur ».
 */
import { ArrowLeft, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SuiviCommande } from "@/components/site/suivi-commande";
import { commandePublique } from "@/lib/db/commandes";
import { contrasteSur } from "@/lib/utils";

type Proprietes = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false },
};

export default async function PageSuivi({ params }: Proprietes) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const commande = await commandePublique(id);
  if (!commande) notFound();

  const surCouleur = contrasteSur(commande.restaurant.couleur);

  return (
    <div
      className="min-h-dvh bg-slate-50 dark:bg-slate-950"
      style={{
        ["--couleur-principale" as string]: commande.restaurant.couleur,
        ["--couleur-sur-principale" as string]: surCouleur,
      }}
    >
      <header className="degrade-principal px-4 pt-6 pb-12 text-white">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/m/${commande.restaurant.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {commande.restaurant.nom}
          </Link>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
            <Timer className="size-3.5" aria-hidden />
            Commande n° {commande.numero}
          </p>

          <h1 className="mt-3 font-titre text-2xl font-extrabold tracking-tight sm:text-3xl">
            {commande.nomClient ? `Merci ${commande.nomClient} !` : "Merci !"} Votre commande est
            suivie en direct.
          </h1>
          <p className="mt-2 max-w-xl text-white/85">
            Cette page se met à jour toute seule : inutile de la recharger. Vous pouvez la garder
            ouverte pendant que vous attendez.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-7 max-w-2xl px-4 pb-16">
        <SuiviCommande
          commande={{
            id: commande.id,
            numero: commande.numero,
            statut: commande.statut,
            paiementStatut: commande.paiementStatut,
            modePaiement: commande.modePaiement,
            total: commande.total,
            type: commande.type,
            tableNumero: commande.tableNumero,
            nomClient: commande.nomClient,
            heureRetrait: commande.heureRetrait ? commande.heureRetrait.toISOString() : null,
            motifAnnulation: commande.motifAnnulation,
            appelServeurAt: commande.appelServeurAt ? commande.appelServeurAt.toISOString() : null,
            lignes: commande.lignes.map((ligne) => ({
              id: ligne.id,
              nom: ligne.nom,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
              options: ligne.options,
              note: ligne.note,
            })),
            note: commande.note,
          }}
          restaurant={{
            nom: commande.restaurant.nom,
            slug: commande.restaurant.slug,
            telephone: commande.restaurant.telephone,
            couleur: commande.restaurant.couleur,
            devise: commande.restaurant.devise,
          }}
          moyensPaiement={commande.moyensPaiement.map((moyen) => ({
            operateur: moyen.operateur,
            numero: moyen.numero,
            titulaire: moyen.titulaire,
          }))}
        />
      </main>
    </div>
  );
}
