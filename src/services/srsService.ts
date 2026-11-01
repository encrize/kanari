import {
  KanaSymbol,
  CharacterMistake,
  AppStatistics,
  ScriptType,
  ProficiencyLevel,
  PresetType,
} from '../types/kana';
import { KANA_GROUPS } from '../data/groups';

export class SrsService {
  /**
   * Recency queue buffer to prevent immediate question repetition.
   */
  private recencyQueue: string[] = [];
  private maxRecencySize = 5;

  /**
   * Clear or reset recency queue
   */
  public clearRecencyQueue(): void {
    this.recencyQueue = [];
  }

  /**
   * Calculate proficiency level for a character given user stats
   */
  public calculateProficiency(stat?: CharacterMistake): ProficiencyLevel {
    if (!stat) return 'not-studied';

    const total = stat.totalAttempts || (stat.rightCount + stat.failedCount);
    if (total === 0) return 'not-studied';

    const accuracy = stat.rightCount / total;
    const avgTime = stat.totalResponseTimeMs
      ? stat.totalResponseTimeMs / total
      : 2000;

    // Mastered: high volume, >=95% accuracy, fast (< 1.2s)
    if (total >= 5 && accuracy >= 0.95 && avgTime <= 1200) {
      return 'mastered';
    }

    // Good: >=85% accuracy, reasonable response time (< 2.5s)
    if (accuracy >= 0.85 && avgTime <= 2500) {
      return 'good';
    }

    // Critical: <60% accuracy or slow hesitation (> 4.5s)
    if (accuracy < 0.6 || avgTime > 4500) {
      return 'critical';
    }

    // Learning: in between
    return 'learning';
  }

  /**
   * Weighted random sampling to pick the next question from a candidate pool,
   * avoiding recent items in the recency queue.
   */
  public getNextWeightedKana(
    pool: KanaSymbol[],
    statsMap: Record<string, CharacterMistake>
  ): KanaSymbol {
    if (pool.length === 0) {
      throw new Error('Candidate pool cannot be empty');
    }

    if (pool.length === 1) {
      return pool[0];
    }

    // Filter out recently asked kana if pool has more items than recency buffer
    let eligiblePool = pool.filter((s) => !this.recencyQueue.includes(s.kana));
    if (eligiblePool.length === 0) {
      // If all items are in recency, clear oldest half
      this.recencyQueue = this.recencyQueue.slice(Math.floor(this.maxRecencySize / 2));
      eligiblePool = pool.filter((s) => !this.recencyQueue.includes(s.kana));
      if (eligiblePool.length === 0) eligiblePool = pool;
    }

    // Calculate weights
    const weights: number[] = eligiblePool.map((sym) => {
      const stat = statsMap[sym.kana];
      if (!stat) return 1.0; // Base default weight
      return Math.max(0.1, stat.weight ?? 1.0);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;

    let selected = eligiblePool[0];
    for (let i = 0; i < eligiblePool.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        selected = eligiblePool[i];
        break;
      }
    }

    // Update recency queue
    this.recencyQueue.push(selected.kana);
    if (this.recencyQueue.length > Math.min(this.maxRecencySize, pool.length - 1)) {
      this.recencyQueue.shift();
    }

    return selected;
  }

  /**
   * Look-alikes preset character definitions
   */
  public getLookalikeSymbols(script: ScriptType = 'katakana'): KanaSymbol[] {
    const katakanaPairs = [
      // シ / ツ
      { kana: 'シ', romaji: ['shi', 'si'] },
      { kana: 'ツ', romaji: ['tsu', 'tu'] },
      // ソ / ン
      { kana: 'ソ', romaji: ['so'] },
      { kana: 'ン', romaji: ['n', 'nn'] },
      // ウ / ワ
      { kana: 'ウ', romaji: ['u'] },
      { kana: 'ワ', romaji: ['wa'] },
      // ク / ケ / タ
      { kana: 'ク', romaji: ['ku'] },
      { kana: 'ケ', romaji: ['ke'] },
      { kana: 'タ', romaji: ['ta'] },
      // マ / ム
      { kana: 'マ', romaji: ['ma'] },
      { kana: 'ム', romaji: ['mu'] },
      // ノ / メ / ヌ
      { kana: 'ノ', romaji: ['no'] },
      { kana: 'メ', romaji: ['me'] },
      { kana: 'ヌ', romaji: ['nu'] },
    ];

    const hiraganaPairs = [
      { kana: 'さ', romaji: ['sa'] },
      { kana: 'き', romaji: ['ki'] },
      { kana: 'れ', romaji: ['re'] },
      { kana: 'わ', romaji: ['wa'] },
      { kana: 'ね', romaji: ['ne'] },
      { kana: 'め', romaji: ['me'] },
      { kana: 'ぬ', romaji: ['nu'] },
      { kana: 'ろ', romaji: ['ro'] },
      { kana: 'る', romaji: ['ru'] },
    ];

    if (script === 'hiragana') return hiraganaPairs;
    if (script === 'both') return [...katakanaPairs, ...hiraganaPairs];
    return katakanaPairs;
  }

  /**
   * Combos and modifications (Dakuten, Handakuten, small ッ, small ゃ/ゅ/ょ, yōon)
   */
  public getComboSymbols(script: ScriptType = 'katakana'): KanaSymbol[] {
    const katakanaCombos: KanaSymbol[] = [];
    const hiraganaCombos: KanaSymbol[] = [];

    // Extract from groups data
    for (const group of KANA_GROUPS.katakana) {
      if (
        group.id.includes('dakuten') ||
        group.id.includes('handakuten') ||
        group.id.includes('yoon') ||
        group.id.includes('combo') ||
        group.id.includes('special')
      ) {
        katakanaCombos.push(...group.symbols);
      }
    }

    for (const group of KANA_GROUPS.hiragana) {
      if (
        group.id.includes('dakuten') ||
        group.id.includes('handakuten') ||
        group.id.includes('yoon') ||
        group.id.includes('combo') ||
        group.id.includes('special')
      ) {
        hiraganaCombos.push(...group.symbols);
      }
    }

    if (script === 'hiragana') return hiraganaCombos;
    if (script === 'both') return [...katakanaCombos, ...hiraganaCombos];
    return katakanaCombos.length > 0 ? katakanaCombos : this.getFallbackCombos();
  }

  private getFallbackCombos(): KanaSymbol[] {
    return [
      { kana: 'ガ', romaji: ['ga'] },
      { kana: 'ギ', romaji: ['gi'] },
      { kana: 'グ', romaji: ['gu'] },
      { kana: 'ゲ', romaji: ['ge'] },
      { kana: 'ゴ', romaji: ['go'] },
      { kana: 'ザ', romaji: ['za'] },
      { kana: 'ジ', romaji: ['ji', 'zi'] },
      { kana: 'ズ', romaji: ['zu'] },
      { kana: 'ゼ', romaji: ['ze'] },
      { kana: 'ゾ', romaji: ['zo'] },
      { kana: 'ダ', romaji: ['da'] },
      { kana: 'ヂ', romaji: ['ji', 'di'] },
      { kana: 'ヅ', romaji: ['zu', 'du'] },
      { kana: 'デ', romaji: ['de'] },
      { kana: 'ド', romaji: ['do'] },
      { kana: 'バ', romaji: ['ba'] },
      { kana: 'ビ', romaji: ['bi'] },
      { kana: 'ブ', romaji: ['bu'] },
      { kana: 'ベ', romaji: ['be'] },
      { kana: 'ボ', romaji: ['bo'] },
      { kana: 'パ', romaji: ['pa'] },
      { kana: 'ピ', romaji: ['pi'] },
      { kana: 'プ', romaji: ['pu'] },
      { kana: 'ペ', romaji: ['pe'] },
      { kana: 'ポ', romaji: ['po'] },
      { kana: 'キャ', romaji: ['kya'] },
      { kana: 'キュ', romaji: ['kyu'] },
      { kana: 'キョ', romaji: ['kyo'] },
      { kana: 'シャ', romaji: ['sha'] },
      { kana: 'シュ', romaji: ['shu'] },
      { kana: 'ショ', romaji: ['sho'] },
      { kana: 'チャ', romaji: ['cha'] },
      { kana: 'チュ', romaji: ['chu'] },
      { kana: 'チョ', romaji: ['cho'] },
      { kana: 'ニャ', romaji: ['nya'] },
      { kana: 'ニュ', romaji: ['nyu'] },
      { kana: 'ニョ', romaji: ['nyo'] },
      { kana: 'ヒャ', romaji: ['hya'] },
      { kana: 'ヒュ', romaji: ['hyu'] },
      { kana: 'ヒョ', romaji: ['hyo'] },
      { kana: 'ミャ', romaji: ['mya'] },
      { kana: 'ミュ', romaji: ['myu'] },
      { kana: 'ミョ', romaji: ['myo'] },
      { kana: 'リャ', romaji: ['rya'] },
      { kana: 'リュ', romaji: ['ryu'] },
      { kana: 'リョ', romaji: ['ryo'] },
      { kana: 'ギャ', romaji: ['gya'] },
      { kana: 'ギュ', romaji: ['gyu'] },
      { kana: 'ギョ', romaji: ['gyo'] },
      { kana: 'ジャ', romaji: ['ja', 'jya'] },
      { kana: 'ジュ', romaji: ['ju', 'jyu'] },
      { kana: 'ジョ', romaji: ['jo', 'jyo'] },
      { kana: 'ビャ', romaji: ['bya'] },
      { kana: 'ビュ', romaji: ['byu'] },
      { kana: 'ビョ', romaji: ['byo'] },
      { kana: 'ピャ', romaji: ['pya'] },
      { kana: 'ピュ', romaji: ['pyu'] },
      { kana: 'ピョ', romaji: ['pyo'] },
    ];
  }

  /**
   * Get user's Top 10 weakest characters based on:
   * - Error count / low accuracy
   * - High response time (hesitation)
   * - Mini-SRS weight
   */
  public getWeakestCharacters(
    stats: AppStatistics,
    script: ScriptType = 'katakana',
    limit: number = 10
  ): { symbols: KanaSymbol[]; insufficientData: boolean } {
    let characters = Object.values(stats.characters);

    if (script !== 'both') {
      characters = characters.filter((c) => c.script === script);
    }

    // Filter characters that have at least 1 attempt
    const tested = characters.filter((c) => (c.totalAttempts || (c.rightCount + c.failedCount)) > 0);

    if (tested.length < 3) {
      return { symbols: [], insufficientData: true };
    }

    // Score function prioritizing high weight, low accuracy, high failed count, and slow time
    const sorted = tested.sort((a, b) => {
      const totalA = a.totalAttempts || (a.rightCount + a.failedCount);
      const totalB = b.totalAttempts || (b.rightCount + b.failedCount);
      const accA = a.rightCount / (totalA || 1);
      const accB = b.rightCount / (totalB || 1);
      const weightA = a.weight ?? (1.0 + a.failedCount);
      const weightB = b.weight ?? (1.0 + b.failedCount);

      // Higher weight / lower accuracy ranks first
      return weightB - weightA || accA - accB;
    });

    const topWeak = sorted.slice(0, limit);
    const symbols: KanaSymbol[] = topWeak.map((item) => ({
      kana: item.kana,
      romaji: [item.romaji],
    }));

    return { symbols, insufficientData: false };
  }

  /**
   * Get symbols by preset type
   */
  public getPresetSymbols(
    preset: PresetType,
    script: ScriptType,
    stats: AppStatistics
  ): { symbols: KanaSymbol[]; insufficientData?: boolean } {
    switch (preset) {
      case 'lookalikes':
        return { symbols: this.getLookalikeSymbols(script) };
      case 'combos':
        return { symbols: this.getComboSymbols(script) };
      case 'weakest':
        return this.getWeakestCharacters(stats, script, 10);
      default:
        return { symbols: [] };
    }
  }
}

export const srsService = new SrsService();
