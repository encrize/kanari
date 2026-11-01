import React from 'react';
import {
  ListFilter,
  Shuffle,
  Grid,
  Keyboard,
  BookOpen,
  Zap,
  Volume2,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { ALL_QUIZ_STAGES } from '../../data/stages';
import { QuizStageId } from '../../types/kana';

interface StageSelectorBarProps {
  currentStageId: QuizStageId;
  onSelectStage: (id: QuizStageId) => void;
  language: 'ru' | 'en';
}

export const StageSelectorBar: React.FC<StageSelectorBarProps> = ({
  currentStageId,
  onSelectStage,
  language,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'ListFilter':
        return <ListFilter className="w-4 h-4" />;
      case 'Shuffle':
        return <Shuffle className="w-4 h-4" />;
      case 'Grid':
        return <Grid className="w-4 h-4" />;
      case 'Keyboard':
        return <Keyboard className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'Volume2':
        return <Volume2 className="w-4 h-4" />;
      case 'PenTool':
        return <PenTool className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {language === 'en' ? 'Study Stages (1–9)' : 'Режимы обучения (Этапы 1–9)'}
        </span>
      </div>

      {/* Stages grid / scroll with adequate card spacing so labels never overlap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2">
        {ALL_QUIZ_STAGES.map((stage) => {
          const isSelected = stage.id === currentStageId;

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[92px] ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                  : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {getIcon(stage.iconName)}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block leading-tight">
                  {language === 'en' ? `Stage ${stage.stageNumber}` : `Этап ${stage.stageNumber}`}
                </span>
                <span className="text-xs font-bold leading-tight mt-0.5 block line-clamp-1" title={language === 'ru' ? stage.titleRu : stage.titleEn}>
                  {language === 'ru' ? stage.titleRu : stage.titleEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
