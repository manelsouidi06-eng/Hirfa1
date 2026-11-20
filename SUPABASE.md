# Guide Supabase pour HIRFA (pas à pas)

> Les noms des menus Supabase peuvent légèrement changer. Cherchez le mot le plus proche.

## 1. Créer les comptes et le projet
1. Créez un compte **GitHub** (github.com, Sign up).
2. Sur **supabase.com**, cliquez *Start your project*, puis *Continue with GitHub*.
3. *New project* : nom `hirfa`, un mot de passe de base de données (à noter, à ne JAMAIS partager), région en Europe, offre Free.
4. Attendez 1 à 2 minutes.

## 2. Trouver l'URL et la Publishable key
Engrenage *Project Settings* > *API Keys* : copiez **Project URL** et **Publishable key** (`sb_publishable_...`).
Ouvrez `supabase-client.js` et remplacez les deux valeurs. Ne mettez jamais la clé `secret`/`service_role`.

## 3. Exécuter les scripts SQL (dans cet ordre)
*SQL Editor* > *New query* : collez, puis *Run*, un fichier à la fois.
1. `supabase-setup.sql` : produits, rôles, sécurité. **Base neuve uniquement.**
2. `supabase-orders.sql` : commandes (relançable sans perdre de données).
3. `supabase-admin.sql` : plus tard, voir l'étape 6.

Un message « Success » s'affiche. Vérifiez dans *Table Editor* : `products` contient 10 lignes.

## 4. Régler l'authentification
*Authentication* > *URL Configuration* :
- **Site URL** : `http://localhost:8000` (ou `http://127.0.0.1:5500` avec Live Server).
- **Redirect URLs** : ajoutez `http://localhost:8000/**` et `http://127.0.0.1:5500/**`. Après Vercel, ajoutez aussi `https://VOTRE-SITE.vercel.app/**` et remplacez la Site URL.
*Authentication* > *Sign In / Providers* > *Email* : gardez **Confirm email** activé.

## 5. Créer votre compte sur le site
Ouvrez `signup.html`, inscrivez-vous, ouvrez l'e-mail de confirmation (regardez les spams), cliquez le lien. Sur l'offre gratuite, le nombre d'e-mails par heure est limité : attendez avant de réessayer.

## 6. Devenir admin
1. *Authentication* > *Users* : copiez l'**UUID** de votre compte.
2. Ouvrez `supabase-admin.sql`, remplacez `VOTRE-UUID`, collez dans *SQL Editor*, *Run*.
3. Déconnectez-vous puis reconnectez-vous : le lien Admin apparaît.

## 7. Erreurs fréquentes
- *Invalid API key* : URL ou clé mal copiée dans `supabase-client.js`.
- *relation "public.products" does not exist* : `supabase-setup.sql` n'a pas été exécuté.
- *permission denied / new row violates row-level security* : normal pour un visiteur ; sinon vérifiez le rôle admin.
- Le lien de confirmation ne marche pas : revoyez les Redirect URLs (étape 4).
- *invalid input syntax for type uuid* : `VOTRE-UUID` n'a pas été remplacé.

## 8. Mise en ligne sur Vercel
1. Mettez le dossier `mon-site` dans un dépôt **GitHub** (*New repository*, puis *uploading an existing file*).
2. Sur **vercel.com**, connectez-vous avec GitHub, *Add New > Project*, choisissez le dépôt.
3. **Framework Preset : Other.** Root Directory : le dossier contenant `index.html`. Build Command : vide. Output Directory : vide (ou `.`).
4. *Deploy*, puis notez l'adresse `https://xxxx.vercel.app`.
5. Retournez à l'étape 4 : ajoutez cette adresse dans Supabase (Site URL et Redirect URLs).
6. Testez sur l'adresse HTTPS : inscription, connexion, commande.
