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

export const LIBELLES_PLAN: Record<Plan, string> = {
  gratuit: "Gratuit",
  pro: "Pro",
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

export const MODES_PAIEMENT = ["orange", "moov", "mtn", "especes"] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const LIBELLES_PAIEMENT: Record<ModePaiement, string> = {
  orange: "Orange Money",
  moov: "Moov Money",
  mtn: "MTN MoMo",
  especes: "Espèces sur place",
};

export const CODES_PAIEMENT: Record<ModePaiement, string> = {
  orange: "OM",
  moov: "Moov",
  mtn: "MoMo",
  especes: "Cash",
};

export const OPERATEURS = ["orange", "moov", "mtn"] as const;
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
