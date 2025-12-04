/**
 * Script pour générer les clés VAPID pour les Web Push Notifications
 * 
 * Usage:
 *   pnpm tsx scripts/generate-vapid-keys.ts
 * 
 * Les clés générées doivent être ajoutées au fichier .env :
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key>
 *   VAPID_PRIVATE_KEY=<private_key>
 *   VAPID_SUBJECT=mailto:admin@chronodil.com
 */

import webpush from 'web-push';

console.log('🔐 Génération des clés VAPID pour les Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Clés générées avec succès!\n');
console.log('='.repeat(60));
console.log('\n📝 Ajoutez ces lignes à votre fichier .env :\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@chronodil.com`);
console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANT:');
console.log('   - Ces clés doivent rester secrètes');
console.log('   - La clé publique (NEXT_PUBLIC_*) peut être exposée côté client');
console.log('   - La clé privée (VAPID_PRIVATE_KEY) NE DOIT JAMAIS être exposée');
console.log('   - Redémarrez le serveur après modification du .env');
console.log('\n📖 Documentation: https://github.com/web-push-libs/web-push');
