# Déployer Sandwich Planner en ligne

Le build est prêt. Pour obtenir un **lien public** :

## Option 1 : Vercel (recommandé, gratuit)

1. Va sur [vercel.com](https://vercel.com) et crée un compte (ou connecte-toi avec GitHub).
2. Clique sur **"Add New Project"** puis **"Import Git Repository"** (si le projet est sur GitHub), ou **"Import"** et glisse le dossier du projet.
3. Si tu n’as pas de dépôt Git : installe Vercel CLI et déploie depuis le dossier du projet :
   ```bash
   cd sandwich-app
   npx vercel
   ```
   Suis les questions (lien vers ton compte Vercel, nom du projet). À la fin, tu obtiendras une URL du type **https://sandwich-app-xxx.vercel.app**.

## Option 2 : Netlify

1. Va sur [netlify.com](https://netlify.com).
2. **"Add new site"** → **"Import an existing project"**.
3. Choisis **"Deploy manually"** et glisse le dossier **sandwich-app** (après `npm run build`, le dossier à déployer est `.next` + les fichiers statiques ; pour Netlify, utilise plutôt le connecteur Git ou **"Build command"** : `npm run build`, **Publish directory** : `.next` — pour Next.js, le connecteur Netlify est prévu).

## Option 3 : Déploiement manuel (hébergeur avec Node)

Sur un serveur (VPS, OVH, etc.) :

```bash
cd sandwich-app
npm ci
npm run build
npm start
```

Le site écoute sur le port 3000 par défaut. Configure un reverse proxy (nginx) et un nom de domaine si besoin.

---

**Note :** L’API de persistance (`/api/persist`) enregistre les données dans le fichier `data/store.json` sur le serveur. Sur Vercel/Netlify (serverless), le système de fichiers est éphémère : les données ne sont pas conservées entre les déploiements. Pour une persistance en production, il faudrait brancher une base de données (ex. Vercel Postgres, Supabase) ou un stockage externe.
