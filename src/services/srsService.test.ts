import { describe, it, expect, beforeEach } from 'vitest';
import { srsService } from './srsService';
import { KanaSymbol, CharacterMistake, AppStatistics } from '../types/kana';

describe('SrsService - Intelligent SRS and Presets', () => {
  beforeEach(() => {
    srsService.clearRecencyQueue();
  });

  describe('calculateProficiency', () => {
    it('returns not-studied if no stats exist or 0 attempts', () => {
      expect(srsService.calculateProficiency(undefined)).toBe('not-studied');

      const stat: CharacterMistake = {
        kana: 'ア',
        romaji: 'a',
        script: 'katakana',
        failedCount: 0,
        rightCount: 0,
        totalAttempts: 0,
        lastAttempt: Date.now(),
      };
      expect(srsService.calculateProficiency(stat)).toBe('not-studied');
    });

    it('returns critical if accuracy is below 60%', () => {
      const stat: CharacterMistake = {
        kana: 'シ',
        romaji: 'shi',
        script: 'katakana',
        failedCount: 4,
        rightCount: 1, // 20%
        totalAttempts: 5,
        totalResponseTimeMs: 10000,
        lastAttempt: Date.now(),
      };
      expect(srsService.calculateProficiency(stat)).toBe('critical');
    });

    it('returns critical if average response time is over 4500ms', () => {
      const stat: CharacterMistake = {
        kana: 'ツ',
        romaji: 'tsu',
        script: 'katakana',
        failedCount: 0,
        rightCount: 4,
        totalAttempts: 4,
        totalResponseTimeMs: 20000, // 5000ms avg
        lastAttempt: Date.now(),
      };
      expect(srsService.calculateProficiency(stat)).toBe('critical');
    });

    it('returns learning for moderate accuracy (60-84%)', () => {
      const stat: CharacterMistake = {
        kana: 'カ',
        romaji: 'ka',
        script: 'katakana',
        failedCount: 1,
        rightCount: 3, // 75%
        totalAttempts: 4,
        totalResponseTimeMs: 8000, // 2000ms avg
        lastAttempt: Date.now(),
      };
      expect(srsService.calculateProficiency(stat)).toBe('learning');
    });

    it('returns good for high accuracy (>=85%) and reasonable time', () => {
      const stat: CharacterMistake = {
        kana: 'サ',
        romaji: 'sa',
        script: 'katakana',
        failedCount: 0,
        rightCount: 4,
        totalAttempts: 4,
        totalResponseTimeMs: 6000, // 1500ms avg
        lastAttempt: Date.now(),
      };
      expect(srsService.calculateProficiency(stat)).toBe('good');
    });

    it('returns mastered for >=5 attempts, >=95% accuracy, and fast response (<=1200ms)', () => {
      const stat: CharacterMistake = {
        kana: 'ナ',
        romaji: 'na',
        script: 'katakana',
        failedCount: 0,
        rightCount: 8,
        totalAttempts: 8,
        totalResponseTimeMs: 7200, // 900ms avg
        lastAttempt: Date.now(),
      };
      expect(srsService.calculateProficiency(stat)).toBe('mastered');
    });
  });

  describe('getNextWeightedKana', () => {
    const pool: KanaSymbol[] = [
      { kana: 'ア', romaji: ['a'] },
      { kana: 'イ', romaji: ['i'] },
      { kana: 'ウ', romaji: ['u'] },
      { kana: 'エ', romaji: ['e'] },
      { kana: 'オ', romaji: ['o'] },
    ];

    it('returns a symbol from the candidate pool', () => {
      const statsMap: Record<string, CharacterMistake> = {};
      const picked = srsService.getNextWeightedKana(pool, statsMap);
      expect(pool.some((p) => p.kana === picked.kana)).toBe(true);
    });

    it('prioritizes characters with higher difficulty weight', () => {
      const statsMap: Record<string, CharacterMistake> = {
        ア: {
          kana: 'ア',
          romaji: 'a',
          script: 'katakana',
          failedCount: 10,
          rightCount: 1,
          weight: 9.9, // Very high weight
          lastAttempt: Date.now(),
        },
        イ: {
          kana: 'イ',
          romaji: 'i',
          script: 'katakana',
          failedCount: 0,
          rightCount: 10,
          weight: 0.2, // Very low weight
          lastAttempt: Date.now(),
        },
      };

      const miniPool = [pool[0], pool[1]]; // ア and イ
      let aCount = 0;
      for (let i = 0; i < 50; i++) {
        srsService.clearRecencyQueue();
        const picked = srsService.getNextWeightedKana(miniPool, statsMap);
        if (picked.kana === 'ア') aCount++;
      }

      // 'ア' has 9.9 weight vs 'イ' with 0.2, so 'ア' should appear significantly more often
      expect(aCount).toBeGreaterThan(35);
    });

    it('avoids immediate question repetition via recency buffer', () => {
      const statsMap: Record<string, CharacterMistake> = {};
      const first = srsService.getNextWeightedKana(pool, statsMap);
      const second = srsService.getNextWeightedKana(pool, statsMap);

      // Second should not immediately repeat first because pool has 5 items
      expect(second.kana).not.toBe(first.kana);
    });
  });

  describe('getLookalikeSymbols', () => {
    it('returns katakana lookalike pairs including シ, ツ, ソ, ン', () => {
      const lookalikes = srsService.getLookalikeSymbols('katakana');
      const kanas = lookalikes.map((s) => s.kana);
      expect(kanas).toContain('シ');
      expect(kanas).toContain('ツ');
      expect(kanas).toContain('ソ');
      expect(kanas).toContain('ン');
      expect(kanas).toContain('ウ');
      expect(kanas).toContain('ワ');
      expect(kanas).toContain('ク');
      expect(kanas).toContain('ケ');
      expect(kanas).toContain('タ');
      expect(kanas).toContain('マ');
      expect(kanas).toContain('ム');
    });
  });

  describe('getWeakestCharacters', () => {
    it('signals insufficientData if fewer than 3 characters have attempts', () => {
      const emptyStats: AppStatistics = {
        streak: 0,
        bestStreak: 0,
        lastTrainedDate: '',
        totalAttempts: 1,
        correctAttempts: 1,
        characters: {
          ア: {
            kana: 'ア',
            romaji: 'a',
            script: 'katakana',
            failedCount: 0,
            rightCount: 1,
            totalAttempts: 1,
            lastAttempt: Date.now(),
          },
        },
        completedStagesCount: 0,
        dailyGoal: 30,
        todayCount: 1,
      };

      const result = srsService.getWeakestCharacters(emptyStats, 'katakana', 10);
      expect(result.insufficientData).toBe(true);
      expect(result.symbols).toHaveLength(0);
    });

    it('extracts top 10 weakest characters based on weight and errors', () => {
      const mockStats: AppStatistics = {
        streak: 2,
        bestStreak: 2,
        lastTrainedDate: '2026-11-01',
        totalAttempts: 20,
        correctAttempts: 12,
        characters: {
          シ: {
            kana: 'シ',
            romaji: 'shi',
            script: 'katakana',
            failedCount: 5,
            rightCount: 1,
            weight: 6.2,
            totalAttempts: 6,
            lastAttempt: Date.now(),
          },
          ツ: {
            kana: 'ツ',
            romaji: 'tsu',
            script: 'katakana',
            failedCount: 4,
            rightCount: 2,
            weight: 4.8,
            totalAttempts: 6,
            lastAttempt: Date.now(),
          },
          ン: {
            kana: 'ン',
            romaji: 'n',
            script: 'katakana',
            failedCount: 3,
            rightCount: 2,
            weight: 3.5,
            totalAttempts: 5,
            lastAttempt: Date.now(),
          },
          ア: {
            kana: 'ア',
            romaji: 'a',
            script: 'katakana',
            failedCount: 0,
            rightCount: 5,
            weight: 0.3,
            totalAttempts: 5,
            lastAttempt: Date.now(),
          },
        },
        completedStagesCount: 2,
        dailyGoal: 30,
        todayCount: 10,
      };

      const result = srsService.getWeakestCharacters(mockStats, 'katakana', 10);
      expect(result.insufficientData).toBe(false);
      expect(result.symbols.length).toBeGreaterThanOrEqual(3);
      // 'シ' has highest weight so should be first
      expect(result.symbols[0].kana).toBe('シ');
    });
  });
});
