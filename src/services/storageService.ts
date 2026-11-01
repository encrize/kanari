import { AppSettings, AppStatistics, CharacterMistake, ScriptType } from '../types/kana';
import { getGroupsForScript } from '../utils/kanaUtils';

const SETTINGS_KEY = 'kanari_settings_v3';
const STATS_KEY = 'kanari_stats_v3';

export const DEFAULT_SETTINGS: AppSettings = {
  voice: 'female',
  voiceSpeed: 1.0,
  soundEnabled: true,
  soundFxEnabled: true,
  preferredFont: 'noto-sans-jp',
  fontJitterEnabled: false,
  jitterFonts: ['noto-sans-jp', 'shippori-mincho', 'm-plus-rounded', 'dela-gothic', 'klee-one'],
  theme: 'light',
  language: 'en', // Default language is English as requested
  timerEnabled: false,
  timerDurationSec: 10,
  autoPlayAudio: true,
  activeScript: 'katakana', // Katakana prioritized
};

export const DEFAULT_STATS: AppStatistics = {
  streak: 0,
  bestStreak: 0,
  lastTrainedDate: '',
  totalAttempts: 0,
  correctAttempts: 0,
  characters: {},
  completedStagesCount: 0,
  dailyGoal: 30,
  todayCount: 0,
};

class StorageService {
  public loadSettings(): AppSettings {
    try {
      let data = localStorage.getItem(SETTINGS_KEY);
      if (!data) data = localStorage.getItem('kana_pro_free_settings_v2');
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public loadSelectedGroups(script: ScriptType): string[] {
    try {
      const key = `kanari_selected_groups_${script}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const defaultGroups = getGroupsForScript(script === 'both' ? 'katakana' : script);
    return defaultGroups.slice(0, 5).map((g) => g.id);
  }

  public saveSelectedGroups(script: ScriptType, groupIds: string[]): void {
    try {
      const key = `kanari_selected_groups_${script}`;
      localStorage.setItem(key, JSON.stringify(groupIds));
    } catch {
      // ignore
    }
  }

  public loadStats(): AppStatistics {
    try {
      let data = localStorage.getItem(STATS_KEY);
      if (!data) data = localStorage.getItem('kana_pro_free_stats_v1');
      if (!data) return DEFAULT_STATS;
      const parsed: AppStatistics = JSON.parse(data);

      // Check daily reset
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.lastTrainedDate !== today) {
        // Check if yesterday was trained for streak continuity
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (parsed.lastTrainedDate !== yesterday && parsed.lastTrainedDate !== today) {
          parsed.streak = 0;
        }
        parsed.todayCount = 0;
      }

      return { ...DEFAULT_STATS, ...parsed };
    } catch {
      return DEFAULT_STATS;
    }
  }

  public saveStats(stats: AppStatistics): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }

  public recordAttempt(
    kana: string,
    romaji: string,
    script: 'katakana' | 'hiragana',
    isCorrect: boolean,
    responseTimeMs: number = 2000
  ): AppStatistics {
    const stats = this.loadStats();
    const today = new Date().toISOString().slice(0, 10);

    // Update streak if today is first practice today
    if (stats.lastTrainedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (stats.lastTrainedDate === yesterday) {
        stats.streak += 1;
      } else {
        stats.streak = 1;
      }
      stats.lastTrainedDate = today;
      stats.todayCount = 0;
    }

    if (stats.streak > stats.bestStreak) {
      stats.bestStreak = stats.streak;
    }

    stats.totalAttempts += 1;
    stats.todayCount += 1;
    if (isCorrect) stats.correctAttempts += 1;

    // Track character history with Mini-SRS weights
    const existing: CharacterMistake = stats.characters[kana] || {
      kana,
      romaji,
      script,
      failedCount: 0,
      rightCount: 0,
      totalAttempts: 0,
      totalResponseTimeMs: 0,
      consecutiveFastCorrect: 0,
      weight: 1.0,
      lastAttempt: Date.now(),
      recentAttempts: [],
    };

    const currentAttempts = (existing.totalAttempts || (existing.rightCount + existing.failedCount)) + 1;
    const currentTotalTime = (existing.totalResponseTimeMs || (currentAttempts - 1) * 2000) + responseTimeMs;
    const currentRecent = [...(existing.recentAttempts || []).slice(-9), isCorrect];

    let currentWeight = existing.weight ?? 1.0;
    let consecutiveFast = existing.consecutiveFastCorrect ?? 0;

    if (!isCorrect) {
      existing.failedCount += 1;
      consecutiveFast = 0;
      // Mistake penalty: multiply weight by 2.5 (capped at 10.0)
      currentWeight = Math.min(10.0, currentWeight * 2.5);
    } else {
      existing.rightCount += 1;
      if (responseTimeMs < 1000) {
        consecutiveFast += 1;
        if (consecutiveFast >= 3) {
          // Three consecutive fast answers under 1s reduces weight drastically to 0.3
          currentWeight = Math.max(0.2, currentWeight * 0.3);
        } else {
          currentWeight = Math.max(0.4, currentWeight * 0.85);
        }
      } else if (responseTimeMs > 4000) {
        // Hesitation (>4s) increases weight
        consecutiveFast = 0;
        currentWeight = Math.min(6.0, currentWeight * 1.5);
      } else {
        consecutiveFast = 0;
        currentWeight = Math.max(0.5, currentWeight * 0.9);
      }
    }

    existing.totalAttempts = currentAttempts;
    existing.totalResponseTimeMs = currentTotalTime;
    existing.consecutiveFastCorrect = consecutiveFast;
    existing.weight = Number(currentWeight.toFixed(2));
    existing.lastAttempt = Date.now();
    existing.recentAttempts = currentRecent;

    stats.characters[kana] = existing;

    this.saveStats(stats);
    return stats;
  }

  public recordStageCompleted(): AppStatistics {
    const stats = this.loadStats();
    stats.completedStagesCount += 1;
    this.saveStats(stats);
    return stats;
  }

  public getMostFailedCharacters(script?: ScriptType): CharacterMistake[] {
    const stats = this.loadStats();
    let list = Object.values(stats.characters).filter((c) => c.failedCount > 0);

    if (script && script !== 'both') {
      list = list.filter((c) => c.script === script);
    }

    // Sort by failed count descending, then by weight descending
    return list.sort((a, b) => (b.weight ?? b.failedCount) - (a.weight ?? a.failedCount));
  }

  public exportBackup(): string {
    const backup = {
      version: '2.0.0',
      appName: 'kana-pro-free',
      exportedAt: new Date().toISOString(),
      settings: this.loadSettings(),
      stats: this.loadStats(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackup(jsonStr: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid JSON file format' };
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      if (data.stats && typeof data.stats === 'object') {
        this.saveStats({ ...DEFAULT_STATS, ...data.stats });
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON file' };
    }
  }

  public resetAllProgress(): void {
    try {
      localStorage.removeItem(STATS_KEY);
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();
