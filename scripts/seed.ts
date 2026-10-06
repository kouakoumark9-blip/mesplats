/**
 * Script de peuplement (seed) — Mesplats
 * ---------------------------------------------------------------------------
 * Crée deux restaurants de démonstration complets :
 *   1. « Maquis Le Baoulé » (/m/maquis-le-baoule) : 3 catégories, 10 produits
 *      (dont options et un produit épuisé), 5 tables, moyens de paiement,
 *      4 comptes d'équipe et des commandes du jour pour alimenter les
 *      statistiques et l'écran de service.
 *   2. « Chez Tantie Fanta » (/m/chez-tantie-fanta) : sert à vérifier
 *      l'isolation multi-tenant (données strictement séparées).
 *
 * Lancement :  npm run db:seed
 * Le script est idempotent : il supprime puis recrée les restaurants de démo.
 */
import "./charger-env";
import { eq, inArray } from "drizzle-orm";

import { hacherMotDePasse } from "@/lib/auth/password";
import { db, sql as client } from "@/lib/db";
import {
  categories,
  orderItems,
  orders,
  paymentMethods,
  productOptions,
  products,
  restaurants,
  tables,
  users,
} from "@/lib/db/schema";

/* -------------------------------------------------------------------------- */
/*                            Données de démonstration                        */
/* -------------------------------------------------------------------------- */

type OptionSeed = { nom: string; supplementPrix: number };
type ProduitSeed = {
  nom: string;
  description: string;
  prix: number;
  options?: OptionSeed[];
  disponible?: boolean;
  /** Chemin public de la photo (voir /public/plats). */
  photo?: string;
};
type CategorieSeed = { nom: string; ordre: number; produits: ProduitSeed[] };

const CATALOGUE_DEMO: CategorieSeed[] = [
  {
    nom: "Plats ivoiriens",
    ordre: 1,
    produits: [
      {
        nom: "Attiéké poisson braisé",
        description:
          "Attiéké frais servi avec un poisson braisé entier, oignons et tomates fraîches.",
        prix: 2500,
        photo: "/plats/attieke-poisson.jpg",
        options: [
          { nom: "Piment vert écrasé", supplementPrix: 200 },
          { nom: "Supplément poisson", supplementPrix: 1500 },
        ],
      },
      {
        nom: "Sauce graine + riz",
        description: "Sauce graine onctueuse au poisson fumé, accompagnée de riz blanc.",
        prix: 2000,
      },
      {
        nom: "Kedjenou de poulet",
        description: "Poulet mijoté à l'étouffée avec tomates, oignons et épices maison.",
        prix: 3000,
        photo: "/plats/kedjenou-poulet.jpg",
        options: [{ nom: "Portion supplémentaire d'attiéké", supplementPrix: 500 }],
      },
      {
        nom: "Riz gras",
        description: "Riz cuisiné dans son bouillon avec légumes et morceaux de viande.",
        prix: 1500,
      },
    ],
  },
  {
    nom: "Grillades & braisés",
    ordre: 2,
    produits: [
      {
        nom: "Poulet braisé entier",
        description: "Poulet mariné braisé au charbon, servi avec alloco et attiéké.",
        prix: 5000,
        options: [
          { nom: "Alloco supplémentaire", supplementPrix: 500 },
          { nom: "Attiéké supplémentaire", supplementPrix: 500 },
        ],
      },
      {
        nom: "Brochettes de bœuf",
        description: "Deux brochettes de bœuf grillées, piment et oignons grillés.",
        prix: 1000,
        options: [{ nom: "Piment fort", supplementPrix: 100 }],
      },
      {
        nom: "Poisson braisé (carpe)",
        description: "Carpe braisée au charbon, marinée aux épices locales.",
        prix: 3000,
        // Démonstration du bouton « épuisé ».
        disponible: false,
      },
      {
        nom: "Alloco",
        description: "Bananes plantain frites, sauce tomate épicée maison.",
        prix: 500,
        photo: "/plats/alloco.jpg",
      },
    ],
  },
  {
    nom: "Boissons",
    ordre: 3,
    produits: [
      {
        nom: "Bissap frais",
        description: "Infusion d'hibiscus glacée, légèrement sucrée.",
        prix: 500,
        photo: "/plats/bissap.jpg",
      },
      {
        nom: "Jus de gingembre",
        description: "Jus de gingembre frais pressé, tonique et piquant.",
        prix: 500,
      },
    ],
  },
];

const CATALOGUE_TANTIE: CategorieSeed[] = [
  {
    nom: "Spécialités",
    ordre: 1,
    produits: [
      {
        nom: "Soupe de poisson",
        description: "Soupe de poisson frais au piment et au gombo.",
        prix: 2500,
      },
      { nom: "Riz sauce arachide", description: "Riz blanc, sauce arachide au poulet.", prix: 1800 },
      { nom: "Attiéké thon", description: "Attiéké servi avec thon braisé.", prix: 2200 },
    ],
  },
  {
    nom: "Boissons",
    ordre: 2,
    produits: [{ nom: "Eau minérale 1,5 L", description: "Bouteille d'eau fraîche.", prix: 500 }],
  },
];

/* -------------------------------------------------------------------------- */
/*                                   Utilitaires                              */
/* -------------------------------------------------------------------------- */

async function supprimerRestaurant(slug: string) {
  const [existant] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);
  if (!existant) return;

  // Les contraintes ON DELETE CASCADE nettoient le reste (produits, tables…).
  const commandes = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.restaurantId, existant.id));
  if (commandes.length > 0) {
    await db.delete(orderItems).where(
      inArray(
        orderItems.orderId,
        commandes.map((c) => c.id),
      ),
    );
    await db.delete(orders).where(eq(orders.restaurantId, existant.id));
  }
  await db.delete(users).where(eq(users.restaurantId, existant.id));
  await db.delete(restaurants).where(eq(restaurants.id, existant.id));
  console.log(`   ↳ ancienne version de « ${slug} » supprimée`);
}

async function creerCatalogue(restaurantId: string, catalogue: CategorieSeed[]) {
  const produitsCrees = new Map<string, { id: string; nom: string; prix: number }>();

  for (const categorie of catalogue) {
    const [creee] = await db
      .insert(categories)
      .values({ restaurantId, nom: categorie.nom, ordre: categorie.ordre })
      .returning({ id: categories.id });

    let ordre = 1;
    for (const produit of categorie.produits) {
      const [cree] = await db
        .insert(products)
        .values({
          restaurantId,
          categoryId: creee.id,
          nom: produit.nom,
          description: produit.description,
          prix: produit.prix,
          photo: produit.photo ?? null,
          disponible: produit.disponible ?? true,
          ordre: ordre++,
        })
        .returning({ id: products.id });

      if (produit.options?.length) {
        await db.insert(productOptions).values(
          produit.options.map((option, index) => ({
            productId: cree.id,
            nom: option.nom,
            supplementPrix: option.supplementPrix,
            ordre: index + 1,
          })),
        );
      }

      produitsCrees.set(produit.nom, { id: cree.id, nom: produit.nom, prix: produit.prix });
    }
  }

  return produitsCrees;
}

/* -------------------------------------------------------------------------- */
/*                                    Seed                                    */
/* -------------------------------------------------------------------------- */

async function semer() {
  console.log("\n🌱  Mesplats — peuplement de la base de données\n");

  await supprimerRestaurant("maquis-le-baoule");
  await supprimerRestaurant("chez-tantie-fanta");

  const [mdpDemo, mdpSuper, mdpTantie] = await Promise.all([
    hacherMotDePasse("Demo1234"),
    hacherMotDePasse("Super1234"),
    hacherMotDePasse("Demo1234"),
  ]);

  /* ------------------------- 1. Maquis Le Baoulé ------------------------- */

  const [demo] = await db
    .insert(restaurants)
    .values({
      nom: "Maquis Le Baoulé",
      slug: "maquis-le-baoule",
      couleurPrincipale: "#E4572E",
      adresse: "Rue des Jardins, Cocody — Abidjan",
      telephone: "+225 07 07 12 34 56",
      horaires: "Tous les jours de 11h00 à 23h00",
      devise: "FCFA",
      plan: "pro",
      actif: true,
    })
    .returning();

  const produitsDemo = await creerCatalogue(demo.id, CATALOGUE_DEMO);

  const tablesDemo = await db
    .insert(tables)
    .values([1, 2, 3, 4, 5].map((n) => ({ restaurantId: demo.id, numero: String(n) })))
    .returning({ id: tables.id, numero: tables.numero });

  await db.insert(paymentMethods).values([
    {
      restaurantId: demo.id,
      operateur: "orange" as const,
      numero: "+225 07 07 12 34 56",
      titulaire: "Maquis Le Baoulé",
    },
    {
      restaurantId: demo.id,
      operateur: "moov" as const,
      numero: "+225 01 02 03 04 05",
      titulaire: "Maquis Le Baoulé",
    },
    {
      restaurantId: demo.id,
      operateur: "mtn" as const,
      numero: "+225 05 05 05 05 05",
      titulaire: "Maquis Le Baoulé",
    },
  ]);

  await db.insert(users).values([
    {
      restaurantId: demo.id,
      nom: "Awa Konan",
      email: "admin@demo.ci",
      motDePasseHash: mdpDemo,
      role: "admin" as const,
    },
    {
      restaurantId: demo.id,
      nom: "Yao Serge",
      email: "serveur@demo.ci",
      motDePasseHash: mdpDemo,
      role: "serveur" as const,
    },
    {
      restaurantId: demo.id,
      nom: "Aya Traoré",
      email: "cuisine@demo.ci",
      motDePasseHash: mdpDemo,
      role: "cuisine" as const,
    },
  ]);

  /* --------------------------- Commandes du jour -------------------------- */

  const maintenant = new Date();
  const ilYA = (minutes: number) => new Date(maintenant.getTime() - minutes * 60_000);
  const dans_ = (minutes: number) => new Date(maintenant.getTime() + minutes * 60_000);

  const p = (nom: string) => {
    const produit = produitsDemo.get(nom);
    if (!produit) throw new Error(`Produit de démonstration introuvable : ${nom}`);
    return produit;
  };

  const commandesSeed = [
    {
      numero: 1,
      type: "sur_place" as const,
      tableId: tablesDemo[1].id,
      nomClient: "Awa",
      telephoneClient: "+2250707120001",
      statut: "servie" as const,
      modePaiement: "especes" as const,
      paiementStatut: "paye" as const,
      createdAt: ilYA(185),
      lignes: [
        { produit: p("Attiéké poisson braisé"), quantite: 1, options: [{ nom: "Piment vert écrasé", prix: 200 }] },
        { produit: p("Bissap frais"), quantite: 2, options: [] },
      ],
    },
    {
      numero: 2,
      type: "emporter" as const,
      tableId: null,
      nomClient: "Koffi",
      telephoneClient: "+2250707120002",
      statut: "servie" as const,
      modePaiement: "orange" as const,
      paiementStatut: "paye" as const,
      createdAt: ilYA(120),
      lignes: [
        { produit: p("Poulet braisé entier"), quantite: 1, options: [{ nom: "Alloco supplémentaire", prix: 500 }] },
        { produit: p("Jus de gingembre"), quantite: 1, options: [] },
      ],
    },
    {
      numero: 3,
      type: "sur_place" as const,
      tableId: tablesDemo[3].id,
      nomClient: "Fatou",
      telephoneClient: "+2250707120003",
      statut: "en_preparation" as const,
      modePaiement: "moov" as const,
      paiementStatut: "paye" as const,
      createdAt: ilYA(35),
      lignes: [
        { produit: p("Kedjenou de poulet"), quantite: 2, options: [{ nom: "Portion supplémentaire d'attiéké", prix: 500 }] },
      ],
      note: "Pas trop de piment s'il vous plaît.",
    },
    {
      numero: 4,
      type: "sur_place" as const,
      tableId: tablesDemo[2].id,
      nomClient: "Ibrahim",
      telephoneClient: "+2250707120004",
      statut: "nouvelle" as const,
      modePaiement: "especes" as const,
      paiementStatut: "en_attente" as const,
      createdAt: ilYA(6),
      lignes: [
        { produit: p("Brochettes de bœuf"), quantite: 4, options: [{ nom: "Piment fort", prix: 100 }] },
        { produit: p("Alloco"), quantite: 2, options: [] },
      ],
    },
    {
      numero: 5,
      type: "emporter" as const,
      tableId: null,
      nomClient: "Mariam",
      telephoneClient: "+2250707120005",
      statut: "nouvelle" as const,
      modePaiement: "mtn" as const,
      paiementStatut: "en_attente" as const,
      createdAt: ilYA(2),
      heureRetrait: dans_(28),
      lignes: [
        { produit: p("Sauce graine + riz"), quantite: 2, options: [] },
        { produit: p("Riz gras"), quantite: 1, options: [] },
      ],
      note: "Commande à retirer vers 13h.",
    },
    {
      numero: 6,
      type: "emporter" as const,
      tableId: null,
      nomClient: "Client de passage",
      telephoneClient: "+2250707120006",
      statut: "annulee" as const,
      modePaiement: "orange" as const,
      paiementStatut: "en_attente" as const,
      createdAt: ilYA(95),
      motifAnnulation: "Produit épuisé, le client a été remboursé.",
      lignes: [{ produit: p("Alloco"), quantite: 1, options: [] }],
    },
  ];

  for (const commande of commandesSeed) {
    const total = commande.lignes.reduce(
      (somme, ligne) =>
        somme +
        (ligne.produit.prix + ligne.options.reduce((s, o) => s + o.prix, 0)) * ligne.quantite,
      0,
    );

    const [creee] = await db
      .insert(orders)
      .values({
        numero: commande.numero,
        restaurantId: demo.id,
        type: commande.type,
        tableId: commande.tableId,
        nomClient: commande.nomClient,
        telephoneClient: commande.telephoneClient,
        statut: commande.statut,
        total,
        modePaiement: commande.modePaiement,
        paiementStatut: commande.paiementStatut,
        heureRetrait: "heureRetrait" in commande ? commande.heureRetrait : null,
        note: "note" in commande ? (commande.note as string) : null,
        motifAnnulation:
          "motifAnnulation" in commande ? (commande.motifAnnulation as string) : null,
        createdAt: commande.createdAt,
        updatedAt: commande.createdAt,
      })
      .returning({ id: orders.id });

    await db.insert(orderItems).values(
      commande.lignes.map((ligne) => ({
        orderId: creee.id,
        productId: ligne.produit.id,
        nom: ligne.produit.nom,
        quantite: ligne.quantite,
        prixUnitaire: ligne.produit.prix,
        options: ligne.options,
      })),
    );
  }

  /* -------------------------- 2. Chez Tantie Fanta ------------------------ */

  const [tantie] = await db
    .insert(restaurants)
    .values({
      nom: "Chez Tantie Fanta",
      slug: "chez-tantie-fanta",
      couleurPrincipale: "#0F766E",
      adresse: "Boulevard de la Paix, Yopougon — Abidjan",
      telephone: "+225 05 44 55 66 77",
      horaires: "Lundi au samedi de 10h00 à 21h00",
      plan: "gratuit",
    })
    .returning();

  await creerCatalogue(tantie.id, CATALOGUE_TANTIE);
  await db
    .insert(tables)
    .values([1, 2, 3].map((n) => ({ restaurantId: tantie.id, numero: `T${n}` })));
  await db.insert(paymentMethods).values({
    restaurantId: tantie.id,
    operateur: "orange" as const,
    numero: "+225 05 44 55 66 77",
    titulaire: "Fanta Coulibaly",
  });
  await db.insert(users).values({
    restaurantId: tantie.id,
    nom: "Fanta Coulibaly",
    email: "admin@tantie.ci",
    motDePasseHash: mdpTantie,
    role: "admin" as const,
  });

  /* ------------------------- 3. Super administrateur ---------------------- */

  // L'ancien domaine afrimenu.app a été remplacé : on retire le compte
  // historique s'il existe encore, pour ne pas laisser deux super-admins.
  await db.delete(users).where(eq(users.email, "superadmin@afrimenu.app"));

  const [existantSuper] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "superadmin@mesplats.app"))
    .limit(1);

  if (existantSuper) {
    await db
      .update(users)
      .set({ motDePasseHash: mdpSuper, role: "superadmin", actif: true, restaurantId: null })
      .where(eq(users.id, existantSuper.id));
  } else {
    await db.insert(users).values({
      restaurantId: null,
      nom: "Équipe Mesplats",
      email: "superadmin@mesplats.app",
      motDePasseHash: mdpSuper,
      role: "superadmin" as const,
    });
  }

  /* -------------------------------- Résumé -------------------------------- */

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log(`
✅  Base de données peuplée avec succès !

   RESTAURANT DE DÉMONSTRATION
   Nom         Maquis Le Baoulé  (plan Pro)
   Menu        ${base}/m/maquis-le-baoule
   Table 2     ${base}/m/maquis-le-baoule/t/2
   À emporter  ${base}/m/maquis-le-baoule
   Contenu     3 catégories · 10 produits · 5 tables · 3 moyens de paiement
                6 commandes du jour (dont 2 nouvelles à traiter)

   COMPTES DE CONNEXION
   Propriétaire  admin@demo.ci            Demo1234   → /dashboard
   Serveur       serveur@demo.ci          Demo1234   → /service
   Cuisine       cuisine@demo.ci          Demo1234   → /service
   Super-admin   superadmin@mesplats.app  Super1234  → /admin

   SECOND RESTAURANT (test d'isolation multi-tenant)
   Admin         admin@tantie.ci          Demo1234   → /dashboard
   Menu          ${base}/m/chez-tantie-fanta
`);
}

semer()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (erreur) => {
    console.error("\n❌  Échec du peuplement :", erreur);
    await client.end().catch(() => undefined);
    process.exit(1);
  });
