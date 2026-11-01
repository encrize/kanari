import React, { useState } from 'react';
import { AppSettings, AppStatistics, KanaSymbol, ScriptType, ProficiencyLevel } from '../../types/kana';
import { getGroupsForScript } from '../../utils/kanaUtils';
import { srsService } from '../../services/srsService';
import { audioService } from '../../services/audioService';
import { CharacterDetailModal } from '../Chart/CharacterDetailModal';

interface KanaHeatmapProps {
  settings: AppSettings;
  stats: AppStatistics;
  script?: ScriptType;
}

export const KanaHeatmap: React.FC<KanaHeatmapProps> = ({
  settings,
  stats,
  script,
}) => {
  const isEn = settings.language === 'en';
  const targetScript = script || settings.activeScript;
  const groups = getGroupsForScript(targetScript);
  const [selectedSymbol, setSelectedSymbol] = useState<KanaSymbol | null>(null);

  const getHeatmapColor = (level: ProficiencyLevel): string => {
    switch (level) {
      case 'mastered':
        // Bright Vibrant Green
        return 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-400';
      case 'good':
        // Green
        return 'bg-emerald-600/60 dark:bg-emerald-600/50 text-white hover:bg-emerald-500/70';
      case 'learning':
        // Yellow / Orange
        return 'bg-amber-400/80 dark:bg-amber-500/70 text-slate-900 dark:text-white hover:bg-amber-400';
      case 'critical':
        // Red
        return 'bg-rose-500 text-white shadow-xs hover:bg-rose-400';
      default:
        // Gray (not studied)
        return 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800 hover:border-slate-400';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isEn ? 'Kana Proficiency Heatmap' : 'Тепловая карта освоения каны'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEn
              ? 'Color indicates accuracy, response speed, and adaptive SRS difficulty'
              : 'Цвет отражает точность ответов, скорость реакции и уровень SRS'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
            {isEn ? 'Legend:' : 'Шкала:'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
            <span>{isEn ? 'New' : 'Новый'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-rose-500" />
            <span>{isEn ? 'Critical' : 'Ошибки'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-400" />
            <span>{isEn ? 'Learning' : 'В процессе'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600/70" />
            <span>{isEn ? 'Good' : 'Хорошо'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500" />
            <span>{isEn ? 'Mastered' : 'Освоено'}</span>
          </div>
        </div>
      </div>

      {/* Grid of characters organized by groups */}
      <div className="space-y-4 overflow-x-auto pb-2 scrollbar-none">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="w-24 shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {group.label}
            </span>

            <div className="flex flex-wrap gap-1.5">
              {group.symbols.map((sym) => {
                const charStat = stats.characters[sym.kana];
                const level = srsService.calculateProficiency(charStat);
                const colorCls = getHeatmapColor(level);

                return (
                  <button
                    key={sym.kana}
                    onClick={() => {
                      audioService.playKana(sym.kana);
                      setSelectedSymbol(sym);
                    }}
                    title={`${sym.kana} (${sym.romaji[0]}): ${level}`}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center transition-all transform hover:scale-110 cursor-pointer ${colorCls}`}
                  >
                    <span className="text-sm sm:text-base font-black leading-tight font-noto-sans">
                      {sym.kana}
                    </span>
                    <span className="text-[9px] font-mono opacity-80 leading-none">
                      {sym.romaji[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Character Details Modal */}
      {selectedSymbol && (
        <CharacterDetailModal
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
          settings={settings}
          characterStats={stats.characters[selectedSymbol.kana]}
        />
      )}
    </div>
  );
};
