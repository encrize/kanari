import { KANA_GROUPS } from '../data/groups';
import { KANA_STROKES } from '../data/strokes';
import { KANA_WORDS } from '../data/words';
import { KATAKANA_VOCABULARY } from '../data/wordsDatabase';
import { KanaGroup, KanaSymbol, KanaWord, ScriptType } from '../types/kana';

export function getGroupsForScript(script: ScriptType): KanaGroup[] {
  if (script === 'katakana') {
    return KANA_GROUPS.katakana;
  }
  if (script === 'hiragana') {
    return KANA_GROUPS.hiragana;
  }
  return [...KANA_GROUPS.katakana, ...KANA_GROUPS.hiragana];
}

export function getAllSymbols(groups: KanaGroup[]): KanaSymbol[] {
  const map = new Map<string, KanaSymbol>();
  for (const g of groups) {
    for (const sym of g.symbols) {
      if (!map.has(sym.kana)) {
        map.set(sym.kana, sym);
      }
    }
  }
  return Array.from(map.values());
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getMultipleChoiceOptions(
  correctSymbol: KanaSymbol,
  allPool: KanaSymbol[],
  count: number = 4
): KanaSymbol[] {
  const distractors = allPool
    .filter((s) => s.kana !== correctSymbol.kana)
    .slice();
  const shuffledDistractors = shuffleArray(distractors).slice(0, count - 1);
  return shuffleArray([correctSymbol, ...shuffledDistractors]);
}

export function getStrokesForKana(kana: string): string[] | null {
  return KANA_STROKES[kana] || null;
}

/**
 * Keyboard layout map: Russian layout to English QWERTY
 */
const RU_TO_EN_MAP: Record<string, string> = {
  'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p',
  'х': '[', 'ъ': ']', 'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k',
  'д': 'l', 'ж': ';', 'э': "'", 'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm',
  'б': ',', 'ю': '.',
};

const RU_SYLLABLES: Record<string, string> = {
  'ка': 'ka', 'ки': 'ki', 'ку': 'ku', 'ке': 'ke', 'ко': 'ko',
  'са': 'sa', 'ши': 'shi', 'си': 'shi', 'су': 'su', 'се': 'se', 'со': 'so',
  'та': 'ta', 'чи': 'chi', 'ти': 'chi', 'цу': 'tsu', 'те': 'te', 'то': 'to',
  'на': 'na', 'ни': 'ni', 'ну': 'nu', 'не': 'ne', 'но': 'no',
  'ха': 'ha', 'хи': 'hi', 'фу': 'fu', 'ху': 'fu', 'хе': 'he', 'хо': 'ho',
  'ма': 'ma', 'ми': 'mi', 'му': 'mu', 'ме': 'me', 'мо': 'mo',
  'я': 'ya', 'ю': 'yu', 'ё': 'yo', 'йо': 'yo',
  'ра': 'ra', 'ри': 'ri', 'ру': 'ru', 'ре': 're', 'ро': 'ro',
  'ва': 'wa', 'во': 'wo', 'н': 'n',
  'а': 'a', 'и': 'i', 'у': 'u', 'э': 'e', 'е': 'e', 'о': 'o',
  'га': 'ga', 'ги': 'gi', 'гу': 'gu', 'ге': 'ge', 'го': 'go',
  'за': 'za', 'джи': 'ji', 'дзи': 'ji', 'зи': 'ji', 'жи': 'ji', 'зу': 'zu', 'зе': 'ze', 'зо': 'zo',
  'да': 'da', 'де': 'de', 'до': 'do',
  'ба': 'ba', 'би': 'bi', 'бу': 'bu', 'бе': 'be', 'бо': 'bo',
  'па': 'pa', 'пи': 'pi', 'пу': 'pu', 'пе': 'pe', 'по': 'po',
};

/**
 * Normalizes romaji answer, converting Russian Cyrillic syllable equivalents
 * or accidental Russian keyboard layout letters into clean Latin romaji.
 */
export function normalizeRomajiInput(input: string): string {
  const clean = input.trim().toLowerCase();
  if (!clean) return '';

  // Phonetic Cyrillic syllable fallback
  if (RU_SYLLABLES[clean]) {
    return RU_SYLLABLES[clean];
  }

  // Keyboard layout inversion
  let convertedLayout = '';
  let hasRuChar = false;
  for (const ch of clean) {
    if (RU_TO_EN_MAP[ch]) {
      convertedLayout += RU_TO_EN_MAP[ch];
      hasRuChar = true;
    } else {
      convertedLayout += ch;
    }
  }

  if (hasRuChar) {
    return convertedLayout;
  }

  return clean;
}

// Ring buffer tracking recently tested words to prevent frequent repetitions across sessions
const recentWordKeys = new Set<string>();

/**
 * Extracts vocabulary words consisting STRICTLY of the characters in activeSymbols.
 * Prevents unlearned characters from appearing in Word practice and avoids repeating recent words.
 */
export function getWordsForSymbols(
  activeSymbols: KanaSymbol[],
  script: ScriptType,
  count: number = 10,
  excludeWords?: Set<string>
): KanaWord[] {
  const availableKanaSet = new Set(activeSymbols.map((s) => s.kana));
  availableKanaSet.add('ー'); // Long vowel dash is part of katakana words

  // Combine words from KATAKANA_VOCABULARY and KANA_WORDS
  const allVocab = [...KATAKANA_VOCABULARY, ...KANA_WORDS];
  const uniqueVocabMap = new Map<string, KanaWord>();
  for (const w of allVocab) {
    if (!uniqueVocabMap.has(w.k)) {
      uniqueVocabMap.set(w.k, w);
    }
  }
  const allVocabList = Array.from(uniqueVocabMap.values());

  // Strictly filter words where EVERY character is in availableKanaSet
  const strictWords = allVocabList.filter((w) => {
    return Array.from(w.k).every((c) => availableKanaSet.has(c));
  });

  if (strictWords.length > 0) {
    // Partition into fresh (unseen recently) and seen
    const unseen = strictWords.filter(
      (w) => !recentWordKeys.has(w.k) && (!excludeWords || !excludeWords.has(w.k))
    );
    const seen = strictWords.filter((w) => !unseen.includes(w));

    let chosen: KanaWord[] = [];
    if (unseen.length >= count) {
      chosen = shuffleArray(unseen).slice(0, count);
    } else {
      chosen = [...shuffleArray(unseen), ...shuffleArray(seen)];
      while (chosen.length < count) {
        chosen = chosen.concat(shuffleArray(strictWords));
      }
      chosen = chosen.slice(0, count);
    }

    // Update recentWordKeys ring buffer
    for (const w of chosen) {
      recentWordKeys.add(w.k);
    }
    if (recentWordKeys.size > 80) {
      const excess = recentWordKeys.size - 60;
      let removed = 0;
      for (const k of recentWordKeys) {
        if (removed >= excess) break;
        recentWordKeys.delete(k);
        removed++;
      }
    }

    return chosen;
  }

  // If user only selected 1 or 2 characters and no complete words exist yet in dictionary:
  // Sort vocabulary by highest percentage of known characters
  const partial = allVocabList
    .map((w) => {
      const chars = Array.from(w.k);
      const knownCount = chars.filter((c) => availableKanaSet.has(c)).length;
      return { word: w, ratio: knownCount / Math.max(1, chars.length) };
    })
    .filter((item) => item.ratio > 0);

  partial.sort((a, b) => b.ratio - a.ratio);
  return partial.slice(0, count).map((p) => p.word);
}
