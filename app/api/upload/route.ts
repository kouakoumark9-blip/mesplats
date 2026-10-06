/**
 * Téléversement des photos de plats vers Vercel Blob.
 * ---------------------------------------------------------------------------
 * - réservé aux propriétaires (rôle `admin`) d'un restaurant actif ;
 * - le fichier est rangé sous `restaurants/<id>/plats/`, ce qui garantit qu'un
 *   restaurant ne peut pas écraser les images d'un autre ;
 * - si `BLOB_READ_WRITE_TOKEN` n'est pas configuré, on répond 503 avec un
 *   message explicite : l'interface propose alors de coller une adresse
 *   d'image, ce qui permet d'utiliser l'application sans Blob.
 */
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { exigerApiRestaurant } from "@/lib/auth/autorisation";
import { blobToken } from "@/lib/env";
import { identifiantCourt } from "@/lib/utils";

/** Types acceptés : photos prises au téléphone ou préparées sur ordinateur. */
const TYPES_ACCEPTES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** 5 Mo : une photo de plat prise avec un téléphone reste bien en dessous. */
const TAILLE_MAX = 5 * 1024 * 1024;

export async function POST(requete: Request) {
  const garde = await exigerApiRestaurant("admin");
  if ("reponse" in garde) return garde.reponse;

  const jeton = blobToken();
  if (!jeton) {
    return NextResponse.json(
      {
        erreur:
          "Le stockage de photos n'est pas encore activé sur ce serveur. " +
          "Collez plutôt l'adresse d'une image (https://…) ou activez Vercel Blob " +
          "en renseignant BLOB_READ_WRITE_TOKEN.",
      },
      { status: 503 },
    );
  }

  let donnees: FormData;
  try {
    donnees = await requete.formData();
  } catch {
    return NextResponse.json({ erreur: "Envoi illisible." }, { status: 400 });
  }

  const fichier = donnees.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return NextResponse.json({ erreur: "Aucun fichier reçu." }, { status: 400 });
  }

  const extension = TYPES_ACCEPTES[fichier.type];
  if (!extension) {
    return NextResponse.json(
      { erreur: "Format non pris en charge. Utilisez une image JPG, PNG, WEBP ou AVIF." },
      { status: 415 },
    );
  }

  if (fichier.size > TAILLE_MAX) {
    return NextResponse.json(
      { erreur: "Image trop lourde (5 Mo maximum). Compressez-la puis réessayez." },
      { status: 413 },
    );
  }

  try {
    const { url } = await put(
      `restaurants/${garde.utilisateur.restaurantId}/plats/${Date.now()}-${identifiantCourt()}.${extension}`,
      fichier,
      { access: "public", token: jeton, contentType: fichier.type },
    );

    return NextResponse.json({ url });
  } catch (erreur) {
    console.error("Échec du téléversement Blob :", erreur);
    return NextResponse.json(
      { erreur: "Le téléversement a échoué. Vérifiez votre connexion puis réessayez." },
      { status: 502 },
    );
  }
}
