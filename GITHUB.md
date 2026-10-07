# Mesplats → GitHub : connecter le dépôt et le tableau de projet

Ce guide branche le projet sur **GitHub** (dépôt + tableau de projet
`kouakoumark9-blip/projects/2`) puis sur **Vercel**.

Tout est déjà préparé dans le dépôt :

| Élément | Fichier / commande | Rôle |
| --- | --- | --- |
| Intégration continue | `.github/workflows/ci.yml` | À chaque envoi : types, style, migrations, seed et `next build` |
| Modèles de fiches | `.github/ISSUE_TEMPLATE/` | « Bogue » et « Évolution », en français, avec les champs utiles |
| Modèle de fusion | `.github/pull_request_template.md` | Liste de contrôle avant fusion |
| Branchement complet | `scripts/connecter-github.sh` | Crée le dépôt, envoie le code, remplit le tableau |
| Fiches du carnet de route | `scripts/github-projet.mjs` | Étiquettes, fiches et colonnes du tableau (sans doublon) |

---

## 1. Installer GitHub CLI (une seule fois)

```bash
# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y gh

# macOS
brew install gh

# Windows
winget install --id GitHub.cli
```

Puis connectez-vous :

```bash
gh auth login                 # choisissez GitHub.com → HTTPS → connexion par navigateur
gh auth refresh -s project    # indispensable pour écrire dans le tableau de projet
```

## 2. Brancher le dépôt et remplir le tableau (une seule commande)

Depuis le dossier du projet :

```bash
cd afrimenu
bash scripts/connecter-github.sh
```

Le script enchaîne : dépôt privé `kouakoumark9-blip/mesplats`, branche `main`,
envoi du code, description et mots-clés du dépôt, **puis** les 13 étiquettes,
les 19 fiches du carnet de route et leur colonne dans le tableau
(« En cours », « À faire », « Terminé »).

Variantes utiles :

```bash
bash scripts/connecter-github.sh --public          # dépôt public
bash scripts/connecter-github.sh --sans-projet     # fiches seulement, sans toucher au tableau
node scripts/github-projet.mjs --simulation        # voir le plan sans rien créer
```

> Le script ne crée jamais de doublon : une fiche déjà ouverte avec le même
> titre est simplement réutilisée et remise dans sa colonne.

## 3. À la main, si vous préférez le navigateur

1. **Créer le dépôt** : <https://github.com/new> → nom `mesplats` → *Private* →
   **ne cochez rien** (ni README ni .gitignore) → *Create repository*.
2. **Envoyer le code** depuis votre machine :

   ```bash
   cd afrimenu
   git branch -M main
   git remote add origin git@github.com:kouakoumark9-blip/mesplats.git
   git push -u origin main
   ```

3. **Tableau de projet** : <https://github.com/users/kouakoumark9-blip/projects/2>
   → *Settings* → vérifiez que la vue est en mode **Board** avec les colonnes
   `À faire`, `En cours`, `Terminé`.
4. **Remplir les fiches** : `node scripts/github-projet.mjs`.

## 4. Ce que fait l'intégration continue

À chaque `git push` sur `main` et sur chaque demande de fusion, GitHub exécute
`.github/workflows/ci.yml` :

| Tâche | Commande | Ce qui est vérifié |
| --- | --- | --- |
| Types et style | `npm run typecheck` puis `npm run lint` | Aucune erreur TypeScript, aucune règle ESLint cassée |
| Build | `npm run db:setup` puis `npm run build` | Les migrations s'appliquent sur une base PostgreSQL 17 vierge, le jeu de démonstration s'insère, l'application compile |

Le voyant de l'intégration continue apparaît dans l'onglet **Actions** du dépôt.
Un voyant rouge signifie qu'il ne faut pas fusionner : la fiche correspondante
reste en « En cours ».

## 5. Déployer sur Vercel (après le premier envoi)

1. **Neon** — <https://console.neon.tech> → *New project* (région `eu-central-1`) →
   copiez la chaîne de connexion **Pooled**.
2. **Vercel** — <https://vercel.com/new> → *Import* le dépôt `mesplats` →
   Framework détecté : **Next.js**.
3. **Variables d'environnement** (Production, Preview, Development) :

   | Variable | Où la trouver |
   | --- | --- |
   | `DATABASE_URL` | Neon → Connection string (pooled, avec `?sslmode=require`) |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → *Create Database* → Blob |
   | `NEXT_PUBLIC_APP_URL` | `https://votre-domaine.com` (sert à construire les QR codes) |

4. **Préparer la base de production** :

   ```bash
   DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require" npm run db:setup
   ```

5. **Déployer**, puis vérifier au téléphone : `/m/maquis-le-baoule` (la carte),
   `/service` (l'écran de la salle) et `/boutique` (les supports imprimés).

> À partir de ce moment, chaque envoi sur `main` déclenche **un déploiement
> Vercel** et **une exécution de la CI** : c'est la boucle de travail normale.

## 6. En cas de souci

| Symptôme | Cause | Solution |
| --- | --- | --- |
| `gh: command not found` | GitHub CLI absent | Section 1 |
| `gh auth status` → *not logged in* | Session expirée | `gh auth login` |
| Tableau vide, fiches créées | Portée `project` manquante | `gh auth refresh -s project` puis relancer le script |
| `remote origin already exists` | Dépôt déjà branché | `git remote set-url origin git@github.com:…` |
| Voyant rouge « Build » | Migrations ou type cassés | Ouvrir l'onglet *Actions*, lire la ligne en rouge, corriger, renvoyer |
