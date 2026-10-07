/**
 * Catalogue de la Boutique Mesplats — supports imprimés autour du menu QR.
 * ---------------------------------------------------------------------------
 * Source de vérité unique : la même liste sert à l'affichage ET au calcul du
 * prix côté serveur (`lib/actions/boutique.ts`). Un prix envoyé par le
 * navigateur n'est jamais retenu : il est toujours relu ici.
 *
 * Les tarifs sont dégressifs par palier de quantité (comme chez un imprimeur) :
 * plus le tirage est important, plus le prix unitaire baisse. Tout est en FCFA,
 * impression et livraison à Abidjan comprises.
 */

export type OptionBoutique = {
  id: string;
  nom: string;
  /** Supplément par unité, en FCFA (0 = inclus). */
  prix: number;
};

export type PalierBoutique = {
  /** Quantité à partir de laquelle ce prix unitaire s'applique. */
  aPartirDe: number;
  prixUnitaire: number;
};

export type ArticleBoutique = {
  id: string;
  nom: string;
  /** Titre court affiché sur la vignette. */
  accroche: string;
  description: string;
  /** Visuel produit (photo de catalogue) — dans /public/boutique. */
  photo: string;
  /** Prix unitaire de base (premier palier), en FCFA. */
  prixUnitaire: number;
  /** Paliers dégressifs, du plus petit au plus grand tirage. */
  paliers: PalierBoutique[];
  /** Quantité minimale d'un tirage. */
  minimum: number;
  /** Pas d'incrémentation conseillé (10, 5, 25…). */
  pas: number;
  /** Tirage maximal conseillé pour un même atelier d'impression. */
  maximum: number;
  /** Caractéristiques techniques, affichées en puces sous la description. */
  specifications: string[];
  options: OptionBoutique[];
  /** Badge éventuel : « Le plus commandé », « Nouveau »… */
  miseEnAvant?: string;
};

/** Délai de fabrication annoncé par produit (ou par défaut). */
export const DELAI_DEFAUT = "3 jours ouvrés";

export const CATALOGUE_BOUTIQUE: ArticleBoutique[] = [
  {
    id: "chevalet-plexiglas",
    nom: "Chevalet de table en plexiglas",
    accroche: "Le classique de la salle",
    description:
      "Chevalet A6 en plexiglas 2 mm avec carte interchangeable. Votre QR code est imprimé au centre, votre logo en en-tête. Se nettoie d'un coup de chiffon, résiste aux éclaboussures de sauce et aux années de service.",
    photo: "/boutique/chevalet-de-table.jpg",
    prixUnitaire: 4_500,
    paliers: [
      { aPartirDe: 1, prixUnitaire: 4_500 },
      { aPartirDe: 10, prixUnitaire: 4_000 },
      { aPartirDe: 25, prixUnitaire: 3_500 },
    ],
    minimum: 1,
    pas: 1,
    maximum: 200,
    specifications: [
      "Plexiglas cristal 2 mm, bords polis",
      "Carte A6 quadri, papier 350 g",
      "QR code testé au scan avant expédition",
    ],
    options: [
      { id: "logo-couleur", nom: "Logo du restaurant en couleur", prix: 500 },
      { id: "carte-supplementaire", nom: "Carte de rechange supplémentaire", prix: 800 },
      { id: "pied-antiderapant", nom: "Pied antidérapant renforcé", prix: 300 },
    ],
    miseEnAvant: "Le plus commandé",
  },
  {
    id: "stickers-ronds",
    nom: "Stickers ronds autocollants",
    accroche: "Tout-terrain, intérieur et extérieur",
    description:
      "Sticker vinyle Ø 5 cm, waterproof, à coller sur la vitrine, le comptoir, la glacière ou le capot des livreurs. Il résiste aux lavages quotidiens et au soleil : c'est le support qui travaille même quand la salle est fermée.",
    photo: "/boutique/stickers-ronds.jpg",
    prixUnitaire: 500,
    paliers: [
      { aPartirDe: 10, prixUnitaire: 500 },
      { aPartirDe: 50, prixUnitaire: 400 },
      { aPartirDe: 100, prixUnitaire: 330 },
    ],
    minimum: 10,
    pas: 10,
    maximum: 1_000,
    specifications: [
      "Vinyle blanc mat Ø 5 cm",
      "Adhésif renforcé, waterproof",
      "Tenue 3 ans à l'extérieur, sans jaunissement",
    ],
    options: [
      { id: "decoupe-forme", nom: "Découpe à la forme de votre logo", prix: 120 },
      { id: "vernis-selectif", nom: "Vernis sélectif brillant sur le QR", prix: 90 },
    ],
    miseEnAvant: "Dès 10 exemplaires",
  },
  {
    id: "sous-bocks",
    nom: "Sous-bocks QR en carton épais",
    accroche: "Pour le bar et les terrasses",
    description:
      "Sous-bock rond Ø 9 cm, carton 400 g pelliculé. Le client pose son verre dessus, scanne, commande — sans jamais quitter sa table. Un support naturellement regardé, à chaque tournée.",
    photo: "/boutique/sous-bocks.jpg",
    prixUnitaire: 350,
    paliers: [
      { aPartirDe: 25, prixUnitaire: 350 },
      { aPartirDe: 100, prixUnitaire: 280 },
      { aPartirDe: 250, prixUnitaire: 230 },
    ],
    minimum: 25,
    pas: 25,
    maximum: 2_000,
    specifications: [
      "Carton 400 g, pelliculage brillant recto",
      "Ø 9 cm, absorption boisson",
      "QR code lisible même avec un verre posé",
    ],
    options: [
      { id: "recto-verso", nom: "Impression recto-verso", prix: 60 },
      { id: "bordure-coloree", nom: "Bordure à votre couleur", prix: 40 },
    ],
  },
  {
    id: "set-de-table",
    nom: "Set de table papier QR",
    accroche: "Format 30 × 42 cm",
    description:
      "Set de table en papier 80 g imprimé avec votre QR code, vos horaires et votre numéro WhatsApp. Il fait office de menu, de sous-main et de pub pour vos plats du jour, à chaque service.",
    photo: "/boutique/set-de-table.jpg",
    prixUnitaire: 250,
    paliers: [
      { aPartirDe: 50, prixUnitaire: 250 },
      { aPartirDe: 200, prixUnitaire: 200 },
      { aPartirDe: 500, prixUnitaire: 165 },
    ],
    minimum: 50,
    pas: 50,
    maximum: 5_000,
    specifications: [
      "Papier 80 g blanc, format 30 × 42 cm",
      "Encre alimentaire certifiée",
      "Zone menu du jour laissée libre si besoin",
    ],
    options: [
      { id: "menu-du-jour", nom: "Emplacement « plat du jour » imprimé", prix: 20 },
      { id: "double-face", nom: "Impression recto-verso", prix: 45 },
    ],
  },
  {
    id: "affiche-vitrine",
    nom: "Affiche A3 plastifiée",
    accroche: "Pour la vitrine et l'entrée",
    description:
      "Affiche A3 plastifiée 250 microns, à fixer aux ventouses ou à encadrer. QR code en très grand format, testé à 5 mètres de distance : le client scanne depuis la rue, avant même d'entrer.",
    photo: "/boutique/affiche-vitrine.jpg",
    prixUnitaire: 6_000,
    paliers: [
      { aPartirDe: 1, prixUnitaire: 6_000 },
      { aPartirDe: 5, prixUnitaire: 5_200 },
      { aPartirDe: 10, prixUnitaire: 4_500 },
    ],
    minimum: 1,
    pas: 1,
    maximum: 100,
    specifications: [
      "Format A3 (29,7 × 42 cm), plastification mate",
      "Œillets ou ventouses au choix",
      "Lisibilité testée jusqu'à 5 m",
    ],
    options: [
      { id: "ventouses", nom: "4 ventouses de vitrine incluses", prix: 700 },
      { id: "oeillets", nom: "Œillets métalliques renforcés", prix: 600 },
      { id: "format-a2", nom: "Passer au format A2", prix: 2_500 },
    ],
  },
  {
    id: "pack-maquis",
    nom: "Pack complet « Maquis 10 tables »",
    accroche: "Tout équiper d'un coup",
    description:
      "La dotation complète d'un maquis de 10 tables : 10 chevalets, 4 stickers vitrine, 50 sous-bocks et une affiche A3. Un seul tirage, un seul délai, un prix groupé — et chaque table devient un point de commande.",
    photo: "/boutique/pack-complet.jpg",
    prixUnitaire: 78_000,
    paliers: [
      { aPartirDe: 1, prixUnitaire: 78_000 },
      { aPartirDe: 3, prixUnitaire: 71_000 },
    ],
    minimum: 1,
    pas: 1,
    maximum: 20,
    specifications: [
      "10 chevalets A6 + 4 stickers + 50 sous-bocks + 1 affiche A3",
      "Économie moyenne de 18 % par rapport à l'achat séparé",
      "Livraison groupée, une seule adresse",
    ],
    options: [
      { id: "tables-15", nom: "Passer à 15 tables (+ 5 chevalets)", prix: 18_000 },
      { id: "livraison-province", nom: "Livraison en province (transporteur)", prix: 4_500 },
    ],
  },
];

/** Recherche un article du catalogue par identifiant. */
export function articleBoutique(id: string): ArticleBoutique | null {
  return CATALOGUE_BOUTIQUE.find((article) => article.id === id) ?? null;
}

/** Prix unitaire applicable à une quantité (paliers dégressifs). */
export function prixUnitairePour(article: ArticleBoutique, quantite: number): number {
  const palier = [...article.paliers]
    .sort((a, b) => b.aPartirDe - a.aPartirDe)
    .find((candidat) => quantite >= candidat.aPartirDe);
  return palier?.prixUnitaire ?? article.prixUnitaire;
}

/** Montant du prochain palier, pour afficher « dès X pièces, Y FCFA ». */
export function prochainPalier(article: ArticleBoutique, quantite: number) {
  return article.paliers.find((palier) => palier.aPartirDe > quantite) ?? null;
}

/** Récapitulatif d'une ligne de panier, prix recalculé. */
export type LignePanier = {
  articleId: string;
  nom: string;
  photo: string;
  quantite: number;
  prixUnitaire: number;
  options: { nom: string; prix: number }[];
  /** Identifiants des options choisies : seuls eux partent au serveur. */
  optionsIds: string[];
  /** Total de la ligne : (prix unitaire + options) × quantité. */
  total: number;
};

/** Construit une ligne de panier à partir du catalogue (jamais du navigateur). */
export function construireLigne(
  article: ArticleBoutique,
  quantite: number,
  optionsChoisies: string[],
): LignePanier {
  const options = article.options
    .filter((option) => optionsChoisies.includes(option.id))
    .map((option) => ({ nom: option.nom, prix: option.prix }));

  const supplement = options.reduce((somme, option) => somme + option.prix, 0);
  const prixUnitaire = prixUnitairePour(article, quantite);

  return {
    articleId: article.id,
    nom: article.nom,
    photo: article.photo,
    quantite,
    prixUnitaire,
    options,
    optionsIds: [...optionsChoisies],
    total: (prixUnitaire + supplement) * quantite,
  };
}

/** Référence lisible d'une commande de supports : MP-2607-4F3A. */
export function referenceBoutique(): string {
  const maintenant = new Date();
  const annee = String(maintenant.getFullYear()).slice(2);
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const aleatoire = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `MP-${annee}${mois}-${aleatoire}`;
}
