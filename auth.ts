/**
 * Instance Auth.js complète (runtime Node) avec le provider Credentials.
 *
 * L'authentification se fait par email + mot de passe : les mots de passe sont
 * hachés avec bcrypt et les sessions sont signées en JWT. La vérification
 * elle-même est déléguée à `verifierIdentifiants` (lib/auth/credentials.ts),
 * partagée avec la Server Action de connexion.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { verifierIdentifiants } from "@/lib/auth/credentials";
import { connexionSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email et mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        motDePasse: { label: "Mot de passe", type: "password" },
      },
      async authorize(identifiants) {
        const resultat = connexionSchema.safeParse(identifiants);
        if (!resultat.success) return null;

        const identite = await verifierIdentifiants(
          resultat.data.email,
          resultat.data.motDePasse,
        );
        if (!identite) return null;

        // Ces informations sont copiées dans le JWT par le callback `jwt`,
        // puis exposées à `auth()` par le callback `session`.
        return {
          id: identite.id,
          name: identite.nom,
          email: identite.email,
          role: identite.role,
          restaurantId: identite.restaurantId,
          restaurantNom: identite.restaurantNom,
          restaurantSlug: identite.restaurantSlug,
          restaurantActif: identite.restaurantActif,
        };
      },
    }),
  ],
});
