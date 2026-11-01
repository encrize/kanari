import en from '../locales/en.json';
import ru from '../locales/ru.json';

export type Language = 'en' | 'ru';

export const LOCALES: Record<Language, typeof en> = {
  en,
  ru: ru as typeof en,
};

export function getTranslation(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const dictionary = LOCALES[lang] || LOCALES.en;
  const keys = path.split('.');
  let current: any = dictionary;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      let fallback: any = LOCALES.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  if (!params) return current;

  return current.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}
