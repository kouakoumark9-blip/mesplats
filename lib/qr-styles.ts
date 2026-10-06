/**
 * Rendu avancé des QR codes : 5 styles, couleurs libres, logo au centre.
 * ---------------------------------------------------------------------------
 * Un seul jeu de paramètres, deux sorties :
 *  • `svgQrAvance()`   → balisage SVG (net à l'impression, ~2 Ko) ;
 *  • `dessinerQrCanvas()` → PNG haute résolution dessiné dans le navigateur.
 *
 * Les styles agissent sur la forme des « modules » (les petits carrés) et sur
 * les trois « yeux » (motifs de repérage) afin de rester lisibles : le contraste
 * et la proportion des modules sont conservés, seuls les contours changent.
 *
 * Le module n'est ni « use server » ni « use client » : il est utilisable des
 * deux côtés. `qrcode` fournit la matrice (aucune API réseau).
 */
import QRCode from "qrcode";

import type { StyleQr } from "@/lib/constants";

export type MotifModule = "carre" | "arrondi" | "cercle" | "losange" | "feuille";
export type MotifOeil = "carre" | "arrondi" | "rond";

export type ParametresQrAvance = {
  texte: string;
  style: StyleQr;
  /** Couleur du motif (modules et yeux). */
  fonce: string;
  /** Couleur du fond, y compris la zone de silence. */
  clair: string;
  /** Marge en modules (2 = bon compromis écran/impression). */
  marge?: number;
  /** Affiche le logo du restaurant au centre du code. */
  logoUrl?: string | null;
  /** Force un niveau de correction (par défaut : H si logo, M sinon). */
  correction?: "L" | "M" | "Q" | "H";
};

/** Apparence de chaque style : motif des modules, yeux et épaisseur. */
export const APPARENCE_QR: Record<
  StyleQr,
  { module: MotifModule; oeil: MotifOeil; echelle: number }
> = {
  // Référence sobre, très bien lue par les vieux téléphones.
  classique: { module: "carre", oeil: "carre", echelle: 1 },
  // Coins adoucis : le style par défaut des QR « modernes ».
  arrondi: { module: "arrondi", oeil: "arrondi", echelle: 0.96 },
  // Pastilles rondes, très lisible en grand format (chevalets).
  points: { module: "cercle", oeil: "rond", echelle: 0.92 },
  // Losanges : le rendu le plus décoratif, pour les cartes de table.
  chic: { module: "losange", oeil: "rond", echelle: 1 },
  // Feuilles : deux coins arrondis, tracé fin et élégant à grande échelle.
  elegant: { module: "feuille", oeil: "rond", echelle: 0.98 },
};

export type MatriceQr = {
  /** Nombre de modules sur un côté (hors marge). */
  taille: number;
  /** true = module noir. Indexé `[y][x]`. */
  modules: boolean[][];
  /** true si le module appartient à l'un des trois yeux de repérage. */
  yeux: boolean[][];
};

/** Construit la matrice du QR code et repère les yeux de repérage. */
export function matriceQr(texte: string, correction: "L" | "M" | "Q" | "H" = "M"): MatriceQr {
  const code = QRCode.create(texte, { errorCorrectionLevel: correction });
  const taille = code.modules.size;
  const modules: boolean[][] = [];
  const yeux: boolean[][] = [];

  for (let y = 0; y < taille; y += 1) {
    const ligneModules: boolean[] = [];
    const ligneYeux: boolean[] = [];
    for (let x = 0; x < taille; x += 1) {
      ligneModules.push(Boolean(code.modules.get(x, y)));
      const dansUnCoin =
        (x < 7 && y < 7) ||
        (x >= taille - 7 && y < 7) ||
        (x < 7 && y >= taille - 7);
      ligneYeux.push(dansUnCoin);
    }
    modules.push(ligneModules);
    yeux.push(ligneYeux);
  }

  return { taille, modules, yeux };
}

/* -------------------------------------------------------------------------- */
/*                              Tracés SVG                                    */
/* -------------------------------------------------------------------------- */

function cheminModule(x: number, y: number, taille: number, motif: MotifModule): string {
  const s = taille;
  switch (motif) {
    case "arrondi": {
      const r = s * 0.32;
      return (
        `M${x + r} ${y}h${s - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${s - 2 * r}` +
        `a${r} ${r} 0 0 1 -${r} ${r}h-${s - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}` +
        `v-${s - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`
      );
    }
    case "cercle": {
      const r = s / 2;
      return (
        `M${x} ${y + r}a${r} ${r} 0 1 0 ${s} 0a${r} ${r} 0 1 0 -${s} 0z`
      );
    }
    case "losange": {
      const c = s / 2;
      return (
        `M${x + c} ${y}L${x + s} ${y + c}L${x + c} ${y + s}L${x} ${y + c}z`
      );
    }
    case "feuille": {
      const r = s * 0.5;
      return (
        `M${x + r} ${y}h${s - r}v${s - r}` +
        `a${r} ${r} 0 0 1 -${r} ${r}h-${s - r}v-${s - r}` +
        `a${r} ${r} 0 0 1 ${r} -${r}z`
      );
    }
    case "carre":
    default:
      return `M${x} ${y}h${s}v${s}h-${s}z`;
  }
}

/** Cercle plein (utilisé pour reconstruire les yeux des styles ronds). */
function cercle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 -${r * 2} 0z`;
}

/**
 * Tracé d'un « œil » de repérage, exprimé en modules (carré de 7 × 7) :
 * anneau extérieur de 1 module, trou de 5, pastille centrale de 3. Ces
 * proportions sont celles du QR code : les respecter garantit que les
 * téléphones reconnaissent le code, quel que soit le style choisi.
 */
function cheminOeil(oeil: MotifOeil): string {
  if (oeil === "carre") {
    return (
      "M0 0h7v7h-7z" + // anneau extérieur
      "M1 1h5v5h-5z" + // trou
      "M2 2h3v3h-3z" // pastille centrale
    );
  }

  if (oeil === "rond") {
    // Cercles : extérieur Ø 7, trou Ø 5, pastille Ø 3 → rapport 1:1:3:1:1.
    const anneau = cercle(3.5, 3.5, 3.5) + cercle(3.5, 3.5, 2.5);
    return anneau + cercle(3.5, 3.5, 1.5);
  }

  // « arrondi » : même géométrie que le carré, coins adoucis.
  const arrondi = (x: number, y: number, cote: number, rayon: number) =>
    `M${x + rayon} ${y}h${cote - 2 * rayon}a${rayon} ${rayon} 0 0 1 ${rayon} ${rayon}` +
    `v${cote - 2 * rayon}a${rayon} ${rayon} 0 0 1 -${rayon} ${rayon}` +
    `h-${cote - 2 * rayon}a${rayon} ${rayon} 0 0 1 -${rayon} -${rayon}` +
    `v-${cote - 2 * rayon}a${rayon} ${rayon} 0 0 1 ${rayon} -${rayon}z`;

  return arrondi(0, 0, 7, 1.4) + arrondi(1, 1, 5, 0.8) + arrondi(2, 2, 3, 0.6);
}

/** Positions (coin haut-gauche) des trois yeux de repérage. */
function positionsYeux(taille: number): { x: number; y: number }[] {
  return [
    { x: 0, y: 0 },
    { x: taille - 7, y: 0 },
    { x: 0, y: taille - 7 },
  ];
}

/**
 * QR code complet en SVG. La taille est exprimée en « modules » : le SVG est
 * vectoriel, il s'adapte donc à n'importe quelle largeur d'affichage.
 */
export function svgQrAvance(params: ParametresQrAvance): string {
  const marge = params.marge ?? 2;
  const logo = params.logoUrl?.trim() ? params.logoUrl.trim() : null;
  const correction = params.correction ?? (logo ? "H" : "M");
  const { taille, modules, yeux } = matriceQr(params.texte, correction);
  const apparence = APPARENCE_QR[params.style] ?? APPARENCE_QR.classique;

  const cote = taille + marge * 2;
  const echelle = apparence.echelle;
  /** Marge intérieure du module : recentre le motif dans sa cellule. */
  const decalage = (1 - echelle) / 2;

  const modulesPaths: string[] = [];
  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      if (!modules[y][x] || yeux[y][x]) continue;
      modulesPaths.push(
        cheminModule(
          marge + x + decalage,
          marge + y + decalage,
          echelle,
          apparence.module,
        ),
      );
    }
  }

  const yeuxPaths = positionsYeux(taille).map(
    (position) =>
      `<path transform="translate(${marge + position.x} ${marge + position.y})" ` +
      `d="${cheminOeil(apparence.oeil)}"/>`,
  );

  /* --------------------------- Logo au centre ---------------------------- */
  let logoBalise = "";
  if (logo) {
    // 22 % du côté : la correction d'erreur H tolère jusqu'à ~30 %.
    const tailleLogo = cote * 0.22;
    const cadre = tailleLogo * 1.22;
    const x = (cote - cadre) / 2;
    const rayon = cadre * 0.18;
    logoBalise =
      `<rect x="${x}" y="${x}" width="${cadre}" height="${cadre}" rx="${rayon}" ` +
      `fill="${params.clair}"/>` +
      `<rect x="${x}" y="${x}" width="${cadre}" height="${cadre}" rx="${rayon}" ` +
      `fill="none" stroke="${params.fonce}" stroke-opacity="0.12" stroke-width="${cote * 0.004}"/>` +
      `<image href="${echapper(logo)}" x="${(cote - tailleLogo) / 2}" y="${(cote - tailleLogo) / 2}" ` +
      `width="${tailleLogo}" height="${tailleLogo}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cote} ${cote}" ` +
    `width="100%" height="100%" shape-rendering="geometricPrecision" role="img" ` +
    `aria-label="QR code du menu">` +
    `<rect width="${cote}" height="${cote}" fill="${params.clair}"/>` +
    `<g fill="${params.fonce}" fill-rule="evenodd">` +
    `<path d="${modulesPaths.join("")}"/>` +
    yeuxPaths.join("") +
    `</g>` +
    logoBalise +
    `</svg>`
  );
}

function echapper(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* -------------------------------------------------------------------------- */
/*                         Export PNG (côté navigateur)                       */
/* -------------------------------------------------------------------------- */

/**
 * Dessine le QR code dans un canvas (navigateur uniquement) et renvoie un
 * `data:image/png;base64,…` prêt à télécharger. Le rendu reprend exactement le
 * même style que la version SVG affichée à l'écran.
 */
export async function dessinerQrCanvas(
  params: ParametresQrAvance & { pixels?: number },
): Promise<string> {
  const pixels = params.pixels ?? 1024;
  const marge = params.marge ?? 2;
  const logo = params.logoUrl?.trim() ? params.logoUrl.trim() : null;
  const correction = params.correction ?? (logo ? "H" : "M");
  const { taille, modules, yeux } = matriceQr(params.texte, correction);
  const apparence = APPARENCE_QR[params.style] ?? APPARENCE_QR.classique;

  const cote = taille + marge * 2;
  const unite = pixels / cote;

  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible dans ce navigateur.");

  ctx.fillStyle = params.clair;
  ctx.fillRect(0, 0, pixels, pixels);
  ctx.fillStyle = params.fonce;

  const echelle = apparence.echelle;
  const decalage = (1 - echelle) / 2;

  const dessinerModule = (x: number, y: number) => {
    const s = unite * echelle;
    const px = (marge + x + decalage) * unite;
    const py = (marge + y + decalage) * unite;
    ctx.beginPath();
    switch (apparence.module) {
      case "arrondi": {
        const r = s * 0.32;
        ctx.moveTo(px + r, py);
        ctx.arcTo(px + s, py, px + s, py + s, r);
        ctx.arcTo(px + s, py + s, px, py + s, r);
        ctx.arcTo(px, py + s, px, py, r);
        ctx.arcTo(px, py, px + s, py, r);
        break;
      }
      case "cercle":
        ctx.arc(px + s / 2, py + s / 2, s / 2, 0, Math.PI * 2);
        break;
      case "losange":
        ctx.moveTo(px + s / 2, py);
        ctx.lineTo(px + s, py + s / 2);
        ctx.lineTo(px + s / 2, py + s);
        ctx.lineTo(px, py + s / 2);
        break;
      case "feuille": {
        // Deux coins arrondis (haut-gauche et bas-droit), deux coins droits.
        const r = s * 0.5;
        ctx.moveTo(px + r, py);
        ctx.lineTo(px + s, py);
        ctx.lineTo(px + s, py + s - r);
        ctx.arcTo(px + s, py + s, px + s - r, py + s, r);
        ctx.lineTo(px, py + s);
        ctx.lineTo(px, py + r);
        ctx.arcTo(px, py, px + r, py, r);
        break;
      }
      case "carre":
      default:
        ctx.rect(px, py, s, s);
    }
    ctx.fill("evenodd");
  };

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      if (!modules[y][x] || yeux[y][x]) continue;
      dessinerModule(x, y);
    }
  }

  /* --------------------------- Les trois yeux ---------------------------- */
  const dessinerOeil = (ox: number, oy: number) => {
    const x = (marge + ox) * unite;
    const y = (marge + oy) * unite;
    const m = unite; // un module

    /*
     * Les trois formes sont tracées dans UN SEUL chemin puis remplies en
     * `evenodd` : le trou du milieu reste clair et la pastille centrale est
     * pleine. C'est ce rapport 1:1:3:1:1 qui permet aux téléphones de
     * reconnaître le code.
     */
    const carre = (decalage: number, cote: number, rayon: number) => {
      const d = decalage * m;
      const c = cote * m;
      if (rayon > 0) ctx.roundRect(x + d, y + d, c, c, rayon * m);
      else ctx.rect(x + d, y + d, c, c);
    };

    const cercle = (cx: number, cy: number, rayon: number) => {
      const centreX = x + cx * m;
      const centreY = y + cy * m;
      const r = rayon * m;
      ctx.moveTo(centreX + r, centreY);
      ctx.arc(centreX, centreY, r, 0, Math.PI * 2);
    };

    ctx.beginPath();
    if (apparence.oeil === "rond") {
      cercle(3.5, 3.5, 3.5);
      cercle(3.5, 3.5, 2.5);
      cercle(3.5, 3.5, 1.5);
    } else if (apparence.oeil === "carre") {
      carre(0, 7, 0);
      carre(1, 5, 0);
      carre(2, 3, 0);
    } else {
      carre(0, 7, 1.4);
      carre(1, 5, 0.8);
      carre(2, 3, 0.6);
    }
    ctx.fill("evenodd");
  };

  positionsYeux(taille).forEach((position) => dessinerOeil(position.x, position.y));

  /* ----------------------------- Logo central ---------------------------- */
  if (logo) {
    const image = await chargerImage(logo).catch(() => null);
    if (image) {
      const tailleLogo = pixels * 0.22;
      const cadre = tailleLogo * 1.22;
      const position = (pixels - cadre) / 2;
      const rayon = cadre * 0.18;

      ctx.fillStyle = params.clair;
      ctx.beginPath();
      ctx.roundRect(position, position, cadre, cadre, rayon);
      ctx.fill();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = params.fonce;
      ctx.lineWidth = Math.max(1, pixels * 0.004);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.drawImage(image, (pixels - tailleLogo) / 2, (pixels - tailleLogo) / 2, tailleLogo, tailleLogo);
    }
  }

  return canvas.toDataURL("image/png");
}

export function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resoudre(image);
    image.onerror = () => rejeter(new Error(`Image illisible : ${url}`));
    image.src = url;
  });
}
