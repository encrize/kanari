import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  Volume2,
  Shuffle,
  AlertTriangle,
} from 'lucide-react';
import {
  AppSettings,
  AppStatistics,
  KanaGroup,
  KanaSymbol,
  ScriptType,
} from '../../types/kana';
import { getGroupsForScript, getAllSymbols, shuffleArray, normalizeRomajiInput } from '../../utils/kanaUtils';
import { audioService } from '../../services/audioService';
import { storageService } from '../../services/storageService';
import { TRANSLATIONS } from '../../data/translations';
import confetti from 'canvas-confetti';

interface TofuguCard {
  id: string;
  symbol: KanaSymbol;
  userInput: string;
  isCorrect: boolean;
  incorrectAttempts: number;
}

interface TofuguQuizTabProps {
  settings: AppSettings;
  stats: AppStatistics;
  onUpdateStats: (newStats: AppStatistics) => void;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
}

export const TofuguQuizTab: React.FC<TofuguQuizTabProps> = ({
  settings,
  stats,
  onUpdateStats,
  onUpdateSettings,
}) => {
  const t = TRANSLATIONS[settings.language];
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results'>('setup');

  // Groups selection in setup
  const groups = getGroupsForScript(settings.activeScript);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
    return groups.slice(0, 5).map((g) => g.id); // Default to first 5 rows (A, Ka, Sa, Ta, Na)
  });
  const [shuffleCards, setShuffleCards] = useState(true);

  // Active cards on the board
  const [cards, setCards] = useState<TofuguCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);

  // References to input elements to auto-focus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update groups if active script changes
  useEffect(() => {
    const currentGroups = getGroupsForScript(settings.activeScript);
    const valid = selectedGroupIds.filter((id) =>
      currentGroups.some((g) => g.id === id)
    );
    if (valid.length === 0) {
      setSelectedGroupIds(currentGroups.slice(0, 5).map((g) => g.id));
    }
  }, [settings.activeScript]);

  // Start the quiz
  const handleStartQuiz = (customSymbols?: KanaSymbol[]) => {
    let symbolPool: KanaSymbol[] = [];

    if (customSymbols && customSymbols.length > 0) {
      symbolPool = customSymbols;
    } else {
      const chosenGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
      symbolPool = getAllSymbols(chosenGroups);
    }

    if (symbolPool.length === 0) {
      symbolPool = getAllSymbols(groups.slice(0, 1));
    }

    const orderedPool = shuffleCards ? shuffleArray(symbolPool) : [...symbolPool];

    const cardList: TofuguCard[] = orderedPool.map((sym, idx) => ({
      id: `${sym.kana}-${idx}`,
      symbol: sym,
      userInput: '',
      isCorrect: false,
      incorrectAttempts: 0,
    }));

    setCards(cardList);
    inputRefs.current = [];
    setActiveCardIndex(0);
    setGameState('playing');

    // Focus first input box shortly after render
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  // Find next unsolved card and focus it
  const focusNextUnsolved = (currentIndex: number, currentCards: TofuguCard[]) => {
    // Look forward
    for (let i = currentIndex + 1; i < currentCards.length; i++) {
      if (!currentCards[i].isCorrect) {
        setActiveCardIndex(i);
        inputRefs.current[i]?.focus();
        return;
      }
    }
    // Loop around from start
    for (let i = 0; i < currentIndex; i++) {
      if (!currentCards[i].isCorrect) {
        setActiveCardIndex(i);
        inputRefs.current[i]?.focus();
        return;
      }
    }
  };

  // Validate user submission on a card (using explicitValue to avoid React closure lag)
  const handleCardSubmit = (index: number, explicitValue?: string) => {
    const card = cards[index];
    if (!card || card.isCorrect) return;

    const rawVal = explicitValue !== undefined ? explicitValue : card.userInput;
    const val = normalizeRomajiInput(rawVal);
    if (!val) return;

    const isMatch = card.symbol.romaji.some((r) => r.toLowerCase() === val);
    const script = settings.activeScript === 'katakana' ? 'katakana' : 'hiragana';

    // Record attempt in global storage
    const updatedStats = storageService.recordAttempt(
      card.symbol.kana,
      card.symbol.romaji[0],
      script,
      isMatch
    );
    onUpdateStats(updatedStats);

    if (isMatch) {
      audioService.playCorrectSound();

      setCards((prev) => {
        const nextCards = [...prev];
        nextCards[index] = {
          ...nextCards[index],
          isCorrect: true,
          userInput: card.symbol.romaji[0],
        };

        const allDone = nextCards.every((c) => c.isCorrect);
        if (allDone) {
          handleFinishQuiz(nextCards);
        } else {
          focusNextUnsolved(index, nextCards);
        }
        return nextCards;
      });
    } else {
      audioService.playWrongSound();
      setShakingCardId(card.id);

      setCards((prev) => {
        const nextCards = [...prev];
        nextCards[index] = {
          ...nextCards[index],
          incorrectAttempts: nextCards[index].incorrectAttempts + 1,
          userInput: '', // clear field on error
        };
        return nextCards;
      });

      setTimeout(() => {
        setShakingCardId(null);
      }, 500);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // 1. Update card userInput immediately
    setCards((prev) => {
      const nextCards = [...prev];
      if (nextCards[index]) {
        nextCards[index] = {
          ...nextCards[index],
          userInput: value,
        };
      }
      return nextCards;
    });

    const card = cards[index];
    if (!card || card.isCorrect) return;

    // 2. Normalize and check instant match
    const normalized = normalizeRomajiInput(value);
    const isMatch = card.symbol.romaji.some(
      (r) => r.toLowerCase() === normalized
    );

    if (isMatch) {
      handleCardSubmit(index, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentInput = cards[index]?.userInput || '';
      handleCardSubmit(index, currentInput);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      focusNextUnsolved(index, cards);
    }
  };

  const handleFinishQuiz = (finalCards?: TofuguCard[]) => {
    const list = finalCards || cards;
    const correctCount = list.filter((c) => c.isCorrect).length;
    if (correctCount === list.length && list.length > 0) {
      audioService.playCompleteSound();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
    setGameState('results');
  };

  // Quick group toggles for Setup
  const toggleGroup = (id: string) => {
    if (selectedGroupIds.includes(id)) {
      if (selectedGroupIds.length <= 1) return;
      setSelectedGroupIds(selectedGroupIds.filter((g) => g !== id));
    } else {
      setSelectedGroupIds([...selectedGroupIds, id]);
    }
  };

  const selectAll = () => setSelectedGroupIds(groups.map((g) => g.id));
  const selectBasic = () => {
    const basicIds = groups.filter((g) => !g.tags || g.tags.length === 0).map((g) => g.id);
    setSelectedGroupIds(basicIds);
  };
  const selectLookAlikes = () => {
    const lookIds = groups.filter((g) => g.tags?.includes('look-alike')).map((g) => g.id);
    setSelectedGroupIds(lookIds.length > 0 ? lookIds : groups.slice(0, 5).map((g) => g.id));
  };

  // Calculate results statistics
  const totalCards = cards.length;
  const correctCards = cards.filter((c) => c.isCorrect);
  const mistakeCards = cards.filter((c) => !c.isCorrect || c.incorrectAttempts > 0);
  const accuracyPct = totalCards > 0 ? Math.round((correctCards.length / totalCards) * 100) : 0;

  // Retry only cards with mistakes
  const handleRetryMistakes = () => {
    const mistakeSymbols = mistakeCards.map((c) => c.symbol);
    handleStartQuiz(mistakeSymbols);
  };

  // -------------------------------------------------------------
  // VIEW 1: SETUP SCREEN
  // -------------------------------------------------------------
  if (gameState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-pop">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tofugu Style Grid Quiz</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.tofuguSetupTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
            {t.tofuguSetupDesc}
          </p>
        </div>

        {/* Script Selector (Katakana vs Hiragana) */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() =>
              onUpdateSettings((prev) => ({ ...prev, activeScript: 'katakana' }))
            }
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              settings.activeScript === 'katakana'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            Катакана (カタカナ)
          </button>
          <button
            onClick={() =>
              onUpdateSettings((prev) => ({ ...prev, activeScript: 'hiragana' }))
            }
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              settings.activeScript === 'hiragana'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            Хирагана (ひらがな)
          </button>
        </div>

        {/* Quick Row Selection Presets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Выберите строки каны
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Выбрано строк: {selectedGroupIds.length} из {groups.length}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Все строки
              </button>
              <button
                onClick={selectBasic}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Только основные
              </button>
              {groups.some((g) => g.tags?.includes('look-alike')) && (
                <button
                  onClick={selectLookAlikes}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer"
                >
                  Похожие знаки (シ/ツ/ソ/ン)
                </button>
              )}
            </div>
          </div>

          {/* Grid of Group Checkboxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {groups.map((group) => {
              const isSelected = selectedGroupIds.includes(group.id);
              const preview = group.symbols.map((s) => s.kana).join(' ');

              return (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <span className="text-xs font-bold block truncate">
                      {group.label}
                    </span>
                    <span className="text-sm font-noto-sans font-black text-sky-600 dark:text-sky-400 block truncate mt-0.5">
                      {preview}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Shuffle Option */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleCards}
                onChange={(e) => setShuffleCards(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Перемешать порядок карточек (как на Tofugu)</span>
            </label>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleStartQuiz()}
            className="w-full sm:w-auto min-w-[240px] py-4 px-8 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.tofuguStartQuiz}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: PLAYING SCREEN (Match exact Tofugu design from user screenshot!)
  // -------------------------------------------------------------
  if (gameState === 'playing') {
    const completedCount = cards.filter((c) => c.isCorrect).length;

    return (
      <div className="max-w-5xl mx-auto px-4 py-6 animate-pop">
        {/* Tofugu Header & Instructions (identical to image!) */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 tracking-tight mb-4">
            {t.tofuguTitle}
          </h1>

          <div className="max-w-xl mx-auto text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 sm:pl-8">
            <ul className="list-disc space-y-1">
              <li>{t.tofuguRule1}</li>
              <li>{t.tofuguRule2}</li>
              <li>{t.tofuguRule3}</li>
              <li>{t.tofuguRule4}</li>
              <li>{t.tofuguRule5}</li>
            </ul>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl max-w-md mx-auto shadow-xs">
          <span>{t.tofuguCompletedCards(completedCount, cards.length)}</span>
          <span className="font-mono text-sky-600 dark:text-sky-400">
            {Math.round((completedCount / cards.length) * 100)}%
          </span>
        </div>

        {/* Tofugu Cards Grid (Exact look & feel from uploaded image) */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 max-w-4xl mx-auto">
          {cards.map((card, idx) => {
            const isFocused = activeCardIndex === idx && !card.isCorrect;
            const isShaking = shakingCardId === card.id;

            // Colors matching Tofugu:
            // Unsolved: #2b82c9 (Vibrant Blue)
            // Solved: #48bb78 (Vibrant Green)
            let cardBg = 'bg-[#2b82c9]';
            if (card.isCorrect) {
              cardBg = 'bg-[#48bb78]';
            } else if (isShaking) {
              cardBg = 'bg-rose-600';
            }

            return (
              <div
                key={card.id}
                onClick={() => {
                  if (!card.isCorrect) {
                    setActiveCardIndex(idx);
                    inputRefs.current[idx]?.focus();
                  }
                }}
                className={`relative w-[96px] sm:w-[108px] h-[148px] sm:h-[162px] rounded-2xl flex flex-col items-center justify-between p-3 select-none transition-all shadow-md cursor-pointer ${cardBg} ${
                  isFocused ? 'ring-4 ring-sky-300 scale-105 z-10' : ''
                } ${isShaking ? 'animate-shake' : ''}`}
              >
                {/* Large White Kana Character */}
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold font-noto-sans text-white drop-shadow-sm">
                    {card.symbol.kana}
                  </span>
                </div>

                {/* White Text Field on bottom */}
                <div className="w-full">
                  {card.isCorrect ? (
                    <div className="w-full py-1.5 rounded-lg bg-white/90 text-center font-mono font-bold text-slate-500 text-sm shadow-inner">
                      {card.symbol.romaji[0]}
                    </div>
                  ) : (
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      value={card.userInput}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      onFocus={() => setActiveCardIndex(idx)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck="false"
                      className="w-full py-1 px-1 rounded-lg bg-white text-center font-mono font-bold text-slate-900 text-base sm:text-lg outline-none shadow-sm focus:ring-2 focus:ring-sky-400"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Finish Quiz Button Centered at Bottom (Exact style from screenshot) */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            onClick={() => handleFinishQuiz()}
            className="px-8 py-3.5 rounded-xl bg-[#2b82c9] hover:bg-[#2470ac] active:scale-95 text-white font-bold text-base shadow-md transition cursor-pointer"
          >
            {t.tofuguFinishQuiz}
          </button>

          <button
            onClick={() => setGameState('setup')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            {t.tofuguNewSetup}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: RESULTS SCREEN
  // -------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pop">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Quiz Results
        </h2>
        <p className="text-base font-bold text-slate-600 dark:text-slate-300 mt-2">
          {t.tofuguAccuracyScore(correctCards.length, totalCards, accuracyPct)}
        </p>

        {/* Visual score pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 max-w-md mx-auto">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
              Passed Cards
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {correctCards.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
              Needs Review
            </span>
            <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {mistakeCards.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Accuracy
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {accuracyPct}%
            </span>
          </div>
        </div>

        {/* Cards Breakdown */}
        {mistakeCards.length > 0 && (
          <div className="text-left bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Characters that had mistakes or were left unsolved:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mistakeCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => audioService.playKana(card.symbol.kana)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between cursor-pointer hover:border-rose-400"
                >
                  <span className="text-xl font-black font-noto-sans text-slate-900 dark:text-white">
                    {card.symbol.kana}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-500">
                    {card.symbol.romaji[0]}
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {mistakeCards.length > 0 && (
            <button
              onClick={handleRetryMistakes}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition cursor-pointer"
            >
              {t.tofuguRetryMistakes} ({mistakeCards.length})
            </button>
          )}

          <button
            onClick={() => handleStartQuiz()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.tofuguTryAgain}</span>
          </button>

          <button
            onClick={() => setGameState('setup')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            {t.tofuguNewSetup}
          </button>
        </div>
      </div>
    </div>
  );
};
