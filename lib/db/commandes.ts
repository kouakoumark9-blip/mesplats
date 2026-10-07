/**
 * Lecture des commandes — TOUJOURS filtrée par `restaurant_id`.
 * ---------------------------------------------------------------------------
 * Trois usages :
 *  • la page publique de suivi (`/commande/[id]`) : une commande par son UUID,
 *    avec son restaurant, ses lignes et les moyens de paiement à afficher ;
 *  • l'écran de service : les commandes du jour du restaurant, du plus récent ;
 *  • les statistiques du back-office : compteurs du jour et plats les plus
 *    vendus (étape 7).
 */
import { and, asc, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  paymentMethods,
  restaurants,
  tables,
  type OptionCommande,
} from "@/lib/db/schema";
import { STATUTS_ACTIFS, type Statut, type TypeCommande } from "@/lib/constants";
import { bornesJour } from "@/lib/utils";

export type LigneAffichee = {
  id: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  options: OptionCommande[];
  note: string | null;
};

export type CommandeAffichee = {
  id: string;
  numero: number;
  type: TypeCommande;
  statut: Statut;
  tableNumero: string | null;
  nomClient: string | null;
  telephoneClient: string | null;
  total: number;
  modePaiement: string | null;
  paiementStatut: string;
  heureRetrait: Date | null;
  note: string | null;
  motifAnnulation: string | null;
  appelServeurAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lignes: LigneAffichee[];
};

function assembler(
  commande: Omit<CommandeAffichee, "lignes">,
  lignes: (LigneAffichee & { orderId: string })[],
): CommandeAffichee {
  return {
    ...commande,
    // Le champ technique `orderId` ne fait pas partie de l'objet affiché.
    lignes: lignes
      .filter((ligne) => ligne.orderId === commande.id)
      .map((ligne) => ({
        id: ligne.id,
        nom: ligne.nom,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        options: ligne.options,
        note: ligne.note,
      })),
  };
}

/** Colonnes communes aux listes de commandes. */
const COLONNES = {
  id: orders.id,
  numero: orders.numero,
  type: orders.type,
  statut: orders.statut,
  tableNumero: tables.numero,
  nomClient: orders.nomClient,
  telephoneClient: orders.telephoneClient,
  total: orders.total,
  modePaiement: orders.modePaiement,
  paiementStatut: orders.paiementStatut,
  heureRetrait: orders.heureRetrait,
  note: orders.note,
  motifAnnulation: orders.motifAnnulation,
  appelServeurAt: orders.appelServeurAt,
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
} as const;

/**
 * Commandes de service d'un restaurant : tout ce qui n'est pas terminé
 * (nouvelle → prête) plus les commandes du jour déjà servies ou annulées, afin
 * que le personnel garde une trace de la journée sur le même écran.
 */
export async function commandesDeService(
  restaurantId: string,
  limite = 60,
): Promise<CommandeAffichee[]> {
  const { debut } = bornesJour();

  const lignesCommandes = await db
    .select(COLONNES)
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        or(inArray(orders.statut, STATUTS_ACTIFS), gte(orders.createdAt, debut)),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(limite);

  if (lignesCommandes.length === 0) return [];

  const articles = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      nom: orderItems.nom,
      quantite: orderItems.quantite,
      prixUnitaire: orderItems.prixUnitaire,
      options: orderItems.options,
      note: orderItems.note,
    })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        lignesCommandes.map((c) => c.id),
      ),
    )
    .orderBy(asc(orderItems.nom));

  return lignesCommandes.map((commande) => assembler(commande, articles));
}

/** Détail d'une commande + informations publiques du restaurant (page de suivi). */
export async function commandePublique(id: string) {
  const [entete] = await db
    .select({
      ...COLONNES,
      restaurantId: orders.restaurantId,
      restaurantNom: restaurants.nom,
      restaurantSlug: restaurants.slug,
      restaurantTelephone: restaurants.telephone,
      restaurantCouleur: restaurants.couleurPrincipale,
      restaurantLogo: restaurants.logo,
      devise: restaurants.devise,
    })
    .from(orders)
    .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!entete) return null;

  const [articles, moyens] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        nom: orderItems.nom,
        quantite: orderItems.quantite,
        prixUnitaire: orderItems.prixUnitaire,
        options: orderItems.options,
        note: orderItems.note,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .orderBy(asc(orderItems.nom)),
    db
      .select({
        operateur: paymentMethods.operateur,
        numero: paymentMethods.numero,
        titulaire: paymentMethods.titulaire,
      })
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.restaurantId, entete.restaurantId),
          eq(paymentMethods.actif, true),
        ),
      ),
  ]);

  return {
    ...assembler(entete, articles),
    restaurant: {
      id: entete.restaurantId,
      nom: entete.restaurantNom,
      slug: entete.restaurantSlug,
      telephone: entete.restaurantTelephone,
      couleur: entete.restaurantCouleur,
      logo: entete.restaurantLogo,
      devise: entete.devise,
    },
    moyensPaiement: moyens,
  };
}

/** Compteurs utilisés par l'anti-spam : commandes actives et récentes. */
export async function compterCommandesTelephone(
  restaurantId: string,
  telephone: string,
): Promise<{ actives: number; derniereHeure: number }> {
  const [resultat] = await db
    .select({
      actives: sql<number>`count(*) filter (where ${inArray(orders.statut, STATUTS_ACTIFS)})::int`,
      derniereHeure: sql<number>`count(*) filter (where ${orders.createdAt} >= now() - interval '1 hour')::int`,
    })
    .from(orders)
    .where(and(eq(orders.restaurantId, restaurantId), eq(orders.telephoneClient, telephone)));

  return {
    actives: resultat?.actives ?? 0,
    derniereHeure: resultat?.derniereHeure ?? 0,
  };
}

/** Statistiques du jour : commandes, chiffre d'affaires, panier moyen. */
export async function statsJour(restaurantId: string) {
  const { debut, fin } = bornesJour();

  const [totaux] = await db
    .select({
      commandes: sql<number>`count(*)::int`,
      chiffre: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      annulees: sql<number>`count(*) filter (where ${orders.statut} = 'annulee')::int`,
      enCours: sql<number>`count(*) filter (where ${inArray(orders.statut, STATUTS_ACTIFS)})::int`,
      encaisse: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.paiementStatut} = 'paye'), 0)::int`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.createdAt, debut),
        lt(orders.createdAt, fin),
      ),
    );

  const commandes = totaux?.commandes ?? 0;
  return {
    commandes,
    chiffre: totaux?.chiffre ?? 0,
    annulees: totaux?.annulees ?? 0,
    enCours: totaux?.enCours ?? 0,
    encaisse: totaux?.encaisse ?? 0,
    panierMoyen: commandes > 0 ? Math.round((totaux?.chiffre ?? 0) / commandes) : 0,
  };
}

/** Plats les plus vendus du jour (nom, quantité, montant). */
export async function topProduitsJour(restaurantId: string, limite = 5) {
  const { debut, fin } = bornesJour();

  return db
    .select({
      nom: orderItems.nom,
      quantite: sql<number>`sum(${orderItems.quantite})::int`,
      montant: sql<number>`sum(${orderItems.quantite} * ${orderItems.prixUnitaire})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        sql`${orders.statut} <> 'annulee'`,
        gte(orders.createdAt, debut),
        lt(orders.createdAt, fin),
      ),
    )
    .groupBy(orderItems.nom)
    .orderBy(desc(sql`sum(${orderItems.quantite})`))
    .limit(limite);
}

/** Ventes des sept derniers jours (histogramme simple du tableau de bord). */
export async function ventesSeptJours(restaurantId: string) {
  return db
    .select({
      jour: sql<string>`to_char(${orders.createdAt} at time zone 'Africa/Abidjan', 'YYYY-MM-DD')`,
      commandes: sql<number>`count(*)::int`,
      montant: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        sql`${orders.statut} <> 'annulee'`,
        gte(orders.createdAt, sql`now() - interval '7 days'`),
      ),
    )
    .groupBy(sql`to_char(${orders.createdAt} at time zone 'Africa/Abidjan', 'YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(${orders.createdAt} at time zone 'Africa/Abidjan', 'YYYY-MM-DD')`));
}

/**
 * Journal des commandes du back-office, filtrable par statut et par type.
 * Sert à l'écran « Commandes » (historique du jour et des jours précédents).
 */
export async function commandesHistorique(
  restaurantId: string,
  filtres: { statut?: Statut; type?: TypeCommande; limite?: number } = {},
): Promise<CommandeAffichee[]> {
  const conditions = [eq(orders.restaurantId, restaurantId)];
  if (filtres.statut) conditions.push(eq(orders.statut, filtres.statut));
  if (filtres.type) conditions.push(eq(orders.type, filtres.type));

  const entetes = await db
    .select(COLONNES)
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(filtres.limite ?? 100);

  if (entetes.length === 0) return [];

  const articles = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      nom: orderItems.nom,
      quantite: orderItems.quantite,
      prixUnitaire: orderItems.prixUnitaire,
      options: orderItems.options,
      note: orderItems.note,
    })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        entetes.map((entete) => entete.id),
      ),
    )
    .orderBy(asc(orderItems.nom));

  return entetes.map((entete) => assembler(entete, articles));
}
