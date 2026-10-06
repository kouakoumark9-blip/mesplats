/**
 * Schéma de la base de données (Drizzle ORM / PostgreSQL).
 *
 * Conventions :
 *  - colonnes PostgreSQL en snake_case, propriétés TypeScript en camelCase ;
 *  - identifiants `uuid` générés par la base (compatibles URLs publiques) ;
 *  - montants en entiers (le franc CFA n'a pas de décimales) ;
 *  - TOUTE table métier porte un `restaurant_id` : l'isolation multi-tenant
 *    est appliquée dans chaque requête via `lib/db/scope.ts`.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  MODES_PAIEMENT,
  OPERATEURS,
  PAIEMENT_STATUTS,
  PLANS,
  ROLES,
  STATUTS,
  TYPES_COMMANDE,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const roleEnum = pgEnum("role", ROLES);
export const planEnum = pgEnum("plan", PLANS);
export const typeCommandeEnum = pgEnum("type_commande", TYPES_COMMANDE);
export const statutCommandeEnum = pgEnum("statut_commande", STATUTS);
export const modePaiementEnum = pgEnum("mode_paiement", MODES_PAIEMENT);
export const paiementStatutEnum = pgEnum("paiement_statut", PAIEMENT_STATUTS);
export const operateurEnum = pgEnum("operateur", OPERATEURS);

/* -------------------------------------------------------------------------- */
/*                                Restaurants                                 */
/* -------------------------------------------------------------------------- */

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nom: text("nom").notNull(),
    /** Identifiant public utilisé dans les URLs : /m/[slug] */
    slug: text("slug").notNull().unique(),
    /** URL du logo affiché sur le menu public. */
    logo: text("logo"),
    /** URL de la bannière (photo d'ambiance) affichée en haut du menu public. */
    banniere: text("banniere"),
    couleurPrincipale: text("couleur_principale").notNull().default("#E4572E"),
    adresse: text("adresse"),
    /** Complément d'adresse (bâtiment, étage, repère). */
    adresseComplement: text("adresse_complement"),
    codePostal: text("code_postal"),
    ville: text("ville"),
    telephone: text("telephone"),
    horaires: text("horaires"),
    description: text("description"),
    devise: text("devise").notNull().default("FCFA"),
    /* --- Apparence de la carte numérique (paramètres → Personnalisation) --- */
    themeMenu: text("theme_menu").notNull().default("clair"),
    couleurFond: text("couleur_fond").notNull().default("neutre"),
    policeMenu: text("police_menu").notNull().default("moderne"),
    /** Langues proposées sur la carte, la première étant la langue principale. */
    langues: text("langues").array().notNull().default(sql`ARRAY['fr']::text[]`),
    /** Réseaux sociaux affichés sur le menu : { instagram, facebook, x, snapchat }. */
    reseaux: jsonb("reseaux").$type<Record<string, string>>(),
    /* --- Personnalisation des QR codes (écran « Tables & QR codes ») --- */
    qrStyle: text("qr_style").notNull().default("classique"),
    qrCouleur: text("qr_couleur").notNull().default("#0f172a"),
    qrFond: text("qr_fond").notNull().default("#ffffff"),
    /** Affiche le logo du restaurant au centre des QR codes. */
    qrLogo: boolean("qr_logo").notNull().default(false),
    plan: planEnum("plan").notNull().default("gratuit"),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("restaurants_actif_idx").on(t.actif)],
);

/* -------------------------------------------------------------------------- */
/*                              Utilisateurs                                  */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Nul uniquement pour les super-admins de la plateforme. */
    restaurantId: uuid("restaurant_id").references(() => restaurants.id, {
      onDelete: "cascade",
    }),
    nom: text("nom").notNull(),
    email: text("email").notNull().unique(),
    motDePasseHash: text("mot_de_passe_hash").notNull(),
    role: roleEnum("role").notNull().default("admin"),
    actif: boolean("actif").notNull().default(true),
    dernierAccesAt: timestamp("dernier_acces_at", { withTimezone: true }),
    /** Jeton de réinitialisation du mot de passe (haché) — usage unique. */
    resetToken: text("reset_token"),
    resetExpire: timestamp("reset_expire", { withTimezone: true }),
    /** true si la session doit expirer vite (case « Se souvenir de moi » décochée). */
    sessionCourte: boolean("session_courte").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("users_restaurant_idx").on(t.restaurantId),
    index("users_email_idx").on(t.email),
  ],
);

/* -------------------------------------------------------------------------- */
/*                          Catégories et produits                            */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    /** Ordre d'affichage dans le menu (croissant). */
    ordre: integer("ordre").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    /**
     * Disponibilité de la catégorie : { jours: 0-6, creneaux: [{debut,fin}] }.
     * `null` (ou vide) = disponible en permanence. Sert à afficher « Petit-déjeuner »
     * le matin, « Grillades » le soir, etc.
     */
    disponibilite: jsonb("disponibilite").$type<{
      jours?: number[];
      creneaux?: { debut: string; fin: string }[];
    } | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("categories_restaurant_ordre_idx").on(t.restaurantId, t.ordre)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    description: text("description"),
    /** Prix en entiers, dans la devise du restaurant (FCFA par défaut). */
    prix: integer("prix").notNull(),
    photo: text("photo"),
    /** false = « épuisé » : masqué du menu client mais conservé au catalogue. */
    disponible: boolean("disponible").notNull().default(true),
    /** Nombre de personnes (plats à partager : « pour 2 à 4 personnes »). */
    personnesMin: integer("personnes_min"),
    personnesMax: integer("personnes_max"),
    ordre: integer("ordre").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_restaurant_idx").on(t.restaurantId),
    index("products_category_ordre_idx").on(t.categoryId, t.ordre),
  ],
);

/** Suppléments / options d'un produit (ex. « Fromage +500 »). */
export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    supplementPrix: integer("supplement_prix").notNull().default(0),
    ordre: integer("ordre").notNull().default(0),
  },
  (t) => [index("product_options_product_idx").on(t.productId)],
);

/* -------------------------------------------------------------------------- */
/*                                   Tables                                   */
/* -------------------------------------------------------------------------- */

export const tables = pgTable(
  "tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    /** Libellé libre : « 1 », « 12 », « Terrasse A »… */
    numero: text("numero").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("tables_restaurant_numero_unique").on(t.restaurantId, t.numero),
    index("tables_restaurant_idx").on(t.restaurantId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                            Commandes et lignes                             */
/* -------------------------------------------------------------------------- */

/** Option choisie, figée dans la ligne de commande. */
export type OptionCommande = { nom: string; prix: number };

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Numéro lisible, séquentiel par restaurant (affiché au personnel). */
    numero: integer("numero").notNull(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    type: typeCommandeEnum("type").notNull().default("emporter"),
    tableId: uuid("table_id").references(() => tables.id, { onDelete: "set null" }),
    nomClient: text("nom_client"),
    telephoneClient: text("telephone_client"),
    statut: statutCommandeEnum("statut").notNull().default("nouvelle"),
    /** Total en entiers, calculé côté serveur à partir des lignes. */
    total: integer("total").notNull(),
    modePaiement: modePaiementEnum("mode_paiement"),
    paiementStatut: paiementStatutEnum("paiement_statut").notNull().default("en_attente"),
    /** Heure de retrait souhaitée (commandes à emporter). */
    heureRetrait: timestamp("heure_retrait", { withTimezone: true }),
    /** Note libre du client (ex. « sans piment »). */
    note: text("note"),
    motifAnnulation: text("motif_annulation"),
    /** Renseigné quand le client appuie sur « Appeler le serveur ». */
    appelServeurAt: timestamp("appel_serveur_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("orders_restaurant_numero_unique").on(t.restaurantId, t.numero),
    index("orders_restaurant_created_idx").on(t.restaurantId, t.createdAt),
    index("orders_restaurant_statut_idx").on(t.restaurantId, t.statut),
    index("orders_telephone_idx").on(t.telephoneClient),
    index("orders_table_idx").on(t.tableId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Null si le produit a été supprimé du catalogue (historique conservé). */
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Copie du nom au moment de la commande (snapshot). */
    nom: text("nom").notNull(),
    quantite: integer("quantite").notNull().default(1),
    prixUnitaire: integer("prix_unitaire").notNull(),
    options: jsonb("options")
      .$type<OptionCommande[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    note: text("note"),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                          Moyens de paiement (MoMo)                         */
/* -------------------------------------------------------------------------- */

export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    operateur: operateurEnum("operateur").notNull(),
    numero: text("numero").notNull(),
    /** Nom du titulaire du compte mobile money (affiché au client). */
    titulaire: text("titulaire"),
    actif: boolean("actif").notNull().default(true),
  },
  (t) => [
    unique("payment_methods_restaurant_operateur_unique").on(t.restaurantId, t.operateur),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  products: many(products),
  tables: many(tables),
  orders: many(orders),
  paymentMethods: many(paymentMethods),
}));

export const usersRelations = relations(users, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [users.restaurantId],
    references: [restaurants.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [products.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  options: many(productOptions),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.restaurantId],
    references: [restaurants.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [paymentMethods.restaurantId],
    references: [restaurants.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Restaurant = typeof restaurants.$inferSelect;
export type NouveauRestaurant = typeof restaurants.$inferInsert;
export type Utilisateur = typeof users.$inferSelect;
export type NouvelUtilisateur = typeof users.$inferInsert;
export type Categorie = typeof categories.$inferSelect;
export type Produit = typeof products.$inferSelect;
export type OptionProduit = typeof productOptions.$inferSelect;
export type Table = typeof tables.$inferSelect;
export type Commande = typeof orders.$inferSelect;
export type LigneCommande = typeof orderItems.$inferSelect;
export type MoyenPaiement = typeof paymentMethods.$inferSelect;
