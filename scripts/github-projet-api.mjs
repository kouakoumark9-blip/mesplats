#!/usr/bin/env node
/**
 * Mesplats — remplissage du dépôt et du tableau de projet via l'API GitHub
 * ---------------------------------------------------------------------------
 * Ne nécessite AUCUN outil à installer (ni `gh`, ni jeton dans le dépôt) :
 * tout passe par l'API REST et GraphQL avec un jeton d'accès personnel.
 *
 *   · étiquettes du dépôt (13) ;
 *   · fiches du carnet de route (19) — sans doublon ;
 *   · ajout de chaque fiche au tableau de projet et choix de sa colonne.
 *
 * Utilisation :
 *   GH_TOKEN=ghp_…            node scripts/github-projet-api.mjs
 *   node scripts/github-projet-api.mjs --jeton-fichier /tmp/gh-token.txt
 *   node scripts/github-projet-api.mjs --simulation
 *
 * Options : --depot, --proprietaire, --projet, --simulation, --aide
 * Le jeton a besoin des portées : repo, workflow, project.
 */
import { readFileSync } from "node:fs";

import { couleurs, fiches } from "./carnet-de-route.mjs";

/* ------------------------------------------------------------------ options */
const args = process.argv.slice(2);
const option = (nom, defaut = null) => {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : defaut;
};
const drapeau = (nom) => args.includes(`--${nom}`);

if (drapeau("aide")) {
  console.log("node scripts/github-projet-api.mjs [--depot p/n] [--proprietaire p] [--projet n] [--simulation]");
  process.exit(0);
}

const simulation = drapeau("simulation");
const proprietaire = option("proprietaire", "kouakoumark9-blip");
const numeroProjet = Number(option("projet", "2"));
const depot = option("depot", `${proprietaire}/mesplats`);

const fichierJeton = option("jeton-fichier", "/tmp/gh-token.txt");
let jeton = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? null;
if (!jeton && fichierJeton) {
  try {
    jeton = readFileSync(fichierJeton, "utf8").trim();
  } catch {
    /* le jeton viendra peut-être de l'environnement */
  }
}
if (!jeton && !simulation) {
  console.error(
    "Aucun jeton trouvé. Utilisez :\n" +
      "  GH_TOKEN=ghp_… node scripts/github-projet-api.mjs\n" +
      "  ou --jeton-fichier /chemin/vers/jeton.txt",
  );
  process.exit(1);
}

/* ------------------------------------------------------------------- api */
const ENTETES = {
  Authorization: `bearer ${jeton ?? ""}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
  "User-Agent": "mesplats-carnet-de-route",
};

async function api(chemin, { methode = "GET", corps } = {}) {
  const reponse = await fetch(`https://api.github.com${chemin}`, {
    method: methode,
    headers: ENTETES,
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const texte = await reponse.text();
  const donnees = texte ? JSON.parse(texte) : null;
  if (!reponse.ok) {
    const detail = donnees?.message ?? reponse.statusText;
    throw new Error(`${methode} ${chemin} → ${reponse.status} ${detail}`);
  }
  return donnees;
}

async function graphql(requete, variables) {
  const reponse = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: ENTETES,
    body: JSON.stringify({ query: requete, variables }),
  });
  const donnees = await reponse.json();
  if (donnees.errors?.length) throw new Error(`GraphQL : ${donnees.errors[0].message}`);
  return donnees.data;
}

/* --------------------------------------------------------------- 1. étiquettes */
async function creerEtiquettes() {
  const existantes = new Set(
    (await api(`/repos/${depot}/labels?per_page=100`)).map((e) => e.name),
  );
  for (const [nom, couleur] of Object.entries(couleurs)) {
    if (existantes.has(nom)) {
      console.log(`  ↺ étiquette déjà là : ${nom}`);
      continue;
    }
    if (simulation) {
      console.log(`  + étiquette ${nom}`);
      continue;
    }
    await api(`/repos/${depot}/labels`, {
      methode: "POST",
      corps: { name: nom, color: couleur },
    });
    console.log(`  ✓ étiquette créée : ${nom}`);
  }
}

/* ------------------------------------------------------------------ 2. fiches */
async function fichesExistantes() {
  const sortie = await api(`/repos/${depot}/issues?state=all&per_page=100`);
  return new Map(sortie.map((fiche) => [fiche.title, fiche]));
}

async function creerFiches() {
  const existantes = await fichesExistantes();
  const resultats = [];

  for (const fiche of fiches) {
    const dejaLa = existantes.get(fiche.titre);
    if (dejaLa) {
      console.log(`  ↺ déjà ouverte : ${fiche.titre}`);
      resultats.push({ fiche, numero: dejaLa.number, noeud: dejaLa.node_id });
      continue;
    }
    if (simulation) {
      console.log(`  + ${fiche.titre} [${fiche.colonne}]`);
      continue;
    }

    const creee = await api(`/repos/${depot}/issues`, {
      methode: "POST",
      corps: { title: fiche.titre, body: fiche.corps, labels: fiche.etiquettes },
    });
    console.log(`  ✓ fiche créée : #${creee.number} — ${fiche.titre}`);
    resultats.push({ fiche, numero: creee.number, noeud: creee.node_id });

    if (fiche.fermer) {
      await api(`/repos/${depot}/issues/${creee.number}`, {
        methode: "PATCH",
        corps: { state: "closed", state_reason: "completed" },
      });
      await api(`/repos/${depot}/issues/${creee.number}/comments`, {
        methode: "POST",
        corps: { body: "Livré et testé." },
      });
    }
  }

  return resultats;
}

/* ----------------------------------------------------------------- 3. tableau */
async function tableaux() {
  const donnees = await graphql(
    `query ($login: String!) {
       user(login: $login) {
         projectV2(number: ${numeroProjet}) {
           id
           title
           url
           fields(first: 50) {
             nodes {
               __typename
               ... on ProjectV2SingleSelectField { id name options { id name } }
               ... on ProjectV2FieldCommon { id name }
             }
           }
         }
       }
     }`,
    { login: proprietaire },
  );
  return donnees.user?.projectV2 ?? null;
}

function optionColonne(nom, options) {
  const motifs = {
    "a-faire": ["à faire", "a faire", "todo", "backlog", "à traiter"],
    "en-cours": ["en cours", "in progress", "doing"],
    termine: ["terminé", "termine", "done", "fini"],
  }[nom] ?? [];
  return options.find((o) => motifs.some((m) => o.name.toLowerCase().includes(m)))?.id ?? null;
}

async function remplirTableau(resultats) {
  const projet = await tableaux();
  if (!projet) {
    console.warn(
      "  ⚠ Tableau de projet introuvable — vérifiez le numéro et la portée `project` du jeton.",
    );
    return;
  }
  const champ = projet.fields.nodes.find((f) => /statut|status/i.test(f.name) && f.options);
  const elements = await graphql(
    `query ($projet: ID!) {
       node(id: $projet) {
         ... on ProjectV2 {
           items(first: 100) { nodes { id content { ... on Issue { id } } } }
         }
       }
     }`,
    { projet: projet.id },
  );
  const dejaDansLeTableau = new Map(
    (elements.node.items.nodes ?? [])
      .filter((i) => i.content?.id)
      .map((i) => [i.content.id, i.id]),
  );

  let ajoutees = 0;
  for (const { fiche, noeud } of resultats) {
    let element = dejaDansLeTableau.get(noeud);
    if (!element) {
      const ajout = await graphql(
        `mutation ($projet: ID!, $contenu: ID!) {
           addProjectV2ItemById(input: { projectId: $projet, contentId: $contenu }) {
             item { id }
           }
         }`,
        { projet: projet.id, contenu: noeud },
      );
      element = ajout.addProjectV2ItemById.item.id;
      ajoutees += 1;
    }

    if (champ) {
      const idColonne = optionColonne(fiche.colonne, champ.options);
      if (idColonne) {
        await graphql(
          `mutation ($projet: ID!, $element: ID!, $champ: ID!, $valeur: String!) {
             updateProjectV2ItemFieldValue(input: {
               projectId: $projet, itemId: $element, fieldId: $champ,
               value: { singleSelectOptionId: $valeur }
             }) { projectV2Item { id } }
           }`,
          { projet: projet.id, element, champ: champ.id, valeur: idColonne },
        );
      }
    }
  }

  console.log(`  ✓ ${ajoutees} fiche(s) ajoutée(s) au tableau « ${projet.title} »`);
  console.log(`  ✓ tableau : ${projet.url}`);
}

/* ------------------------------------------------------------------ exécution */
console.log(`\nDépôt   : https://github.com/${depot}`);
console.log(`Tableau : https://github.com/users/${proprietaire}/projects/${numeroProjet}`);
console.log(`Mode    : ${simulation ? "simulation" : "réel"}\n`);

const moi = simulation ? { login: "(simulation)" } : await api("/user");
console.log(`Jeton   : ${moi.login}\n`);

console.log("▸ Étiquettes");
await creerEtiquettes();

console.log("\n▸ Carnet de route");
const resultats = await creerFiches();

if (!simulation && resultats.length) {
  console.log("\n▸ Tableau de projet");
  await remplirTableau(resultats);
}

console.log(
  `\nBilan : ${resultats.length} fiche(s) au dépôt, ${fiches.filter((f) => f.fermer).length} close(s) (travail livré).`,
);
console.log(`Dépôt   : https://github.com/${depot}`);
console.log(`Fiches  : https://github.com/${depot}/issues`);
console.log(`CI      : https://github.com/${depot}/actions`);
