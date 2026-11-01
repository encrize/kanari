import React from 'react';
import {
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Sparkles,
  GraduationCap,
  BookOpen,
  LayoutGrid,
  Table,
  BarChart2,
  Settings,
} from 'lucide-react';
import { AppSettings } from '../types/kana';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  settings: AppSettings;
  activeTab: 'practice' | 'words' | 'tofugu' | 'chart' | 'stats' | 'settings';
  onSelectTab: (tab: 'practice' | 'words' | 'tofugu' | 'chart' | 'stats' | 'settings') => void;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onOpenProModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  onSelectTab,
  onUpdateSettings,
  onOpenProModal,
}) => {
  const t = TRANSLATIONS[settings.language];

  const toggleTheme = () => {
    onUpdateSettings((prev) => {
      const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { ...prev, theme: nextTheme };
    });
  };

  const toggleSound = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const toggleLanguage = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      language: prev.language === 'en' ? 'ru' : 'en',
    }));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0f141f]/95 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('practice')}
            className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-rose-600 transition-colors font-noto-sans">
              カ
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg sm:text-xl text-slate-900 dark:text-white lowercase">
                kanari
              </span>
            </div>
          </button>
        </div>

        {/* Minimalist Navigation Pills */}
        <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 dark:bg-slate-800/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onSelectTab('practice')}
            title={t.tabPractice}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="hidden md:inline">{t.tabPractice}</span>
          </button>

          {/* Word Mode Tab */}
          <button
            onClick={() => onSelectTab('words')}
            title={t.tabWords}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'words'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="hidden md:inline">{t.tabWords}</span>
          </button>

          {/* Tofugu Quiz Tab */}
          <button
            onClick={() => onSelectTab('tofugu')}
            title={t.tabTofugu}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'tofugu'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="hidden md:inline">{t.tabTofugu}</span>
          </button>

          <button
            onClick={() => onSelectTab('chart')}
            title={t.tabChart}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden md:inline">{t.tabChart}</span>
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            title={t.tabStats}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden md:inline">{t.tabStats}</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            title={t.tabSettings}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden md:inline">{t.tabSettings}</span>
          </button>
        </nav>

        {/* Right Action Icons: Clean & Minimalist */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Sound Toggle"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Theme Toggle"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Minimalist Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Switch language"
          >
            {settings.language === 'en' ? '🇬🇧 EN' : '🇷🇺 RU'}
          </button>
        </div>
      </div>
    </header>
  );
};
