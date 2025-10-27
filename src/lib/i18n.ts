import { cookies } from 'next/headers';
import fr from '@/i18n/messages/fr.json';
import en from '@/i18n/messages/en.json';

// ⚡ Next.js 16 + Cache Components compatible i18n system
// N'utilise PAS next-intl getRequestConfig (incompatible)
// Charge les messages directement et utilise next-intl uniquement pour le provider

const DEFAULT_LOCALE = 'fr' as const;
const LOCALE_COOKIE = 'NEXT_LOCALE';

export type Locale = 'fr' | 'en';

const messages = {
  fr,
  en,
} as const;

/**
 * Récupère la locale depuis le cookie (configuré par proxy.ts)
 * Compatible avec Cache Components grâce à "use cache: private"
 * Cette directive permet l'utilisation de cookies() tout en restant performant
 */
export async function getLocale(): Promise<Locale> {
  "use cache: private";
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  return locale || DEFAULT_LOCALE;
}

/**
 * Récupère les messages pour la locale actuelle
 * Les messages sont importés statiquement, donc pas de latence
 */
export async function getMessages(locale?: Locale) {
  const currentLocale = locale || await getLocale();
  return messages[currentLocale];
}

/**
 * Pour les composants qui ont besoin de la locale de manière synchrone
 */
export function getMessagesSync(locale: Locale) {
  return messages[locale];
}

/**
 * Helper pour getTranslations compatible avec next-intl
 * Retourne une fonction pour accéder aux traductions d'un namespace
 */
export async function getTranslations(namespace?: string) {
  const locale = await getLocale();
  const allMessages = messages[locale];

  return (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');
    let value: any = allMessages;

    for (const k of keys) {
      value = value?.[k];
    }

    return value || fullKey;
  };
}
