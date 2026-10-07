#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Mesplats — finalisation du branchement GitHub, sans intervention manuelle
# ---------------------------------------------------------------------------
# À lancer APRÈS l'autorisation (scripts/github-connexion.mjs) : ce script
# attend le jeton, connecte le CLI GitHub, envoie le code sur `main`, remplit
# la présentation du dépôt, puis crée les étiquettes, les fiches et les
# colonnes du tableau de projet n°2.
#
# Le déroulé complet est journalisé dans /tmp/github-finaliser.log et le bilan
# (avec les URL) est écrit dans /home/user/github-resultat.txt.
# ---------------------------------------------------------------------------
set -uo pipefail

JETON="/tmp/mesplats-gh-token"
export GH_CONFIG_DIR=/tmp/gh-config
PROJET="./scripts/github-projet.mjs"
DEPOT="kouakoumark9-blip/mesplats"
PROPRIETAIRE="kouakoumark9-blip"
NUMERO_PROJET="2"
RESULTAT="/home/user/github-resultat.txt"

dire() { printf '%s\n' "$1" | tee -a "$RESULTAT"; }

: > "$RESULTAT"
dire "Mesplats → GitHub — $(date '+%d/%m/%Y %H:%M')"
dire "Dépôt  : https://github.com/$DEPOT"
dire "Tableau: https://github.com/users/$PROPRIETAIRE/projects/$NUMERO_PROJET"
dire ""

# ------------------------------------------------------------------ 1) jeton
dire "▸ 1. Attente de l'autorisation…"
for _ in $(seq 1 240); do
  [ -f "$JETON" ] && break
  sleep 5
done
if [ ! -f "$JETON" ]; then
  dire "  ✗ Aucune autorisation reçue (code expiré). Relancez la connexion."
  exit 1
fi
TOKEN="$(cat "$JETON")"
dire "  ✓ Autorisation reçue"

# -------------------------------------------------------------------- 2) gh
if ! command -v gh >/dev/null 2>&1; then
  dire "▸ 2. Installation du CLI GitHub…"
  sudo apt-get update -q >>/tmp/github-finaliser.log 2>&1
  sudo apt-get install -y -q gh >>/tmp/github-finaliser.log 2>&1
fi
mkdir -p "$GH_CONFIG_DIR"
if printf '%s' "$TOKEN" | gh auth login --with-token >>/tmp/github-finaliser.log 2>&1; then
  dire "▸ 2. CLI GitHub connecté ($(gh api user --jq .login 2>/dev/null))"
else
  dire "▸ 2. ✗ Le CLI GitHub n'a pas accepté le jeton"
  exit 1
fi

# ------------------------------------------------------------------ 3) envoi
dire "▸ 3. Envoi du code sur la branche main…"
git branch -M main
git remote remove origin >/dev/null 2>&1 || true
git remote add origin "https://github.com/$DEPOT.git"
if git -c http.extraheader="AUTHORIZATION: bearer $TOKEN" push -u origin main >>/tmp/github-finaliser.log 2>&1; then
  NB_COMMITS="$(git rev-list --count HEAD)"
  dire "  ✓ $NB_COMMITS commits en ligne : https://github.com/$DEPOT"
else
  dire "  ✗ L'envoi a échoué — détail dans /tmp/github-finaliser.log"
  tail -5 /tmp/github-finaliser.log | sed 's/^/    /' >> "$RESULTAT"
  exit 1
fi

# ------------------------------------------------------- 4) présentation du dépôt
gh repo edit "$DEPOT" \
  --description "Mesplats — menu QR et commande en ligne pour restaurants : carte publique, commande à table, écran de service temps réel, paiements mobile money, boutique de supports imprimés." \
  --add-topic nextjs --add-topic typescript --add-topic tailwindcss --add-topic drizzle-orm \
  --add-topic postgresql --add-topic authjs --add-topic restaurant --add-topic qr-code \
  --add-topic pwa --add-topic cote-divoire --add-topic fcfa --add-topic mesplats \
  >>/tmp/github-finaliser.log 2>&1 && dire "▸ 4. Présentation et mots-clés du dépôt mis à jour"

# --------------------------------------------- 5) étiquettes, fiches et tableau
dire "▸ 5. Étiquettes, fiches et tableau de projet…"
node "$PROJET" --depot "$DEPOT" --proprietaire "$PROPRIETAIRE" --projet "$NUMERO_PROJET" \
  >>/tmp/github-finaliser.log 2>&1
BILAN="$(grep -E "^Bilan :" /tmp/github-finaliser.log | tail -1)"
dire "  ${BILAN:-✗ création des fiches à vérifier (/tmp/github-finaliser.log)}"

dire ""
dire "✓ Terminé — dépôt et tableau à jour."
dire "  CI : https://github.com/$DEPOT/actions"
