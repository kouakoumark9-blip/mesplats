/**
 * Constantes métier partagées entre le serveur et le client.
 * Source de vérité unique pour les rôles, statuts, moyens de paiement, etc.
 */

export const ROLES = ["admin", "serveur", "cuisine", "superadmin"] as const;
export type Role = (typeof ROLES)[number];

export const LIBELLES_ROLE: Record<Role, string> = {
  admin: "Propriétaire",
  serveur: "Serveur",
  cuisine: "Cuisine",
  superadmin: "Super administrateur",
};

export const DESCRIPTION_ROLE: Record<Role, string> = {
  admin: "Accès total : menu, tables, commandes, équipe, paiements et statistiques.",
  serveur: "Voit et traite les commandes sur l'écran de service.",
  cuisine: "Voit uniquement les commandes à préparer.",
  superadmin: "Gère la plateforme : restaurants, activation, suspension.",
};

/** Rôles qu'un propriétaire (admin) peut créer depuis son back-office. */
export const ROLES_EQUIPE = ["serveur", "cuisine"] as const;

export const PLANS = ["gratuit", "pro"] as const;
export type Plan = (typeof PLANS)[number];

/** Limite de produits selon le plan (null = illimité). */
export const LIMITE_PRODUITS: Record<Plan, number | null> = {
  gratuit: 20,
  pro: null,
};

/** Limite du nombre de comptes d'équipe (serveurs/cuisine) selon le plan. */
export const LIMITE_COMPTES_EQUIPE: Record<Plan, number | null> = {
  gratuit: 3,
  pro: null,
};

/** Limite du nombre de tables selon le plan (null = illimité). */
export const LIMITE_TABLES: Record<Plan, number | null> = {
  gratuit: 5,
  pro: null,
};

/**
 * Tarifs de l'abonnement, en FCFA par mois. Mesplats n'a pas de formule
 * gratuite : ces deux montants sont les seuls affichés sur le site.
 * L'annuel correspond à 10 mois payés sur 12 (deux mois offerts).
 */
export const TARIFS = { pro: 9_900, multi: 19_900 } as const;

export const LIBELLES_PLAN: Record<Plan, string> = {
  /**
   * « gratuit » est l'état technique d'un compte fraîchement créé : Mesplats ne
   * propose plus de formule gratuite, l'abonnement est payable par mobile money.
   */
  gratuit: "À activer",
  pro: "Pro",
};

/** États d'une commande de supports imprimés (boutique Mesplats). */
export const STATUTS_BOUTIQUE = ["nouvelle", "confirmee", "en_production", "expediee", "annulee"] as const;
export type StatutBoutique = (typeof STATUTS_BOUTIQUE)[number];

export const LIBELLES_STATUT_BOUTIQUE: Record<StatutBoutique, string> = {
  nouvelle: "À confirmer",
  confirmee: "Confirmée",
  en_production: "En production",
  expediee: "Expédiée",
  annulee: "Annulée",
};

/** Types de commande */
export const TYPES_COMMANDE = ["sur_place", "emporter"] as const;
export type TypeCommande = (typeof TYPES_COMMANDE)[number];

export const LIBELLES_TYPE_COMMANDE: Record<TypeCommande, string> = {
  sur_place: "Sur place",
  emporter: "À emporter",
};

/** Statuts d'une commande, dans l'ordre du cycle de vie. */
export const STATUTS = [
  "nouvelle",
  "acceptee",
  "en_preparation",
  "prete",
  "servie",
  "annulee",
] as const;
export type Statut = (typeof STATUTS)[number];

export const LIBELLES_STATUT: Record<Statut, string> = {
  nouvelle: "Nouvelle",
  acceptee: "Acceptée",
  en_preparation: "En préparation",
  prete: "Prête",
  servie: "Servie",
  annulee: "Annulée",
};

/** Statuts considérés comme « actifs » sur l'écran de service. */
export const STATUTS_ACTIFS: Statut[] = [
  "nouvelle",
  "acceptee",
  "en_preparation",
  "prete",
];

/** Classes Tailwind associées à chaque statut (fond + texte + bordure). */
export const COULEURS_STATUT: Record<Statut, string> = {
  nouvelle: "bg-amber-100 text-amber-900 border-amber-300",
  acceptee: "bg-blue-100 text-blue-900 border-blue-300",
  en_preparation: "bg-violet-100 text-violet-900 border-violet-300",
  prete: "bg-emerald-100 text-emerald-900 border-emerald-300",
  servie: "bg-slate-100 text-slate-700 border-slate-300",
  annulee: "bg-rose-100 text-rose-900 border-rose-300",
};

/** Couleur d'accent (barre latérale des cartes commande) */
export const ACCENTS_STATUT: Record<Statut, string> = {
  nouvelle: "bg-amber-500",
  acceptee: "bg-blue-500",
  en_preparation: "bg-violet-500",
  prete: "bg-emerald-500",
  servie: "bg-slate-400",
  annulee: "bg-rose-500",
};

export const MODES_PAIEMENT = ["orange", "moov", "mtn", "wave", "especes"] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const LIBELLES_PAIEMENT: Record<ModePaiement, string> = {
  orange: "Orange Money",
  moov: "Moov Money",
  mtn: "MTN MoMo",
  wave: "Wave",
  especes: "Espèces sur place",
};

export const CODES_PAIEMENT: Record<ModePaiement, string> = {
  orange: "OM",
  moov: "Moov",
  mtn: "MoMo",
  wave: "Wave",
  especes: "Cash",
};

export const OPERATEURS = ["orange", "moov", "mtn", "wave"] as const;

/* -------------------------------------------------------------------------- */
/*                    Apparence de la carte numérique (paramètres)            */
/* -------------------------------------------------------------------------- */

export const THEMES_MENU = ["clair", "sombre"] as const;
export type ThemeMenu = (typeof THEMES_MENU)[number];

/** Fonds proposés pour la carte : nom technique → libellé + couleur. */
export const COULEURS_FOND_MENU = [
  { cle: "neutre", libelle: "Neutre", couleur: "#f8fafc" },
  { cle: "blanc", libelle: "Blanc", couleur: "#ffffff" },
  { cle: "creme", libelle: "Crème", couleur: "#fdf6ec" },
  { cle: "menthe", libelle: "Menthe", couleur: "#ecfdf5" },
  { cle: "ciel", libelle: "Ciel", couleur: "#eff6ff" },
  { cle: "rose", libelle: "Rosé", couleur: "#fdf2f8" },
] as const;
export type CouleurFondMenu = (typeof COULEURS_FOND_MENU)[number]["cle"];

/**
 * Polices proposées pour la carte publique. Chaque entrée indique la variable
 * CSS à appliquer : les familles sont déjà chargées par `next/font`, donc
 * changer de police ne déclenche aucun téléchargement supplémentaire.
 */
export const POLICES_MENU = [
  { cle: "moderne", libelle: "Moderne", variable: "var(--font-titre)", exemple: "Aa" },
  { cle: "elegant", libelle: "Élégant", variable: "Georgia, 'Times New Roman', serif", exemple: "Aa" },
  { cle: "classique", libelle: "Classique", variable: "var(--font-sans)", exemple: "Aa" },
  { cle: "convivial", libelle: "Convivial", variable: "var(--font-marque)", exemple: "Aa" },
  { cle: "epure", libelle: "Épuré", variable: "ui-monospace, 'SF Mono', Menlo, monospace", exemple: "Aa" },
] as const;
export type PoliceMenu = (typeof POLICES_MENU)[number]["cle"];

/** Langues proposées pour la carte (la traduction est manuelle, hors ligne). */
export const LANGUES_MENU = [
  { cle: "fr", libelle: "Français" },
  { cle: "en", libelle: "Anglais" },
  { cle: "es", libelle: "Espagnol" },
  { cle: "ar", libelle: "Arabe" },
] as const;

export const RESEAUX_SOCIAUX = [
  { cle: "instagram", libelle: "Instagram", gabarit: "https://instagram.com/…" },
  { cle: "facebook", libelle: "Facebook", gabarit: "https://facebook.com/…" },
  { cle: "x", libelle: "X (Twitter)", gabarit: "https://x.com/…" },
  { cle: "snapchat", libelle: "Snapchat", gabarit: "https://snapchat.com/add/…" },
] as const;

/* -------------------------------------------------------------------------- */
/*                       Disponibilité des catégories                         */
/* -------------------------------------------------------------------------- */

/** 0 = lundi … 6 = dimanche (comme `Date.getDay()` converti). */
export const JOURS_SEMAINE = [
  { index: 0, court: "L", libelle: "Lundi" },
  { index: 1, court: "Ma", libelle: "Mardi" },
  { index: 2, court: "Me", libelle: "Mercredi" },
  { index: 3, court: "J", libelle: "Jeudi" },
  { index: 4, court: "V", libelle: "Vendredi" },
  { index: 5, court: "S", libelle: "Samedi" },
  { index: 6, court: "D", libelle: "Dimanche" },
] as const;

/** Raccourcis proposés au-dessus du sélecteur personnalisé. */
export const PRESETS_DISPONIBILITE = [
  { cle: "toujours", libelle: "Toujours" },
  { cle: "midi", libelle: "Midi" },
  { cle: "soir", libelle: "Soir" },
  { cle: "weekend", libelle: "Week-end" },
  { cle: "personnalise", libelle: "Personnalisé" },
] as const;
export type PresetDisponibilite = (typeof PRESETS_DISPONIBILITE)[number]["cle"];

/** Disponibilité d'une catégorie enregistrée en base (voir `categories`). */
export type DisponibiliteCategorie = {
  /** 0 = lundi … 6 = dimanche. Vide = tous les jours. */
  jours?: number[];
  /** Créneaux horaires « HH:MM ». Vide = toute la journée. */
  creneaux?: { debut: string; fin: string }[];
};

/* -------------------------------------------------------------------------- */
/*                        Personnalisation des QR codes                       */
/* -------------------------------------------------------------------------- */

export const STYLES_QR = [
  { cle: "classique", libelle: "Classique" },
  { cle: "arrondi", libelle: "Arrondi" },
  { cle: "points", libelle: "Points" },
  { cle: "chic", libelle: "Chic" },
  { cle: "elegant", libelle: "Élégant" },
] as const;
export type StyleQr = (typeof STYLES_QR)[number]["cle"];

export const COULEURS_QR = [
  "#0f172a",
  "#000000",
  "#E4572E",
  "#0b6b3a",
  "#0b5fa5",
  "#7c2d12",
] as const;
export type Operateur = (typeof OPERATEURS)[number];

export const PAIEMENT_STATUTS = ["en_attente", "paye"] as const;
export type PaiementStatut = (typeof PAIEMENT_STATUTS)[number];

export const LIBELLES_PAIEMENT_STATUT: Record<PaiementStatut, string> = {
  en_attente: "Paiement en attente",
  paye: "Payé",
};

/** Devises supportées (l'Afrique de l'Ouest utilise majoritairement le FCFA). */
export const DEVISES = ["FCFA", "GHS", "NGN", "GMD", "SLL", "LRD"] as const;
export type Devise = (typeof DEVISES)[number];

/**
 * Pays d'Afrique de l'Ouest proposés dans le sélecteur d'indicatif téléphonique.
 * La Côte d'Ivoire est proposée par défaut.
 */
export type Pays = {
  code: string;
  nom: string;
  indicatif: string;
  drapeau: string;
  longueurNumero: number;
};

export const PAYS_AFRIQUE_OUEST: Pays[] = [
  { code: "CI", nom: "Côte d'Ivoire", indicatif: "+225", drapeau: "🇨🇮", longueurNumero: 10 },
  { code: "SN", nom: "Sénégal", indicatif: "+221", drapeau: "🇸🇳", longueurNumero: 9 },
  { code: "ML", nom: "Mali", indicatif: "+223", drapeau: "🇲🇱", longueurNumero: 8 },
  { code: "BF", nom: "Burkina Faso", indicatif: "+226", drapeau: "🇧🇫", longueurNumero: 8 },
  { code: "NE", nom: "Niger", indicatif: "+227", drapeau: "🇳🇪", longueurNumero: 8 },
  { code: "TG", nom: "Togo", indicatif: "+228", drapeau: "🇹🇬", longueurNumero: 8 },
  { code: "BJ", nom: "Bénin", indicatif: "+229", drapeau: "🇧🇯", longueurNumero: 10 },
  { code: "GN", nom: "Guinée", indicatif: "+224", drapeau: "🇬🇳", longueurNumero: 9 },
  { code: "GH", nom: "Ghana", indicatif: "+233", drapeau: "🇬🇭", longueurNumero: 9 },
  { code: "NG", nom: "Nigeria", indicatif: "+234", drapeau: "🇳🇬", longueurNumero: 10 },
  { code: "GM", nom: "Gambie", indicatif: "+220", drapeau: "🇬🇲", longueurNumero: 7 },
  { code: "SL", nom: "Sierra Leone", indicatif: "+232", drapeau: "🇸🇱", longueurNumero: 8 },
  { code: "LR", nom: "Libéria", indicatif: "+231", drapeau: "🇱🇷", longueurNumero: 8 },
  { code: "GW", nom: "Guinée-Bissau", indicatif: "+245", drapeau: "🇬🇼", longueurNumero: 7 },
  { code: "MR", nom: "Mauritanie", indicatif: "+222", drapeau: "🇲🇷", longueurNumero: 8 },
  { code: "CV", nom: "Cap-Vert", indicatif: "+238", drapeau: "🇨🇻", longueurNumero: 7 },
];

export const PAYS_DEFAUT = PAYS_AFRIQUE_OUEST[0];

/**
 * Anti-spam côté client : nombre maximal de commandes par numéro de téléphone,
 * et par session de navigation, sur une fenêtre glissante.
 */
export const LIMITES_COMMANDE = {
  parTelephoneParHeure: 3,
  parSession: 6,
  fenetreMinutes: 60,
};

/** Délai pendant lequel l'alerte « Appeler le serveur » reste visible. */
export const APPEL_SERVEUR_MINUTES = 3;
