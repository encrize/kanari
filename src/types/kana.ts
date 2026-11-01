export type ScriptType = 'katakana' | 'hiragana' | 'both';

export interface KanaSymbol {
  kana: string;
  romaji: string[];
  hangul?: string[];
  arabic?: string[];
}

export interface KanaGroup {
  id: string;
  script: 'hiragana' | 'katakana';
  label: string;
  tags?: string[];
  symbols: KanaSymbol[];
}

export interface KanaGroupsData {
  hiragana: KanaGroup[];
  katakana: KanaGroup[];
}

export interface AudioSpriteInfo {
  kana: string;
  romaji: string[];
  startMs: number;
  durationMs: number;
}

export type WordCategory =
  | 'music'
  | 'tech'
  | 'it'
  | 'everyday'
  | 'entertainment'
  | 'food'
  | 'travel';

export interface KanaWord {
  id: number | string;
  k: string; // kana word
  r: string; // romaji
  e: string[]; // english meanings
  ru?: string; // russian meaning
  category?: WordCategory;
  acceptedRomaji?: string[];
  acceptedEnglish?: string[];
  explanationEn?: string;
  explanationRu?: string;
}

export type QuizStageId =
  | 'stage-1'
  | 'stage-2'
  | 'stage-3'
  | 'stage-4'
  | 'stage-5'
  | 'stage-6'
  | 'stage-7'
  | 'stage-8'
  | 'stage-9';

export interface QuizStageMeta {
  id: QuizStageId;
  mechanic:
    | 'choice-romaji'
    | 'choice-kana'
    | 'pair-match'
    | 'type-romaji'
    | 'type-word'
    | 'type-stream'
    | 'listen-choice'
    | 'stroke-order'
    | 'draw-kana';
  stageNumber: number;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  iconName: string;
  wasPaidOnKanaPro: boolean;
}

export type ProficiencyLevel =
  | 'not-studied'
  | 'critical'
  | 'learning'
  | 'good'
  | 'mastered';

export interface CharacterMistake {
  kana: string;
  romaji: string;
  script: 'katakana' | 'hiragana';
  failedCount: number;
  rightCount: number;
  totalAttempts?: number;
  totalResponseTimeMs?: number;
  consecutiveFastCorrect?: number;
  weight?: number; // Adaptive difficulty weight for Weighted Random Sampling / Mini-SRS
  lastAttempt: number;
  recentAttempts?: boolean[];
}

export interface AppStatistics {
  streak: number;
  bestStreak: number;
  lastTrainedDate: string;
  totalAttempts: number;
  correctAttempts: number;
  characters: Record<string, CharacterMistake>;
  completedStagesCount: number;
  dailyGoal: number;
  todayCount: number;
}

export type PreferredFont =
  | 'noto-sans-jp'
  | 'shippori-mincho'
  | 'm-plus-rounded'
  | 'dela-gothic'
  | 'klee-one'
  | 'noto-serif-jp'
  | 'zen-maru-gothic';

export interface AppSettings {
  voice: 'female' | 'male';
  voiceSpeed: number;
  soundEnabled: boolean;
  soundFxEnabled: boolean;
  preferredFont: PreferredFont;
  fontJitterEnabled: boolean;
  jitterFonts: PreferredFont[];
  theme: 'light' | 'dark';
  language: 'ru' | 'en';
  timerEnabled: boolean;
  timerDurationSec: number;
  autoPlayAudio: boolean;
  activeScript: ScriptType;
}

export type PresetType = 'all' | 'lookalikes' | 'combos' | 'weakest';
