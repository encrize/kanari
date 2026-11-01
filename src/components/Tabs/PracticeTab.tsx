import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  Shuffle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  AppSettings,
  AppStatistics,
  CharacterMistake,
  KanaSymbol,
  KanaWord,
  QuizStageId,
  PresetType,
} from '../../types/kana';
import { getGroupsForScript, getAllSymbols, getWordsForSymbols } from '../../utils/kanaUtils';
import { storageService } from '../../services/storageService';
import { srsService } from '../../services/srsService';
import { audioService } from '../../services/audioService';
import { StageSelectorBar } from '../Practice/StageSelectorBar';
import { GroupSelectorModal } from '../Practice/GroupSelectorModal';
import { StageChoiceRomaji } from '../Practice/StageChoiceRomaji';
import { StageChoiceKana } from '../Practice/StageChoiceKana';
import { StagePairMatch } from '../Practice/StagePairMatch';
import { StageTypeRomaji } from '../Practice/StageTypeRomaji';
import { StageTypeWord } from '../Practice/StageTypeWord';
import { StageTypeStream } from '../Practice/StageTypeStream';
import { StageListenChoice } from '../Practice/StageListenChoice';
import { StageStrokeOrder } from '../Practice/StageStrokeOrder';
import { StageDrawKana } from '../Practice/StageDrawKana';
import { SessionCompleteModal } from '../Practice/SessionCompleteModal';
import { ALL_QUIZ_STAGES } from '../../data/stages';
import { TRANSLATIONS } from '../../data/translations';
import { getTranslation } from '../../services/i18n';

interface PracticeTabProps {
  settings: AppSettings;
  stats: AppStatistics;
  onUpdateStats: (newStats: AppStatistics) => void;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  forcedPracticeCharacters?: string[]; // If coming from "Practice Mistakes"
}

export const PracticeTab: React.FC<PracticeTabProps> = ({
  settings,
  stats,
  onUpdateStats,
  onUpdateSettings,
  forcedPracticeCharacters,
}) => {
  const isEn = settings.language === 'en';
  const t = TRANSLATIONS[settings.language];
  const [currentStageId, setCurrentStageId] = useState<QuizStageId>('stage-1');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetType>('all');
  const [insufficientWeakestData, setInsufficientWeakestData] = useState(false);

  // Question response timer and font jitter
  const questionStartTimeRef = useRef<number>(Date.now());
  const [jitterFontClass, setJitterFontClass] = useState<string>('');

  // Persistent selected groups for Katakana or Hiragana
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
    return storageService.loadSelectedGroups(settings.activeScript);
  });

  const handleUpdateGroupIds = (newIds: string[]) => {
    setSelectedGroupIds(newIds);
    storageService.saveSelectedGroups(settings.activeScript, newIds);
  };

  // Restore saved selected groups if script changes
  useEffect(() => {
    const saved = storageService.loadSelectedGroups(settings.activeScript);
    setSelectedGroupIds(saved);
  }, [settings.activeScript]);

  // Active pool of symbols, factoring in presets
  const activeSymbols = useMemo(() => {
    // 1. If forced practice characters (from Mistakes click)
    if (forcedPracticeCharacters && forcedPracticeCharacters.length > 0) {
      const allSyms = getAllSymbols(getGroupsForScript(settings.activeScript));
      const filtered = allSyms.filter((s) => forcedPracticeCharacters.includes(s.kana));
      if (filtered.length > 0) return filtered;
    }

    // 2. If a smart learning preset is chosen
    if (activePreset !== 'all') {
      const res = srsService.getPresetSymbols(activePreset, settings.activeScript, stats);
      if (res.insufficientData) {
        setInsufficientWeakestData(true);
      } else {
        setInsufficientWeakestData(false);
        if (res.symbols.length > 0) return res.symbols;
      }
    } else {
      setInsufficientWeakestData(false);
    }

    // 3. Normal group selection
    const groups = getGroupsForScript(settings.activeScript);
    const chosenGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
    const symbols = getAllSymbols(chosenGroups);
    return symbols.length > 0 ? symbols : getAllSymbols(groups.slice(0, 1));
  }, [settings.activeScript, selectedGroupIds, forcedPracticeCharacters, activePreset]);

  // Session state
  const SESSION_LENGTH = 10;
  const [sessionQueue, setSessionQueue] = useState<KanaSymbol[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [questionStep, setQuestionStep] = useState(0);
  const [masteryScore, setMasteryScore] = useState(0);
  const [correctInSession, setCorrectInSession] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState<CharacterMistake[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Words queue for Stage 5
  const [sessionWords, setSessionWords] = useState<KanaWord[]>(() => {
    return getWordsForSymbols(activeSymbols, settings.activeScript, SESSION_LENGTH);
  });
  const [wordQueueIndex, setWordQueueIndex] = useState(0);

  // Font Jitter assignment
  const assignJitterFont = () => {
    if (!settings.fontJitterEnabled || !settings.jitterFonts || settings.jitterFonts.length === 0) {
      setJitterFontClass('');
      return;
    }
    const randomIndex = Math.floor(Math.random() * settings.jitterFonts.length);
    const font = settings.jitterFonts[randomIndex];
    const map: Record<string, string> = {
      'noto-sans-jp': 'font-noto-sans',
      'shippori-mincho': 'font-shippori-mincho',
      'm-plus-rounded': 'font-m-plus-rounded',
      'dela-gothic': 'font-dela-gothic',
      'klee-one': 'font-klee-one',
      'noto-serif-jp': 'font-noto-serif',
      'zen-maru-gothic': 'font-zen-maru',
    };
    setJitterFontClass(map[font] || '');
  };

  // Initialize or restart session using Adaptive Weighted SRS
  const startNewSession = () => {
    srsService.clearRecencyQueue();
    let queue: KanaSymbol[] = [];

    if (activeSymbols.length > 0) {
      for (let i = 0; i < SESSION_LENGTH; i++) {
        const sym = srsService.getNextWeightedKana(activeSymbols, stats.characters);
        queue.push(sym);
      }
    }

    // Generate a fresh, unrepeated batch of vocabulary words for Stage 5
    const freshWords = getWordsForSymbols(activeSymbols, settings.activeScript, SESSION_LENGTH);
    setSessionWords(freshWords);

    setSessionQueue(queue);
    setQueueIndex(0);
    setWordQueueIndex(0);
    setQuestionStep(0);
    setMasteryScore(0);
    setCorrectInSession(0);
    setSessionMistakes([]);
    setIsSessionComplete(false);
    setCurrentStreak(0);
    questionStartTimeRef.current = Date.now();
    assignJitterFont();
  };

  // Only restart session when user intentionally changes script, groups, preset, stage, or forced characters.
  const groupsKey = selectedGroupIds.slice().sort().join(',');
  const forcedKey = forcedPracticeCharacters ? forcedPracticeCharacters.join(',') : '';

  useEffect(() => {
    startNewSession();
  }, [settings.activeScript, groupsKey, activePreset, currentStageId, forcedKey]);

  const currentSymbol = sessionQueue[queueIndex] || sessionQueue[sessionQueue.length - 1] || activeSymbols[0];
  const currentWord = sessionWords[wordQueueIndex] || sessionWords[sessionWords.length - 1] || sessionWords[0];

  // Detect whether this character is being encountered for the very first time
  const charStat = currentSymbol ? stats.characters[currentSymbol.kana] : undefined;
  const isFirstTime =
    !charStat ||
    ((charStat.totalAttempts || ((charStat.rightCount || 0) + (charStat.failedCount || 0))) === 0);

  const handleAnswer = (isCorrect: boolean) => {
    const responseTimeMs = Math.max(200, Date.now() - questionStartTimeRef.current);
    const script = settings.activeScript === 'katakana' ? 'katakana' : 'hiragana';

    // Record attempt with intelligent Mini-SRS difficulty weighting & response timing
    const updatedStats = storageService.recordAttempt(
      currentSymbol.kana,
      currentSymbol.romaji[0],
      script,
      isCorrect,
      responseTimeMs
    );
    onUpdateStats(updatedStats);

    if (isCorrect) {
      setCorrectInSession((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);
      const nextScore = masteryScore + 1;
      setMasteryScore(nextScore);

      // Session complete when user achieves SESSION_LENGTH net correct answers
      if (nextScore >= SESSION_LENGTH) {
        const s = storageService.recordStageCompleted();
        onUpdateStats(s);
        setIsSessionComplete(true);
        return;
      }
    } else {
      setCurrentStreak(0);
      // Progress retreats backward on mistake as requested (capped at 0)
      setMasteryScore((prev) => Math.max(0, prev - 1));

      setSessionMistakes((prev) => {
        if (prev.some((m) => m.kana === currentSymbol.kana)) return prev;
        return [
          ...prev,
          {
            kana: currentSymbol.kana,
            romaji: currentSymbol.romaji[0],
            script,
            failedCount: 1,
            rightCount: 0,
            lastAttempt: Date.now(),
          },
        ];
      });

      // Re-queue the missed item so the user practices it again
      setSessionQueue((prev) => [...prev, currentSymbol]);
      if (currentStageId === 'stage-5' && currentWord) {
        setSessionWords((prev) => [...prev, currentWord]);
      }
    }

    // Always advance question step (forces new key and fresh component)
    setQuestionStep((prev) => prev + 1);

    // Advance queue index and replenish if running low
    setQueueIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx >= sessionQueue.length - 2 && activeSymbols.length > 0) {
        const moreSymbols: KanaSymbol[] = [];
        for (let i = 0; i < 5; i++) {
          moreSymbols.push(srsService.getNextWeightedKana(activeSymbols, stats.characters));
        }
        setSessionQueue((q) => [...q, ...moreSymbols]);
      }
      return nextIdx;
    });

    if (currentStageId === 'stage-5') {
      setWordQueueIndex((prev) => {
        const nextIdx = prev + 1;
        if (nextIdx >= sessionWords.length - 2 && activeSymbols.length > 0) {
          const moreWords = getWordsForSymbols(activeSymbols, settings.activeScript, 5);
          setSessionWords((w) => [...w, ...moreWords]);
        }
        return nextIdx;
      });
    }

    questionStartTimeRef.current = Date.now();
    assignJitterFont();
  };

  const handleNextStage = () => {
    const stageIdx = ALL_QUIZ_STAGES.findIndex((s) => s.id === currentStageId);
    const nextIdx = (stageIdx + 1) % ALL_QUIZ_STAGES.length;
    setCurrentStageId(ALL_QUIZ_STAGES[nextIdx].id);
  };

  // Global keyboard shortcuts (Space for audio, Esc for restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (currentSymbol) {
          audioService.playKana(currentSymbol.kana);
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        startNewSession();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSymbol]);

  const currentStageMeta = ALL_QUIZ_STAGES.find((s) => s.id === currentStageId)!;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Script & Presets Header Bar */}
      <div className="flex flex-col gap-3 mb-6 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Script pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              onClick={() =>
                onUpdateSettings((prev) => ({ ...prev, activeScript: 'katakana' }))
              }
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                settings.activeScript === 'katakana'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.scriptKatakana}
            </button>

            <button
              onClick={() =>
                onUpdateSettings((prev) => ({ ...prev, activeScript: 'hiragana' }))
              }
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                settings.activeScript === 'hiragana'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.scriptHiragana}
            </button>

            <button
              onClick={() =>
                onUpdateSettings((prev) => ({ ...prev, activeScript: 'both' }))
              }
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                settings.activeScript === 'both'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.scriptBoth}
            </button>
          </div>

          {/* Group Selector Trigger Button */}
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-rose-500" />
              <span>
                {isEn
                  ? `Groups: ${selectedGroupIds.length} selected`
                  : `Группы: ${selectedGroupIds.length} выбрано`}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Smart Learning Presets Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEn ? 'Smart Presets:' : 'Умные пресеты:'}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActivePreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activePreset === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isEn ? 'All Selected' : 'Все выбранные'}
            </button>

            <button
              onClick={() => setActivePreset('lookalikes')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activePreset === 'lookalikes'
                  ? 'bg-rose-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="シ/ツ, ソ/ン, ウ/ワ, ク/ケ/タ, マ/ム"
            >
              <Eye className="w-3 h-3" />
              <span>{isEn ? 'Look-alikes (シ/ツ)' : 'Похожие (シ/ツ)'}</span>
            </button>

            <button
              onClick={() => setActivePreset('combos')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activePreset === 'combos'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Dakuten, Handakuten, yōon"
            >
              <Shuffle className="w-3 h-3" />
              <span>{isEn ? 'Combos & Modifiers' : 'Сочетания и Дакутэн'}</span>
            </button>

            <button
              onClick={() => setActivePreset('weakest')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activePreset === 'weakest'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Top 10 weakest characters"
            >
              <Flame className="w-3 h-3" />
              <span>{isEn ? 'Weakest Links (Top 10)' : 'Слабые звенья (Топ-10)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weakest Links Empty State Banner */}
      {insufficientWeakestData && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between gap-3 animate-pop">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <strong className="font-bold block text-amber-700 dark:text-amber-400">
                {getTranslation(settings.language, 'presets.weakestEmptyTitle')}
              </strong>
              <span>
                {getTranslation(settings.language, 'presets.weakestEmptyDesc')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActivePreset('all')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition cursor-pointer"
          >
            {isEn ? 'Use All Groups' : 'Все группы'}
          </button>
        </div>
      )}

      {/* 9 Stages Selector Carousel */}
      <StageSelectorBar
        currentStageId={currentStageId}
        onSelectStage={setCurrentStageId}
        language={settings.language}
      />

      {/* Session Progress Header */}
      <div className="flex items-center justify-between gap-3 mb-4 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        {/* Left: Stage Title & Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
              {isEn ? `Stage ${currentStageMeta.stageNumber}` : `Этап ${currentStageMeta.stageNumber}`}
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
              {settings.language === 'ru' ? currentStageMeta.titleRu : currentStageMeta.titleEn}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block truncate">
            {settings.language === 'ru' ? currentStageMeta.descriptionRu : currentStageMeta.descriptionEn}
          </p>
        </div>

        {/* Right: Streak & Progress number */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentStreak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-rose-500" />
              <span>{currentStreak}🔥</span>
            </div>
          )}

          {currentStageId !== 'stage-3' && currentStageId !== 'stage-6' && (
            <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white text-sm font-black">
                {masteryScore}
              </span>
              /{SESSION_LENGTH}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-6 text-[11px] font-mono font-semibold text-slate-400 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl">
        <div className="flex items-center gap-3">
          <span>{getTranslation(settings.language, 'practice.keyboardHints.space')}</span>
          <span>{getTranslation(settings.language, 'practice.keyboardHints.esc')}</span>
        </div>
        {settings.fontJitterEnabled && (
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
            ⚡ {isEn ? 'Font Jitter Active' : 'Шрифт рандомизирован'}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {currentStageId !== 'stage-3' && currentStageId !== 'stage-6' && (
        <div className="w-full h-2 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden mb-8 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300 shadow-xs shadow-emerald-500/30"
            style={{ width: `${Math.min(100, (masteryScore / SESSION_LENGTH) * 100)}%` }}
          />
        </div>
      )}

      {/* Active Stage Exercise Screen with Font Jitter wrapper */}
      <div className={`min-h-[380px] flex items-center justify-center ${jitterFontClass}`}>
        {currentStageId === 'stage-1' && currentSymbol && (
          <StageChoiceRomaji
            key={`stage-1-${questionStep}`}
            symbol={currentSymbol}
            allSymbols={activeSymbols}
            settings={settings}
            onAnswer={handleAnswer}
            isFirstTime={isFirstTime}
          />
        )}

        {currentStageId === 'stage-2' && currentSymbol && (
          <StageChoiceKana
            key={`stage-2-${questionStep}`}
            symbol={currentSymbol}
            allSymbols={activeSymbols}
            settings={settings}
            onAnswer={handleAnswer}
            isFirstTime={isFirstTime}
          />
        )}

        {currentStageId === 'stage-3' && (
          <StagePairMatch
            activeSymbols={activeSymbols}
            settings={settings}
            onFinish={() => {
              storageService.recordStageCompleted();
              setIsSessionComplete(true);
            }}
          />
        )}

        {currentStageId === 'stage-4' && currentSymbol && (
          <StageTypeRomaji
            key={`stage-4-${questionStep}`}
            symbol={currentSymbol}
            settings={settings}
            onAnswer={handleAnswer}
          />
        )}

        {currentStageId === 'stage-5' && (
          currentWord ? (
            <StageTypeWord
              key={`stage-5-${questionStep}`}
              word={currentWord}
              settings={settings}
              onAnswer={handleAnswer}
            />
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm max-w-md mx-auto animate-pop">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                {isEn ? 'More Kana Needed for Words' : 'Нужно больше знаков для слов'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {isEn
                  ? 'The characters currently selected cannot form whole Japanese words. Select more rows or choose all basic groups to practice complete vocabulary.'
                  : 'Из выбранных сейчас символов нельзя составить полноценные японские слова. Выберите больше строк каны или откройте выбор групп.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => {
                    const groups = getGroupsForScript(settings.activeScript);
                    handleUpdateGroupIds(groups.slice(0, 8).map((g) => g.id));
                    setActivePreset('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  {isEn ? 'Add Common Rows' : 'Добавить основные строки'}
                </button>
                <button
                  onClick={() => setIsGroupModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {isEn ? 'Select Groups' : 'Выбрать группы'}
                </button>
              </div>
            </div>
          )
        )}

        {currentStageId === 'stage-6' && (
          <StageTypeStream
            activeSymbols={activeSymbols}
            settings={settings}
            onFinish={() => {
              storageService.recordStageCompleted();
              setIsSessionComplete(true);
            }}
          />
        )}

        {currentStageId === 'stage-7' && currentSymbol && (
          <StageListenChoice
            key={`stage-7-${questionStep}`}
            symbol={currentSymbol}
            allSymbols={activeSymbols}
            settings={settings}
            onAnswer={handleAnswer}
          />
        )}

        {currentStageId === 'stage-8' && currentSymbol && (
          <StageStrokeOrder
            key={`stage-8-${questionStep}`}
            symbol={currentSymbol}
            settings={settings}
            onAnswer={handleAnswer}
          />
        )}

        {currentStageId === 'stage-9' && currentSymbol && (
          <StageDrawKana
            key={`stage-9-${questionStep}`}
            symbol={currentSymbol}
            settings={settings}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {/* Group Selector Modal */}
      <GroupSelectorModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        script={settings.activeScript}
        selectedGroupIds={selectedGroupIds}
        onChangeSelectedGroupIds={handleUpdateGroupIds}
        language={settings.language}
      />

      {/* Session Completion Modal */}
      <SessionCompleteModal
        isOpen={isSessionComplete}
        accuracy={
          questionStep > 0
            ? Math.round((correctInSession / questionStep) * 100)
            : 100
        }
        totalAnswered={questionStep}
        correctCount={correctInSession}
        streak={stats.streak}
        sessionMistakes={sessionMistakes}
        onRestart={startNewSession}
        onNextStage={handleNextStage}
        language={settings.language}
      />
    </div>
  );
};
