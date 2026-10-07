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

import { couleurs, fiches } from "./carnet-de-route.mjs";

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



/* ------------------------------------------------------- carnet de route */


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
