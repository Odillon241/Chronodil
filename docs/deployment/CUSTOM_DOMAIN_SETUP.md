# Configuration du domaine chronodil.com

Guide complet pour configurer le domaine personnalisé chronodil.com sur Vercel.

## 1. Ajouter le domaine dans Vercel

### Via le Dashboard Vercel

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **chronodil-app**
3. Aller dans **Settings** > **Domains**
4. Cliquer sur **Add Domain**
5. Entrer `chronodil.com`
6. Vercel va afficher les enregistrements DNS à configurer

### Via Vercel CLI (Alternative)

```bash
vercel domains add chronodil.com
```

## 2. Configurer les DNS chez votre registrar

Chez votre registrar de domaine, ajouter les enregistrements suivants :

### Option A : Utiliser les nameservers Vercel (Recommandé)

Changer les nameservers du domaine vers :
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### Option B : Enregistrements DNS manuels

| Type  | Nom          | Valeur                        | TTL  |
|-------|--------------|-------------------------------|------|
| A     | @            | 76.76.21.21                   | 3600 |
| CNAME | www          | cname.vercel-dns.com          | 3600 |

> **Note** : Les IPs Vercel peuvent changer. Vérifiez toujours dans le dashboard Vercel les valeurs actuelles.

## 3. Mettre à jour les variables d'environnement Vercel

### Via le Dashboard

1. Aller dans **Settings** > **Environment Variables**
2. Mettre à jour ou créer les variables suivantes :

| Variable                 | Valeur                      | Environnements |
|--------------------------|-----------------------------|----------------|
| `NEXT_PUBLIC_APP_URL`    | `https://chronodil.com`     | Production     |
| `NEXT_PUBLIC_BASE_URL`   | `https://chronodil.com`     | Production     |

### Via Vercel CLI

```bash
# Supprimer les anciennes valeurs
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env rm NEXT_PUBLIC_BASE_URL production

# Ajouter les nouvelles
echo "https://chronodil.com" | vercel env add NEXT_PUBLIC_APP_URL production
echo "https://chronodil.com" | vercel env add NEXT_PUBLIC_BASE_URL production
```

## 4. Configurer Supabase Auth

### Dans le Dashboard Supabase

1. Aller sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet **kucajoobtwptpdanuvnj**
3. Aller dans **Authentication** > **URL Configuration**
4. Mettre à jour :

| Paramètre           | Valeur                                |
|---------------------|---------------------------------------|
| **Site URL**        | `https://chronodil.com`               |
| **Redirect URLs**   | Ajouter :                             |
|                     | `https://chronodil.com/**`            |
|                     | `https://www.chronodil.com/**`        |
|                     | (Garder les anciennes pour la transition) |

### Redirect URLs complètes à configurer

```
http://localhost:3000/**
https://chronodil-app.vercel.app/**
https://chronodil.com/**
https://www.chronodil.com/**
```

## 5. Configurer les emails (Resend)

Maintenant que vous avez un domaine personnalisé, vous pouvez configurer Resend pour envoyer depuis `@chronodil.com`.

### 5.1 Ajouter le domaine dans Resend

1. Aller sur [resend.com/domains](https://resend.com/domains)
2. Cliquer sur **Add Domain**
3. Entrer `chronodil.com`
4. Resend affichera les enregistrements DNS à ajouter

### 5.2 Ajouter les enregistrements DNS pour les emails

| Type  | Nom                              | Valeur                                           |
|-------|----------------------------------|--------------------------------------------------|
| TXT   | @                                | `v=spf1 include:_spf.resend.com ~all`            |
| CNAME | resend._domainkey                | (Valeur fournie par Resend)                      |
| TXT   | _dmarc                           | `v=DMARC1; p=none;`                              |

### 5.3 Mettre à jour la variable RESEND_FROM_EMAIL

Dans Vercel et `.env.production` :

```env
RESEND_FROM_EMAIL=Chronodil <no-reply@chronodil.com>
```

## 6. Vérifications post-configuration

### Checklist

- [ ] Le domaine chronodil.com affiche l'application
- [ ] Le domaine www.chronodil.com redirige vers chronodil.com
- [ ] HTTPS est actif (certificat SSL automatique Vercel)
- [ ] La connexion/inscription fonctionne
- [ ] La réinitialisation de mot de passe fonctionne
- [ ] Les emails arrivent depuis @chronodil.com (après vérification Resend)

### Tester les redirections Auth

```bash
# Tester le flow de réinitialisation de mot de passe
# Le lien doit rediriger vers https://chronodil.com/auth/reset-password
```

### Vérifier le SSL

```bash
curl -I https://chronodil.com
# Doit retourner HTTP/2 200
```

## 7. Garder l'ancien domaine (optionnel)

Pour une transition en douceur, vous pouvez garder `chronodil-app.vercel.app` comme alias qui redirige vers `chronodil.com`.

Dans Vercel Dashboard > Settings > Domains :
- `chronodil.com` - Domaine principal
- `www.chronodil.com` - Redirige vers chronodil.com
- `chronodil-app.vercel.app` - Alias (optionnel)

## 8. Délais de propagation DNS

- Les changements DNS peuvent prendre **24-48 heures** pour se propager
- Vous pouvez vérifier la propagation sur [dnschecker.org](https://dnschecker.org)
- Le certificat SSL sera automatiquement provisionné par Vercel une fois les DNS propagés

## Récapitulatif des actions

1. **Vercel** : Ajouter chronodil.com dans Settings > Domains
2. **Registrar** : Configurer les DNS (A record + CNAME)
3. **Vercel** : Mettre à jour NEXT_PUBLIC_APP_URL et NEXT_PUBLIC_BASE_URL
4. **Supabase** : Mettre à jour Site URL et Redirect URLs
5. **Resend** : Ajouter et vérifier le domaine pour les emails
6. **Attendre** : Propagation DNS (24-48h max)
7. **Tester** : Vérifier tous les flows d'authentification
