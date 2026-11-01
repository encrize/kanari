import { describe, it, expect } from 'vitest';
import { normalizeRomajiInput, getWordsForSymbols } from './kanaUtils';
import { KanaSymbol } from '../types/kana';

describe('kanaUtils - normalizeRomajiInput', () => {
  it('passes standard english romaji unchanged', () => {
    expect(normalizeRomajiInput('ka')).toBe('ka');
    expect(normalizeRomajiInput('shi')).toBe('shi');
    expect(normalizeRomajiInput('tsu')).toBe('tsu');
  });

  it('converts direct Russian syllable input into romaji', () => {
    expect(normalizeRomajiInput('ка')).toBe('ka');
    expect(normalizeRomajiInput('ки')).toBe('ki');
    expect(normalizeRomajiInput('ши')).toBe('shi');
    expect(normalizeRomajiInput('цу')).toBe('tsu');
    expect(normalizeRomajiInput('то')).toBe('to');
  });

  it('converts Russian keyboard layout typo into English romaji', () => {
    expect(normalizeRomajiInput('лф')).toBe('ka');
    expect(normalizeRomajiInput('ырш')).toBe('shi');
  });
});

describe('kanaUtils - getWordsForSymbols strict filtering', () => {
  it('only returns words consisting of the provided active symbols', () => {
    const active: KanaSymbol[] = [
      { kana: 'ア', romaji: ['a'] },
      { kana: 'イ', romaji: ['i'] },
      { kana: 'ス', romaji: ['su'] },
    ];
    const words = getWordsForSymbols(active, 'katakana', 5);
    const validLetters = new Set(['ア', 'イ', 'ス', 'ー']);
    for (const w of words) {
      for (const ch of Array.from(w.k)) {
        expect(validLetters.has(ch)).toBe(true);
      }
    }
  });
});
