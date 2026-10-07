#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Mesplats — brancher le projet sur GitHub en une commande
# ---------------------------------------------------------------------------
# Ce script :
#   1. vérifie que `gh` (GitHub CLI) est installé et connecté ;
#   2. renomme la branche locale en `main` ;
#   3. crée le dépôt distant (s'il n'existe pas) et envoie tout le code ;
#   4. remplit la description et les mots-clés du dépôt ;
#   5. lance `scripts/github-projet.mjs` : étiquettes, fiches et tableau de projet.
#
# Utilisation :
#   bash scripts/connecter-github.sh                       # privé, kouakoumark9-blip/mesplats
#   bash scripts/connecter-github.sh --public
#   bash scripts/connecter-github.sh --depot kouakoumark9-blip/mesplats --projet 2
#   bash scripts/connecter-github.sh --sans-projet
# ---------------------------------------------------------------------------
set -euo pipefail

PROPRIETAIRE="${PROPRIETAIRE:-kouakoumark9-blip}"
NOM_DEPOT="${NOM_DEPOT:-mesplats}"
PROJET="${PROJET:-2}"
VISIBILITE="--private"
SANS_PROJET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --public) VISIBILITE="--public"; shift ;;
    --depot) PROPRIETAIRE="${2%%/*}"; NOM_DEPOT="${2##*/}"; shift 2 ;;
    --projet) PROJET="$2"; shift 2 ;;
    --sans-projet) SANS_PROJET="--sans-projet"; shift ;;
    --aide|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Option inconnue : $1" >&2; exit 1 ;;
  esac
done

DEPOT="$PROPRIETAIRE/$NOM_DEPOT"

bleu()  { printf '\033[1;34m%s\033[0m\n' "$1"; }
vert()  { printf '\033[1;32m%s\033[0m\n' "$1"; }
rouge() { printf '\033[1;31m%s\033[0m\n' "$1"; }

# ------------------------------------------------------------------ 1) `gh`
if ! command -v gh >/dev/null 2>&1; then
  rouge "GitHub CLI (gh) n'est pas installé."
  cat <<'FIN'

Installez-le puis relancez ce script :

  • Ubuntu / Debian :
      sudo apt-get install -y gh
  • macOS (Homebrew) :
      brew install gh
  • Windows :
      winget install --id GitHub.cli

Puis connectez-vous :

  gh auth login
  gh auth refresh -s project     # nécessaire pour le tableau de projet

FIN
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  rouge "gh n'est pas connecté. Lancez :"
  echo "  gh auth login"
  echo "  gh auth refresh -s project"
  exit 1
fi
vert "✓ GitHub CLI connecté"

# --------------------------------------------------------------- 2) branche
CURRENTE="$(git branch --show-current)"
if [[ "$CURRENTE" != "main" ]]; then
  git branch -M main
  vert "✓ Branche renommée : $CURRENTE → main"
else
  vert "✓ Branche main"
fi

# ---------------------------------------------------------------- 3) dépôt
if git remote get-url origin >/dev/null 2>&1; then
  ORIGINE="$(git remote get-url origin)"
  if [[ "$ORIGINE" != *"$DEPOT"* ]]; then
    git remote set-url origin "git@github.com:$DEPOT.git"
    echo "↺ Origine mise à jour : $DEPOT"
  else
    vert "✓ Origine déjà configurée : $ORIGINE"
  fi
  git push -u origin main
else
  if gh repo view "$DEPOT" >/dev/null 2>&1; then
    git remote add origin "git@github.com:$DEPOT.git"
    git push -u origin main
  else
    gh repo create "$DEPOT" "$VISIBILITE" --source=. --remote=origin --push \
      --description "Mesplats — menu QR et commande pour restaurants (Côte d'Ivoire / Afrique de l'Ouest)"
  fi
  vert "✓ Dépôt $DEPOT créé et code envoyé"
fi

# ------------------------------------------------------ 4) présentation du dépôt
gh repo edit "$DEPOT" \
  --description "Mesplats — menu QR et commande en ligne pour restaurants : carte publique, commande à table, écran de service temps réel, paiements mobile money." \
  --add-topic nextjs --add-topic typescript --add-topic tailwindcss --add-topic drizzle-orm \
  --add-topic postgresql --add-topic authjs --add-topic restaurant --add-topic qr-code \
  --add-topic pwa --add-topic cote-divoire --add-topic fcfa --add-topic mesplats \
  >/dev/null 2>&1 || echo "  (description du dépôt non modifiée — à faire depuis GitHub si besoin)"

# Crée les étiquettes et les fiches, puis remplit le tableau de projet
node scripts/github-projet.mjs --depot "$DEPOT" --proprietaire "$PROPRIETAIRE" --projet "$PROJET" $SANS_PROJET

vert "\n✓ Terminé"
echo "Dépôt   : https://github.com/$DEPOT"
echo "Tableau : https://github.com/users/$PROPRIETAIRE/projects/$PROJET"
echo
echo "Prochaine étape — le déploiement :"
echo "  1. Neon   → https://console.neon.tech (copier la chaîne « pooled »)"
echo "  2. Vercel → https://vercel.com/new (importer $DEPOT, coller DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN)"
echo "  3. En local, sur la base Neon :  DATABASE_URL=\"…\" npm run db:setup"
