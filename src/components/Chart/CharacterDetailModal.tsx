import React, { useEffect } from 'react';
import { X, Volume2, BookOpen, AlertCircle, BarChart2 } from 'lucide-react';
import { KanaSymbol, AppSettings, CharacterMistake, ProficiencyLevel } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { StrokeAnimator } from '../Common/StrokeAnimator';
import { KANA_WORDS } from '../../data/words';
import { srsService } from '../../services/srsService';

interface CharacterDetailModalProps {
  symbol: KanaSymbol | null;
  onClose: () => void;
  settings: AppSettings;
  characterStats?: CharacterMistake;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  symbol,
  onClose,
  settings,
  characterStats,
}) => {
  if (!symbol) return null;
  const isEn = settings.language === 'en';

  const proficiency: ProficiencyLevel = srsService.calculateProficiency(characterStats);
  const totalAttempts = characterStats?.totalAttempts || ((characterStats?.rightCount || 0) + (characterStats?.failedCount || 0));
  const correctCount = characterStats?.rightCount || 0;
  const accuracyPct = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const avgResponseTimeSec = characterStats?.totalResponseTimeMs && totalAttempts > 0
    ? (characterStats.totalResponseTimeMs / totalAttempts / 1000).toFixed(1)
    : totalAttempts > 0 ? '2.0' : '-';

  const getProficiencyBadge = (level: ProficiencyLevel) => {
    switch (level) {
      case 'mastered':
        return { label: isEn ? 'Mastered (Bright Green)' : 'Освоено (Отлично)', color: 'bg-emerald-500 text-white' };
      case 'good':
        return { label: isEn ? 'Good (Green)' : 'Хорошо (Зеленый)', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40' };
      case 'learning':
        return { label: isEn ? 'Learning (Yellow/Orange)' : 'В процессе (Оранжевый)', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40' };
      case 'critical':
        return { label: isEn ? 'Needs Practice (Red)' : 'Требует практики (Красный)', color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40' };
      default:
        return { label: isEn ? 'Not Studied Yet' : 'Не изучался', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700' };
    }
  };

  const badge = getProficiencyBadge(proficiency);

  // Find sample words containing this kana
  const exampleWords = KANA_WORDS.filter((w) => w.k.includes(symbol.kana)).slice(0, 4);

  // Mnemonic tips for famous Katakana lookalikes
  const getLookAlikeNote = (kana: string) => {
    if (isEn) {
      switch (kana) {
        case 'シ':
          return 'In [シ] (shi), the strokes rise from bottom to top, like sea spray rising up.';
        case 'ツ':
          return 'In [ツ] (tsu), the strokes point downward vertically, like needles or rain dropping down.';
        case 'ソ':
          return 'In [ソ] (so), the left stroke aims downward, steep diagonal.';
        case 'ン':
          return 'In [ン] (n), the long stroke sweeps upward from the bottom left.';
        case 'ノ':
          return 'A single curved sweep arcing down to the left.';
        case 'ウ':
          return 'Similar to [ワ] and [フ], but has a vertical mark on the top roof.';
        case 'ワ':
          return 'Unlike [ウ], it has a flat top with no vertical mark.';
        case 'ク':
          return 'Similar to [ワ], but the top stroke is a diagonal slash.';
        default:
          return null;
      }
    } else {
      switch (kana) {
        case 'シ':
          return 'Штрихи в [シ] (си) идут снизу вверх, как волна цунами, смотрящая в лицо.';
        case 'ツ':
          return 'Штрихи в [ツ] (цу) падают вертикально, сверху вниз, как капли дождя.';
        case 'ソ':
          return 'В [ソ] (со) левый штрих направлен сверху вниз, основной штрих круче.';
        case 'ン':
          return 'В [ン] (н) длинный штрих начинается снизу и скользит вверх направо.';
        case 'ノ':
          return 'Одиночный штрих плавно изгибается сверху вниз направо.';
        case 'ウ':
          return 'Похож на [ワ] и [フ], но имеет вертикальную шапочку сверху.';
        case 'ワ':
          return 'В отличие от [ウ], не имеет центрального верхнего штриха.';
        case 'ク':
          return 'Похож на [ワ], но верхняя черта диагональная.';
        default:
          return null;
      }
    }
  };

  const lookAlikeNote = getLookAlikeNote(symbol.kana);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Character Title & Sound */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-18 h-18 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center font-noto-sans text-4xl sm:text-5xl font-black text-rose-500 shadow-xs">
            {symbol.kana}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {symbol.romaji[0]}
              </h3>
              <button
                onClick={() => audioService.playKana(symbol.kana)}
                className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition cursor-pointer"
                title={isEn ? 'Hear pronunciation' : 'Слушать произношение'}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? `Spelling variants: ${symbol.romaji.join(', ')}` : `Варианты написания: ${symbol.romaji.join(', ')}`}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Learning Statistics Summary */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEn ? 'Learning Performance' : 'Показатели изучения'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                {isEn ? 'Attempts' : 'Попыток'}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {totalAttempts}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                {isEn ? 'Correct' : 'Верно'}
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {correctCount}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                {isEn ? 'Accuracy' : 'Точность'}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {accuracyPct}%
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                {isEn ? 'Avg Time' : 'Ср. время'}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {avgResponseTimeSec}s
              </span>
            </div>
          </div>
        </div>

        {/* Stroke Order Animation */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 mb-6 flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {isEn ? 'Animated Stroke Order' : 'Анимированный порядок черт'}
          </span>
          <StrokeAnimator kana={symbol.kana} size={170} autoPlay={true} showNumbers={true} showControls={true} />
        </div>

        {/* Look-alike Warning for Katakana */}
        {lookAlikeNote && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                {isEn ? 'Stroke Direction & Look-alike Note:' : 'Особенность начертания:'}
              </strong>
              {lookAlikeNote}
            </div>
          </div>
        )}

        {/* Example vocabulary words */}
        {exampleWords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <BookOpen className="w-4 h-4 text-rose-500" />
              <span>{isEn ? 'Example Words with this Kana:' : 'Примеры слов с этим символом:'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exampleWords.map((word) => (
                <div
                  key={word.id}
                  onClick={() => audioService.playKana(word.k)}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-400 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <span className="text-base font-black font-noto-sans text-slate-900 dark:text-white block">
                      {word.k}
                    </span>
                    <span className="text-[11px] font-mono text-rose-500 font-bold block">
                      {word.r}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                      {isEn ? word.e.join(', ') : (word.ru || word.e[0])}
                    </span>
                  </div>
                  <Volume2 className="w-4 h-4 text-slate-400 hover:text-rose-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
