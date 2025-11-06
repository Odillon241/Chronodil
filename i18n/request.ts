import { getRequestConfig } from 'next-intl/server';
import messages from '../src/i18n/messages/fr.json';

// ⚡ Configuration next-intl STATIQUE pour Next.js 16 + React 19
// IMPORTANT: Ce fichier doit être 100% statique (pas de cookies, headers, etc.)
// pour être compatible avec le prerendering

export default getRequestConfig(async () => {
  // Utilise toujours 'fr' de manière statique
  // Le changement de locale dynamique se fait uniquement côté client
  return {
    locale: 'fr',
    messages,
  };
});
