# AfriMenu — Menu QR et commande en ligne pour restaurants

**AfriMenu** est une application SaaS complète de **menu QR** et de **prise de commande** destinée
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
| `NEXT_PUBLIC_APP_URL` | ⬜² | URL publique utilisée dans les QR codes (ex. `https://afrimenu.ci`). Sur Vercel, déduite automatiquement de `VERCEL_URL` si absente. |
| `DRIZZLE_LOG` | ⬜ | `true` pour journaliser les requêtes SQL générées. |

¹ Requis dès que vous téléversez des photos (étapes 2 et 3). Sans ce jeton, l'interface masque les
boutons d'envoi et affiche une explication.

² Indispensable en production : les QR codes imprimés doivent pointer vers votre domaine définitif.
Définissez cette variable **avant** de générer et d'imprimer vos cartes de table.

> ⚠️ `.env.local` est ignoré par Git (`.gitignore` → `.env*`). Ne committez jamais de secret.

---

## 5. Comptes de démonstration

Créés par `npm run db:seed`. Mot de passe identique pour tous les tests : `Demo1234`.

| Rôle | Email | Redirection après connexion |
| --- | --- | --- |
| Propriétaire (admin) | `admin@demo.ci` | `/dashboard` |
| Serveur | `serveur@demo.ci` | `/service` |
| Cuisine | `cuisine@demo.ci` | `/service` |
| Super-admin plateforme | `superadmin@afrimenu.app` (mot de passe `Super1234`) | `/admin` |

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
git commit -m "AfriMenu : structure, base de données et authentification"
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
| 3 | Tables et génération des QR codes (PNG + planche PDF) | ⏳ À venir |
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
  bandeau de chiffres, grille de fonctionnalités illustrée, section « un QR par table », tarifs avec
  bascule mensuel/annuel (FCFA), FAQ et pied de page complet. Vrais QR codes générés en SVG et
  **décodés en test**.
- **Section « Votre menu en ligne en 3 étapes »** : créez votre menu → imprimez vos QR codes →
  recevez les commandes. Chaque étape est illustrée par une **mini-maquette d'écran** dessinée en
  HTML/CSS (`components/site/maquettes-etapes.tsx`) : **écran de téléphone** pour l'ajout d'un plat,
  **planche A4** de QR codes, **écran de tablette** pour la commande reçue. Les cadres d'appareil
  réutilisent le composant `Telephone` du héro (`components/site/hero-phones.tsx`). Les deux vignettes de QR de l'étape 2 sont de
  **vrais codes scannables** (décodés en test vers `/m/maquis-le-baoule/t/4`).
- **Tarifs** : plan Gratuit (0 FCFA, 20 plats, 5 tables) et plan Pro à **4 900 FCFA/mois avec le
  premier mois offert** (annuel : 49 000 FCFA, deux mois offerts), plus une formule
  multi-établissements. Le tarif est repris dans le JSON-LD de la page et dans les paramètres du
  back-office.
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

---

## 12 bis. Choix de contenu de la page d'accueil

Certaines sections ont été volontairement retirées de la page d'accueil pour l'alléger :

- **Section « Écran de service »** (aperçu sur fond sombre) — l'écran reste accessible depuis le
  back-office et sera présenté à l'étape 5 ;
- **Section « Tout ce dont votre restaurant a besoin »** (accordéon illustré) — le composant
  `components/site/accordeon-avantages.tsx` est conservé dans le projet : il suffit de réimporter
  `AccordeonAvantages` dans `app/page.tsx` pour le remettre en place.

---

## 13. Dépannage

**`Variable d'environnement manquante : DATABASE_URL`**
Le fichier `.env.local` est absent ou incomplet. Copiez `.env.example` vers `.env.local`, ou
renseignez les variables dans Vercel → Settings → Environment Variables.

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

Projet privé — © AfriMenu, Abidjan, Côte d'Ivoire.

Pour toute question : **support@afrimenu.app**
