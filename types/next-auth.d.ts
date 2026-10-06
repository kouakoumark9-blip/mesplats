/**
 * Augmentation des types Auth.js : la session et le JWT portent le rôle ainsi
 * que le restaurant courant, ce qui permet aux composants serveur de filtrer
 * toutes les requêtes par `restaurantId` sans requête supplémentaire.
 */
import type { DefaultSession } from "next-auth";

import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      restaurantId: string | null;
      restaurantSlug: string | null;
      restaurantNom: string | null;
      /** false = restaurant suspendu par la plateforme. */
      restaurantActif: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: Role;
    restaurantId: string | null;
    restaurantSlug: string | null;
    restaurantNom: string | null;
    restaurantActif: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    restaurantId?: string | null;
    restaurantSlug?: string | null;
    restaurantNom?: string | null;
    restaurantActif?: boolean;
  }
}
