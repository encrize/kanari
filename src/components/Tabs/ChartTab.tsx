import React, { useState, useMemo } from 'react';
import { Volume2, Search, LayoutGrid, Flame } from 'lucide-react';
import { AppSettings, AppStatistics, KanaSymbol } from '../../types/kana';
import { getGroupsForScript } from '../../utils/kanaUtils';
import { audioService } from '../../services/audioService';
import { CharacterDetailModal } from '../Chart/CharacterDetailModal';
import { TRANSLATIONS } from '../../data/translations';
import { KanaHeatmap } from '../Common/KanaHeatmap';

interface ChartTabProps {
  settings: AppSettings;
  stats: AppStatistics;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
}

export const ChartTab: React.FC<ChartTabProps> = ({
  settings,
  stats,
  onUpdateSettings,
}) => {
  const t = TRANSLATIONS[settings.language];
  const isEn = settings.language === 'en';
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<KanaSymbol | null>(null);

  const groups = useMemo(() => {
    return getGroupsForScript(settings.activeScript);
  }, [settings.activeScript]);

  const categories = [
    { id: 'all', label: isEn ? 'All Categories' : 'Все категории' },
    { id: 'basic', label: isEn ? 'Basic (Gojūon)' : 'Основные (Годжуон)' },
    { id: 'look-alike', label: isEn ? 'Look-alikes' : 'Похожие знаки' },
    { id: 'dakuten', label: isEn ? 'Dakuten (Nigori)' : 'Дакутэн (Нигори)' },
    { id: 'handakuten', label: isEn ? 'Handakuten' : 'Хандакутэн' },
    { id: 'yoon', label: isEn ? 'Yōon (Combos)' : 'Сочетания (Ёон)' },
    { id: 'loan', label: isEn ? 'Loan Words' : 'Заимствованные (Loan)' },
  ];

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'basic') return !g.tags || g.tags.length === 0;
      return g.tags?.includes(activeCategory);
    });
  }, [groups, activeCategory]);

  const handlePlaySound = (e: React.MouseEvent, kana: string) => {
    e.stopPropagation();
    audioService.playKana(kana);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Bar: Script Toggle + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        {/* Script Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() =>
              onUpdateSettings((prev) => ({ ...prev, activeScript: 'katakana' }))
            }
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              settings.activeScript === 'katakana'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.scriptKatakana}
          </button>
          <button
            onClick={() =>
              onUpdateSettings((prev) => ({ ...prev, activeScript: 'hiragana' }))
            }
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              settings.activeScript === 'hiragana'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.scriptHiragana}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isEn ? 'Table' : 'Сетка'}</span>
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'heatmap'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isEn ? 'Heatmap' : 'Теплокарта'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Search kana or romaji...' : 'Поиск по кане или ромаджи...'}
            className="w-full pl-9 pr-4 py-2 rounded-2xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Content View: Table or Heatmap */}
      {viewMode === 'heatmap' ? (
        <KanaHeatmap settings={settings} stats={stats} script={settings.activeScript} />
      ) : (
        <>
          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Kana Rows Display */}
          <div className="space-y-6">
            {filteredGroups.map((group) => {
              const symbols = group.symbols.filter((s) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.trim().toLowerCase();
                return (
                  s.kana.includes(q) ||
                  s.romaji.some((r) => r.toLowerCase().includes(q))
                );
              });

              if (symbols.length === 0) return null;

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {group.label}
                    </span>
                    {group.tags?.includes('look-alike') && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {isEn ? 'Look-alike Set' : 'Похожие начертания'}
                      </span>
                    )}
                  </div>

                  {/* Grid of character cards */}
                  <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-2.5">
                    {symbols.map((sym) => (
                      <div
                        key={sym.kana}
                        onClick={() => {
                          audioService.playKana(sym.kana);
                          setSelectedSymbol(sym);
                        }}
                        className="group relative p-3 sm:p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/50 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 border border-slate-200/70 dark:border-slate-700/60 hover:border-rose-400 dark:hover:border-rose-500 flex flex-col items-center justify-center transition-all cursor-pointer"
                      >
                        {/* Character */}
                        <span className="text-2xl sm:text-3xl font-black font-noto-sans text-slate-900 dark:text-white group-hover:scale-105 transition-transform">
                          {sym.kana}
                        </span>

                        {/* Romaji */}
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 group-hover:text-rose-500 mt-1">
                          {sym.romaji[0]}
                        </span>

                        {/* Audio trigger icon */}
                        <button
                          onClick={(e) => handlePlaySound(e, sym.kana)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full text-slate-300 group-hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                          title={isEn ? 'Play sound' : 'Слушать звук'}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Character Inspection & Animated Stroke Order Modal */}
      <CharacterDetailModal
        symbol={selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
        settings={settings}
        characterStats={selectedSymbol ? stats.characters[selectedSymbol.kana] : undefined}
      />
    </div>
  );
};
