/**
 * Paiements — /dashboard/paiements
 *
 * Récapitulatif des encaissements mobile money (Orange Money, Moov, MTN, Wave)
 * et validation manuelle : le restaurant vérifie la réception de l'argent sur
 * son téléphone, puis valide ici — la page de suivi du client se met à jour
 * aussitôt. Les numéros affichés au client sont réglés dans les paramètres.
 */
import { ArrowRight, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ValidationPaiements } from "@/components/dashboard/validation-paiements";
import { Bouton } from "@/components/ui/bouton";
import { exigerRole } from "@/lib/auth/autorisation";
import { commandesDeService } from "@/lib/db/commandes";

export const metadata: Metadata = { title: "Paiements" };
export const dynamic = "force-dynamic";

export default async function PagePaiements() {
  const utilisateur = await exigerRole("admin");
  const commandes = await commandesDeService(utilisateur.restaurantId!);

  const initiales = commandes.map((commande) => ({
    id: commande.id,
    numero: commande.numero,
    type: commande.type,
    statut: commande.statut,
    tableNumero: commande.tableNumero,
    nomClient: commande.nomClient,
    telephoneClient: commande.telephoneClient,
    total: commande.total,
    modePaiement: commande.modePaiement,
    paiementStatut: commande.paiementStatut,
    createdAt: commande.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl font-extrabold text-slate-900 dark:text-white">
            Paiements
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Validation manuelle des paiements mobile money. Aucune commission, aucun intermédiaire :
            l&apos;argent arrive directement sur votre numéro.
          </p>
        </div>
        <Link href="/dashboard/parametres#paiements">
          <Bouton variante="contour" icone={<Smartphone className="size-4" aria-hidden />}>
            Modifier mes numéros
          </Bouton>
        </Link>
      </header>

      <ValidationPaiements
        commandesInitiales={initiales}
        devise={utilisateur.devise}
        peutValider
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Comment ça marche, en pratique ?
        </p>
        <ol className="mt-2 list-decimal space-y-1 ps-5">
          <li>
            Le client envoie le <strong>montant exact</strong> au numéro affiché sur sa page de suivi,
            en inscrivant le numéro de commande dans le motif.
          </li>
          <li>
            Il vous montre la capture d&apos;écran — ou vous l&apos;envoyez vous-même depuis WhatsApp.
          </li>
          <li>
            Vous vérifiez la réception, puis vous cliquez sur <strong>« Marquer le paiement reçu »</strong>.
          </li>
          <li>
            Le suivi du client affiche « Paiement confirmé » et son bon de commande reste complet dans
            le journal.
          </li>
        </ol>
        <Link
          href="/service"
          className="mt-3 inline-flex items-center gap-1.5 font-semibold text-slate-800 underline dark:text-slate-100"
        >
          Valider aussi depuis l&apos;écran de service
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
