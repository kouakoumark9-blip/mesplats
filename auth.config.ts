/**
 * Configuration Auth.js partagée entre le middleware (runtime Edge) et le
 * serveur (runtime Node).
 *
 * ⚠️ Ce fichier ne doit JAMAIS importer la base de données : le middleware
 * s'exécute sur le Edge. Le provider Credentials, qui interroge PostgreSQL,
 * est ajouté dans `auth.ts` (runtime Node uniquement).
 */
import type { NextAuthConfig } from "next-auth";

import { espaceParDefaut, regleAcces } from "@/lib/auth/roles";
import type { Role } from "@/lib/constants";

export const authConfig = {
  // Nécessaire derrière les proxys (Vercel, previews) pour accepter l'hôte.
  trustHost: true,
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  session: {
    strategy: "jwt",
    // 30 jours de session : les serveurs restent connectés sur leur tablette.
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  providers: [],
  callbacks: {
    /** Copie les informations métier dans le JWT au moment de la connexion. */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: Role }).role ?? "serveur";
        token.restaurantId = (user as { restaurantId?: string | null }).restaurantId ?? null;
        token.restaurantSlug = (user as { restaurantSlug?: string | null }).restaurantSlug ?? null;
        token.restaurantNom = (user as { restaurantNom?: string | null }).restaurantNom ?? null;
        token.restaurantActif =
          (user as { restaurantActif?: boolean }).restaurantActif ?? true;
      }
      return token;
    },

    /** Expose ces informations à `auth()` et aux composants serveur. */
    session({ session, token }) {
      session.user.id = (token.id as string) ?? "";
      session.user.role = (token.role as Role) ?? "serveur";
      session.user.restaurantId = (token.restaurantId as string | null) ?? null;
      session.user.restaurantSlug = (token.restaurantSlug as string | null) ?? null;
      session.user.restaurantNom = (token.restaurantNom as string | null) ?? null;
      session.user.restaurantActif = (token.restaurantActif as boolean) ?? true;
      return session;
    },

    /**
     * Contrôle d'accès du middleware : les zones protégées exigent une session
     * valide et un rôle autorisé. Le contrôle « restaurant actif » est refait
     * côté serveur (avec accès base de données) dans `lib/auth/autorisation.ts`.
     */
    authorized({ auth, request }) {
      const chemin = request.nextUrl.pathname;
      const regle = regleAcces(chemin);
      if (regle.publique) return true;

      const utilisateur = auth?.user;
      if (!utilisateur) return false; // → redirection vers /connexion?callbackUrl=…

      // Restaurant suspendu : tout est bloqué sauf l'équipe plateforme.
      if (utilisateur.role !== "superadmin" && utilisateur.restaurantActif === false) {
        return Response.redirect(new URL("/compte-suspendu", request.nextUrl));
      }

      if (!regle.roles.includes(utilisateur.role)) {
        return Response.redirect(new URL(espaceParDefaut(utilisateur.role), request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
