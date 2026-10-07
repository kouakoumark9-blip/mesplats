/*
 * Service worker Mesplats — PWA installable, pensée pour la 3G/4G.
 * ---------------------------------------------------------------------------
 * Stratégies :
 *  • documents (pages) : réseau d'abord, repli sur une page hors ligne ;
 *  • ressources statiques Next (`/_next/static/…`) et images : cache d'abord,
 *    ce qui accélère nettement les visites suivantes sur mobile ;
 *  • API et Server Actions : jamais mis en cache (les données de commande
 *    doivent toujours être fraîches).
 */
const VERSION = "mesplats-v1";
const CACHE_STATIQUE = `${VERSION}-statique`;
const CACHE_IMAGES = `${VERSION}-images`;
const PAGE_HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches
      .open(CACHE_STATIQUE)
      .then((cache) => cache.addAll([PAGE_HORS_LIGNE, "/icons/icone.svg", "/manifest.webmanifest"]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(
          cles
            .filter((cle) => !cle.startsWith(VERSION))
            .map((cle) => caches.delete(cle)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;

  // Seules les lectures GET sont mises en cache ; tout le reste va au réseau.
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);

  // Données dynamiques : commandes, session, API interne → jamais de cache.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Ressources statiques Next.js : cache d'abord.
  if (url.pathname.startsWith("/_next/static/")) {
    evenement.respondWith(
      caches.match(requete).then(
        (enCache) =>
          enCache ??
          fetch(requete).then((reponse) => {
            const copie = reponse.clone();
            caches.open(CACHE_STATIQUE).then((cache) => cache.put(requete, copie));
            return reponse;
          }),
      ),
    );
    return;
  }

  // Images (photos de plats, bannières) : cache d'abord, réseau ensuite.
  if (requete.destination === "image") {
    evenement.respondWith(
      caches.match(requete).then(
        (enCache) =>
          enCache ??
          fetch(requete)
            .then((reponse) => {
              const copie = reponse.clone();
              caches.open(CACHE_IMAGES).then((cache) => cache.put(requete, copie));
              return reponse;
            })
            .catch(() => enCache),
      ),
    );
    return;
  }

  // Pages : réseau d'abord (données fraîches), repli sur la page hors ligne.
  if (requete.mode === "navigate") {
    evenement.respondWith(
      fetch(requete).catch(() =>
        caches
          .match(PAGE_HORS_LIGNE)
          .then((page) => page ?? new Response("Hors ligne", { status: 503 })),
      ),
    );
  }
});
