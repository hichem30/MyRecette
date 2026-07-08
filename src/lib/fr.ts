// Simple French translation helper - replaces next-intl
import { FR, getText as getFrenchText } from './constants/fr-complete';

// Type-safe get translation function
export function t(key: string): string {
  return getFrenchText(key);
}

// Replace setRequestLocale - no op in single language mode
export function setRequestLocale(_locale: string): void {
  // No-op - we only support French
}

// Replace getTranslations - return namespace from FR
export function getTranslations(namespace: string) {
  return {
    t: (key: string) => {
      const fullKey = `${namespace}.${key}`;
      return t(fullKey);
    },
    raw: (key: string) => {
      const fullKey = `${namespace}.${key}`;
      return t(fullKey);
    }
  };
}

// Replace unstable_setRequestLocale
export const unstable_setRequestLocale = setRequestLocale;

// Direct access to French constants
export { FR };
export default FR;