/**
 * Charge `.env.local` puis `.env` dans `process.env`.
 *
 * Next.js le fait automatiquement pour l'application, mais pas pour les
 * scripts lancés hors Next (`drizzle-kit`, `tsx scripts/seed.ts`, etc.).
 * Ce chargeur minimal évite d'ajouter la dépendance `dotenv`.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Ce module s'exécute dès son import : placez `import "./charger-env";` en
 * toute première ligne d'un script lancé hors Next.js (les imports ES sont
 * hoistés dans l'ordre d'écriture), et l'environnement sera chargé avant que
 * `@/lib/db` ne soit évalué.
 */
export function chargerEnvLocal(fichiers = [".env.local", ".env"]): void {
  for (const fichier of fichiers) {
    const chemin = resolve(process.cwd(), fichier);
    if (!existsSync(chemin)) continue;

    for (const ligne of readFileSync(chemin, "utf8").split("\n")) {
      const ligneNette = ligne.trim();
      if (!ligneNette || ligneNette.startsWith("#")) continue;

      const separateur = ligneNette.indexOf("=");
      if (separateur === -1) continue;

      const cle = ligneNette.slice(0, separateur).trim();
      let valeur = ligneNette.slice(separateur + 1).trim();

      // Retire les guillemets englobants.
      if (
        (valeur.startsWith('"') && valeur.endsWith('"')) ||
        (valeur.startsWith("'") && valeur.endsWith("'"))
      ) {
        valeur = valeur.slice(1, -1);
      }

      if (process.env[cle] === undefined) {
        process.env[cle] = valeur;
      }
    }
  }
}

// Effet de bord volontaire : charge .env.local à l'import du module.
chargerEnvLocal();
