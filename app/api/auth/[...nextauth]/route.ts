/**
 * Point de terminaison Auth.js (`/api/auth/*`) : connexion, déconnexion,
 * session, CSRF et callbacks.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// bcrypt et le pilote postgres nécessitent le runtime Node.
export const runtime = "nodejs";
