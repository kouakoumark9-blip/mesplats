# Mesplats — menu QR et commande en ligne pour restaurants

**Mesplats** est une application SaaS complète de **menu QR** et de **prise de commande** destinée
aux restaurants de **Côte d'Ivoire** et d'**Afrique de l'Ouest**.

Un restaurateur crée son compte, saisit ses plats, et l'application génère ses **QR codes de table**.
Les clients scannent, consultent le menu et commandent depuis leur téléphone — **sans installer
d'application et sans créer de compte**. Les serveurs reçoivent les commandes en temps réel, que ce
soit **sur place** (à table) ou **à emporter**.

> Interface 100 % en français · Prix en **FCFA** · Paiement **Orange Money, Moov Money, MTN MoMo** ou espèces.

---

## Table des matières

1. [Fonctionnalités](#1-fonctionnalités)
2. [Stack technique](#2-stack-technique)
3. [Démarrage rapide](#3-démarrage-rapide)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Comptes de démonstration](#5-comptes-de-démonstration)
6. [Structure du projet](#6-structure-du-projet)
7. [Scripts npm](#7-scripts-npm)
8. [Modèle de données](#8-modèle-de-données)
9. [Rôles et permissions](#9-rôles-et-permissions)
10. [Déploiement pas à pas (GitHub → Neon → Vercel)](#10-déploiement-pas-à-pas)
11. [Sécurité et qualité](#11-sécurité-et-qualité)
12. [Avancement du projet](#12-avancement-du-projet)
13. [Dépannage](#13-dépannage)

---

## 1. Fonctionnalités

### Espace public — le client (aucune installation, aucun compte)

| Parcours | Adresse | État |
| --- | --- | --- |
| Menu à emporter | `/m/[slug]` | Aperçu en lecture seule (étape 1), commande à l'étape 4 |
| Menu avec table pré-remplie (sur place) | `/m/[slug]/t/[numero]` | Aperçu en lecture seule (étape 1), commande à l'étape 4 |
| Suivi de commande en direct | `/commande/[id]` | Étape 6 |

> Les liens de la page d'accueil et du back-office mènent à de **vraies pages** :
> elles lisent le restaurant, ses catégories, ses plats et ses prix en base de
> données et appliquent sa couleur principale. La prise de commande (panier,
> options, paiement, suivi) est livrée à l'étape 4.

- Menu par catégories avec barre de navigation fixe, recherche et photos.
- Fiche produit avec options/suppléments, note libre (« sans piment »).
- Panier persistant, modifiable avant validation.
- Formulaire court : prénom + téléphone (indicatif **+225** par défaut, tous les pays de la zone).
- Paiement : Orange Money, Moov Money, MTN MoMo (numéro du restaurant affiché avec le **montant
  exact** + bouton « Ouvrir l'application » / « Copier le numéro ») ou espèces. Le restaurateur
  valide manuellement le paiement reçu.
- Suivi du statut en direct, bouton « Appeler le serveur », protections anti-spam.

### Back-office — le restaurateur (`/dashboard`)

- **Vue d'ensemble** : commandes du jour, chiffre d'affaires, produits les plus vendus.
- **Menu** : CRUD des catégories et produits, photo, prix, description, options, bouton
  « épuisé / disponible » en un clic, réorganisation par ordre.
- **Tables** : création de N tables d'un coup, un QR code unique par table, **export PNG** et
  **planche PDF imprimable** (une carte par table avec logo, numéro et QR), plus un QR
  « À emporter » pour la vitrine.
- **Commandes** : historique, filtres, changement de statut, annulation avec motif,
  validation du paiement.
- **Équipe** : création de comptes serveur et cuisine.
- **Paiements** : numéros Orange Money, Moov Money, MTN MoMo.
- **Paramètres** : nom, logo, couleur principale, adresse, téléphone, horaires, devise.

### Service — serveur et cuisine (`/service`)

- Commandes en temps réel (rafraîchissement toutes les 4 secondes, pas de WebSocket).
- **Alerte sonore** et animation à chaque nouvelle commande, badge de comptage.
- Cartes lisibles : numéro, « Table X » ou « À emporter », articles, options, notes, heure, statut, paiement.
- Boutons de changement de statut en un clic, refus/annulation avec motif, « Marquer comme payé ».
- **Mode sombre** et interface grand format pour tablette.
- Boutons **WhatsApp / SMS** pré-remplis pour prévenir le client.

### Plateforme — super-admin (`/admin`)

- Liste de tous les restaurants avec compteurs (commandes, volume, produits, comptes).
- Activation / suspension d'un établissement (l'accès est coupé immédiatement, même pour les
  sessions déjà ouvertes).
- Plans : **Gratuit** (20 produits maximum) et **Pro** (illimité).

---

## 1 bis. Marque et tarifs

| Élément | Valeur |
| --- | --- |
| Nom du produit | **Mesplats** (ex-AfriMenu) |
| Logo | Pastille sombre avec repères de QR code et couverts orange — **inchangé**, `components/site/logo.tsx` |
| Adresse de contact | support@mesplats.app |
| Compte super-admin | superadmin@mesplats.app |
| Formule Pro | **9 900 FCFA / mois** — un restaurant, tout inclus |
| Formule Multi-établissements | **19 900 FCFA / mois** — jusqu'à 5 adresses |
| Annuel | 10 mois payés sur 12 (−17 %) |
| Formule gratuite | **aucune** : on règle directement par mobile money |

Les deux montants ne sont écrits qu'à un seul endroit — `TARIFS` dans `lib/constants.ts` — et repris
par la grille tarifaire, la page d'inscription, l'encart des étapes, les paramètres du back-office et
le JSON-LD de la page d'accueil.

Côté base de données et code, l'état technique `gratuit` subsiste : c'est le plan d'un compte
fraîchement créé qui n'a pas encore réglé son abonnement (limites de 20 plats et 5 tables). Il est
présenté à l'utilisateur comme **« À activer »**.

## 1 ter. Typographie et logos de paiement

**Trois polices, chacune son rôle** (`next/font/google`, auto-hébergées par Next : aucun appel à
Google depuis le navigateur du client, donc pas de dépendance réseau en 3G) :

| Police | Usage | Variable |
| --- | --- | --- |
| **Inter** | Texte courant, formulaires, tableaux | `--font-sans` |
| **Plus Jakarta Sans** | Titres, boutons et libellés d'interface | `--font-titre` |
| **Baloo 2** | Lettrages de marque uniquement (mot-symbole « Mesplats », logos de paiement) | `--font-marque` |

Détails de rendu ajoutés dans `app/globals.css` : `font-synthesis: none` (pas de gras synthétique),
`text-rendering: optimizeLegibility`, et la classe `.chiffres` (`tabular-nums`) appliquée aux
montants, pour que les colonnes de prix et de totaux restent alignées quand l'écran de service
défile.

**Logos des moyens de paiement** — `components/ui/logos-paiement.tsx` :

- Cinq marques : **Orange Money**, **Moov Money**, **MTN MoMo**, **Wave** et **Espèces**.
- **Même taille et même forme pour toutes** : la pastille fait 36 / 48 / 64 px selon la variante
  (`sm`, `md`, `lg`), toujours carrée, toujours `rounded-xl` en `md`, avec le même anneau intérieur
  et la même ombre. Seul le dessin intérieur diffère ; une rangée de logos est donc alignée au pixel
  partout dans l'application — page d'accueil, inscription et paramètres du restaurant.
- Dessinées en **SVG** : aucun fichier image, aucun appel réseau, quelques centaines d'octets,
  nettes à toutes les tailles et parfaitement lisibles en 3G. Ce sont des repères visuels
  simplifiés, pas les logos officiels des opérateurs.
- **Wave est désormais un opérateur à part entière** : ajouté à `MODES_PAIEMENT` et `OPERATEURS`
  (`lib/constants.ts`), à l'énumération PostgreSQL `operateur` et `mode_paiement`
  (migration `drizzle/0001_*.sql`), au formulaire des paramètres (4 opérateurs au lieu de 3) et au
  restaurant de démonstration (numéro Wave `+225 07 88 55 44 33`).
- Vérifié au navigateur : les 5 pastilles mesurent exactement **48 × 48 px avec un rayon de 12 px**
  sur les trois pages, chacune avec son fond de marque.

## 1 quater. Fonctionnalités ajoutées (passe « plus professionnel »)

Cette passe reprend les fonctionnalités d'un outil de menu QR du marché
(MonQrMenu) en les adaptant au modèle Mesplats : français, **FCFA**, mobile money
Orange / Moov / MTN / Wave, formules payantes 9 900 et 19 900 FCFA, temps réel par
polling, aucune API payante.

| Domaine | Ce qui a été ajouté |
| --- | --- |
| **Connexion** | **Mot de passe oublié** : `/mot-de-passe-oublie` puis `/reinitialiser-mot-de-passe?jeton=…`. Jeton aléatoire de 32 octets, stocké **haché** (SHA-256), valable 30 minutes, à usage unique. Réponse toujours identique (pas d'énumération des comptes). Envoi par e-mail si `RESEND_API_KEY` est configurée, sinon le lien est affiché au demandeur. Indicateur de robustesse du mot de passe en direct. |
| **Catégories** | **Disponibilité** par catégorie : raccourcis *Toujours*, *Midi*, *Soir*, *Week-end*, *Personnalisé*, puis choix des jours (L → D) et de 1 à 4 créneaux horaires. La carte publique affiche « Servi 06:00 – 11:00 » et grise la catégorie hors créneau (« Cette partie de la carte revient plus tard »), calculé sur l'heure d'Abidjan (UTC+0). |
| **Menu** | Recherche, **Tout déplier / Tout replier** par catégorie, **Sélectionner** (actions de masse : épuisé, remise en vente, suppression), compteurs de catégories et de plats, réordonnancement par flèches (utilisable au doigt comme au clavier, contrairement au glisser-déposer), **nombre de personnes** min/max sur les plats à partager. |
| **Page « QR Code »** | Écran dédié `/dashboard/qr` : **5 styles** (Classique, Arrondi, Points, Chic, Élégant), couleur du motif et du fond (palettes + sélecteur libre), **logo au centre** (correction d'erreur renforcée automatiquement), adresse encodée avec bouton **Copier**, export **PNG 1024 px** et **SVG** vecteur. Les QR des tables reprennent les mêmes réglages. |
| **Paramètres** | Sommaire ancré et cinq sections : **Établissement** (nom, slug, présentation, adresse + complément, code postal, ville, téléphone, horaires, devise, couleur), **Apparence** (logo + bannière, téléversement Blob ou adresse d'image), **Personnalisation de la carte** (thème clair/sombre, fond Neutre/Blanc/Crème/Menthe/Ciel/Rosé, 5 polices, aperçu en direct + « Prévisualiser la carte »), **Langues du menu** (français + anglais, espagnol, arabe), **Réseaux sociaux** (Instagram, Facebook, X, Snapchat), **Zone sensible** (suppression de l'établissement sur double confirmation : nom exact + mot de passe revérifié). |
| **Carte publique** | Applique le thème, la couleur de fond, la police, la bannière, le logo, la présentation courte, l'adresse complète, les réseaux sociaux et les horaires. Sélecteur de langue par l'URL (`?lang=en`), sens de lecture géré pour l'arabe, gratuité signalée pour les plats épuisés. |
| **Nouveaux écrans** | **Boutique** (chevalets, stickers, affiches : commande par WhatsApp, impression à partir de vos réglages QR) et **S'abonner** (comparatif 9 900 / 19 900 FCFA, paiement mobile money, activation expliquée pas à pas). Navigation du back-office complétée : *Menu · QR Code · Tables · Boutique · Paramètres · S'abonner*. |

**Qualité vérifiée (build `Mesplats`)** : `tsc --noEmit` et `eslint` silencieux, `npm run build`
sans erreur, **65/65 vérifications Playwright** (`/home/user/qa/verif-nouveautes.mjs`) et
**5/5 styles de QR décodés** par un décodeur ZXing (`/home/user/qa/qr-scannabilite.mjs`), y compris
avec le logo au centre. Aucune erreur console, aucun débordement horizontal en 390 px.

---

## 2. Stack technique

| Domaine | Choix |
| --- | --- |
| Framework | **Next.js 15 (App Router)** + **React 19** + **TypeScript** |
| Styles | **Tailwind CSS v4** (jetons de design dans `app/globals.css`) |
| Base de données | **PostgreSQL** — **Neon** en production |
| ORM | **Drizzle ORM** + `drizzle-kit` (migrations SQL versionnées) |
| Authentification | **Auth.js v5 (NextAuth)** — email + mot de passe, sessions JWT |
| Mots de passe | **bcryptjs** (facteur de coût 10) |
| Validation | **Zod** (mêmes schémas côté client et serveur) |
| Images | **Vercel Blob** |
| QR codes | **`qrcode`** (PNG, SVG, data URL) + **jsPDF** pour la planche imprimable |
| Icônes | **Lucide React** |
| Typographie | **Inter** (texte) + **Plus Jakarta Sans** (titres) |
| Temps réel | **Polling 4 s** sur l'écran de service (aucun WebSocket) |
| PWA | `manifest.webmanifest` + service worker + installation sur téléphone |
| Hébergement | **Vercel** |

**Performance** : première page servie en **103–122 kB de JavaScript** — pensée pour la 3G et les
téléphones d'entrée de gamme, avec des cibles tactiles larges et des contrastes lisibles au soleil.

---

## 3. Démarrage rapide

### Prérequis

- **Node.js 20 ou plus** — <https://nodejs.org>
- **PostgreSQL 15+** — via **Docker** (le plus simple) ou un compte **Neon** gratuit
- **Git**

### Installation en une commande

```bash
git clone <votre-depot>.git
cd afrimenu
./scripts/dev-setup.sh
npm run dev
```

Le script vérifie Node, génère `.env.local` (avec un `AUTH_SECRET` aléatoire), installe les
dépendances, démarre PostgreSQL sous Docker, applique les migrations et charge le restaurant de
démonstration.

### Installation manuelle (si vous préférez tout contrôler)

```bash
# 1. Dépendances
npm install

# 2. Environnement
cp .env.example .env.local
#    → renseignez DATABASE_URL et AUTH_SECRET (openssl rand -base64 32)

# 3. Base de données locale (Docker) — ou utilisez Neon directement
docker compose up -d

# 4. Tables + données de démonstration
npm run db:migrate
npm run db:seed

# 5. Serveur de développement
npm run dev
```

Ouvrez ensuite <http://localhost:3000>.

> **Sans Docker ?** Créez un projet Neon (gratuit), copiez la chaîne de connexion dans
> `DATABASE_URL`, puis lancez `npm run db:migrate && npm run db:seed`.

---

## 4. Variables d'environnement

Copiez `.env.example` vers `.env.local` en développement, et déclarez les mêmes clés dans
**Vercel → Settings → Environment Variables** pour la production.

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Chaîne de connexion PostgreSQL (Neon en production). Ajoutez `?sslmode=require`. |
| `AUTH_SECRET` | ✅ | Secret de signature des sessions. Généré avec `openssl rand -base64 32`. |
| `BLOB_READ_WRITE_TOKEN` | ⬜¹ | Jeton d'écriture **Vercel Blob** pour les photos de plats et les logos. |
| `NEXT_PUBLIC_APP_URL` | ⬜² | URL publique utilisée dans les QR codes (ex. `https://mesplats.ci`). Sur Vercel, déduite automatiquement de `VERCEL_URL` si absente. |
| `RESEND_API_KEY` | ⬜³ | Envoi des e-mails transactionnels (lien « mot de passe oublié ») via Resend. Sans clé, le lien est affiché directement au demandeur — aucun blocage. |
| `EMAIL_EXPEDITEUR` | ⬜³ | Expéditeur affiché, ex. `Mesplats <notifications@mesplats.ci>`. |
| `DRIZZLE_LOG` | ⬜ | `true` pour journaliser les requêtes SQL générées. |

¹ Requis dès que vous téléversez des photos (étapes 2 et 3). Sans ce jeton, l'interface masque les
boutons d'envoi et affiche une explication.

² Indispensable en production : les QR codes imprimés doivent pointer vers votre domaine définitif.
Définissez cette variable **avant** de générer et d'imprimer vos cartes de table.

³ Facultatif : sans `RESEND_API_KEY`, la page « mot de passe oublié » affiche elle-même le lien de
réinitialisation (valable 30 minutes) au lieu de l'envoyer par e-mail. Pratique en auto-hébergement et
pour la démonstration ; en production, renseignez la clé pour que le lien parte par e-mail.

> ⚠️ `.env.local` est ignoré par Git (`.gitignore` → `.env*`). Ne committez jamais de secret.

---

## 5. Comptes de démonstration

Créés par `npm run db:seed`. Mot de passe identique pour tous les tests : `Demo1234`.

| Rôle | Email | Redirection après connexion |
| --- | --- | --- |
| Propriétaire (admin) | `admin@demo.ci` | `/dashboard` |
| Serveur | `serveur@demo.ci` | `/service` |
| Cuisine | `cuisine@demo.ci` | `/service` |
| Super-admin plateforme | `superadmin@mesplats.app` (mot de passe `Super1234`) | `/admin` |

**Restaurants de démonstration**

| Restaurant | Menu public | Contenu |
| --- | --- | --- |
| Maquis Le Baoulé (plan Pro) | `/m/maquis-le-baoule` | 3 catégories, 10 produits (dont un épuisé), 5 tables, 3 moyens de paiement, 6 commandes du jour |
| Chez Tantie Fanta (plan Gratuit) | `/m/chez-tantie-fanta` | 2 catégories, 4 produits, 3 tables — sert à vérifier l'isolation multi-tenant |

Sur la page `/connexion`, le bouton **« Remplir avec le compte de démonstration »** pré-remplit le
formulaire du propriétaire.

---

## 6. Structure du projet

```text
afrimenu/
├── app/
│   ├── layout.tsx                  # Layout racine : polices, métadonnées, toasts
│   ├── globals.css                 # Système de design Tailwind v4 (couleurs, animations)
│   ├── page.tsx                    # Page d'accueil du SaaS (landing page)
│   ├── m/[slug]/                   # Menu public + /t/[numero] (aperçu étape 1)
│   ├── connexion/                  # Connexion
│   ├── inscription/                # Création du restaurant + compte propriétaire
│   ├── compte-suspendu/            # Message affiché si l'établissement est suspendu
│   ├── dashboard/                  # Back-office propriétaire : coque, vue d'ensemble,
│   │   ├── layout.tsx              #   menu (catégories/plats) et paramètres
│   ├── service/                    # Écran serveur / cuisine (étape 5)
│   ├── admin/                      # Espace plateforme super-admin (étape 7)
│   ├── api/upload/                 # Téléversement des photos de plats (Vercel Blob)
│   ├── mon-compte/                 # Informations du compte connecté
│   └── api/auth/[...nextauth]/     # Routes Auth.js
├── auth.ts                         # Auth.js complet (provider Credentials, runtime Node)
├── auth.config.ts                  # Configuration partagée, compatible Edge (middleware)
├── middleware.ts                   # Garde d'accès : session + rôle + restaurant actif
├── components/
│   ├── site/                       # Landing : en-tête collant, hero (3 écrans HTML/CSS),
│   │                               # vignettes de fonctionnalités, section des 3 étapes
│   │                               # et ses mini-maquettes d'écran,
│   │                               # bascule tarifs,
│   │                               # QR inline (SVG), photos de plats, animations au défilement
│   ├── ui/                         # Design system : bouton, carte, champ, badge, modale,
│   │                               # squelettes, états vides, toasts, interrupteur
│   ├── auth/                       # Formulaires de connexion / inscription / déconnexion
│   ├── dashboard/                  # Coque (barre latérale), gestion du menu, formulaire de plat,
│   │                               # profil du restaurant, moyen de paiement
│   └── formulaires/                # Choix de l'indicatif téléphonique (pays d'Afrique de l'Ouest)
├── lib/
│   ├── constants.ts                # Rôles, statuts, paiements, pays, pays d'Afrique de l'Ouest
│   ├── env.ts                      # Accès centralisé aux variables d'environnement
│   ├── utils.ts                    # Formateurs FCFA, slugs, téléphones, dates, contraste
│   ├── db/
│   │   ├── index.ts                # Client Drizzle unique (postgres.js)
│   │   ├── schema.ts               # Schéma complet (9 tables, enums, index, relations)
│   │   ├── agregats.ts             # Sous-requêtes SQL qualifiées (compteurs, CA)
│   │   ├── catalogue.ts            # Lectures du catalogue, filtrées par restaurant_id
│   │   └── public.ts               # Lectures publiques (restaurant par slug, menu)
│   ├── auth/
│   │   ├── password.ts             # bcrypt : hachage et vérification
│   │   ├── roles.ts                # Règles d'accès PURES (utilisables en Edge)
│   │   └── autorisation.ts         # Garde-fous serveur + API (vérification en base)
│   ├── qr.ts                       # Génération des QR codes (PNG, SVG, Buffer)
│   ├── validations/                # Schémas Zod partagés client/serveur (auth, catalogue)
│   └── actions/                    # Server Actions : auth, catalogue (profil, catégories, plats)
├── drizzle/                        # Migrations SQL versionnées + métadonnées
├── scripts/
│   ├── seed.ts                     # Restaurant + commandes de démonstration
│   ├── reset-db.ts                 # Remise à zéro du schéma (développement)
│   ├── charger-env.ts              # Chargement de .env.local hors Next.js
│   └── dev-setup.sh                # Installation complète en une commande
├── public/
│   ├── manifest.webmanifest        # Manifeste PWA
│   └── icons/                      # Icônes de l'application
├── docker-compose.yml              # PostgreSQL local
├── drizzle.config.ts               # Configuration drizzle-kit
└── .env.example                    # Modèle de variables d'environnement
```

---

### Fichiers notables ajoutés par la passe « fonctionnalités »

```
lib/qr-styles.ts                              moteur de rendu des QR (5 styles, logo, SVG + canvas)
lib/i18n-public.ts                            libellés de la carte en français, anglais, espagnol, arabe
lib/auth/jetons.ts                            jetons de réinitialisation (32 octets, SHA-256, 30 min)
lib/email.ts                                  e-mail transactionnel Resend, avec mode de secours
components/dashboard/atelier-qr.tsx            écran « QR Code » (aperçu en direct, exports)
components/dashboard/disponibilite-categorie.tsx  jours + créneaux horaires d'une catégorie
components/dashboard/formulaire-carte.tsx      thème, fond, police, langues + aperçu
components/dashboard/formulaire-vitrine.tsx    logo, bannière, présentation, adresse
components/dashboard/formulaire-reseaux.tsx    Instagram, Facebook, X, Snapchat
components/dashboard/zone-danger.tsx           suppression de l'établissement (triple garde)
components/ui/icones-reseaux.tsx               pictogrammes de réseaux (tracés maison, 24 × 24)
app/dashboard/qr · app/dashboard/boutique · app/dashboard/abonnement
app/mot-de-passe-oublie · app/reinitialiser-mot-de-passe
drizzle/0002_*.sql                             migration : apparence, langues, QR, disponibilité, personnes
```

## 7. Scripts npm

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (<http://localhost:3000>) |
| `npm run build` | Build de production (Vercel l'exécute automatiquement) |
| `npm start` | Serveur de production local |
| `npm run lint` | Analyse ESLint |
| `npm run typecheck` | Vérification TypeScript sans émission |
| `npm run db:generate` | Génère une migration SQL à partir de `lib/db/schema.ts` |
| `npm run db:migrate` | Applique les migrations en attente |
| `npm run db:push` | Synchronise le schéma sans fichier de migration (prototypage) |
| `npm run db:studio` | Interface visuelle Drizzle Studio |
| `npm run db:seed` | Charge les restaurants de démonstration |
| `npm run db:reset` | Supprime toutes les tables (**développement uniquement**) |
| `npm run db:setup` | `db:migrate` + `db:seed` |
| `bash scripts/relancer-apercu.sh` | **Environnement éphémère** : redémarre PostgreSQL, rejoue migrations et seed (si la base est vide) et reconstruit le projet. Ajoutez `--sans-build` pour gagner du temps, ou passez une URL en argument. |

**Modifier le schéma de données :**

```bash
# 1. éditez lib/db/schema.ts
npm run db:generate   # 2. crée drizzle/000X_*.sql
npm run db:migrate    # 3. applique la migration
```

---

## 8. Modèle de données

Neuf tables, toutes reliées à un `restaurant_id` (isolation multi-tenant stricte appliquée dans
chaque requête via `lib/auth/autorisation.ts` et les helpers de portée).

| Table | Rôle | Colonnes principales |
| --- | --- | --- |
| `restaurants` | Établissement | `nom`, `slug` (unique), `logo`, `couleur_principale`, `adresse`, `telephone`, `horaires`, `devise`, `plan`, `actif` |
| `users` | Comptes | `restaurant_id`, `nom`, `email` (unique), `mot_de_passe_hash`, `role`, `actif`, `dernier_acces_at` |
| `categories` | Rubriques du menu | `restaurant_id`, `nom`, `ordre`, `visible` |
| `products` | Plats et boissons | `restaurant_id`, `category_id`, `nom`, `description`, `prix`, `photo`, `disponible`, `ordre` |
| `product_options` | Suppléments d'un plat | `product_id`, `nom`, `supplement_prix`, `ordre` |
| `tables` | Tables du restaurant | `restaurant_id`, `numero` (unique par restaurant) |
| `orders` | Commandes | `numero`, `restaurant_id`, `type`, `table_id`, `nom_client`, `telephone_client`, `statut`, `total`, `mode_paiement`, `paiement_statut`, `heure_retrait`, `note`, `motif_annulation`, `appel_serveur_at`, horodatages |
| `order_items` | Lignes de commande | `order_id`, `product_id`, `nom` (copie), `quantite`, `prix_unitaire`, `options` (JSON), `note` |
| `payment_methods` | Numéros mobile money | `restaurant_id`, `operateur`, `numero`, `titulaire`, `actif` |

**Détails utiles**

- **Montants en entiers** : le franc CFA n'a pas de décimales, aucun arrondi flottant n'est possible.
- **Copy-on-write** : `order_items.nom` et `prix_unitaire` figent le produit au moment de la
  commande — modifier un prix ne réécrit jamais l'historique.
- **Numérotation** : `orders.numero` est séquentiel **par restaurant** (`unique(restaurant_id, numero)`).
- **Index** : sur `restaurant_id` + `created_at`, `statut`, `telephone_client`, `table_id` pour des
  listes rapides même avec des dizaines de milliers de commandes.

---

## 9. Rôles et permissions

| Zone | `admin` | `serveur` | `cuisine` | `superadmin` |
| --- | :---: | :---: | :---: | :---: |
| `/dashboard` (back-office) | ✅ | — | — | — |
| `/service` (écran temps réel) | ✅ | ✅ | ✅ | — |
| `/admin` (plateforme) | — | — | — | ✅ |
| `/mon-compte` | ✅ | ✅ | ✅ | ✅ |
| Menu public | ✅ | ✅ | ✅ | ✅ |

Un rôle non autorisé est **redirigé** vers son espace naturel (serveur → `/service`,
super-admin → `/admin`) au lieu de voir une erreur 403.

**Trois niveaux de contrôle** (aucun n'est seul suffisant) :

1. **Middleware** (`middleware.ts`, runtime Edge) — vérifie la session JWT, le rôle et l'état du
   restaurant avant même d'atteindre la page. Aucun accès base de données à ce niveau.
2. **Garde-fous serveur** (`lib/auth/autorisation.ts`) — revérifient en base, à chaque requête, que
   le restaurant existe et qu'il est **actif**. Une suspension coupe donc immédiatement les sessions
   déjà ouvertes, y compris celles dont le JWT est encore valide.
3. **Portée des requêtes** — chaque lecture et écriture filtre sur le `restaurant_id` de la session,
   jamais sur un identifiant venu du client.

---

## 10. Déploiement pas à pas

### Étape 1 — Mettre le code sur GitHub

```bash
cd afrimenu
git init
git add .
git commit -m "Mesplats : structure, base de données et authentification"
git branch -M main
git remote add origin https://github.com/<votre-compte>/afrimenu.git
git push -u origin main
```

> `.env.local` est ignoré par Git : vérifiez avec `git status` qu'aucun secret n'est ajouté.

### Étape 2 — Créer la base de données sur Neon

1. Créez un compte sur <https://neon.tech> (offre gratuite suffisante pour démarrer).
2. **Create project** → nom : `afrimenu`, région : **Europe (Frankfurt)** ou **AWS eu-west** (le plus
   proche d'Abidjan, latence la plus faible), PostgreSQL 17.
3. Dans **Connection string**, sélectionnez **Pooled connection** et copiez la chaîne :

   ```text
   postgresql://utilisateur:motdepasse@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Important** : gardez `-pooler` dans l'hôte et `?sslmode=require` à la fin.

> Le pooler (PgBouncer) est indispensable avec les fonctions serverless de Vercel : le client
> `postgres.js` est configuré avec `prepare: false` dans `lib/db/index.ts` pour s'y adapter.

### Étape 3 — Appliquer les migrations sur Neon

Depuis votre machine, avec la chaîne Neon :

```bash
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require" npm run db:migrate
```

Pour charger des données de démonstration sur l'environnement de préproduction (facultatif) :

```bash
DATABASE_URL="…" npm run db:seed
```

> **Alternative** : ajoutez `drizzle-kit migrate` à la commande de build Vercel. C'est pratique mais
> déconseillé en production — une migration échouée fait échouer le déploiement. Préférez la
> commande locale ci-dessus, ou un job dédié.

### Étape 4 — Déployer sur Vercel

1. <https://vercel.com/new> → **Import Git Repository** → choisissez votre dépôt `afrimenu`.
2. Framework détecté automatiquement : **Next.js** (laissez les réglages par défaut).
3. Dans **Environment Variables**, ajoutez :

   | Nom | Valeur | Environnements |
   | --- | --- | --- |
   | `DATABASE_URL` | chaîne Neon (pooled) | Production, Preview, Development |
   | `AUTH_SECRET` | `openssl rand -base64 32` | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://votre-domaine.vercel.app` | Production |

4. **Deploy**. Le premier déploiement prend 1 à 2 minutes.

### Étape 5 — Activer Vercel Blob (photos des plats)

1. Dans le projet Vercel : **Storage** → **Create Database** → **Blob**.
2. Nommez-la `afrimenu-images` et connectez-la au projet.
3. Vercel ajoute automatiquement `BLOB_READ_WRITE_TOKEN`. Vérifiez sa présence dans
   **Settings → Environment Variables**, puis **redéployez** pour que la fonction serverless le voie.

### Étape 6 — Domaine personnalisé et QR codes

1. **Settings → Domains** → ajoutez votre domaine (ex. `afrimenu.ci`) et suivez les instructions DNS.
2. Mettez à jour `NEXT_PUBLIC_APP_URL` avec ce domaine définitif, puis **redéployez**.
3. **Générez vos QR codes seulement après cette étape** : un QR code imprimé encode une URL fixe,
   il ne peut pas être corrigé après impression.

### Étape 7 — Installer l'application (PWA)

Depuis Chrome (Android) ou Safari (iOS), ouvrez votre back-office puis **« Ajouter à l'écran
d'accueil »** : l'application s'installe comme une application native, sans passer par un store.

### Liste de contrôle avant mise en production

- [ ] `AUTH_SECRET` unique et long (jamais celui du `.env.example`).
- [ ] `DATABASE_URL` en **pooled connection** avec `sslmode=require`.
- [ ] `NEXT_PUBLIC_APP_URL` = domaine définitif **avant** impression des QR codes.
- [ ] Migrations appliquées (`npm run db:migrate` sur la base Neon).
- [ ] Au moins un compte `superadmin` créé (via `npm run db:seed` ou une insertion manuelle).
- [ ] Un test de commande complet : scan → panier → commande → écran de service → paiement validé.
- [ ] `NEXT_PUBLIC_APP_URL` et `NEXT_PUBLIC_*` cohérents dans les trois environnements Vercel.

---

## 11. Sécurité et qualité

| Sujet | Mise en œuvre |
| --- | --- |
| **Mots de passe** | bcrypt, coût 10 (`lib/auth/password.ts`). Comparaison factice pour les emails inconnus : impossible de deviner si un compte existe via le temps de réponse. |
| **Sessions** | JWT signés (`AUTH_SECRET`), cookie `httpOnly`/`secure`, durée 30 jours, `SameSite=Lax`. |
| **Validation** | Zod côté client **et** côté serveur, à partir des mêmes schémas (`lib/validations/`). Un client malveillant ne contourne aucune règle. |
| **Contrôle d'accès** | Triple vérification : middleware → garde-fou serveur (état du restaurant en base) → filtrage systématique par `restaurant_id`. |
| **Isolation multi-tenant** | Aucune requête ne s'exécute sans `restaurant_id` issu de la session. Testé avec deux restaurants de démonstration. |
| **Anti-spam commandes** | Limite par numéro de téléphone et par session (constantes dans `lib/constants.ts`), fenêtre glissante. |
| **Suspension** | Un restaurant suspendu ne peut plus se connecter **et** les sessions en cours sont coupées à la requête suivante. |
| **En-têtes HTTP** | `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en production. Intégration en iframe volontairement autorisée (voir le commentaire dans `next.config.ts`). |
| **Robustesse** | États vides soignés, squelettes de chargement, messages d'erreur en français actionnables, pages d'erreur dédiées. |
| **Accessibilité** | Cibles tactiles ≥ 44 px, contrastes vérifiés, navigation clavier, `aria-*` sur les composants interactifs, toasts en `aria-live`, animations désactivées si `prefers-reduced-motion`. |
| **Performance** | Page d'accueil ≈ 250 Ko au total (dont 125 Ko de JS et 50 Ko de HTML), QR codes en SVG (1,5 Ko l'unité au lieu de 3,5 Ko en PNG), polices en `display: swap`. |

---

## 12. Avancement du projet

Le projet est construit par étapes, chacune vérifiée avant de passer à la suivante.

| # | Étape | État |
| --- | --- | --- |
| 1 | Initialisation, base de données, authentification, design system | ✅ **Terminée** |
| 2 | Back-office : profil du restaurant, catégories, produits, options | ✅ **Terminée** |
| 3 | Tables et génération des QR codes (PNG + planche PDF) | ✅ **Terminée** |
| 4 | Menu public, panier et création de commande | ⏳ À venir |
| 5 | Écran de service temps réel et gestion des statuts | ⏳ À venir |
| 6 | Suivi client, paiement manuel, liens WhatsApp/SMS | ⏳ À venir |
| 7 | Statistiques, équipe, super-admin, PWA | ⏳ À venir |

**Étape 1 — ce qui est livré et vérifié**

- Schéma Drizzle complet (9 tables + enums + index + relations) et migration `drizzle/0000_*.sql`.
- Seed : deux restaurants, 14 produits, 8 tables, 4 moyens de paiement, 6 commandes du jour.
- Authentification Auth.js (email + mot de passe, bcrypt), inscription générant un **slug unique**,
  connexion automatique, déconnexion.
- Routage par rôle vérifié : connexion séparée pour admin / serveur / cuisine / super-admin, avec
  redirection automatique vers l'espace de chacun.
- Isolation multi-tenant vérifiée entre deux restaurants.
- Suspension de restaurant testée : connexion bloquée **et** sessions ouvertes coupées.
- Design system (boutons, cartes, champs, badges, modales, squelettes, états vides, toasts) prêt à
  être réutilisé par les étapes suivantes.
- Page d'accueil du SaaS, connexion, inscription, mon compte, page « compte suspendu ».
- **Landing page professionnelle** : en-tête collant avec menu mobile, titre à mot souligné,
  boutons pilule, hero avec trois écrans de téléphone dessinés en HTML/CSS et cartes flottantes,
  bandeau de chiffres, section « un QR par table », tarifs avec bascule mensuel/annuel (FCFA), FAQ
  et pied de page complet. Vrais QR codes générés en SVG et
  **décodés en test**.
- **Section « Votre menu en ligne en 3 étapes »** : créez votre menu → imprimez vos QR codes →
  recevez les commandes. Chaque étape est illustrée par une **mini-maquette d'écran** dessinée en
  HTML/CSS (`components/site/maquettes-etapes.tsx`) : **écran de téléphone** pour l'ajout d'un plat,
  **planche A4** de QR codes, **écran de tablette** pour la commande reçue. Les cadres d'appareil
  réutilisent le composant `Telephone` du héro (`components/site/hero-phones.tsx`). Les deux vignettes de QR de l'étape 2 sont de
  **vrais codes scannables**, chacune vers sa table (décodés en test vers `/m/maquis-le-baoule/t/1`
  et `/t/2`).
- **Tarifs** : **deux formules payantes seulement**, sans formule gratuite ni mois offert —
  Pro à **9 900 FCFA/mois** et Multi-établissements à **19 900 FCFA/mois** (annuel : 10 mois payés
  sur 12). Règlement par Orange Money, Moov Money ou MTN MoMo. Les montants sont définis une seule
  fois dans `lib/constants.ts` (`TARIFS`) et repris par le JSON-LD de la page.
- **Photos de plats** : `public/plats/*.jpg` et `public/ambiance/maquis.jpg`, servies par
  `next/image` (WebP, redimensionnement) ; `components/site/photo-plat.tsx` gère le repli quand
  un plat n'a pas encore de photo.
- **Aperçu du menu public** : `/m/[slug]` et `/m/[slug]/t/[numero]` lisent réellement la base
  (catégories visibles, plats, options, prix, couleur principale du restaurant) ; les photos des
  plats sont affichées, avec vignette de repli sinon ; une table ou un slug inexistant renvoie
  une page 404.

**Étape 2 — ce qui est livré et vérifié**

- **Coque du back-office** : barre latérale (ordinateur) et tiroir (mobile), navigation par rôle,
  compteur de plan, lien vers le menu public, déconnexion. La couleur de marque du restaurant est
  injectée en variables CSS : boutons et accents suivent automatiquement le thème choisi.
- **Vue d'ensemble** : chiffre d'affaires du jour, commandes du jour, commandes à traiter, plats
  au menu, liste de mise en route (4 étapes) et raccourcis vers l'écran de service et les QR codes.
- **Mon menu** (`/dashboard/menu`) : création, renommage, masquage et suppression de catégories ;
  ajout, modification, duplication et suppression de plats ; **épuisé / disponible en un clic** ;
  réorganisation des catégories et des plats par flèches ; recherche instantanée ; éditeur de
  **suppléments** (jusqu'à 8 par plat) ; téléversement de photo vers Vercel Blob (repli par adresse
  d'image si Blob n'est pas configuré) ; états vides soignés ; bascules optimistes avec retour en
  arrière en cas d'échec.
- **Limite du plan Gratuit appliquée par le serveur** : 20 plats maximum. Le bouton d'ajout est
  désactivé à 20/20 **et** la Server Action refuse l'insertion (vérifié en contournant l'interface).
- **Paramètres** (`/dashboard/parametres`) : nom, **adresse publique avec vérification d'unicité en
  direct**, adresse postale, horaires, téléphone (indicatif Afrique de l'Ouest), devise, **couleur
  de marque** (12 teintes proposées + sélecteur libre) avec aperçu en direct du menu client, plus la
  formule d'abonnement et la jauge de plats.
- **Moyens de paiement mobile money** : Orange Money, Moov Money, MTN MoMo — numéro, titulaire,
  activation/désactivation, suppression, avec écrasement du numéro existant par opérateur.
- **Validation Zod partagée** (`lib/validations/catalogue.ts`) : jouée côté client *et* rejouée dans
  chaque Server Action ; toutes les actions sont gardées par `exigerRole("admin")` et filtrent sur
  le `restaurant_id` de la session.
- **Publication immédiate** : toute modification apparaît aussitôt sur `/m/[slug]` (nom, couleur,
  catégories, plats, options). Vérifié au navigateur : 20 contrôles automatisés au vert, aucune
  erreur console, aucun débordement horizontal sur mobile (390 px).

**Étape 3 — ce qui est livré et vérifié**

- **Écran « Tables & QR codes »** (`/dashboard/tables`) : une carte par table (QR code, adresse
  publique, bouton PNG, copier le lien, renommer, supprimer) et, en bas, la carte **QR « À
  emporter »** à coller sur la vitrine.
- **Création en lot** : « Ajouter des tables » demande le nombre (1 à 60), le premier numéro et un
  préfixe facultatif, avec **aperçu immédiat des numéros** (« 6 7 8 9 10 »). Les numéros déjà pris
  sont ignorés au lieu de faire échouer tout le lot, et le message final récapitule créées /
  ignorées / refusées.
- **Limite du plan Gratuit appliquée par le serveur** : 5 tables (`LIMITE_TABLES`). L'interface
  affiche le reste disponible et désactive le bouton à 5/5 ; une Server Action contournée refuse
  quand même l'insertion (vérifié en test : 4 tables demandées, 2 créées, message explicite).
- **Un QR code unique par table**, calculé **côté serveur en SVG** (`lib/qr.ts`) : net à
  l'impression, à peine 1,5 Ko, injecté dans la page — le client n'a rien à télécharger. Le lien
  encodé est `…/m/[slug]/t/[numero]`, la table est donc pré-remplie sur le menu public.
- **Export PNG 1024 px** dans le navigateur (`qrcode`) : fichier `qr-table-4.png`, **décodé en test**
  vers la bonne adresse.
- **Planche PDF A4** générée dans le navigateur (`jspdf`) : 8 cartes par page (2 × 4), cadre de
  découpe, nom du restaurant, titre de table, QR 600 px, consigne de scan et adresse courte —
  **23 Ko** pour 6 cartes grâce à `compress: true` (sans lui, 6,3 Mo : intenable en 3G).
- **Planche A4 imprimable** (`/dashboard/tables/impression`) : une carte par table plus le QR
  « À emporter », feuille A4 pilotée par `@page { size: A4; margin: 8mm }`, barre d'outils masquée à
  l'impression (`sans-impression`) et sauts de page propres (`break-inside-avoid`). **Vérifié en
  générant le PDF d'impression : 1 page A4, QR re-décodé depuis la planche.**
- **Renommage et suppression** : renommer une table régénère son QR (le lien contient le numéro,
  l'ancienne carte doit être remplacée — c'est rappelé dans la modale) ; suppression d'une table ou
  de **toutes** les tables avec confirmation, en annulant l'affichage en cas d'échec serveur.
- **Isolation multi-tenant** : chaque requête part du `restaurant_id` de la session ; un serveur ou
  un cuisinier qui ouvre `/dashboard/tables` est renvoyé vers son espace, un visiteur vers
  `/connexion`. Un restaurant ne voit jamais les tables d'un autre (vérifié en test).
- **Vérification navigateur** : **30 contrôles automatisés au vert** — création de lot, quota du
  plan Gratuit, PNG 1024 px décodé, PDF A4 d'une page, QR lus à l'écran, à l'impression et sur la
  planche, renommage, suppressions, isolation, contrôle d'accès, mobile 390 px sans débordement,
  aucune erreur console.

---

## 12 bis. Choix de contenu de la page d'accueil

Certaines sections ont été volontairement retirées de la page d'accueil pour l'alléger :

- **Section « Écran de service »** (aperçu sur fond sombre) — l'écran reste accessible depuis le
  back-office et sera présenté à l'étape 5 ;
- **Section « Tout ce dont votre restaurant a besoin »** (accordéon illustré) — le composant
  `components/site/accordeon-avantages.tsx` est conservé dans le projet : il suffit de réimporter
  `AccordeonAvantages` dans `app/page.tsx` pour le remettre en place ;
- **Section « Des fonctionnalités pensées pour la restauration »** (grille bento de 7 cartes) — son
  balisage vivait directement dans `app/page.tsx` : il a été retiré avec le lien d'ancre
  « Fonctionnalités » de l'en-tête et du pied de page (aucune ancre morte ne subsiste). Les
  vignettes qu'elle utilisait (`VignetteStatuts`, `VignetteStats`, `VignetteNotifications`,
  `VignetteEquipe`, `VignetteQr`, `MaquettePaiement`) restent dans `components/site/` — pour la
  rétablir, reprendre le bloc depuis le commit `13363bb` (`git show 13363bb:app/page.tsx`).

La page d'accueil enchaîne donc : héros → chiffres → « Pourquoi choisir Mesplats » →
« Un QR code pour chaque table » → « 3 étapes » → tarifs → questions → appel final → pied de page.

**Tarifs : deux formules payantes, aucune formule gratuite.** La grille affiche **Pro à 9 900 FCFA
par mois** (un restaurant, tout inclus) et **Multi-établissements à 19 900 FCFA par mois** (jusqu'à
5 adresses), avec la bascule mensuel / annuel (annuel = 10 mois payés sur 12). Plus aucune mention de
plan gratuit ni de mois offert sur le site : héros (« À partir de 9 900 FCFA / mois », « Paiement
mobile money »), introduction de la section tarifs, appels à l'action, FAQ (« Comment se règle
l'abonnement ? »), message d'inscription, encart des étapes et JSON-LD (`Pro: 9900 XOF`,
`Multi: 19900 XOF`). Les montants vivent à un seul endroit : `TARIFS` dans `lib/constants.ts`.

Côté application, l'état technique `gratuit` reste le plan d'un compte fraîchement créé, mais il est
présenté comme **« À activer »** (badge de la barre latérale, encart des paramètres) : le restaurant
règle son abonnement par mobile money, l'équipe Mesplats confirme, et le compte passe en Pro.

**Montants : les milliers s'affichent enfin.** `Intl.NumberFormat("fr-FR")` sépare les milliers par
une **espace fine insécable (U+202F)**, si étroite qu'elle disparaît selon les polices : on lisait
« 24900 FCFA » au lieu de « 24 900 FCFA », et un `.replace(" FCFA", "")` (espace ordinaire) ne
matchait plus, produisant « 9 900 FCFA **FCFA** / mois ». `lib/utils.ts` normalise désormais sur
l'espace insécable classique (U+00A0) via le helper `grouper()`, et `formatNombre()` remplace le
remplacement de chaîne dans la grille tarifaire. Vérifié sur l'accueil, l'inscription, le menu public
et le tableau de bord : aucune occurrence de « 0 FCFA », de « FCFA FCFA » ni de chiffres collés.

**Appel final : la maquette de téléphone est affichée entière.** Elle était auparavant décalée de
40 px vers le bas et recouverte d'un dégradé de 96 px (`from-marque-700/90`) : le cadre sortait de
la carte de 48 px et le bouton « Commander » du panier devenait illisible sous le voile. Le cadre
tient désormais entièrement dans la carte (64 px de marge en haut et en bas en desktop, 48 px sur
tablette) et la section reste sans débordement à 390 px, 640 px, 768 px, 1024 px, 1180 px et
1440 px. En dessous de `sm` (640 px), le téléphone reste masqué : la section se limite au texte et
aux deux boutons.

---

## 13. Dépannage

**`Variable d'environnement manquante : DATABASE_URL`**
Le fichier `.env.local` est absent ou incomplet. Copiez `.env.example` vers `.env.local`, ou
renseignez les variables dans Vercel → Settings → Environment Variables.

**L'environnement a été réinitialisé (sandbox, conteneur jetable) : plus de base, plus de build**
Tout ce qui n'est pas un fichier du projet disparaît entre deux sessions. Une seule commande remet
l'ensemble en état de marche, puis démarrez le serveur :

```bash
bash scripts/relancer-apercu.sh          # PostgreSQL + dépendances + migrations + seed + build
npm start -- -H 0.0.0.0 -p 3000          # à lancer dans un processus persistant
```

Le script détecte l'adresse publique du sandbox (`E2B_SANDBOX_ID`) et la reporte dans
`NEXT_PUBLIC_APP_URL` — indispensable, car **les QR codes sont figés au moment du build** : après un
changement d'adresse, il faut reconstruire pour qu'ils pointent au bon endroit.

**`relation "restaurants" does not exist`**
Les migrations n'ont pas été appliquées sur cette base :
`npm run db:migrate && npm run db:seed`.

**`password authentication failed` / `Connection refused` (Docker)**
Le conteneur n'est pas démarré ou le port 5432 est déjà pris par un autre PostgreSQL :
`docker compose up -d` puis `docker compose logs postgres`. Vérifiez que `DATABASE_URL` correspond
bien à `postgresql://afrimenu:afrimenu@localhost:5432/afrimenu_dev`.

**`CredentialsSignin` dans les journaux**
Ce message est **normal** : il apparaît à chaque email ou mot de passe incorrect. Vérifiez les
identifiants, ou rechargez les comptes de démonstration avec `npm run db:seed`.

**`UntrustedHost` (Auth.js)**
L'application doit connaître son URL publique. En local, `NEXT_PUBLIC_APP_URL=http://localhost:3000` ;
sur Vercel, `trustHost: true` est déjà activé dans `auth.config.ts`.

**Erreur `too many connections` sur Neon**
Utilisez bien la chaîne **pooled** (hôte contenant `-pooler`). Le client est configuré avec
`prepare: false` pour fonctionner derrière PgBouncer.

**Les photos ne s'envoient pas**
`BLOB_READ_WRITE_TOKEN` est absent. Créez un store **Vercel Blob** (étape 5 du déploiement) et
redéployez.

**Le QR code renvoie vers localhost**
`NEXT_PUBLIC_APP_URL` n'est pas définie en production. Corrigez-la, redéployez, puis **régénérez**
vos QR codes.

---

## Licence

Projet privé — © Mesplats, Abidjan, Côte d'Ivoire.

Pour toute question : **support@mesplats.app**
