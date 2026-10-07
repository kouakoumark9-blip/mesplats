#!/usr/bin/env node
/**
 * Mesplats — autorisation GitHub sans mot de passe (flux « code d'appareil »)
 * ---------------------------------------------------------------------------
 * Le CLI GitHub demande un vrai terminal pour s'authentifier ; dans un
 * environnement sans écran, on déroule le même mécanisme officiel de GitHub :
 *
 *   1. on demande un code à usage unique ;
 *   2. le propriétaire du compte ouvre https://github.com/login/device, saisit
 *      ce code et clique « Authorize » — le mot de passe GitHub ne passe jamais
 *      par ce programme ;
 *   3. le programme reçoit un jeton, l'écrit dans /tmp (hors espace de travail)
 *      et s'arrête.
 *
 * Portées demandées (visibles sur la page d'autorisation GitHub) :
 *   repo        — lire et écrire le code des dépôts
 *   workflow    — modifier les workflows GitHub Actions (la CI du projet)
 *   project     — lire et écrire les tableaux de projet (le tableau n°2)
 *   read:org    — lister les organisations du compte
 *
 * Utilisation : node scripts/github-connexion.mjs
 */
import { writeFileSync } from "node:fs";

const CLIENT_ID = process.env.GH_CLIENT_ID ?? "178c6fc778ccc68e1d6a"; // application officielle « GitHub CLI »
const PORTEES = "repo,workflow,project,read:org";
const FICHIER_JETON = "/tmp/mesplats-gh-token";

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

const { device_code, user_code, verification_uri, expires_in, interval } = await demanderCode();

console.log("");
console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║  AUTORISATION GITHUB — à faire une fois, depuis votre navigateur  ║");
console.log("╚══════════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`  1. Ouvrez  :  ${verification_uri}`);
console.log(`  2. Code    :  ${user_code}`);
console.log("  3. Cliquez « Authorize » (compte kouakoumark9-blip)");
console.log("");
console.log(`CODE_A_SAISIR=${user_code}`);
console.log(`URL=${verification_uri}`);
console.log("");
console.log(`En attente de l'autorisation… (valable ${Math.round(expires_in / 60)} minutes)`);
console.log("");

const fin = Date.now() + expires_in * 1000;
let attente = (interval || 5) * 1000;

while (Date.now() < fin) {
  await attendre(attente);
  const resultat = await demanderJeton(device_code);

  if (resultat.access_token) {
    writeFileSync(FICHIER_JETON, resultat.access_token, { mode: 0o600 });
    console.log("AUTORISE — jeton enregistré dans /tmp/mesplats-gh-token (mode 600).");
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
      console.error("\nLe code a expiré. Relancez la commande pour en obtenir un nouveau.");
      process.exit(2);
    case "access_denied":
      console.error("\nAutorisation refusée sur GitHub.");
      process.exit(3);
    default:
      console.error(`\nRéponse inattendue de GitHub : ${JSON.stringify(resultat)}`);
      process.exit(4);
  }
}

console.error("\nDélai dépassé. Relancez la commande pour obtenir un nouveau code.");
process.exit(2);
