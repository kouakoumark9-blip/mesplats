/**
 * Boutique publique — /boutique
 * ---------------------------------------------------------------------------
 * Vitrine accessible SANS compte : un restaurateur (ou un prospect) parcourt
 * les supports imprimés, compose son tirage, voit la dégressivité des prix et
 * met ses articles au panier. Pour envoyer la commande, il crée son compte :
 * le panier est conservé dans sa session et le retrouve dans son espace.
 *
 * Si un propriétaire est déjà connecté, la page se comporte comme la boutique
 * de son espace : il peut commander directement et retrouver ses devis.
 */
import type { Metadata } from "next";

import { CatalogueBoutique } from "@/components/boutique/catalogue-boutique";
import { EnteteSite } from "@/components/site/entete-site";
import { PiedDePage } from "@/components/site/pied-de-page";
import { utilisateurCourant } from "@/lib/auth/autorisation";
import { chiffresBoutique, commandesBoutique } from "@/lib/db/boutique";
import { formatTelephone, formatFcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Boutique : supports imprimés pour votre menu QR",
  description:
    "Chevalets de table, stickers autocollants, sous-bocks, sets de table et affiches avec votre QR code imprimé. Prix dégressifs en FCFA, livraison à Abidjan sous 72 h.",
};

export const dynamic = "force-dynamic";

export default async function PageBoutiquePublique() {
  const utilisateur = await utilisateurCourant();
  const estProprietaire = utilisateur?.role === "admin" && Boolean(utilisateur.restaurantId);

  const [commandes, chiffres] = estProprietaire
    ? await Promise.all([
        commandesBoutique(utilisateur!.restaurantId!),
        chiffresBoutique(utilisateur!.restaurantId!),
      ])
    : [[], { total: 0, enCours: 0, montant: 0, dernierAt: null }];

  return (
    <div className="min-h-dvh bg-slate-50">
      <EnteteSite />

      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Bandeau d'accueil spécifique à la vitrine */}
          <p className="mb-6 rounded-3xl border border-marque-200 bg-marque-50 px-5 py-4 text-sm text-marque-900">
            <strong className="font-titre font-extrabold">Comment ça marche ?</strong> Composez votre
            tirage ci-dessous (quantité, options), ajoutez-le au panier, puis créez votre compte pour
            envoyer la demande. Nous confirmons le devis et le délai sur WhatsApp — aucune passerelle
            de paiement. Livraison à Abidjan sous 72 h, expédition en province par transporteur.
          </p>

          <CatalogueBoutique
            mode="public"
            connecte={estProprietaire}
            commandes={commandes.map((commande) => ({
              id: commande.id,
              reference: commande.reference,
              total: commande.total,
              ville: commande.ville,
              statut: commande.statut,
              createdAt: commande.createdAt.toISOString(),
              articles: commande.articles.map((article) => ({
                nom: article.nom,
                quantite: article.quantite,
              })),
            }))}
            profil={{
              nomRestaurant: utilisateur?.restaurantNom ?? "",
              ville: null,
              adresse: null,
              telephone: utilisateur?.telephoneRestaurant
                ? formatTelephone(utilisateur.telephoneRestaurant).replace(/^\+\d+\s?/, "")
                : null,
            }}
            chiffres={{
              total: chiffres.total,
              enCours: chiffres.enCours,
              montant: chiffres.montant,
            }}
          />

          {/* Rappel tarifaire utile aux prospects (et aux moteurs de recherche) */}
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                titre: "Livraison à Abidjan sous 72 h",
                detail: "Expédition en province par transporteur, frais confirmés dans le devis.",
              },
              {
                titre: "Aucun frais d'impression caché",
                detail: `Impression, test du QR au scan et livraison inclus dès ${formatFcfa(500)} l'unité.`,
              },
              {
                titre: "Vos QR codes, vos couleurs",
                detail: "Les supports reprennent le style, la couleur et le logo de votre carte Mesplats.",
              },
            ].map((element) => (
              <div
                key={element.titre}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <p className="font-titre font-extrabold text-slate-900">{element.titre}</p>
                <p className="mt-1 text-sm text-slate-600">{element.detail}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <PiedDePage />
    </div>
  );
}
