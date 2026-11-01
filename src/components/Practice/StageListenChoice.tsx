import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { getMultipleChoiceOptions } from '../../utils/kanaUtils';

interface StageListenChoiceProps {
  symbol: KanaSymbol;
  allSymbols: KanaSymbol[];
  settings: AppSettings;
  onAnswer: (isCorrect: boolean) => void;
}

export const StageListenChoice: React.FC<StageListenChoiceProps> = ({
  symbol,
  allSymbols,
  settings,
  onAnswer,
}) => {
  const isEn = settings.language === 'en';
  const [options, setOptions] = useState<KanaSymbol[]>([]);
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const answerResultRef = useRef<boolean>(false);

  useEffect(() => {
    const opts = getMultipleChoiceOptions(symbol, allSymbols, 4);
    setOptions(opts);
    setSelectedKana(null);
    setIsAnswered(false);

    playPromptAudio();

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, [symbol]);

  const playPromptAudio = () => {
    setIsPlayingSound(true);
    audioService.playKana(symbol.kana);
    setTimeout(() => setIsPlayingSound(false), 600);
  };

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
    } else {
      audioService.playWrongSound();
    }

    advanceTimerRef.current = window.setTimeout(() => {
      triggerAdvance();
    }, 750);
  };

  // Keyboard number selection (1-4) and quick advance
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
      } else if (e.code === 'Space') {
        e.preventDefault();
        playPromptAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isAnswered, symbol]);

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full px-4 animate-pop">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {isEn ? 'Listen to audio and pick matching kana:' : 'Слушайте произношение и выберите кану:'}
      </span>

      {/* Big Audio Replay Pulse Button */}
      <div className="my-6">
        <button
          onClick={playPromptAudio}
          className={`relative w-26 h-26 rounded-full flex items-center justify-center text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
            isPlayingSound ? 'ring-8 ring-rose-500/20' : ''
          }`}
          title={isEn ? 'Click or press Space to replay' : 'Нажмите или пробел, чтобы повторить'}
        >
          <Volume2 className="w-10 h-10" />
        </button>
        <div className="text-center mt-2 text-xs text-slate-400 font-medium">
          {isEn ? '[Space] to replay' : '[Пробел] - повторить звук'}
        </div>
      </div>

      {/* 4 Kana Choices */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((opt, idx) => {
          const isSelected = selectedKana === opt.kana;
          const isCorrect = opt.kana === symbol.kana;

          let btnStyle =
            'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white shadow-xs';

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
              <span className="text-4xl font-black">{opt.kana}</span>
              {isAnswered && isCorrect && (
                <span className="text-xs font-mono font-bold mt-1 text-emerald-500">
                  {opt.romaji[0]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
