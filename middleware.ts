/**
 * Middleware de sécurité (runtime Edge).
 *
 * Il n'instancie Auth.js qu'avec `auth.config.ts` (sans base de données) afin
 * de rester compatible avec le Edge, puis délègue le contrôle d'accès au
 * callback `authorized` : session valide → rôle autorisé → restaurant actif.
 *
 * Le `matcher` limite son exécution aux zones protégées : les menus publics,
 * la page de suivi de commande et les routes d'API ne paient aucun surcoût.
 */
import NextAuth from "next-auth";

import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/service/:path*",
    "/admin/:path*",
    "/mon-compte/:path*",
  ],
};
