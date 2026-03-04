# Connexion à Supabase – étape par étape

## Étape 1 : Récupérer l’URL du projet

Tu es déjà sur la fenêtre **Connect to your project** avec l’onglet **API Keys**.

1. Repère **Project URL**.
2. Clique sur **Copy** à côté de l’URL (ex. `https://ugxujbcbdtzixzivyyrz.supabase.co`).
3. Garde cette valeur pour plus tard : c’est ta **NEXT_PUBLIC_SUPABASE_URL**.

---

## Étape 2 : Récupérer la clé secrète (Service Role Key)

La clé affichée (Publishable Key / Anon Key) ne suffit pas pour que l’app sauvegarde les données. Il faut la **Service Role Key**.

1. En bas de la même fenêtre, clique sur le bouton **API settings** (ou va dans le menu de gauche : **Project Settings** → **API**).
2. Dans la section **Project API keys**, trouve la clé nommée **service_role** (ou **Secret**).
3. Clique sur **Reveal** pour l’afficher, puis **Copy** pour la copier.
4. **Important** : ne mets jamais cette clé dans ton code ni sur GitHub. Elle ne doit servir que dans les variables d’environnement (voir plus bas).

Tu as maintenant :
- **NEXT_PUBLIC_SUPABASE_URL** = Project URL (étape 1)
- **SUPABASE_SERVICE_ROLE_KEY** = la clé service_role (étape 2)

---

## Étape 3 : Créer ou mettre à jour la table dans Supabase

Sans cette table, l’app ne peut pas lire ni enregistrer les données (ingrédients, sandwichs, compta, etc.).

1. Dans le dashboard Supabase (menu de gauche), clique sur **SQL Editor**.
2. Clique sur **New query**.
3. Ouvre le fichier **`supabase/schema.sql`** dans ton projet (dans le dossier `supabase`).
4. Copie **tout** le contenu de ce fichier.
5. Colle-le dans l’éditeur SQL Supabase.
6. Clique sur **Run** (ou Ctrl+Entrée).
7. Tu dois voir un message du type « Success » en bas.

- **Première fois** : les tables **app_store**, **app_compta** et **app_users** sont créées.
- **Déjà fait avant** : tu peux relancer le même script sans risque. Le script crée aussi la table **app_users** (utilisateurs autorisés pour le login Forge EPITA) si elle n’existe pas. Voir **AUTH-FORGE.md** pour ajouter des utilisateurs.

---

## Étape 4 : Configurer les variables d’environnement

### En local (sur ton PC)

1. À la **racine** du projet (là où se trouve `package.json`), crée un fichier nommé exactement **`.env.local`** (avec le point au début).
2. Ouvre ce fichier et ajoute ces deux lignes en remplaçant par tes vraies valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ugxujbcbdtzixzivyyrz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ta_cle_service_role_ici
```

- Remplace `https://ugxujbcbdtzixzivyyrz.supabase.co` par ton **Project URL** si elle est différente.
- Remplace `ta_cle_service_role_ici` par la clé **service_role** copiée à l’étape 2 (tout en un bloc, sans espaces).

3. Enregistre le fichier.  
   Le fichier `.env.local` est ignoré par Git : il ne sera pas envoyé sur GitHub.

4. **Redémarre** le serveur de dev si il tourne déjà :
   - Arrête-le (Ctrl+C dans le terminal).
   - Relance : `npm run dev`.

### Sur Vercel (site en ligne)

1. Va sur [vercel.com](https://vercel.com) → ouvre **ton projet**.
2. Onglet **Settings** → **Environment Variables**.
3. Ajoute une variable :
   - **Key** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : ton Project URL (ex. `https://ugxujbcbdtzixzivyyrz.supabase.co`)
   - **Environments** : coche Production (et Preview si tu veux).
   - Clique sur **Save**.
4. Ajoute une deuxième variable :
   - **Key** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : la clé **service_role** copiée à l’étape 2.
   - Coche **Sensitive** si l’option existe.
   - **Save**.
5. Va dans **Deployments** → sur le dernier déploiement, clique sur les **…** → **Redeploy** pour que les nouvelles variables soient prises en compte.

---

## Étape 5 : Vérifier que ça marche

1. Lance l’app en local : `npm run dev`.
2. Ouvre [http://localhost:3000](http://localhost:3000).
3. Importe un CSV (ingrédients) ou crée un sandwich, ou saisis des ventes en compta.
4. Recharge la page (F5) : les données doivent toujours être là. Si oui, la connexion à Supabase fonctionne.

Sur Vercel, après le redeploy, fais la même chose sur l’URL de ton site : les données doivent rester et être les mêmes pour tout le monde.

---

## Résumé des 2 variables

| Nom exact                      | Où la trouver dans Supabase | Exemple (à remplacer) |
|--------------------------------|-----------------------------|------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Connect to project → Project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY`    | API settings → service_role (Reveal + Copy) | `eyJhbGc...` (longue chaîne) |

Une fois ces deux variables définies (en local dans `.env.local` et sur Vercel dans Settings → Environment Variables) et les tables créées (étape 3), tout est enregistré dans Supabase. Pour le **login et les permissions** (Forge EPITA), ajoute aussi les variables décrites dans **AUTH-FORGE.md** et insère les utilisateurs autorisés dans **app_users**.

**Mettre à jour Supabase** : si tu as déjà créé la table auparavant, pas besoin de modifier la structure. Le script `supabase/schema.sql` est à jour ; tu peux le ré-exécuter dans le SQL Editor pour t’assurer que tout est bon (aucune perte de données, la table et le payload restent compatibles).
