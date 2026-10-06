/**
 * Génération de QR codes — module réservé au serveur.
 *
 * ⚠️ Ne jamais importer ce fichier depuis un composant client : `qrcode`
 * s'appuie sur des API Node (Buffer).
 *
 * Utilisé par la page d'accueil (QR de démonstration) et, à l'étape 3, par
 * l'atelier « Tables & QR codes » (export PNG et planche PDF imprimable).
 */
import QRCode from "qrcode";

export type OptionsQr = {
  /** Taille en pixels de l'image générée. */
  taille?: number;
  /** Marge blanche autour du motif, en modules (4 = norme d'impression). */
  marge?: number;
  /** Couleur du motif. */
  fonce?: string;
  /** Couleur du fond. */
  clair?: string;
  /** Niveau de correction d'erreur : L, M, Q, H (H = 30 % de dégradation tolérée). */
  correction?: "L" | "M" | "Q" | "H";
};

const DEFAUTS: Required<OptionsQr> = {
  taille: 512,
  marge: 2,
  fonce: "#0f172a",
  clair: "#ffffff",
  correction: "M",
};

function versOptions(options?: OptionsQr) {
  const o = { ...DEFAUTS, ...options };
  return {
    width: o.taille,
    margin: o.marge,
    errorCorrectionLevel: o.correction,
    color: { dark: o.fonce, light: o.clair },
  } as const;
}

/** QR code au format `data:image/png;base64,…` (utilisable dans un <img> ou un PDF). */
export function qrDataUrl(contenu: string, options?: OptionsQr): Promise<string> {
  return QRCode.toDataURL(contenu, versOptions(options));
}

/** QR code vectoriel SVG (impression de grande qualité, poids minimal). */
export function qrSvg(contenu: string, options?: OptionsQr): Promise<string> {
  return QRCode.toString(contenu, { ...versOptions(options), type: "svg" });
}

/** QR code en mémoire, prêt à être envoyé en PNG par une route d'API. */
export function qrPng(contenu: string, options?: OptionsQr): Promise<Buffer> {
  return QRCode.toBuffer(contenu, { ...versOptions(options), type: "png" });
}
