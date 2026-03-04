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

## Persistance des données en ligne (Supabase)

Pour que **tout le monde** ait accès aux mêmes données (ingrédients CSV, sandwichs créés, compta) quand le site est publié sur Vercel, il faut une base **Supabase**.

### 1. Créer un projet Supabase (gratuit)

1. Va sur [supabase.com](https://supabase.com) → **Start your project** → crée un compte si besoin.
2. **New project** → choisis un nom, un mot de passe pour la base, une région → **Create**.
3. Une fois le projet créé, va dans **Project Settings** (icône engrenage) → **API** :
   - **Project URL** → tu en auras besoin pour `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **service_role** (secret) → copie pour `SUPABASE_SERVICE_ROLE_KEY`  
     (ne partage jamais cette clé côté client.)

### 2. Créer la table dans Supabase

1. Dans le dashboard Supabase : **SQL Editor** → **New query**.
2. Ouvre le fichier `supabase/schema.sql` de ce projet, copie tout son contenu, colle dans l’éditeur SQL → **Run**.
3. Tu dois voir un message de succès ; la table `app_store` est créée.

### 3. Variables d’environnement sur Vercel

1. Sur [vercel.com](https://vercel.com) → ton projet → **Settings** → **Environment Variables**.
2. Ajoute :
   - **Name** : `NEXT_PUBLIC_SUPABASE_URL`  
     **Value** : l’URL de ton projet (ex. `https://xxxxx.supabase.co`)
   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`  
     **Value** : la clé **service_role** copiée dans l’étape 1  
     Coche **sensitive** si possible.
3. **Save** puis **redeploy** le projet (Deployments → … sur le dernier déploiement → Redeploy).

Dès que ces variables sont définies, l’API `/api/persist` lit et écrit dans Supabase : les données (CSV, sandwichs, compta) sont partagées pour tous les visiteurs.

### En local (sans Supabase)

Sans ces variables, l’app utilise le fichier `data/store.json` dans le dossier du projet. Pour tester avec Supabase en local, crée un fichier `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.
