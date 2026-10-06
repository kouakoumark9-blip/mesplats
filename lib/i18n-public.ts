/**
 * Libellés de la carte publique, dans les langues choisies par le restaurant.
 * ---------------------------------------------------------------------------
 * Les noms de plats et leurs descriptions restent dans la langue de saisie du
 * restaurateur ; ce sont les libellés de l'interface (titres, boutons, mentions
 * d'épuisement, informations pratiques) qui sont traduits. La langue active est
 * portée par l'URL (`?lang=en`), ce qui fonctionne sans JavaScript et se
 * partage facilement par WhatsApp.
 */
export const LIBELLES_PUBLICS = {
  fr: {
    notreCarte: "Notre carte",
    sousTitreCarte: "Prix affichés en francs CFA, service compris",
    recherche: "Rechercher un plat",
    options: "Options",
    epuise: "Épuisé",
    serviDe: "Servi",
    revientPlusTard: "Cette partie de la carte revient plus tard",
    rienTrouve: "Aucun plat ne correspond à votre recherche.",
    vide: "Aucun plat au menu pour le moment",
    videDetail: "Le restaurateur n'a pas encore publié de catégorie visible avec des produits.",
    infos: "Informations pratiques",
    appeler: "Appeler le restaurant",
    itineraire: "Itinéraire",
    suivre: "Suivez-nous",
    langue: "Langue",
    pourPersonnes: "personnes",
    surPlace: "Sur place",
    aEmporter: "À emporter",
  },
  en: {
    notreCarte: "Our menu",
    sousTitreCarte: "Prices in CFA francs, service included",
    recherche: "Search a dish",
    options: "Options",
    epuise: "Sold out",
    serviDe: "Served",
    revientPlusTard: "This part of the menu comes back later",
    rienTrouve: "No dish matches your search.",
    vide: "No dish on the menu yet",
    videDetail: "The restaurant has not published a visible category with dishes yet.",
    infos: "Practical information",
    appeler: "Call the restaurant",
    itineraire: "Directions",
    suivre: "Follow us",
    langue: "Language",
    pourPersonnes: "people",
    surPlace: "Dine in",
    aEmporter: "Takeaway",
  },
  es: {
    notreCarte: "Nuestra carta",
    sousTitreCarte: "Precios en francos CFA, servicio incluido",
    recherche: "Buscar un plato",
    options: "Opciones",
    epuise: "Agotado",
    serviDe: "Se sirve",
    revientPlusTard: "Esta parte de la carta vuelve más tarde",
    rienTrouve: "Ningún plato corresponde a su búsqueda.",
    vide: "Todavía no hay platos en la carta",
    videDetail: "El restaurante aún no ha publicado una categoría visible con platos.",
    infos: "Información práctica",
    appeler: "Llamar al restaurante",
    itineraire: "Cómo llegar",
    suivre: "Síganos",
    langue: "Idioma",
    pourPersonnes: "personas",
    surPlace: "En el local",
    aEmporter: "Para llevar",
  },
  ar: {
    notreCarte: "قائمتنا",
    sousTitreCarte: "الأسعار بالفرنك الأفريقي، الخدمة مشمولة",
    recherche: "ابحث عن طبق",
    options: "خيارات",
    epuise: "نفد",
    serviDe: "يُقدَّم",
    revientPlusTard: "يعود هذا القسم من القائمة لاحقًا",
    rienTrouve: "لا يوجد طبق يطابق بحثك.",
    vide: "لا توجد أطباق في القائمة بعد",
    videDetail: "لم ينشر المطعم بعد فئة ظاهرة تحتوي على أطباق.",
    infos: "معلومات عملية",
    appeler: "اتصل بالمطعم",
    itineraire: "الاتجاهات",
    suivre: "تابعنا",
    langue: "اللغة",
    pourPersonnes: "أشخاص",
    surPlace: "في المطعم",
    aEmporter: "للطلب الخارجي",
  },
} as const;

export type CodeLangue = keyof typeof LIBELLES_PUBLICS;

/** Libellés d'une langue, avec repli sur le français si le code est inconnu. */
export function libelles(langue?: string | null) {
  const code = (langue ?? "fr") as CodeLangue;
  return LIBELLES_PUBLICS[code] ?? LIBELLES_PUBLICS.fr;
}

/** true si la langue est proposée par le restaurant. */
export function langueAutorisee(langue: string | undefined, proposees: string[]): CodeLangue {
  if (langue && proposees.includes(langue) && langue in LIBELLES_PUBLICS) {
    return langue as CodeLangue;
  }
  return "fr";
}

/** Sens d'écriture : l'arabe s'affiche de droite à gauche. */
export function direction(langue: CodeLangue): "ltr" | "rtl" {
  return langue === "ar" ? "rtl" : "ltr";
}
