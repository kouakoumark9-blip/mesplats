#!/usr/bin/env node
/**
 * Mesplats — autorisation GitHub (flux « code d'appareil »), version robuste
 * ---------------------------------------------------------------------------
 * Différence avec la première version : l'état (code d'appareil + code à
 * saisir) est enregistré dans /home/user, qui survit aux redémarrages de la
 * sandbox. Si le processus est interrompu — ce qui arrive à chaque
 * réinitialisation — le tour suivant REPREND la même attente au lieu de
 * demander un nouveau code au propriétaire du compte.
 *
 *   1. demande d'un code à usage unique à GitHub (ou reprise du code en cours) ;
 *   2. le propriétaire ouvre https://github.com/login/device, saisit le code et
 *      clique « Authorize » — son mot de passe GitHub ne transite jamais ici ;
 *   3. le jeton obtenu est écrit dans /home/user/.github-token (droits 600) et
 *      la suite (envoi du code, étiquettes, fiches, tableau) s'enchaîne.
 *
 * Utilisation : node scripts/github-connexion.mjs
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

const CLIENT_ID = process.env.GH_CLIENT_ID ?? "178c6fc778ccc68e1d6a"; // application officielle « GitHub CLI »
const PORTEES = "repo,workflow,project,read:org";
const FICHIER_ETAT = "/home/user/github-device.json";
const FICHIER_JETON = "/home/user/.github-token";

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function demanderCode() {
  const reponse = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: PORTEES }),
  });
  if (!reponse.ok) throw new Error(`GitHub a refusé la demande de code (${reponse.status})`);
  return reponse.json();
}

async function demanderJeton(deviceCode) {
  const reponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });
  return reponse.json();
}

/** Reprend le code déjà demandé s'il est encore valable, sinon en demande un neuf. */
async function obtenirEtat() {
  if (existsSync(FICHIER_ETAT)) {
    try {
      const etat = JSON.parse(readFileSync(FICHIER_ETAT, "utf8"));
      if (etat.expire_le > Date.now() + 30_000 && etat.device_code) {
        console.log("(reprise de l'attente précédente — même code, rien à ressaisir)");
        return etat;
      }
    } catch {
      /* état illisible : on en demande un neuf */
    }
  }

  const { device_code, user_code, verification_uri, expires_in, interval } = await demanderCode();
  const etat = {
    device_code,
    user_code,
    verification_uri,
    expire_le: Date.now() + expires_in * 1000,
    intervalle: (interval || 5) * 1000,
  };
  writeFileSync(FICHIER_ETAT, JSON.stringify(etat, null, 2));
  return etat;
}

const etat = await obtenirEtat();

console.log("");
console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║  AUTORISATION GITHUB — à faire une fois, depuis votre navigateur  ║");
console.log("╚══════════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`  1. Ouvrez  :  ${etat.verification_uri}`);
console.log(`  2. Code    :  ${etat.user_code}`);
console.log("  3. Cliquez « Authorize » (compte kouakoumark9-blip)");
console.log("");
console.log(`CODE_A_SAISIR=${etat.user_code}`);
console.log(`URL=${etat.verification_uri}`);
console.log("");
console.log(
  `En attente de l'autorisation… (valable ${Math.max(1, Math.round((etat.expire_le - Date.now()) / 60000))} minutes)`,
);
console.log("");

let attente = etat.intervalle || 5000;

while (Date.now() < etat.expire_le) {
  const resultat = await demanderJeton(etat.device_code);

  if (resultat.access_token) {
    writeFileSync(FICHIER_JETON, resultat.access_token, { mode: 0o600 });
    try {
      unlinkSync(FICHIER_ETAT);
    } catch {
      /* sans importance */
    }
    console.log("\nAUTORISE — jeton enregistré dans /home/user/.github-token (droits 600).");
    console.log(`PORTEES_ACCORDEES=${resultat.scope ?? "(non communiquées)"}`);
    process.exit(0);
  }

  switch (resultat.error) {
    case "authorization_pending":
      process.stdout.write(".");
      break;
    case "slow_down":
      attente += 5000;
      break;
    case "expired_token":
      try {
        unlinkSync(FICHIER_ETAT);
      } catch {
        /* sans importance */
      }
      console.error("\nLe code a expiré. Relancez la commande pour en obtenir un nouveau.");
      process.exit(2);
    case "access_denied":
      console.error("\nAutorisation refusée sur GitHub.");
      process.exit(3);
    default:
      console.error(`\nRéponse inattendue de GitHub : ${JSON.stringify(resultat)}`);
      process.exit(4);
  }

  await attendre(attente);
}

try {
  unlinkSync(FICHIER_ETAT);
} catch {
  /* sans importance */
}
console.error("\nDélai dépassé. Relancez la commande pour obtenir un nouveau code.");
process.exit(2);
