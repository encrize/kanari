import { KanaWord } from '../types/kana';
import { normalizeRomajiInput } from './kanaUtils';

/**
 * Normalizes user input by trimming whitespace and converting to lowercase.
 */
export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Validates user's answer for a katakana vocabulary word.
 * Accepts:
 * - Direct romaji matches (e.g. 'gitaa', 'gita')
 * - Accepted English equivalents (e.g. 'guitar')
 * - English meanings in word.e
 * - Russian keyboard layout conversions
 * - Matching after removing hyphens/spaces
 */
export function validateWordAnswer(input: string, word: KanaWord): boolean {
  const normalized = normalizeAnswer(input);
  if (!normalized) return false;

  const candidateAnswers: string[] = [
    normalizeAnswer(word.r),
    ...(word.acceptedRomaji || []).map(normalizeAnswer),
    ...(word.acceptedEnglish || []).map(normalizeAnswer),
    ...(word.e || []).map(normalizeAnswer),
  ];

  // Also include Russian meaning if available
  if (word.ru) {
    candidateAnswers.push(...word.ru.split(',').map((p) => normalizeAnswer(p)));
  }

  // Also include comma-split words from meanings, e.g. "vocalist, vocal" -> ["vocalist", "vocal"]
  for (const eng of word.e || []) {
    const parts = eng.split(',').map((p) => normalizeAnswer(p));
    candidateAnswers.push(...parts);
  }

  // Exact match against candidates
  if (candidateAnswers.includes(normalized)) {
    return true;
  }

  // Check normalized romaji layout inversion (e.g. Russian keyboard typing)
  const convertedLayout = normalizeRomajiInput(normalized);
  if (candidateAnswers.includes(convertedLayout)) {
    return true;
  }

  // Also match ignoring hyphens/apostrophes (e.g. "t-shirt" vs "tshirt")
  const strippedInput = normalized.replace(/[-'’ ]/g, '');
  const matchesStripped = candidateAnswers.some(
    (c) => c.replace(/[-'’ ]/g, '') === strippedInput
  );

  return matchesStripped;
}
