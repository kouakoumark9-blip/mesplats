/**
 * Accès centralisé aux variables d'environnement.
 *
 * Les lectures sont paresseuses (fonctions) afin que `next build` ne casse pas
 * lorsqu'une variable optionnelle est absente, tout en renvoyant des messages
 * d'erreur explicites en français à l'exécution.
 */

function lire(nom: string): string | undefined {
  const valeur = process.env[nom];
  return valeur && valeur.trim().length > 0 ? valeur.trim() : undefined;
}

function obligatoire(nom: string, aide: string): string {
  const valeur = lire(nom);
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}.\n${aide}\n` +
        `En local : copiez .env.example vers .env.local. Sur Vercel : Project Settings → Environment Variables.`,
    );
  }
  return valeur;
}

/** Chaîne de connexion PostgreSQL (Neon en production). */
export function databaseUrl(): string {
  return obligatoire(
    "DATABASE_URL",
    "Exemple : postgresql://user:motdepasse@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  );
}

/** Secret de signature des sessions Auth.js (32 caractères minimum). */
export function authSecret(): string {
  return obligatoire(
    "AUTH_SECRET",
    "Générez-le avec : openssl rand -base64 32",
  );
}

/** Jeton d'écriture Vercel Blob (upload des photos de plats et logos). */
export function blobToken(): string | null {
  return lire("BLOB_READ_WRITE_TOKEN") ?? null;
}

/**
 * URL publique de l'application : sert à construire les liens encodés dans les
 * QR codes. Sur Vercel, `VERCEL_URL` est fournie automatiquement.
 */
export function appUrl(): string {
  const explicite = lire("NEXT_PUBLIC_APP_URL") ?? lire("APP_URL");
  if (explicite) return explicite.replace(/\/$/, "");
  const vercel = lire("VERCEL_PROJECT_PRODUCTION_URL") ?? lire("VERCEL_URL");
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

/** URL utilisée dans les QR codes pour un restaurant donné. */
export function urlMenu(restaurant: { slug: string }, tableNumero?: string | null): string {
  const base = `${appUrl()}/m/${restaurant.slug}`;
  return tableNumero ? `${base}/t/${encodeURIComponent(tableNumero)}` : base;
}

export const estProduction = process.env.NODE_ENV === "production";
