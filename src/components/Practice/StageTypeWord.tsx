import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, BookOpen } from 'lucide-react';
import { KanaWord, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { validateWordAnswer } from '../../utils/wordValidator';

interface StageTypeWordProps {
  word: KanaWord;
  settings: AppSettings;
  onAnswer: (isCorrect: boolean) => void;
}

export const StageTypeWord: React.FC<StageTypeWordProps> = ({
  word,
  settings,
  onAnswer,
}) => {
  const isEn = settings.language === 'en';
  const [inputVal, setInputVal] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const autoAdvanceTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    setInputVal('');
    setAnswered(false);
    setIsCorrect(false);
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [word]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (answered) {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      onAnswer(isCorrect);
      return;
    }

    const isMatch = validateWordAnswer(inputVal, word);

    setIsCorrect(isMatch);
    setAnswered(true);

    if (isMatch) {
      audioService.playCorrectSound();
      if (settings.soundEnabled) {
        setTimeout(() => {
          audioService.playKana(word.k);
        }, 120);
      }
    } else {
      audioService.playWrongSound();
    }

    // Auto-advance to next word with 0.5s delay so the user clearly sees result feedback
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      onAnswer(isMatch);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full px-4 animate-pop">
      <div className="flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
        <BookOpen className="w-3.5 h-3.5" />
        <span>{isEn ? 'Vocabulary Word' : 'Словарный режим'}</span>
      </div>

      {/* Target Word Card */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center shadow-xs mb-6">
        <span className="text-4xl sm:text-5xl font-black font-noto-sans text-slate-900 dark:text-white tracking-wide mb-3">
          {word.k}
        </span>

        {/* Translation tag */}
        <div className="flex flex-col items-center gap-1">
          {isEn ? (
            word.e && word.e.length > 0 && (
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                {word.e.join(', ')}
              </span>
            )
          ) : (
            <>
              {word.ru && (
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                  🇷🇺 {word.ru}
                </span>
              )}
              {word.e && word.e.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  🇬🇧 {word.e.join(', ')}
                </span>
              )}
            </>
          )}
        </div>

        {/* Audio pronunciation */}
        <button
          onClick={() => audioService.playKana(word.k)}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 text-rose-500" />
          <span>{isEn ? 'Hear pronunciation' : 'Слушать слово'}</span>
        </button>
      </div>

      {/* Typing Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <div className="relative w-full">
          <input
            type="text"
            autoFocus
            disabled={answered}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEn ? 'Type romaji word (e.g. terebi)...' : 'Введите чтение на ромаджи (например: terebi)...'}
            className={`w-full px-5 py-3.5 rounded-2xl text-center text-lg font-bold font-mono tracking-wider border transition outline-none ${
              answered
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-rose-500'
            }`}
          />

          {answered && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>
          )}
        </div>

        {answered && !isCorrect && (
          <div className="mt-2 text-center text-xs font-bold text-rose-500">
            {isEn ? 'Correct spelling: ' : 'Правильное написание: '}
            <span className="font-mono underline text-sm tracking-wide">
              {word.r}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={answered || !inputVal.trim()}
          className="w-full mt-4 py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {answered ? (
            <>
              <span>{isEn ? 'Next Word...' : 'Переход...'}</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </>
          ) : (
            <span>{isEn ? 'Check' : 'Проверить'}</span>
          )}
        </button>
      </form>
    </div>
  );
};
