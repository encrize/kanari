import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Flame, RotateCcw, ArrowRight, AlertTriangle } from 'lucide-react';
import { CharacterMistake } from '../../types/kana';
import { audioService } from '../../services/audioService';

interface SessionCompleteModalProps {
  isOpen: boolean;
  accuracy: number;
  totalAnswered: number;
  correctCount: number;
  streak: number;
  sessionMistakes: CharacterMistake[];
  onRestart: () => void;
  onNextStage?: () => void;
  onPracticeMistakes?: () => void;
  language?: 'ru' | 'en';
}

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  isOpen,
  accuracy,
  totalAnswered,
  correctCount,
  streak,
  sessionMistakes,
  onRestart,
  onNextStage,
  onPracticeMistakes,
  language = 'en',
}) => {
  if (!isOpen) return null;
  const isEn = language === 'en';

  useEffect(() => {
    audioService.playCompleteSound();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-pop">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl flex flex-col items-center text-center">
        {/* Trophy icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
          <Trophy className="w-7 h-7" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {isEn ? 'Session Completed!' : 'Тренировка завершена!'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isEn ? 'Great job mastering the Japanese writing system!' : 'Отличный прогресс в изучении каны!'}
        </p>

        {/* Score metrics */}
        <div className="grid grid-cols-3 gap-2 w-full my-5">
          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {isEn ? 'Accuracy' : 'Точность'}
            </span>
            <span className="text-lg font-black text-emerald-500 font-mono mt-0.5">
              {Math.round(accuracy)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {isEn ? 'Score' : 'Верно'}
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {correctCount}/{totalAnswered}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {isEn ? 'Streak' : 'Стрик'}
            </span>
            <div className="flex items-center gap-1 text-rose-500 mt-0.5">
              <Flame className="w-3.5 h-3.5 fill-rose-500" />
              <span className="text-lg font-black font-mono">{streak}</span>
            </div>
          </div>
        </div>

        {/* Mistakes review in this session */}
        {sessionMistakes.length > 0 && (
          <div className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl p-3 mb-5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isEn ? `Characters to review (${sessionMistakes.length}):` : `Символы с ошибками (${sessionMistakes.length}):`}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sessionMistakes.map((m) => (
                <div
                  key={m.kana}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 text-xs"
                >
                  <span className="font-noto-sans font-black text-slate-900 dark:text-white">
                    {m.kana}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {m.romaji}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          {sessionMistakes.length > 0 && onPracticeMistakes && (
            <button
              onClick={onPracticeMistakes}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs transition cursor-pointer"
            >
              {isEn ? 'Practice Mistake Characters' : 'Отработать эти ошибки'}
            </button>
          )}

          {onNextStage && (
            <button
              onClick={onNextStage}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isEn ? 'Next Stage' : 'Следующий режим'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEn ? 'Try Again' : 'Пройти заново'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
