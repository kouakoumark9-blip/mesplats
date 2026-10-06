#!/usr/bin/env bash
#
# Remet l'environnement de développement en état de marche, puis explique comment
# démarrer le serveur d'aperçu.
#
# Utilité : dans un environnement éphémère (sandbox, conteneur jetable), PostgreSQL,
# les dépendances npm et le build disparaissent entre deux sessions. Ce script
# rejoue tout dans le bon ordre, sans casser les données déjà présentes.
#
# Usage :
#   bash scripts/relancer-apercu.sh                    # détecte l'URL du sandbox
#   bash scripts/relancer-apercu.sh https://3000-xxx.e2b.app   # URL imposée
#   bash scripts/relancer-apercu.sh --sans-build       # ne pas reconstruire
#
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RACINE"

URL_DEMANDE=""
SANS_BUILD=0
for argument in "$@"; do
  case "$argument" in
    --sans-build) SANS_BUILD=1 ;;
    http*) URL_DEMANDE="$argument" ;;
  esac
done

etape() { printf "\n\033[1;34m▸ %s\033[0m\n" "$1"; }

# --------------------------------------------------------------------------- #
# 1. URL publique (encodée dans les QR codes et les liens de session)
# --------------------------------------------------------------------------- #
if [ -n "$URL_DEMANDE" ]; then
  URL_APP="$URL_DEMANDE"
elif [ -n "${E2B_SANDBOX_ID:-}" ]; then
  URL_APP="https://3000-${E2B_SANDBOX_ID}.e2b.app"
else
  URL_APP="http://localhost:3000"
fi

etape "Adresse publique : $URL_APP"
if [ -f .env.local ]; then
  if grep -q '^NEXT_PUBLIC_APP_URL=' .env.local; then
    sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"$URL_APP\"|" .env.local
  else
    printf 'NEXT_PUBLIC_APP_URL="%s"\n' "$URL_APP" >> .env.local
  fi
else
  cp .env.example .env.local
  sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"$URL_APP\"|" .env.local
  echo "  .env.local créé depuis .env.example — vérifiez AUTH_SECRET et DATABASE_URL."
fi

# --------------------------------------------------------------------------- #
# 2. PostgreSQL
# --------------------------------------------------------------------------- #
etape "PostgreSQL"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "  PostgreSQL n'est pas installé :"
  echo "    sudo apt-get update && sudo apt-get install -y postgresql postgresql-client"
  exit 1
fi

VERSION_PG="$(ls /etc/postgresql | sort -n | tail -1)"
if ! sudo pg_ctlcluster "$VERSION_PG" main status >/dev/null 2>&1; then
  sudo pg_ctlcluster "$VERSION_PG" main start
fi
# Attente active : le serveur met une seconde ou deux à accepter les connexions
for _ in $(seq 1 20); do
  sudo -u postgres psql -tAc "select 1" >/dev/null 2>&1 && break
  sleep 1
done
echo "  cluster $VERSION_PG démarré"

sudo -u postgres psql -tAc "select 1 from pg_roles where rolname = 'afrimenu'" | grep -q 1 ||
  sudo -u postgres psql -c "create role afrimenu login password 'afrimenu';" >/dev/null
sudo -u postgres psql -tAc "select 1 from pg_database where datname = 'afrimenu_dev'" | grep -q 1 ||
  sudo -u postgres createdb -O afrimenu afrimenu_dev
echo "  rôle et base « afrimenu_dev » prêts"

# --------------------------------------------------------------------------- #
# 3. Dépendances, migrations, données de démonstration
# --------------------------------------------------------------------------- #
if [ ! -x node_modules/.bin/next ]; then
  etape "Installation des dépendances (npm ci)"
  npm ci
fi

etape "Migrations et données de démonstration"
npm run db:migrate
# Le seed n'est rejoué que si la base est vide : il ne doit jamais écraser
# un menu que vous venez de modifier.
NB_RESTAURANTS="$(PGPASSWORD=afrimenu psql -h localhost -U afrimenu -d afrimenu_dev -tAc 'select count(*) from restaurants' 2>/dev/null || echo 0)"
if [ "$NB_RESTAURANTS" -eq 0 ]; then
  npm run db:seed
else
  echo "  base déjà peuplée ($NB_RESTAURANTS restaurant·s) — seed ignoré"
fi

# --------------------------------------------------------------------------- #
# 4. Build de production
# --------------------------------------------------------------------------- #
if [ "$SANS_BUILD" -eq 0 ]; then
  etape "Build de production"
  npm run build
fi

etape "Terminé"
cat <<EOF
  Démarrez le serveur dans un processus persistant :

    npm start -- -H 0.0.0.0 -p 3000

  Puis ouvrez : $URL_APP
  Comptes de démo : admin@demo.ci / Demo1234 · serveur@demo.ci · admin@tantie.ci · superadmin@mesplats.app / Super1234
EOF
