import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';
import { AppSettings, AppStatistics, KanaWord, WordCategory } from '../../types/kana';
import { KATAKANA_VOCABULARY } from '../../data/wordsDatabase';
import { KANA_WORDS } from '../../data/words';
import { validateWordAnswer } from '../../utils/wordValidator';
import { audioService } from '../../services/audioService';
import { getTranslation } from '../../services/i18n';
import { getGroupsForScript } from '../../utils/kanaUtils';
import confetti from 'canvas-confetti';

interface WordModeTabProps {
  settings: AppSettings;
  stats: AppStatistics;
  onUpdateStats: React.Dispatch<React.SetStateAction<AppStatistics>>;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
}

// Master vocabulary combining all curated katakana words (1500+ words)
const ALL_VOCABULARY_WORDS: KanaWord[] = (() => {
  const map = new Map<string, KanaWord>();
  for (const w of KATAKANA_VOCABULARY) {
    map.set(w.k, w);
  }
  for (const w of KANA_WORDS) {
    if (!map.has(w.k) && /^[\u30A0-\u30FFー]+$/.test(w.k)) {
      map.set(w.k, w);
    }
  }
  return Array.from(map.values());
})();

const CATEGORIES: { id: WordCategory | 'all'; labelEn: string; labelRu: string }[] = [
  { id: 'all', labelEn: 'All Categories', labelRu: 'Все категории' },
  { id: 'music', labelEn: 'Music & Audio', labelRu: 'Музыка и звук' },
  { id: 'tech', labelEn: 'Technology', labelRu: 'Технологии' },
  { id: 'it', labelEn: 'Internet & IT', labelRu: 'Интернет и IT' },
  { id: 'everyday', labelEn: 'Everyday Life', labelRu: 'Повседневные' },
  { id: 'entertainment', labelEn: 'Gaming & Fun', labelRu: 'Игры и аниме' },
  { id: 'food', labelEn: 'Food & Drinks', labelRu: 'Еда и напитки' },
  { id: 'travel', labelEn: 'Travel & Places', labelRu: 'Путешествия' },
];

export const WordModeTab: React.FC<WordModeTabProps> = ({
  settings,
  stats,
}) => {
  const isEn = settings.language === 'en';
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>('all');
  const [filterOnlyStudied, setFilterOnlyStudied] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Set of practiced or studied characters from stats
  const studiedCharsSet = useMemo(() => {
    const set = new Set<string>();
    set.add('ー'); // long vowel dash
    set.add('ッ'); // small tsu

    // Any characters user has practiced in stats
    for (const [kana, mistake] of Object.entries(stats.characters || {})) {
      if ((mistake.totalAttempts || 0) > 0 || (mistake.rightCount || 0) > 0) {
        set.add(kana);
      }
    }

    // If user has not practiced many yet, include starter basic rows (A, Ka, Sa, Ta, Na)
    if (set.size <= 2) {
      const basicGroups = getGroupsForScript('katakana').slice(0, 5);
      for (const g of basicGroups) {
        for (const s of g.symbols) {
          set.add(s.kana);
        }
      }
    }

    return set;
  }, [stats]);

  // Filter word list based on category and studied status
  const filteredWords = useMemo(() => {
    let list = ALL_VOCABULARY_WORDS;

    if (selectedCategory !== 'all') {
      list = list.filter((w) => w.category === selectedCategory);
    }

    if (filterOnlyStudied) {
      list = list.filter((w) =>
        Array.from(w.k).every((ch) => studiedCharsSet.has(ch))
      );
    }

    // Shuffle the list once when category or filter changes
    return [...list].sort(() => Math.random() - 0.5);
  }, [selectedCategory, filterOnlyStudied, studiedCharsSet]);

  const currentWord: KanaWord | undefined = filteredWords[currentIndex];

  // Speak word in Japanese using Web Speech API (ensuring no audio collision)
  const speakJapaneseWord = (text: string) => {
    if (!settings.soundEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    try {
      audioService.stopAllAudio();
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ja-JP';
      utter.rate = settings.voiceSpeed || 1.0;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Only auto-play audio AFTER answering, never on question load (to not spoil answer)
  useEffect(() => {
    if (currentWord && settings.autoPlayAudio && answeredState !== 'idle') {
      speakJapaneseWord(currentWord.k);
    }
  }, [answeredState]);

  // Refocus input
  useEffect(() => {
    if (answeredState === 'idle') {
      inputRef.current?.focus();
    }
  }, [currentIndex, answeredState]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || answeredState !== 'idle') return;

    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const isMatch = validateWordAnswer(trimmed, currentWord);
    setTotalAnswered((prev) => prev + 1);

    if (isMatch) {
      setAnsweredState('correct');
      setCorrectCount((prev) => prev + 1);
      audioService.playCorrectSound();
      // Celebrate streak milestones
      if ((correctCount + 1) % 5 === 0) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      setAnsweredState('wrong');
      audioService.playWrongSound();
    }
  };

  const handleNext = () => {
    setInputVal('');
    setAnsweredState('idle');

    if (currentIndex + 1 >= filteredWords.length) {
      setSessionCompleted(true);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Global keyboard shortcuts (Enter to submit/next, Space to listen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If Space is pressed and not typing in input
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        if (currentWord) speakJapaneseWord(currentWord.k);
      }
      if (e.key === 'Enter') {
        if (answeredState !== 'idle') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answeredState, currentWord]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setInputVal('');
    setAnsweredState('idle');
    setSessionCompleted(false);
    setCorrectCount(0);
    setTotalAnswered(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <BookOpen className="w-3 h-3" />
              {isEn ? 'Katakana Loanwords' : 'Заимствованные слова'}
            </span>
            <span className="text-xs text-slate-400">
              {filteredWords.length} {isEn ? 'words in database' : 'слов в базе'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {getTranslation(settings.language, 'words.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {getTranslation(settings.language, 'words.subtitle')}
          </p>
        </div>

        {/* Progress counter */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isEn ? 'Progress' : 'Прогресс'}
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {currentIndex + 1} / {filteredWords.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xs">
            {Math.round(((currentIndex) / Math.max(1, filteredWords.length)) * 100)}%
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <Filter className="w-3.5 h-3.5" />
          <span>{getTranslation(settings.language, 'words.filterCategory')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                handleRestart();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {isEn ? cat.labelEn : cat.labelRu}
            </button>
          ))}
        </div>

        {/* Toggle between All Words and Only Studied Letters */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => {
              setFilterOnlyStudied((prev) => !prev);
              handleRestart();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterOnlyStudied
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>
              {isEn
                ? filterOnlyStudied
                  ? `✓ Filtering by studied kana only (${Math.max(0, studiedCharsSet.size - 2)} characters)`
                  : 'Filter words by studied kana only'
                : filterOnlyStudied
                ? `✓ Только изученные буквы (${Math.max(0, studiedCharsSet.size - 2)} символов)`
                : 'Слова только из изученных букв'}
            </span>
          </button>
        </div>
      </div>

      {/* Session Completed View */}
      {sessionCompleted ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm animate-pop">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {isEn ? 'Category Completed!' : 'Категория пройдена!'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            {isEn
              ? `You answered ${correctCount} out of ${totalAnswered} words correctly (${Math.round(
                  (correctCount / Math.max(1, totalAnswered)) * 100
                )}%).`
              : `Вы правильно ответили на ${correctCount} из ${totalAnswered} слов (${Math.round(
                  (correctCount / Math.max(1, totalAnswered)) * 100
                )}%).`}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isEn ? 'Practice Again' : 'Повторить заново'}</span>
            </button>
          </div>
        </div>
      ) : currentWord ? (
        /* Main Practice Card */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-all">
          <div className="flex flex-col items-center text-center">
            {/* Pronounce Button */}
            <button
              onClick={() => speakJapaneseWord(currentWord.k)}
              className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Click or press Space to listen"
            >
              <Volume2 className="w-4 h-4 text-sky-500" />
              <span>{isEn ? 'Listen [Space]' : 'Слушать [Space]'}</span>
            </button>

            {/* Katakana Word */}
            <div className="text-4xl sm:text-6xl font-black tracking-wider text-slate-900 dark:text-white py-4 select-none font-noto-sans">
              {currentWord.k}
            </div>

            {/* Answer Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-md mt-6">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={answeredState !== 'idle'}
                  placeholder={getTranslation(settings.language, 'words.inputPlaceholder')}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className={`w-full px-5 py-3.5 rounded-2xl text-base sm:text-lg text-center font-medium outline-hidden transition border ${
                    answeredState === 'correct'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold'
                      : answeredState === 'wrong'
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 font-bold'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10'
                  }`}
                />
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {answeredState === 'idle' ? (
                  <button
                    type="submit"
                    disabled={!inputVal.trim()}
                    className="w-full py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold transition shadow-md shadow-sky-500/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isEn ? 'Check Answer [Enter]' : 'Проверить ответ [Enter]'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>{isEn ? 'Next Word [Enter]' : 'Следующее слово [Enter]'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Answer Explanation & Meaning Card */}
            {answeredState !== 'idle' && (
              <div
                className={`w-full max-w-md mt-6 p-4 rounded-2xl border text-left transition-all animate-pop ${
                  answeredState === 'correct'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  {answeredState === 'correct' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {isEn ? 'Correct!' : 'Правильно!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span className="text-rose-700 dark:text-rose-400">
                        {isEn ? 'Incorrect!' : 'Неверно!'}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Romaji:{' '}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentWord.r}
                      {currentWord.acceptedRomaji && currentWord.acceptedRomaji.length > 1 && (
                        <span className="text-slate-400 font-normal">
                          {' '}
                          ({currentWord.acceptedRomaji.join(', ')})
                        </span>
                      )}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {isEn ? 'English:' : 'Значение:'}{' '}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentWord.e.join(', ')}
                      {currentWord.ru && !isEn && (
                        <span className="text-slate-400 font-normal"> ({currentWord.ru})</span>
                      )}
                    </span>
                  </p>
                  {(currentWord.explanationEn || currentWord.explanationRu) && (
                    <p className="pt-1 text-slate-500 dark:text-slate-400 italic">
                      {isEn ? currentWord.explanationEn : currentWord.explanationRu}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm animate-pop">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
            {isEn ? 'No words match your current filter' : 'Нет слов под текущий фильтр'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            {filterOnlyStudied
              ? isEn
                ? 'You have selected "Only studied kana", but the vocabulary database currently does not have words formed solely from your selected characters. Practice more kana groups or switch to all words.'
                : 'Включен фильтр "Только изученные буквы", но в словаре нет слов, составленных исключительно из этих знаков. Выберите больше строк каны или отключите фильтр.'
              : isEn
              ? 'No words found in this category.'
              : 'В выбранной категории пока нет слов.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {filterOnlyStudied && (
              <button
                onClick={() => {
                  setFilterOnlyStudied(false);
                  handleRestart();
                }}
                className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-sky-500/20 cursor-pointer"
              >
                {isEn ? 'Show All 250+ Words' : 'Показать все 250+ слов'}
              </button>
            )}
            {selectedCategory !== 'all' && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  handleRestart();
                }}
                className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                {isEn ? 'All Categories' : 'Все категории'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
