# DailySavingV — Frontend (React + Vite)

Interface reproduisant le style de vos maquettes : cartes blanches, en-têtes de
tableau bleu, boutons verts/turquoise, badges de statut colorés.

## Démarrage

```bash
npm install
cp .env.example .env       # puis renseigner VITE_API_BASE_URL avec l'URL de votre API .NET
npm run dev
```

L'app tourne sur http://localhost:5173

## Build production

```bash
npm run build
```
Génère le dossier `dist/` à déployer sur Netlify, Vercel, ou tout hébergeur statique.

## Structure

```
src/
  api/           client axios (JWT + refresh automatique) + endpoints par module
  context/       AuthContext (login/logout/session)
  components/    Layout (sidebar), DataTable, Modal, StatusBadge — réutilisés partout
  pages/         Un fichier par module : Dashboard, Agency, Users, Collector, Client,
                 Account, Contract, Commission, IMF, Validations (file d'attente Maker-Checker)
  styles/        theme.css — toutes les couleurs et styles centralisés ici
```

## Isolation par agence

Le frontend ne fait AUCUN filtrage lui-même : il affiche simplement ce que l'API
retourne. C'est le backend (.NET, filtre global EF Core sur AgenceID) qui garantit
qu'un utilisateur ne reçoit jamais que les données de son agence. Voir le README
du backend pour le détail.

## Étendre à un nouveau module

Chaque page suit le même squelette (`CollectorManagement.jsx` est la référence la
plus complète, avec onglets Validated/Pending + workflow d'approbation) :
1. Charger les données via `api/endpoints.js`
2. Afficher avec `<DataTable columns={...} rows={...} />`
3. Bouton "+ Add X" ouvre un `<Modal>` avec un formulaire
4. Si l'entité suit le Maker-Checker : onglet Pending + boutons Valider/Rejeter

## Déploiement

1. `npm run build`
2. Glisser le dossier `dist/` sur Netlify (ou connecter le repo GitHub sur Vercel)
3. Configurer la variable d'environnement `VITE_API_BASE_URL` dans les settings du
   service d'hébergement pour pointer vers votre backend .NET déployé
