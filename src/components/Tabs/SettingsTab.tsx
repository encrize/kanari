import React, { useRef, useState } from 'react';
import {
  Volume2,
  Type,
  Sliders,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shuffle,
} from 'lucide-react';
import { AppSettings, PreferredFont } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { storageService } from '../../services/storageService';
import { getTranslation } from '../../services/i18n';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onResetProgress: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
}) => {
  const isEn = settings.language === 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleVoiceChange = (voice: 'female' | 'male') => {
    onUpdateSettings((prev) => ({ ...prev, voice }));
    audioService.setVoice(voice);
    setTimeout(() => {
      audioService.playKana('ア');
    }, 50);
  };

  const handleSpeedChange = (voiceSpeed: number) => {
    onUpdateSettings((prev) => ({ ...prev, voiceSpeed }));
    audioService.setVoiceSpeed(voiceSpeed);
  };

  const handleFontChange = (preferredFont: PreferredFont) => {
    onUpdateSettings((prev) => ({ ...prev, preferredFont }));
  };

  const toggleJitterFont = (fontId: PreferredFont) => {
    onUpdateSettings((prev) => {
      const current = prev.jitterFonts || [];
      const exists = current.includes(fontId);
      if (exists && current.length <= 1) return prev; // keep at least 1
      const nextFonts = exists ? current.filter((f) => f !== fontId) : [...current, fontId];
      return { ...prev, jitterFonts: nextFonts };
    });
  };

  const fonts: { id: PreferredFont; label: string; sub: string; sample: string; fontClass: string }[] = [
    {
      id: 'noto-sans-jp',
      label: 'Noto Sans JP',
      sub: isEn ? 'Standard clean gothic sans-serif' : 'Стандартный четкий гротеск',
      sample: 'アイウエオ',
      fontClass: 'font-noto-sans',
    },
    {
      id: 'shippori-mincho',
      label: 'Shippori Mincho',
      sub: isEn ? 'Traditional brush Mincho with serifs' : 'Традиционный минчо с засечками',
      sample: 'アイウエオ',
      fontClass: 'font-shippori-mincho',
    },
    {
      id: 'm-plus-rounded',
      label: 'M PLUS Rounded 1c',
      sub: isEn ? 'Friendly soft rounded typography' : 'Дружелюбный округлый мягкий шрифт',
      sample: 'アイウエオ',
      fontClass: 'font-m-plus-rounded',
    },
    {
      id: 'dela-gothic',
      label: 'Dela Gothic One',
      sub: isEn ? 'Bold geometric display typography' : 'Массивный геометричный плакатный шрифт',
      sample: 'アイウエオ',
      fontClass: 'font-dela-gothic',
    },
    {
      id: 'klee-one',
      label: 'Klee One',
      sub: isEn ? 'Natural handwriting pencil style' : 'Естественный рукописный стиль',
      sample: 'アイウエオ',
      fontClass: 'font-klee-one',
    },
  ];

  // Backup Export
  const handleExportBackup = () => {
    try {
      const jsonStr = storageService.exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `kana-pro-backup-${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export error: ${e?.message}`);
    }
  };

  // Backup Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmMsg = isEn
      ? 'Importing a backup will replace your current progress, streaks, and settings. Continue?'
      : 'Импорт резервной копии перезапишет текущий прогресс, серии и настройки. Продолжить?';

    if (!window.confirm(confirmMsg)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storageService.importBackup(content);
      if (res.success) {
        setImportStatus({
          success: true,
          message: isEn ? 'Backup successfully imported! Reloading...' : 'Резервная копия успешно восстановлена!',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus({
          success: false,
          message: res.error || (isEn ? 'Invalid JSON schema' : 'Неверный формат JSON'),
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-pop">
      {/* Voice Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-rose-500" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {getTranslation(settings.language, 'settings.voiceTitle')}
          </h3>
        </div>

        {/* Voice Gender Selection */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
            {getTranslation(settings.language, 'settings.voiceSpeaker')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVoiceChange('female')}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                settings.voice === 'female'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold'
                  : 'border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{getTranslation(settings.language, 'settings.voiceFemale')}</span>
              <Volume2 className="w-4 h-4 text-rose-500" />
            </button>

            <button
              onClick={() => handleVoiceChange('male')}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                settings.voice === 'male'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold'
                  : 'border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{getTranslation(settings.language, 'settings.voiceMale')}</span>
              <Volume2 className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Voice Speed */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span>{getTranslation(settings.language, 'settings.voiceSpeed')}</span>
            <span className="font-mono text-rose-500 font-bold">
              {settings.voiceSpeed}x
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0.8, 1.0, 1.2].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.voiceSpeed === spd
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {spd === 1.0 ? getTranslation(settings.language, 'settings.normal') : `${spd}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography & Font Jitter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-5 h-5 text-rose-500" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {getTranslation(settings.language, 'settings.fontTitle')}
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {getTranslation(settings.language, 'settings.fontSubtitle')}
        </p>

        {/* Primary font selector */}
        <div className="mb-6 space-y-2.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {getTranslation(settings.language, 'settings.fontManual')}
          </label>
          {fonts.map((f) => {
            const isSelected = settings.preferredFont === f.id;
            return (
              <div
                key={f.id}
                onClick={() => handleFontChange(f.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {f.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {f.sub}
                  </div>
                </div>

                <div className={`text-2xl font-bold tracking-widest ${f.fontClass}`}>
                  {f.sample}
                </div>
              </div>
            );
          })}
        </div>

        {/* Font Jitter Toggle & Checklist */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {getTranslation(settings.language, 'settings.fontJitterToggle')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {getTranslation(settings.language, 'settings.fontJitterDesc')}
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  fontJitterEnabled: !prev.fontJitterEnabled,
                }))
              }
              className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${
                settings.fontJitterEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.fontJitterEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings.fontJitterEnabled && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2 mt-3 animate-pop">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {getTranslation(settings.language, 'settings.jitterPool')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fonts.map((f) => {
                  const isChecked = (settings.jitterFonts || []).includes(f.id);
                  return (
                    <label
                      key={f.id}
                      onClick={() => toggleJitterFont(f.id)}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-rose-500 focus:ring-rose-500"
                      />
                      <span className={f.fontClass}>{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audio Toggles & Sound Effects */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-rose-500" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {getTranslation(settings.language, 'settings.soundsTitle')}
          </h3>
        </div>

        <div className="space-y-4 text-xs font-semibold">
          {/* Sound FX */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-800 dark:text-slate-200 font-bold">
                {getTranslation(settings.language, 'settings.soundFx')}
              </div>
              <div className="text-slate-400 font-normal">
                {getTranslation(settings.language, 'settings.soundFxDesc')}
              </div>
            </div>
            <button
              onClick={() => {
                const nextVal = !settings.soundFxEnabled;
                onUpdateSettings((prev) => ({ ...prev, soundFxEnabled: nextVal }));
                audioService.setSoundFxMuted(!nextVal);
                if (nextVal) audioService.playCorrectSound();
              }}
              className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${
                settings.soundFxEnabled ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.soundFxEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto play sound */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-slate-800 dark:text-slate-200 font-bold">
                {getTranslation(settings.language, 'settings.soundAutoplay')}
              </div>
              <div className="text-slate-400 font-normal">
                {getTranslation(settings.language, 'settings.soundAutoplayDesc')}
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  autoPlayAudio: !prev.autoPlayAudio,
                }))
              }
              className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${
                settings.autoPlayAudio ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoPlayAudio ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Backup Export / Import */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-5 h-5 text-sky-500" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {getTranslation(settings.language, 'settings.backupTitle')}
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {getTranslation(settings.language, 'settings.backupSubtitle')}
        </p>

        {importStatus && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Button */}
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{getTranslation(settings.language, 'settings.exportBtn')}</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{getTranslation(settings.language, 'settings.importBtn')}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Reset Data */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            if (
              window.confirm(
                isEn
                  ? 'Reset all progress, streaks, and mistake records?'
                  : 'Сбросить весь прогресс, стрик и историю ошибок?'
              )
            ) {
              onResetProgress();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{getTranslation(settings.language, 'settings.resetBtn')}</span>
        </button>
      </div>
    </div>
  );
};
