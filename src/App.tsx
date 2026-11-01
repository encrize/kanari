import React, { useState, useEffect } from 'react';
import { AppSettings, AppStatistics } from './types/kana';
import { storageService, DEFAULT_SETTINGS, DEFAULT_STATS } from './services/storageService';
import { audioService } from './services/audioService';
import { Header } from './components/Header';
import { PracticeTab } from './components/Tabs/PracticeTab';
import { WordModeTab } from './components/Tabs/WordModeTab';
import { TofuguQuizTab } from './components/Tabs/TofuguQuizTab';
import { ChartTab } from './components/Tabs/ChartTab';
import { StatsTab } from './components/Tabs/StatsTab';
import { SettingsTab } from './components/Tabs/SettingsTab';
import { ProInfoModal } from './components/Modals/ProInfoModal';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => storageService.loadSettings());
  const [stats, setStats] = useState<AppStatistics>(() => storageService.loadStats());
  const [activeTab, setActiveTab] = useState<'practice' | 'words' | 'tofugu' | 'chart' | 'stats' | 'settings'>('practice');
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [forcedPracticeList, setForcedPracticeList] = useState<string[]>([]);

  // Synchronize audio service settings and theme
  useEffect(() => {
    audioService.setVoice(settings.voice);
    audioService.setVoiceSpeed(settings.voiceSpeed);
    audioService.setMuted(!settings.soundEnabled);
    audioService.setSoundFxMuted(!settings.soundFxEnabled);

    // Apply dark/light class to root document element
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Preload audio
    audioService.preloadAudio();
  }, [settings]);

  // Persist settings changes
  const handleUpdateSettings = (updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      storageService.saveSettings(next);
      return next;
    });
  };

  // Launch practice for specific failed characters
  const handlePracticeMistakes = (characters: string[]) => {
    setForcedPracticeList(characters);
    setActiveTab('practice');
  };

  const handleResetProgress = () => {
    storageService.resetAllProgress();
    setStats(DEFAULT_STATS);
  };

  // Font family class
  const fontClass =
    settings.preferredFont === 'noto-sans-jp'
      ? 'font-noto-sans'
      : settings.preferredFont === 'shippori-mincho'
      ? 'font-shippori-mincho'
      : settings.preferredFont === 'm-plus-rounded'
      ? 'font-m-plus-rounded'
      : settings.preferredFont === 'dela-gothic'
      ? 'font-dela-gothic'
      : settings.preferredFont === 'klee-one'
      ? 'font-klee-one'
      : settings.preferredFont === 'noto-serif-jp'
      ? 'font-noto-serif'
      : 'font-zen-maru';

  return (
    <div className={`min-h-screen flex flex-col ${fontClass} bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-150`}>
      {/* Navigation Header */}
      <Header
        settings={settings}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setForcedPracticeList([]);
        }}
        onUpdateSettings={handleUpdateSettings}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        {activeTab === 'practice' && (
          <PracticeTab
            settings={settings}
            stats={stats}
            onUpdateStats={setStats}
            onUpdateSettings={handleUpdateSettings}
            forcedPracticeCharacters={forcedPracticeList}
          />
        )}

        {activeTab === 'words' && (
          <WordModeTab
            settings={settings}
            stats={stats}
            onUpdateStats={setStats}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'tofugu' && (
          <TofuguQuizTab
            settings={settings}
            stats={stats}
            onUpdateStats={setStats}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'chart' && (
          <ChartTab
            settings={settings}
            stats={stats}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            stats={stats}
            settings={settings}
            onPracticeMistakes={handlePracticeMistakes}
            onResetStats={handleResetProgress}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">
              kanari
            </span>
            <span>·</span>
            <span>Japanese kana, made simple</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsProModalOpen(true)}
              className="hover:text-rose-500 font-medium transition cursor-pointer"
            >
              All Features
            </button>
          </div>
        </div>
      </footer>

      {/* Pro Unlocked Info Modal */}
      <ProInfoModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        language={settings.language}
      />
    </div>
  );
};
