/**
 * Système de traduction statique simple pour remplacer next-intl
 * Compatible avec Next.js 16 et son prerendering
 */

import messages from '@/i18n/messages/fr.json';

type Messages = typeof messages;
type NestedKeys<T, P extends string = ''> = T extends object
  ? { [K in keyof T]: NestedKeys<T[K], `${P}${P extends '' ? '' : '.'}${K & string}`> }[keyof T]
  : P;

type TranslationKey = NestedKeys<Messages>;

/**
 * Récupère une traduction par sa clé (format: "namespace.key" ou "namespace.nested.key")
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = messages;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation key is not a string: ${key}`);
    return key;
  }

  // Remplacer les paramètres {param} par leurs valeurs
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, param) => {
      return params[param]?.toString() ?? `{${param}}`;
    });
  }

  return value;
}

/**
 * Crée une fonction de traduction avec un namespace préfixé
 * Usage: const t = createTranslator('navigation'); t('dashboard') => 'Tableau de bord'
 */
export function createTranslator(namespace?: string) {
  return (key: string, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, params);
  };
}

/**
 * Hook pour utiliser les traductions dans les composants React
 * Remplace useTranslations de next-intl
 */
export function useT(namespace?: string) {
  return createTranslator(namespace);
}

// Alias pour compatibilité
export const useTranslations = useT;

// Export des messages pour un accès direct si nécessaire
export { messages };
