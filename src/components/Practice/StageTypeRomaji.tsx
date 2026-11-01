import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, Delete } from 'lucide-react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { normalizeRomajiInput } from '../../utils/kanaUtils';

interface StageTypeRomajiProps {
  symbol: KanaSymbol;
  settings: AppSettings;
  onAnswer: (isCorrect: boolean) => void;
}

export const StageTypeRomaji: React.FC<StageTypeRomajiProps> = ({
  symbol,
  settings,
  onAnswer,
}) => {
  const isEn = settings.language === 'en';
  const [inputVal, setInputVal] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setInputVal('');
    setAnswered(false);
    setIsCorrect(false);
    inputRef.current?.focus();
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [symbol]);

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

    const cleanInput = normalizeRomajiInput(inputVal);
    const correct = symbol.romaji.some((r) => r.toLowerCase() === cleanInput);

    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      audioService.playCorrectSound();
      if (settings.soundEnabled) {
        setTimeout(() => {
          audioService.playKana(symbol.kana);
        }, 120);
      }
    } else {
      audioService.playWrongSound();
    }

    // Auto-advance after 500ms so user sees feedback, or immediate on next Enter
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      onAnswer(correct);
    }, 500);
  };

  const handleVirtualKey = (char: string) => {
    if (answered) return;
    if (char === 'DEL') {
      setInputVal((prev) => prev.slice(0, -1));
    } else {
      setInputVal((prev) => prev + char.toLowerCase());
    }
  };

  const virtualKeys = [
    ['a', 'i', 'u', 'e', 'o'],
    ['k', 's', 't', 'n', 'h'],
    ['m', 'y', 'r', 'w', 'g'],
    ['z', 'd', 'b', 'p', 'DEL'],
  ];

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full px-4 animate-pop">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {isEn ? 'Type the romaji reading:' : 'Напечатайте чтение на ромаджи:'}
      </span>

      {/* Target Kana Character */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-center font-noto-sans text-6xl font-black text-slate-900 dark:text-white">
          {symbol.kana}
        </div>
        <button
          onClick={() => audioService.playKana(symbol.kana)}
          className="absolute -bottom-2 -right-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition cursor-pointer"
          title={isEn ? 'Hear pronunciation' : 'Слушать звук'}
        >
          <Volume2 className="w-4 h-4 text-rose-500" />
        </button>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <div className="relative w-full max-w-xs">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            disabled={answered}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isEn ? 'e.g. ka, shi, tsu...' : 'например: a, ka, tsu...'}
            className={`w-full px-5 py-3.5 rounded-2xl text-center text-xl font-bold font-mono tracking-wider border transition outline-none ${
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
            {isEn ? 'Correct answer: ' : 'Правильно: '}
            <span className="font-mono underline text-sm tracking-wide">
              {symbol.romaji.join(', ')}
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!answered && !inputVal.trim()}
          className="w-full max-w-xs mt-4 py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {answered ? (
            <>
              <span>{isEn ? 'Next...' : 'Переход...'}</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </>
          ) : (
            <span>{isEn ? 'Check answer' : 'Проверить ответ'}</span>
          )}
        </button>
      </form>

      {/* Touch Virtual Keypad */}
      <div className="mt-5 w-full max-w-xs bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5 select-none">
        {virtualKeys.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5 justify-center">
            {row.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleVirtualKey(k)}
                className={`py-1.5 flex-1 rounded-xl font-bold font-mono text-xs transition cursor-pointer ${
                  k === 'DEL'
                    ? 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center'
                    : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white shadow-xs'
                }`}
              >
                {k === 'DEL' ? <Delete className="w-3.5 h-3.5" /> : k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
