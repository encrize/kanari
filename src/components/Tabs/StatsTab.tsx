import React from 'react';
import {
  Flame,
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { AppSettings, AppStatistics, CharacterMistake } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { TRANSLATIONS } from '../../data/translations';
import { KanaHeatmap } from '../Common/KanaHeatmap';

interface StatsTabProps {
  stats: AppStatistics;
  settings: AppSettings;
  onPracticeMistakes: (characters: string[]) => void;
  onResetStats: () => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  stats,
  settings,
  onPracticeMistakes,
  onResetStats,
}) => {
  const isEn = settings.language === 'en';
  const t = TRANSLATIONS[settings.language];

  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
      : 0;

  // Mistakes sorted by failure count
  const mistakeList: CharacterMistake[] = Object.values(stats.characters)
    .filter((c) => c.failedCount > 0)
    .sort((a, b) => b.failedCount - a.failedCount);

  const handleStartMistakesPractice = () => {
    if (mistakeList.length === 0) return;
    const kanaList = mistakeList.slice(0, 15).map((m) => m.kana);
    onPracticeMistakes(kanaList);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {/* Streak */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isEn ? 'Daily Streak' : 'Ударный режим'}
            </span>
            <Flame className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.streak}
            </span>
            <span className="text-xs text-slate-400 ml-1">{isEn ? 'days' : 'дн.'}</span>
            <p className="text-[11px] text-slate-400 mt-1">
              {isEn ? `Best: ${stats.bestStreak} days` : `Рекорд: ${stats.bestStreak} дн.`}
            </p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isEn ? 'Accuracy' : 'Точность'}
            </span>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {accuracy}%
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {isEn
                ? `${stats.correctAttempts} of ${stats.totalAttempts} correct`
                : `${stats.correctAttempts} из ${stats.totalAttempts} верно`}
            </p>
          </div>
        </div>

        {/* Practiced characters */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isEn ? 'Practiced' : 'Изучено знаков'}
            </span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {Object.keys(stats.characters).length}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {isEn ? 'characters trained' : 'в катакане и хирагане'}
            </p>
          </div>
        </div>

        {/* Completed stages */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isEn ? 'Completed' : 'Пройдено'}
            </span>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.completedStagesCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {isEn ? 'sessions finished' : 'сессий завершено'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Heatmap */}
      <div className="mb-8">
        <KanaHeatmap settings={settings} stats={stats} />
      </div>

      {/* Weak Characters (Mistakes Section) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>{isEn ? 'Most Failed Characters' : 'Трудные знаки (Частые ошибки)'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn
                ? 'Characters you missed or struggled with during practice'
                : 'Символы, в которых вы допускали ошибки во время тренировок'}
            </p>
          </div>

          {mistakeList.length > 0 && (
            <button
              onClick={handleStartMistakesPractice}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {isEn
                ? `Practice These Mistakes (${mistakeList.length})`
                : `Отработать эти ошибки (${mistakeList.length})`}
            </button>
          )}
        </div>

        {mistakeList.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'No mistakes recorded yet!' : 'Ошибок нет!'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEn
                ? 'Every character has been answered cleanly. Keep going!'
                : 'Все знаки распознаются безошибочно. Продолжайте в том же духе!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {mistakeList.map((m) => {
              const totalCharAttempts = m.failedCount + m.rightCount;
              const charAccuracy = Math.round(
                (m.rightCount / totalCharAttempts) * 100
              );

              return (
                <div
                  key={m.kana}
                  onClick={() => audioService.playKana(m.kana)}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-rose-400 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-noto-sans text-slate-900 dark:text-white">
                      {m.kana}
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-rose-500 block">
                        {m.romaji}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {isEn ? `Mistakes: ${m.failedCount}` : `Ошибок: ${m.failedCount}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold ${
                        charAccuracy < 60
                          ? 'text-rose-500'
                          : charAccuracy < 80
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {charAccuracy}%
                    </span>
                    <Volume2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset progress */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (
              window.confirm(
                isEn
                  ? 'Are you sure you want to reset all training stats and progress?'
                  : 'Вы действительно хотите сбросить весь прогресс и историю ошибок?'
              )
            ) {
              onResetStats();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isEn ? 'Reset training statistics' : 'Сбросить данные прогресса'}</span>
        </button>
      </div>
    </div>
  );
};
