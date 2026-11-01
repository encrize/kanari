import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { normalizeRomajiInput } from '../../utils/kanaUtils';
import { StrokeAnimator } from '../Common/StrokeAnimator';

interface StageStrokeOrderProps {
  symbol: KanaSymbol;
  settings: AppSettings;
  onAnswer: (isCorrect: boolean) => void;
}

export const StageStrokeOrder: React.FC<StageStrokeOrderProps> = ({
  symbol,
  settings,
  onAnswer,
}) => {
  const isEn = settings.language === 'en';
  const [inputVal, setInputVal] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setInputVal('');
    setAnswered(false);
    setIsCorrect(false);
  }, [symbol]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (answered) {
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
        }, 180);
      }
    } else {
      audioService.playWrongSound();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full px-4 animate-pop">
      <div className="text-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {isEn ? 'Watch stroke order and type romaji:' : 'Изучите порядок черт и напишите чтение:'}
        </span>
      </div>

      {/* Stroke Order Animation Canvas */}
      <div className="mb-4">
        <StrokeAnimator kana={symbol.kana} size={210} autoPlay={true} showNumbers={true} showControls={true} />
      </div>

      {/* Audio Playback Button */}
      <button
        onClick={() => audioService.playKana(symbol.kana)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold mb-4 transition cursor-pointer"
      >
        <Volume2 className="w-3.5 h-3.5 text-rose-500" />
        <span>{isEn ? 'Audio' : 'Произношение'}</span>
      </button>

      {/* Answer Input */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            autoFocus
            disabled={answered}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEn ? 'Type romaji (e.g. ka)...' : 'Введите ромаджи (например: ka)...'}
            className={`w-full px-5 py-3 rounded-2xl text-center text-lg font-bold font-mono tracking-wider border transition outline-none ${
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
            {isEn ? 'Correct answer: ' : 'Правильный ответ: '}
            <span className="font-mono underline text-sm">
              {symbol.romaji.join(', ')}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!answered && !inputVal.trim()}
          className="w-full max-w-xs mt-4 py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {answered ? (
            <>
              <span>{isEn ? 'Next' : 'Дальше'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <span>{isEn ? 'Check answer' : 'Проверить ответ'}</span>
          )}
        </button>
      </form>
    </div>
  );
};
