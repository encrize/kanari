import React from 'react';
import { Sparkles, CheckCircle2, X, Lock } from 'lucide-react';
import { ALL_QUIZ_STAGES } from '../../data/stages';
import { TRANSLATIONS } from '../../data/translations';

interface ProInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ru' | 'en';
}

export const ProInfoModal: React.FC<ProInfoModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const isEn = language === 'en';
  const t = TRANSLATIONS[language];

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-pop cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-xl relative max-h-[90vh] overflow-y-auto cursor-default"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEn ? 'All Learning Features Unlocked' : 'Все режимы обучения'}
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEn ? 'Complete Katakana & Hiragana curriculum' : 'Полная программа катаканы и хираганы'}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
          {isEn
            ? 'Practice all 9 comprehensive study stages, Katakana loanwords vocabulary, and Tofugu-style active recall grid without restrictions.'
            : 'Практикуйте все 9 этапов обучения, словарный режим заимствованных слов и интерактивный квиз по сетке карточек Tofugu без ограничений.'}
        </p>

        {/* Comparison table */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-200/80 dark:divide-slate-800 mb-6 text-xs">
          <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 font-bold grid grid-cols-12 text-slate-700 dark:text-slate-300">
            <span className="col-span-8">{isEn ? 'Mode / Feature' : 'Режим / Функция'}</span>
            <span className="col-span-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">
              {isEn ? 'Status' : 'Статус'}
            </span>
          </div>

          {ALL_QUIZ_STAGES.map((s) => (
            <div key={s.id} className="p-2.5 grid grid-cols-12 items-center text-slate-800 dark:text-slate-200">
              <span className="col-span-8 font-medium">
                {s.stageNumber}. {isEn ? s.titleEn : s.titleRu}
              </span>
              <span className="col-span-4 text-center font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                ✓ {isEn ? 'Unlocked' : 'Доступно'}
              </span>
            </div>
          ))}

          <div className="p-2.5 grid grid-cols-12 items-center text-slate-800 dark:text-slate-200 bg-sky-500/5">
            <span className="col-span-8 font-medium">
              {isEn ? 'Tofugu Style Grid Quiz' : 'Tofugu Квиз по сетке карточек'}
            </span>
            <span className="col-span-4 text-center font-bold text-sky-600 dark:text-sky-400 text-[11px]">
              ✓ {isEn ? 'Unlocked' : 'Доступно'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          {t.proModalClose}
        </button>
      </div>
    </div>
  );
};
