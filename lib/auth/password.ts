/**
 * Hachage des mots de passe avec bcrypt (facteur de coût 10).
 *
 * Coût 10 ≈ 80–120 ms sur un runtime serverless : suffisant pour freiner les
 * attaques par force brute tout en gardant la connexion rapide en 3G/4G.
 */
import { compare, hash } from "bcryptjs";

const TOURS = 10;

/** Hache un mot de passe en clair. */
export function hacherMotDePasse(motDePasse: string): Promise<string> {
  return hash(motDePasse, TOURS);
}

/** Vérifie un mot de passe contre son empreinte bcrypt. */
export async function verifierMotDePasse(
  motDePasse: string,
  empreinte: string | null | undefined,
): Promise<boolean> {
  if (!empreinte) return false;
  try {
    return await compare(motDePasse, empreinte);
  } catch {
    return false;
  }
}

/**
 * Empreinte factice comparée lorsqu'aucun compte ne correspond à l'email
 * fourni : le temps de réponse reste ainsi constant et l'énumération des
 * comptes existants n'est pas possible.
 */
const EMPREINTE_FACTICE = "$2b$10$hBqLZ6Lh9nO4PQd6uL8Xxu3E1sE/r/Qz2F6M5kL9cJ1o7y8nO5O5K";

export async function comparerAvecEmpreinteFactice(motDePasse: string): Promise<void> {
  try {
    await compare(motDePasse, EMPREINTE_FACTICE);
  } catch {
    // Ignoré : cette comparaison n'a qu'un rôle de temporisation.
  }
}
