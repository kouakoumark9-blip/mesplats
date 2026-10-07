"use client";

/**
 * Enregistrement du service worker (PWA installable).
 * ---------------------------------------------------------------------------
 * Monté une seule fois dans la mise en page racine. L'enregistrement est
 * volontairement discret : si le navigateur ne gère pas les service workers
 * (ou si l'application tourne en développement sans HTTPS), rien ne casse.
 */
import { useEffect } from "react";

export function EnregistrementServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const enregistrer = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Échec silencieux : l'application fonctionne sans mode hors ligne.
      });
    };

    if (document.readyState === "complete") enregistrer();
    else window.addEventListener("load", enregistrer, { once: true });

    return () => window.removeEventListener("load", enregistrer);
  }, []);

  return null;
}
