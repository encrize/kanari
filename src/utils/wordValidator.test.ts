import { describe, it, expect } from 'vitest';
import { validateWordAnswer, normalizeAnswer } from './wordValidator';
import { KanaWord } from '../types/kana';

describe('wordValidator', () => {
  const sampleWord: KanaWord = {
    id: 'w-1',
    k: 'ギター',
    r: 'gitaa',
    e: ['guitar'],
    ru: 'гитара',
    category: 'music',
    acceptedRomaji: ['gita', 'gitaa'],
    acceptedEnglish: ['guitar'],
    explanationEn: 'From English guitar. Standard acoustic or electric guitar.',
    explanationRu: 'Заимствовано из английского.',
  };

  it('normalizes answer with mixed casing and excessive spacing', () => {
    expect(normalizeAnswer('  GUITAR   ')).toBe('guitar');
    expect(normalizeAnswer('GiTaA  ')).toBe('gitaa');
  });

  it('validates correct English answer', () => {
    expect(validateWordAnswer('guitar', sampleWord)).toBe(true);
    expect(validateWordAnswer('  GUITAR  ', sampleWord)).toBe(true);
  });

  it('validates correct romaji answer', () => {
    expect(validateWordAnswer('gitaa', sampleWord)).toBe(true);
    expect(validateWordAnswer('gita', sampleWord)).toBe(true);
  });

  it('rejects incorrect answers', () => {
    expect(validateWordAnswer('piano', sampleWord)).toBe(false);
    expect(validateWordAnswer('gitar', sampleWord)).toBe(false);
    expect(validateWordAnswer('', sampleWord)).toBe(false);
  });

  it('handles multi-word meanings like vocalist, vocal', () => {
    const vocalWord: KanaWord = {
      id: 'w-2',
      k: 'ボーカル',
      r: 'bookaru',
      e: ['vocalist, vocal'],
      acceptedEnglish: ['vocal', 'vocals', 'singer'],
    };
    expect(validateWordAnswer('vocal', vocalWord)).toBe(true);
    expect(validateWordAnswer('vocalist', vocalWord)).toBe(true);
    expect(validateWordAnswer('singer', vocalWord)).toBe(true);
    expect(validateWordAnswer('bookaru', vocalWord)).toBe(true);
  });
});
