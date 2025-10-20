import { getRequestConfig } from 'next-intl/server';

// Langues supportées
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

// Langue par défaut
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ locale }) => {
  // Utiliser la locale fournie ou la locale par défaut
  const currentLocale = (locale || defaultLocale) as Locale;
  
  return {
    locale: currentLocale,
    messages: (await import(`./messages/${currentLocale}.json`)).default,
  };
});

