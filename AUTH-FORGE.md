# Connexion Forge EPITA et permissions

L’app utilise **Forge ID EPITA** (OIDC) pour le login. Seuls les utilisateurs présents dans la table **app_users** (Supabase) ont accès aux données.

---

## 1. Demander un client OAuth à la Forge

Le **client de test** fourni par la doc Forge ne permet que des redirect URIs sur les ports 8000/8080. Pour utiliser l’app (souvent sur le port 3000 ou en production), il faut **demander ton propre client** à la Forge :

- Doc : [Forge ID OIDC](https://docs.forge.epita.fr/services/forge-id/oidc/)
- Contact : [docs.forge.epita.fr/contact](https://docs.forge.epita.fr/contact)

Dans ta demande, indique :

- **Nom de l’app** : Sandwich Planner (ou le nom de ton projet)
- **Redirect URIs** (exactement) :
  - En prod : `https://TON-DOMAINE.com/api/auth/callback/forge-epita`
  - En dev : `http://localhost:3000/api/auth/callback/forge-epita`
- **Scopes** : `openid`, `profile`, `email` (suffisant pour nom, email, identifiant stable)

Tu recevras un **Client ID** et une **Secret key** à utiliser dans les variables d’environnement.

---

## 2. Variables d’environnement pour l’auth

À ajouter dans **`.env.local`** (local) et dans **Vercel → Settings → Environment Variables** (prod) :

```env
# Obligatoire pour NextAuth
NEXTAUTH_SECRET=une_cle_secrete_longue_aleatoire
NEXTAUTH_URL=http://localhost:3000

# Forge EPITA (après avoir reçu ton client)
FORGE_EPITA_CLIENT_ID=ton_client_id
FORGE_EPITA_CLIENT_SECRET=ta_secret_key
```

- **NEXTAUTH_SECRET** : génère une chaîne aléatoire (ex. `openssl rand -base64 32`).
- **NEXTAUTH_URL** : en local `http://localhost:3000` ; en prod l’URL de ton site (ex. `https://ton-app.vercel.app`).

Sans **FORGE_EPITA_***, la connexion Forge ne fonctionnera pas (bouton « Se connecter avec Forge EPITA » inopérant).

---

## 3. Table des utilisateurs autorisés (app_users)

Le script **`supabase/schema.sql`** crée la table **app_users**. Après avoir exécuté le script dans le SQL Editor Supabase (voir CONNEXION-SUPABASE.md), tu peux ajouter des utilisateurs.

### Ajouter le premier admin (toi)

Après ta **première connexion** avec Forge EPITA, récupère ton **subject** (identifiant stable) :

- Soit en regardant les logs / la session (claim `sub` du token OIDC),
- Soit en ajoutant temporairement un `console.log` dans le callback `profile` de `lib/auth.ts` pour afficher `profile.sub`.

Puis dans Supabase → **SQL Editor** :

```sql
insert into public.app_users (forge_sub, email, name, role)
values (
  'TON_SUB_FORGE_ICI',           -- ex. un identifiant du type "abc123..."
  'ton.email@epita.fr',
  'Ton Nom',
  'admin'
);
```

Tu peux aussi insérer par **email** si tu préfères gérer les accès plus tard (il faudra alors que le premier login enregistre le `forge_sub` associé à l’email – voir ci‑dessous pour une évolution possible).

### Ajouter d’autres utilisateurs

Même principe : une ligne par personne autorisée.

```sql
insert into public.app_users (forge_sub, email, name, role)
values
  ('forge_sub_utilisateur_2', 'autre@epita.fr', 'Autre Nom', 'user'),
  ('forge_sub_utilisateur_3', 'encore@epita.fr', 'Encore Nom', 'user');
```

- **admin** : pour l’instant même accès que **user** ; à terme tu peux réserver des actions (ex. gestion des utilisateurs) aux admins.
- **user** : accès normal à l’app (dashboard, ingrédients, compta, etc.).

### Comportement

- **Pas de Supabase** (pas de `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`) : tout utilisateur connecté via Forge a accès (pratique en dev sans base).
- **Avec Supabase** : seuls les utilisateurs présents dans **app_users** ont accès ; les autres sont redirigés vers **/access-denied**.

---

## 4. Flux utilisateur

1. L’utilisateur va sur l’app → le **middleware** le redirige vers **/login** s’il n’est pas connecté.
2. Sur **/login**, il clique sur « Se connecter avec Forge EPITA » → redirection vers la Forge → après succès, retour sur l’app (callback NextAuth).
3. L’app appelle **/api/me** qui vérifie la session et la présence dans **app_users**.
4. Si l’utilisateur n’est **pas** dans **app_users** → redirection vers **/access-denied** (avec message pour contacter un admin).
5. Sinon, accès normal (dashboard, ingrédients, planificateur, compta).

---

## 5. Résumé des variables d’environnement (auth)

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Secret pour signer les sessions (obligatoire). |
| `NEXTAUTH_URL` | URL de l’app (ex. `http://localhost:3000` ou l’URL Vercel). |
| `FORGE_EPITA_CLIENT_ID` | Client ID reçu de la Forge. |
| `FORGE_EPITA_CLIENT_SECRET` | Secret key reçu de la Forge. |

Une fois le client Forge reçu, les variables configurées et au moins un utilisateur inséré dans **app_users**, le login et les permissions sont opérationnels.
