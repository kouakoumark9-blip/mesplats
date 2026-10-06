#!/usr/bin/env bash
# =============================================================================
# Mesplats — installation de l'environnement de développement en une commande
# =============================================================================
#   ./scripts/dev-setup.sh
#
# Le script :
#   1. vérifie Node.js (>= 20)
#   2. crée .env.local à partir de .env.example si nécessaire
#   3. installe les dépendances npm
#   4. démarre PostgreSQL via Docker (si Docker est disponible)
#   5. applique les migrations Drizzle et charge les données de démonstration
# =============================================================================
set -euo pipefail

VERT="\033[0;32m"; JAUNE="\033[0;33m"; ROUGE="\033[0;31m"; NEUTRE="\033[0m"
etape() { echo -e "\n${VERT}▶ $1${NEUTRE}"; }
avertir() { echo -e "${JAUNE}⚠  $1${NEUTRE}"; }
echec() { echo -e "${ROUGE}✖  $1${NEUTRE}"; exit 1; }

cd "$(dirname "$0")/.."

# --- 1. Node.js --------------------------------------------------------------
etape "Vérification de Node.js"
if ! command -v node >/dev/null 2>&1; then
  echec "Node.js n'est pas installé. Téléchargez la version 20 LTS : https://nodejs.org"
fi
VERSION_NODE=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$VERSION_NODE" -lt 20 ]; then
  echec "Node.js 20 ou plus est requis (version détectée : $(node -v))."
fi
echo "   Node.js $(node -v) — OK"

# --- 2. Fichier .env.local ---------------------------------------------------
etape "Configuration de l'environnement"
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  # Remplace le secret d'exemple par un vrai secret aléatoire.
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env.local
  else
    sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env.local
  fi
  echo "   .env.local créé avec un AUTH_SECRET aléatoire."
else
  echo "   .env.local existe déjà — conservé."
fi

# --- 3. Dépendances ----------------------------------------------------------
etape "Installation des dépendances npm (peut prendre 1 à 2 minutes)"
npm install

# --- 4. PostgreSQL -----------------------------------------------------------
etape "Base de données PostgreSQL"
if docker compose version >/dev/null 2>&1; then
  docker compose up -d
  echo "   Attente du démarrage de PostgreSQL…"
  for _ in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U afrimenu -d afrimenu_dev >/dev/null 2>&1; then
      echo "   PostgreSQL est prêt sur localhost:5432"
      break
    fi
    sleep 1
  done
  if ! grep -q "localhost:5432" .env.local; then
    avertir "Votre .env.local ne pointe pas vers localhost:5432."
    avertir "Pour utiliser Docker, définissez :"
    avertir 'DATABASE_URL="postgresql://afrimenu:afrimenu@localhost:5432/afrimenu_dev"'
  fi
else
  avertir "Docker n'est pas disponible sur cette machine."
  avertir "Deux solutions :"
  avertir "  1) installez Docker Desktop, puis relancez ce script ;"
  avertir "  2) créez un projet Neon (gratuit) sur https://neon.tech et collez"
  avertir "     la chaîne de connexion dans DATABASE_URL (.env.local)."
fi

# --- 5. Migrations et données de démonstration -------------------------------
etape "Application des migrations Drizzle"
npm run db:migrate

etape "Chargement du restaurant de démonstration"
npm run db:seed

etape "Terminé !"
echo "   Lancez le serveur de développement :  npm run dev"
echo "   Puis ouvrez :                         http://localhost:3000"
echo ""
echo "   Comptes de démonstration :"
echo "     Propriétaire  admin@demo.ci            Demo1234"
echo "     Serveur       serveur@demo.ci          Demo1234"
echo "     Cuisine       cuisine@demo.ci          Demo1234"
echo "     Plateforme    superadmin@mesplats.app  Super1234"
echo ""
