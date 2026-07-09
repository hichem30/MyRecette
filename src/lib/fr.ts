// Simple French translation helper - replaces next-intl
import { FR, getText as getFrenchText } from './constants/fr-complete';

// Type-safe get translation function with interpolation support
export function t(key: string, params?: Record<string, string | number>): string {
  let text = getFrenchText(key);
  
  // Replace placeholders like {email}, {count}, etc.
  if (params) {
    for (const [placeholder, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\${'{'}${placeholder}\${'}'}`, 'g'), String(value));
    }
  }
  
  return text;
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

// Client-side hook to replace useLocale from next-intl
export function useLocale(): string {
  // In single language mode, always return 'fr'
  return 'fr';
}

// Client-side hook to replace useTranslations from next-intl
// Returns a function for backward compatibility with next-intl
export function useTranslations(namespace?: string): (key: string, params?: Record<string, string | number>) => string {
  // Return a function that prepends the namespace
  return (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, params);
  };
}

// Replace unstable_setRequestLocale
export const unstable_setRequestLocale = setRequestLocale;

// Server-side function to replace getLocale from next-intl/server
export function getLocale(): string {
  // In single language mode, always return 'fr'
  return 'fr';
}

// Direct access to French constants
export { FR };
export default FR;