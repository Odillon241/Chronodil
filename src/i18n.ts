// ⚡ Configuration next-intl compatible avec Cache Components
// IMPORTANT: Cette config est 100% STATIQUE (pas de cookies, pas de headers)
// La locale est hardcodée à 'fr' pour le SSR
// Le client gérera la locale dynamique via proxy.ts et localStorage

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Configuration statique pour Cache Components
  // On hardcode 'fr' - le client mettra à jour si nécessaire
  const locale = 'fr';

  // Import statique des messages - pas de latence
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
