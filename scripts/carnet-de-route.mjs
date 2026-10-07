/**
 * Mesplats — carnet de route partagé
 * ---------------------------------------------------------------------------
 * Les étiquettes et les fiches ci-dessous alimentent le dépôt GitHub et le
 * tableau de projet. Ce module est partagé par les deux outils :
 *
 *   · scripts/github-projet.mjs      → via le CLI `gh`
 *   · scripts/github-projet-api.mjs  → via l'API GitHub (aucun outil à installer)
 *
 * Chaque fiche porte : un titre, un corps (Markdown), ses étiquettes et la
 * colonne du tableau où elle doit atterrir (`a-faire`, `en-cours`, `termine`).
 * Les fiches marquées `fermer: true` correspondent à du travail livré : elles
 * sont créées puis closes.
 */

export const couleurs = {
  "type/fonctionnalite": "1D76DB",
  "type/bogue": "D73A4A",
  "type/documentation": "0075CA",
  "type/tests": "5319E7",
  "type/deploiement": "0E8A16",
  "priorite/haute": "B60205",
  "priorite/moyenne": "FBCA04",
  "priorite/basse": "C2E0C6",
  "domaine/site": "E4572E",
  "domaine/menu": "F97316",
  "domaine/service": "7C3AED",
  "domaine/boutique": "0EA5E9",
  "domaine/plateforme": "334155",
};

export const fiches = [
  /* ---------------------------------------------------------- en cours */
  {
    titre: "Connecter le dépôt GitHub et déployer Neon + Vercel",
    corps: [
      "Brancher le dépôt sur GitHub, puis déployer :",
      "",
      "- [ ] Dépôt créé et `main` envoyée",
      "- [ ] Projet Neon créé, `DATABASE_URL` (connexion *pooled*) collée dans Vercel",
      "- [ ] `AUTH_SECRET` et `BLOB_READ_WRITE_TOKEN` définis (Production, Preview, Development)",
      "- [ ] `npm run db:setup` exécuté sur la base Neon (migrations + jeu de démonstration)",
      "- [ ] Déploiement Vercel vert, carte publique testée au téléphone",
      "- [ ] CI GitHub verte (types, style, build)",
    ].join("\n"),
    etiquettes: ["type/deploiement", "priorite/haute", "domaine/plateforme"],
    colonne: "en-cours",
  },

  /* ------------------------------------------------------------ à faire */
  {
    titre: "Parcours guidé de première connexion (5 étapes après l'inscription)",
    corps: [
      "Après l'inscription, un nouveau restaurateur ne sait pas par quoi commencer.",
      "Proposer une liste de démarrage : créer ses catégories, ajouter 3 plats, créer ses",
      "tables, imprimer ses QR codes, tester une commande. Chaque étape se coche toute seule",
      "d'après les données réelles, avec une barre de progression `1/5`.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/haute", "domaine/site"],
    colonne: "a-faire",
  },
  {
    titre: "Panier persistant dans l'en-tête du site (badge nombre d'articles)",
    corps: [
      "Aujourd'hui le panier de la boutique n'est visible que sur `/boutique`.",
      "Afficher un bouton panier dans l'en-tête de tout le site, avec le nombre d'articles",
      "en badge, pour qu'un visiteur qui quitte la page boutique retrouve son tirage en cours.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/moyenne", "domaine/boutique"],
    colonne: "a-faire",
  },
  {
    titre: "Témoignages et preuves chiffrées sur la page d'accueil",
    corps: [
      "Ajouter une section « Ils servent déjà avec Mesplats » : deux ou trois témoignages de",
      "restaurateurs (maquis, resto de quartier, pâtisserie) avec la ville, plus les chiffres",
      "clés du produit (temps de service, commandes par jour, delai d'installation).",
      "À faire valider avant publication : pas d'avis inventé.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/moyenne", "domaine/site"],
    colonne: "a-faire",
  },
  {
    titre: "Visuels de mise en situation sur la page Boutique (maquis équipé)",
    corps: [
      "Compléter la vitrine par deux ou trois photos de mise en situation : chevalet en salle,",
      "sticker de vitrine, set de table servi. Les visuels aident à choisir le support.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/basse", "domaine/boutique"],
    colonne: "a-faire",
  },
  {
    titre: "Export Excel (.xlsx) du journal des commandes",
    corps: [
      "Le journal exporte déjà un CSV. Ajouter un export `.xlsx` avec deux onglets :",
      "« Commandes » (date, table, client, total, statut, paiement) et « Produits »",
      "(plat, quantité, chiffre d'affaires), pour la comptabilité du restaurateur.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/moyenne", "domaine/plateforme"],
    colonne: "a-faire",
  },
  {
    titre: "Notifications e-mail (Resend) pour le mot de passe oublié",
    corps: [
      "Aujourd'hui le lien de réinitialisation est affiché directement au propriétaire, avec un",
      "avertissement. Brancher `RESEND_API_KEY` (déjà prévue dans `.env.example`) pour envoyer",
      "un vrai e-mail transactionnel, sans jamais bloquer le parcours si la clé est absente.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/moyenne", "domaine/plateforme"],
    colonne: "a-faire",
  },
  {
    titre: "Anti-spam : limiter aussi par adresse IP",
    corps: [
      "Le garde-fou actuel limite à deux commandes actives par numéro de téléphone.",
      "Ajouter une limite par adresse IP (par exemple 10 commandes par heure et par IP) pour",
      "éviter qu'un même appareil sature l'écran de service en changeant de numéro.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/moyenne", "domaine/menu"],
    colonne: "a-faire",
  },
  {
    titre: "Tests automatisés dans le dépôt (Vitest + parcours Playwright)",
    corps: [
      "Les vérifications existent (`qa/verif-*.mjs`, 190 contrôles) mais vivent hors du dépôt.",
      "Les rapatrier dans `qa/`, les lancer en CI sur chaque envoi, et ajouter des tests",
      "unitaires Vitest pour les calculs de prix (boutique, options, paliers) et les montants.",
    ].join("\n"),
    etiquettes: ["type/tests", "priorite/haute", "domaine/plateforme"],
    colonne: "a-faire",
  },
  {
    titre: "Impression d'un ticket cuisine (imprimante thermique 58/80 mm)",
    corps: [
      "Beaucoup de maquis n'ont pas d'écran en cuisine. Ajouter une vue « ticket »",
      "optimisée pour les imprimantes thermiques (largeur 58 mm ou 80 mm, gros caractères),",
      "avec bouton d'impression automatique à l'arrivée d'une commande si le navigateur le permet.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/basse", "domaine/service"],
    colonne: "a-faire",
  },
  {
    titre: "Guide d'utilisation du restaurateur (PDF illustré)",
    corps: [
      "Rédiger un guide de 8 à 10 pages : créer son menu, imprimer ses QR codes, recevoir et",
      "servir une commande, encaisser un paiement mobile money, gérer son équipe. À remettre",
      "à l'installation, avec des captures d'écran du produit.",
    ].join("\n"),
    etiquettes: ["type/documentation", "priorite/moyenne", "domaine/site"],
    colonne: "a-faire",
  },
  {
    titre: "Partage social : image d'aperçu (Open Graph) par restaurant",
    corps: [
      "Quand un restaurateur colle le lien de sa carte dans WhatsApp, aucune image n'apparaît.",
      "Générer une image d'aperçu par restaurant (nom, logo, couleur, QR code) pour les partages.",
    ].join("\n"),
    etiquettes: ["type/fonctionnalite", "priorite/moyenne", "domaine/menu"],
    colonne: "a-faire",
  },
  {
    titre: "Accessibilité de l'écran de service (clavier et lecteur d'écran)",
    corps: [
      "Vérifier le parcours complet au clavier (sans souris) et annoncer les nouvelles",
      "commandes aux lecteurs d'écran (`aria-live`), en plus de l'alerte sonore.",
    ].join("\n"),
    etiquettes: ["type/tests", "priorite/basse", "domaine/service"],
    colonne: "a-faire",
  },

  /* --------------------------------------------------------- terminées */
  {
    titre: "Étape 1 — Base du projet, base de données et authentification",
    corps: "Next.js + TypeScript + Tailwind, schéma Drizzle complet, migrations, jeu de démonstration, inscription avec slug unique et connexion par mot de passe (bcrypt).",
    etiquettes: ["type/fonctionnalite", "domaine/plateforme"],
    colonne: "termine",
    fermer: true,
  },
  {
    titre: "Étape 2 — Back-office : profil, catégories, produits et options",
    corps: "Profil du restaurant (couleur, logo, slug), CRUD des catégories et des produits avec options et suppléments, épuisé en un clic, ordre d'affichage.",
    etiquettes: ["type/fonctionnalite", "domaine/plateforme"],
    colonne: "termine",
    fermer: true,
  },
  {
    titre: "Étape 3 — Tables et QR codes (PNG, SVG, PDF imprimable)",
    corps: "Création de tables en lot, QR code unique par table, QR « à emporter », atelier QR (5 styles, logo), planche A4 imprimable une carte par table.",
    etiquettes: ["type/fonctionnalite", "domaine/plateforme"],
    colonne: "termine",
    fermer: true,
  },
  {
    titre: "Étapes 4 à 6 — Carte publique, panier, commande, paiement manuel et suivi client",
    corps: "Carte publique thématisée et multilingue, recherche, fiche produit, panier en session, mode sur place ou à emporter avec heure de retrait, formulaire client, paiements Orange/Moov/MTN/Wave/espèces avec validation manuelle, suivi en direct et bouton « Appeler le serveur ».",
    etiquettes: ["type/fonctionnalite", "domaine/menu"],
    colonne: "termine",
    fermer: true,
  },
  {
    titre: "Étape 7 — Écran de service, statistiques, équipe, paiements, super-admin, PWA",
    corps: "Écran service grand format en temps réel (polling 4 s) avec alerte sonore, changements de statut en un clic, refus motivé, statistiques du jour et top produits, gestion d'équipe, validation des paiements, console plateforme (activation des restaurants, formules) et installation PWA.",
    etiquettes: ["type/fonctionnalite", "domaine/service"],
    colonne: "termine",
    fermer: true,
  },
  {
    titre: "Boutique — catalogue de supports imprimés, vitrine publique et catalogue A4",
    corps: "Six supports avec paliers dégressifs en FCFA, options, panier et devis référencés. Vitrine publique `/boutique` accessible sans compte, section sur la page d'accueil, entrée dans la navigation, catalogue imprimable A4 avec QR code vers la boutique.",
    etiquettes: ["type/fonctionnalite", "domaine/boutique"],
    colonne: "termine",
    fermer: true,
  },
];
