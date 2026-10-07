/**
 * Comptes de l'équipe d'un restaurant — TOUJOURS filtré par `restaurant_id`.
 * Le propriétaire voit qui peut se connecter, avec quel rôle et quand la
 * personne s'est connectée pour la dernière fois.
 */
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { Role } from "@/lib/constants";

export type MembreEquipe = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
  dernierAccesAt: Date | null;
  createdAt: Date;
};

export async function equipeDuRestaurant(restaurantId: string): Promise<MembreEquipe[]> {
  return db
    .select({
      id: users.id,
      nom: users.nom,
      email: users.email,
      role: users.role,
      actif: users.actif,
      dernierAccesAt: users.dernierAccesAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.restaurantId, restaurantId))
    .orderBy(desc(users.createdAt));
}
