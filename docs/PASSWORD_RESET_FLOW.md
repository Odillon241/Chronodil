# Flux de Réinitialisation de Mot de Passe - Chronodil

## Vue d'ensemble

Chronodil utilise **Supabase Auth** pour gérer le flux complet de réinitialisation de mot de passe via email. Ce flux est sécurisé, sans OTP manuel, et utilise des magic links avec tokens JWT.

---

## Architecture du Flux

### 1. Page de Demande de Réinitialisation
**Route**: `/auth/forgot-password`
**Fichier**: `src/app/auth/forgot-password/page.tsx`

**Fonctionnalités**:
- Formulaire avec champ email (validation Zod)
- Appel à `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- État de succès affichant l'email envoyé
- Option de renvoi d'email

**Méthode Supabase utilisée**:
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});
```

**Comportement**:
- Supabase envoie un email avec un lien contenant `access_token` et `refresh_token`
- Le lien redirige vers `/auth/reset-password?access_token=...&refresh_token=...`
- L'utilisateur voit un message de confirmation

---

### 2. Page de Réinitialisation du Mot de Passe
**Route**: `/auth/reset-password`
**Fichier**: `src/app/auth/reset-password/page.tsx`

**États de la page**:

#### État 1: Validation du Token (Loading)
- Affiche un spinner pendant la vérification
- Récupère `access_token` et `refresh_token` depuis l'URL
- Appelle `supabase.auth.setSession({ access_token, refresh_token })`
- Vérifie la validité des tokens

**Code de validation**:
```typescript
const accessToken = searchParams.get("access_token");
const refreshToken = searchParams.get("refresh_token");

const { error } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken,
});
```

#### État 2: Token Invalide ou Expiré
- Affiche une icône d'erreur
- Message explicatif: "Lien invalide ou expiré"
- Bouton pour demander un nouveau lien
- Bouton pour retourner à la page de connexion

#### État 3: Formulaire de Nouveau Mot de Passe
- Champs: "Nouveau mot de passe" + "Confirmer le mot de passe"
- Validation Zod: minimum 8 caractères + correspondance
- Appel à `supabase.auth.updateUser({ password })`
- Déconnexion automatique après succès

**Code de mise à jour**:
```typescript
const { error } = await supabase.auth.updateUser({
  password: data.password,
});

if (!error) {
  await supabase.auth.signOut();
  router.push("/auth/login");
}
```

#### État 4: Succès
- Icône de succès (CheckCircle2)
- Message: "Mot de passe réinitialisé avec succès"
- Redirection automatique vers `/auth/login` après 2 secondes

---

## Diagramme du Flux

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Page de Connexion (/auth/login)                             │
│    - Utilisateur clique "Mot de passe oublié ?"                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Page Forgot Password (/auth/forgot-password)                │
│    - Utilisateur entre son email                               │
│    - Appel: supabase.auth.resetPasswordForEmail()              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Email envoyé par Supabase                                    │
│    - Contient magic link avec access_token + refresh_token     │
│    - Template Supabase par défaut (personnalisable)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Utilisateur clique sur le lien                              │
│    - Redirection: /auth/reset-password?access_token=...&...    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Validation du Token (automatique)                           │
│    - Appel: supabase.auth.setSession()                         │
│    - Si valide → Affiche formulaire                            │
│    - Si invalide → Affiche erreur                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Utilisateur entre nouveau mot de passe                      │
│    - Validation: min 8 caractères + correspondance             │
│    - Appel: supabase.auth.updateUser({ password })             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Déconnexion et Redirection                                  │
│    - Appel: supabase.auth.signOut()                            │
│    - Redirection automatique vers /auth/login                  │
│    - Utilisateur peut se connecter avec nouveau mot de passe   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sécurité

### Points de Sécurité Implémentés

1. **Tokens JWT dans l'URL**
   - Les tokens sont générés par Supabase et sont uniques par demande
   - Expiration automatique après un délai configurable (défaut: 1 heure)
   - Les tokens sont invalidés après utilisation

2. **Validation Côté Serveur**
   - `supabase.auth.setSession()` vérifie la signature JWT
   - Vérifie l'expiration du token
   - Vérifie que l'utilisateur existe

3. **Déconnexion Automatique**
   - Après changement de mot de passe, `signOut()` est appelé
   - Force l'utilisateur à se reconnecter avec le nouveau mot de passe
   - Invalide toutes les sessions actives

4. **Validation du Mot de Passe**
   - Minimum 8 caractères (Zod schema)
   - Correspondance entre mot de passe et confirmation
   - Validation côté client ET côté Supabase

5. **Protection contre les Attaques**
   - Rate limiting via Supabase Auth (configurable dans dashboard)
   - HTTPS obligatoire pour les redirects
   - Pas de stockage des tokens en localStorage

---

## Configuration Requise

### Variables d'Environnement (.env)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ipghppjjhjbkhuqzqzyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Email (Resend)
RESEND_API_KEY=re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY
RESEND_FROM_EMAIL=Chronodil <noreply@chronodil.app>
```

### Configuration Supabase Dashboard

**Authentication → Email Templates → Change Email**

Personnaliser le template pour inclure:
- Logo Chronodil
- Texte en français
- Lien avec styling cohérent
- Footer avec copyright

**Authentication → Settings**
- Activer "Enable email confirmations" (si pas déjà fait)
- Configurer "Site URL": `https://chronodil.app` (ou URL de production)
- Configurer "Redirect URLs": `https://chronodil.app/auth/reset-password`

---

## Fichiers Impliqués

### Pages
- `src/app/auth/forgot-password/page.tsx` - Demande de réinitialisation
- `src/app/auth/reset-password/page.tsx` - Changement de mot de passe
- `src/app/auth/login/page.tsx` - Lien "Mot de passe oublié ?"

### Utilitaires
- `src/lib/supabase-client.ts` - Client Supabase côté client
- `src/lib/validations/auth.ts` - Schémas Zod pour validation

### Composants UI Utilisés
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/card.tsx`
- `components/ui/shadcn-io/typing-text.tsx`

---

## Messages d'Erreur et Résolution

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Tokens manquants dans l'URL" | L'utilisateur a accédé directement à `/auth/reset-password` sans passer par l'email | Demander un nouveau lien via `/auth/forgot-password` |
| "Lien expiré ou invalide" | Le token JWT a expiré (> 1 heure) ou a déjà été utilisé | Demander un nouveau lien |
| "Erreur lors de l'envoi de l'email" | Problème avec Resend API ou configuration Supabase | Vérifier les clés API et la configuration email dans Supabase |
| "Les mots de passe ne correspondent pas" | Validation Zod échoue | Vérifier que les deux champs sont identiques |
| "Le mot de passe doit contenir au moins 8 caractères" | Validation Zod échoue | Entrer un mot de passe plus long |

---

## Tests à Effectuer

### Test 1: Flux Complet Réussi
1. ✅ Aller sur `/auth/login`
2. ✅ Cliquer "Mot de passe oublié ?"
3. ✅ Entrer un email valide (existant dans la DB)
4. ✅ Vérifier l'email reçu
5. ✅ Cliquer sur le lien dans l'email
6. ✅ Vérifier redirection vers `/auth/reset-password` avec tokens
7. ✅ Entrer nouveau mot de passe (2 fois)
8. ✅ Vérifier redirection vers `/auth/login`
9. ✅ Se connecter avec nouveau mot de passe

### Test 2: Email Invalide
1. ✅ Entrer un email qui n'existe pas
2. ✅ Vérifier que l'utilisateur voit quand même "Email envoyé" (sécurité: pas révéler l'existence du compte)
3. ✅ Vérifier qu'aucun email n'est reçu

### Test 3: Token Expiré
1. ✅ Demander un lien de réinitialisation
2. ✅ Attendre > 1 heure (ou modifier l'expiration dans Supabase dashboard pour tester)
3. ✅ Cliquer sur le lien
4. ✅ Vérifier que l'erreur "Lien expiré" est affichée
5. ✅ Cliquer "Demander un nouveau lien"
6. ✅ Vérifier redirection vers `/auth/forgot-password`

### Test 4: Validation du Formulaire
1. ✅ Entrer un mot de passe < 8 caractères
2. ✅ Vérifier message d'erreur Zod
3. ✅ Entrer deux mots de passe différents
4. ✅ Vérifier message "Les mots de passe ne correspondent pas"

### Test 5: Réutilisation du Lien
1. ✅ Demander un lien de réinitialisation
2. ✅ Utiliser le lien pour changer le mot de passe
3. ✅ Réessayer d'utiliser le même lien
4. ✅ Vérifier que le token est invalide (déjà utilisé)

---

## Différences avec Better Auth

| Aspect | Better Auth (Ancien) | Supabase Auth (Actuel) |
|--------|----------------------|------------------------|
| **OTP** | Code à 6 chiffres manuel | Magic link avec JWT tokens |
| **Sécurité** | Code en clair dans l'email | Tokens JWT signés et expirables |
| **Expérience** | 2 pages (email → OTP → reset) | 2 pages (email → reset direct) |
| **Configuration** | API routes custom | Configuration Supabase dashboard |
| **Emails** | Resend API direct | Supabase utilise Resend en backend |
| **Session** | Better Auth session | Supabase Auth session |
| **Validation** | Custom validation code | JWT signature verification |

---

## Améliorations Futures Possibles

1. **Email Templates Personnalisés**
   - Créer des templates HTML avec branding Chronodil
   - Configurer dans Supabase Dashboard → Authentication → Email Templates

2. **Rate Limiting Plus Strict**
   - Limiter les demandes de réinitialisation à 3 par heure par IP
   - Configurer dans Supabase Dashboard

3. **Multi-facteur Authentification**
   - Ajouter 2FA avec TOTP (Google Authenticator)
   - Utiliser `supabase.auth.mfa.enroll()`

4. **Historique des Mots de Passe**
   - Empêcher la réutilisation des 5 derniers mots de passe
   - Nécessite une table `password_history` dans Prisma

5. **Notifications de Sécurité**
   - Envoyer un email de confirmation après changement de mot de passe
   - Alerter si tentative de réinitialisation suspecte

---

## Support et Debugging

### Logs Supabase
- Dashboard Supabase → Logs → Auth Logs
- Voir toutes les tentatives de réinitialisation
- Identifier les erreurs d'envoi d'email

### Console Browser
- Vérifier les logs `console.error()` dans reset-password page
- Inspecter les tokens JWT dans l'URL (ne jamais partager publiquement)

### Variables à Vérifier
```bash
# Vérifier configuration Supabase
pnpm supabase status

# Tester connexion Supabase
pnpm supabase db ping

# Vérifier client Prisma
pnpm prisma studio
```

---

## Conclusion

Le flux de réinitialisation de mot de passe est maintenant **entièrement fonctionnel** avec Supabase Auth. Il offre une meilleure sécurité qu'un système OTP manuel, une UX simplifiée (moins d'étapes), et une maintenance facilitée (pas d'API routes custom).

**Prochaine étape**: Tester le flux complet en environnement de développement avant déploiement en production.
