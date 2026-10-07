#!/usr/bin/env node
/**
 * Mesplats — préparation du dépôt GitHub et du tableau de projet
 * ---------------------------------------------------------------------------
 * Ce script fait trois choses, dans cet ordre :
 *
 *   1. il crée (ou met à jour) les étiquettes du dépôt ;
 *   2. il ouvre les fiches du carnet de route — sans doublon : une fiche déjà
 *      ouverte avec le même titre est réutilisée ;
 *   3. il ajoute chaque fiche au tableau de projet GitHub et lui donne sa
 *      colonne (« À faire », « En cours », « Terminé »).
 *
 * Utilisation (après `gh auth login`) :
 *
 *   node scripts/github-projet.mjs                       # dépôt déduit de `git remote`
 *   node scripts/github-projet.mjs --depot kouakoumark9-blip/mesplats
 *   node scripts/github-projet.mjs --projet 2 --proprietaire kouakoumark9-blip
 *   node scripts/github-projet.mjs --simulation          # n'appelle rien, montre le plan
 *   node scripts/github-projet.mjs --sans-projet         # fiches seulement
 *
 * Prérequis : `gh` installé et connecté (`gh auth login`), avec la portée
 * `project` pour le tableau : `gh auth refresh -s project`.
 */
import { execFileSync } from "node:child_process";

/* ------------------------------------------------------------------ options */
const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
  const index = args.indexOf(`--${nom}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith("--")
    ? args[index + 1]
    : defaut;
};
const drapeau = (nom) => args.includes(`--${nom}`);

if (drapeau("aide") || drapeau("help")) {
  console.log(
    [
      "Préparation du dépôt GitHub Mesplats",
      "",
      "  node scripts/github-projet.mjs [options]",
      "",
      "  --depot <proprietaire/nom>   dépôt cible (défaut : lu depuis git remote)",
      "  --proprietaire <pseudo>      propriétaire du tableau de projet (défaut : kouakoumark9-blip)",
      "  --projet <numero>            numéro du tableau de projet (défaut : 2)",
      "  --sans-projet                ne pas toucher au tableau (fiches seulement)",
      "  --simulation                 montrer ce qui serait fait, sans rien créer",
      "  --aide                       afficher cette aide",
    ].join("\n"),
  );
  process.exit(0);
}

const simulation = drapeau("simulation");
const sansProjet = drapeau("sans-projet");
const proprietaireProjet = option("proprietaire", "kouakoumark9-blip");
const numeroProjet = option("projet", "2");

/* -------------------------------------------------------------------- outils */
function gh(commande, { silencieux = false } = {}) {
  try {
    const sortie = execFileSync("gh", commande, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return sortie.trim();
  } catch (erreur) {
    if (silencieux) return null;
    const detail = (erreur.stderr ?? erreur.message ?? "").toString().trim();
    throw new Error(`gh ${commande.join(" ")}\n${detail}`);
  }
}

function depotCourant() {
  const explicite = option("depot");
  if (explicite) return explicite;
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const correspondance = url.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
  if (!correspondance) throw new Error(`Dépôt illisible depuis l'origine git : ${url}`);
  return `${correspondance[1]}/${correspondance[2]}`;
}

const couleurs = {
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

/* ------------------------------------------------------- carnet de route */
const fiches = [
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

/* ---------------------------------------------------------------- exécution */
function creerEtiquettes(depot) {
  for (const [nom, couleur] of Object.entries(couleurs)) {
    if (simulation) {
      console.log(`  · étiquette ${nom}`);
      continue;
    }
    gh(
      ["label", "create", nom, "--color", couleur, "--force", "--repo", depot],
      { silencieux: true },
    );
  }
  console.log(`Étiquettes prêtes (${Object.keys(couleurs).length}).`);
}

function fichesExistantes(depot) {
  const sortie = gh(
    ["issue", "list", "--state", "all", "--limit", "300", "--json", "title,url", "--repo", depot],
    { silencieux: true },
  );
  if (!sortie) return new Map();
  return new Map(JSON.parse(sortie).map(({ title, url }) => [title, url]));
}

/** Colonnes du tableau de projet : identifiants du champ et de ses options. */
function colonnesProjet() {
  const champs = gh(
    ["project", "field-list", numeroProjet, "--owner", proprietaireProjet, "--format", "json", "--limit", "50"],
    { silencieux: true },
  );
  if (!champs) return null;
  const champ = JSON.parse(champs).fields.find((f) => /statut|status/i.test(f.name));
  if (!champ) return null;
  const projet = gh(
    ["project", "view", numeroProjet, "--owner", proprietaireProjet, "--format", "json"],
    { silencieux: true },
  );
  const idProjet = projet ? JSON.parse(projet).id : null;
  const options = Object.fromEntries(
    (champ.options ?? []).map((o) => [o.name.toLowerCase(), o.id]),
  );
  return { idChamp: champ.id, idProjet, options };
}

function colonneDemandee(nom, options) {
  const motifs = {
    "a-faire": ["à faire", "a faire", "todo", "backlog", "à traiter"],
    "en-cours": ["en cours", "in progress", "doing"],
    termine: ["terminé", "termine", "done", "fini"],
  }[nom] ?? [];
  for (const [nomOption, id] of Object.entries(options)) {
    if (motifs.some((motif) => nomOption.includes(motif))) return id;
  }
  return null;
}

async function principal() {
  const depot = depotCourant();
  console.log(`\nDépôt       : ${depot}`);
  console.log(`Tableau     : ${proprietaireProjet} / projet n°${numeroProjet}`);
  console.log(`Mode        : ${simulation ? "simulation (aucune écriture)" : "réel"}\n`);

  if (!simulation) {
    const statut = gh(["auth", "status"], { silencieux: true });
    if (!statut) {
      console.error(
        "gh n'est pas connecté. Lancez :\n  gh auth login\n  gh auth refresh -s project   # pour le tableau de projet\n",
      );
      process.exit(1);
    }
  }

  creerEtiquettes(depot);

  const existantes = simulation ? new Map() : fichesExistantes(depot);
  const projet = sansProjet || simulation ? null : colonnesProjet();
  if (!sansProjet && !simulation && !projet) {
    console.warn(
      "Tableau de projet inaccessible (portée `project` manquante ?).\n" +
        "Les fiches vont être créées quand même ; relancez ensuite avec :\n" +
        "  gh auth refresh -s project && node scripts/github-projet.mjs\n",
    );
  }

  let creees = 0;
  let reutilisees = 0;

  for (const fiche of fiches) {
    let url = existantes.get(fiche.titre) ?? null;

    if (url) {
      reutilisees += 1;
      console.log(`↺ déjà ouverte : ${fiche.titre}`);
    } else if (simulation) {
      console.log(`+ ${fiche.titre} [${[fiche.etiquettes.join(", "), fiche.colonne].filter(Boolean).join(" · ")}]`);
      continue;
    } else {
      url = gh([
        "issue", "create",
        "--repo", depot,
        "--title", fiche.titre,
        "--body", fiche.corps,
        "--label", fiche.etiquettes.join(","),
      ]);
      creees += 1;
      console.log(`✓ créée : ${fiche.titre}`);
    }

    /* Ajout au tableau puis choix de la colonne */
    if (projet && url) {
      const element = gh(
        ["project", "item-add", numeroProjet, "--owner", proprietaireProjet, "--url", url, "--format", "json"],
        { silencieux: true },
      );
      const idElement = element ? JSON.parse(element).id : null;
      const idOption = projet.options ? colonneDemandee(fiche.colonne, projet.options) : null;
      if (idElement && projet.idProjet && projet.idChamp && idOption) {
        gh(
          [
            "project", "item-edit",
            "--id", idElement,
            "--project-id", projet.idProjet,
            "--field-id", projet.idChamp,
            "--single-select-option-id", idOption,
          ],
          { silencieux: true },
        );
      }
    }

    /* Une étape terminée est aussi close côté fiches */
    if (fiche.fermer && url && !simulation) {
      gh(["issue", "close", url, "--reason", "completed", "--comment", "Livré et testé."], { silencieux: true });
    }
  }

  console.log(
    `\nBilan : ${creees} fiche(s) créée(s), ${reutilisees} déjà présente(s).` +
      (sansProjet ? "" : `\nTableau : https://github.com/users/${proprietaireProjet}/projects/${numeroProjet}`),
  );
}

principal().catch((erreur) => {
  console.error(`\nÉchec : ${erreur.message}\n`);
  process.exit(1);
});
