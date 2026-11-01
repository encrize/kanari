import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { getMultipleChoiceOptions } from '../../utils/kanaUtils';

interface StageChoiceKanaProps {
  symbol: KanaSymbol;
  allSymbols: KanaSymbol[];
  settings: AppSettings;
  onAnswer: (isCorrect: boolean) => void;
  isFirstTime?: boolean;
}

export const StageChoiceKana: React.FC<StageChoiceKanaProps> = ({
  symbol,
  allSymbols,
  settings,
  onAnswer,
  isFirstTime = false,
}) => {
  const isEn = settings.language === 'en';
  const [options, setOptions] = useState<KanaSymbol[]>([]);
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const answerResultRef = useRef<boolean>(false);

  useEffect(() => {
    const opts = getMultipleChoiceOptions(symbol, allSymbols, 4);
    setOptions(opts);
    setSelectedKana(null);
    setIsAnswered(false);

    // Pronounce character on first encounter so user learns sound
    if (isFirstTime && settings.soundEnabled) {
      audioService.playKana(symbol.kana);
    }

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, [symbol, isFirstTime]);

  const triggerAdvance = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    onAnswer(answerResultRef.current);
  };

  const handleSelect = (chosen: KanaSymbol) => {
    if (isAnswered) {
      triggerAdvance();
      return;
    }
    setSelectedKana(chosen.kana);
    setIsAnswered(true);

    const correct = chosen.kana === symbol.kana;
    answerResultRef.current = correct;

    if (correct) {
      audioService.playCorrectSound();
      if (settings.soundEnabled) {
        setTimeout(() => {
          audioService.playKana(symbol.kana);
        }, 180);
      }
    } else {
      audioService.playWrongSound();
    }

    advanceTimerRef.current = window.setTimeout(() => {
      triggerAdvance();
    }, 750);
  };

  // 1-4 keyboard shortcuts and Enter/Space quick advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (isAnswered) {
        if (e.key === 'Enter' || e.key === ' ' || ['1', '2', '3', '4'].includes(e.key)) {
          triggerAdvance();
        }
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (options[idx]) {
          handleSelect(options[idx]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isAnswered, symbol]);

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full px-4 animate-pop">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {isFirstTime ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
            ★ {isEn ? 'First encounter - listen and learn!' : 'Новый символ - слушайте и запоминайте!'}
          </span>
        ) : (
          isEn ? 'Select the matching kana:' : 'Выберите символ каны для слога:'
        )}
      </span>

      {/* Target Romaji Prompt */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-center font-mono text-5xl font-black text-slate-900 dark:text-white">
          {symbol.romaji[0]}
        </div>
        <button
          onClick={() => audioService.playKana(symbol.kana)}
          className="absolute -bottom-2 -right-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition cursor-pointer"
          title={isEn ? 'Play sound' : 'Слушать звук'}
        >
          <Volume2 className="w-4 h-4 text-rose-500" />
        </button>
      </div>

      {/* 4 Kana Options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((opt, idx) => {
          const isSelected = selectedKana === opt.kana;
          const isCorrect = opt.kana === symbol.kana;

          let btnStyle =
            'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white shadow-xs';

          // If first encounter, visually highlight correct option to introduce character
          if (!isAnswered && isFirstTime && isCorrect) {
            btnStyle =
              'bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/40 font-bold';
          }

          if (isAnswered) {
            if (isCorrect) {
              btnStyle =
                'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
            } else if (isSelected) {
              btnStyle =
                'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-600 dark:text-rose-400 font-bold animate-shake';
            } else {
              btnStyle = 'opacity-30 border-slate-200 dark:border-slate-800 text-slate-400';
            }
          }

          return (
            <button
              key={opt.kana}
              onClick={() => handleSelect(opt)}
              className={`relative py-5 px-4 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer font-noto-sans ${btnStyle}`}
            >
              <span className="absolute top-2 left-3 text-[10px] font-mono text-slate-400 font-semibold">
                {idx + 1}
              </span>
              {!isAnswered && isFirstTime && isCorrect && (
                <span className="absolute top-2 right-2.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ★ {isEn ? 'Answer' : 'Ответ'}
                </span>
              )}
              <span className="text-4xl font-black">{opt.kana}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
