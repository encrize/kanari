import React, { useState, useEffect } from 'react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { shuffleArray } from '../../utils/kanaUtils';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface CardItem {
  id: string;
  pairKey: string;
  display: string;
  type: 'kana' | 'romaji';
  matched: boolean;
}

interface StagePairMatchProps {
  activeSymbols: KanaSymbol[];
  settings: AppSettings;
  onFinish: () => void;
}

export const StagePairMatch: React.FC<StagePairMatchProps> = ({
  activeSymbols,
  settings,
  onFinish,
}) => {
  const isEn = settings.language === 'en';
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<CardItem | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [pairsLeft, setPairsLeft] = useState(0);

  const initGame = () => {
    const sample = shuffleArray(activeSymbols).slice(0, 6);
    const cardList: CardItem[] = [];

    sample.forEach((sym) => {
      cardList.push({
        id: `k-${sym.kana}`,
        pairKey: sym.kana,
        display: sym.kana,
        type: 'kana',
        matched: false,
      });
      cardList.push({
        id: `r-${sym.kana}`,
        pairKey: sym.kana,
        display: sym.romaji[0],
        type: 'romaji',
        matched: false,
      });
    });

    setCards(shuffleArray(cardList));
    setSelectedFirst(null);
    setWrongIds([]);
    setPairsLeft(sample.length);
  };

  useEffect(() => {
    initGame();
  }, [activeSymbols]);

  const handleCardClick = (card: CardItem) => {
    if (card.matched || wrongIds.length > 0) return;
    if (selectedFirst?.id === card.id) return;

    if (!selectedFirst) {
      setSelectedFirst(card);
      return;
    }

    // Second card picked
    const isMatch = selectedFirst.pairKey === card.pairKey && selectedFirst.type !== card.type;

    if (isMatch) {
      audioService.playCorrectSound();

      setCards((prev) =>
        prev.map((c) =>
          c.pairKey === card.pairKey ? { ...c, matched: true } : c
        )
      );
      setSelectedFirst(null);

      const nextPairsLeft = pairsLeft - 1;
      setPairsLeft(nextPairsLeft);

      if (nextPairsLeft <= 0) {
        audioService.playCompleteSound();
        setTimeout(() => {
          onFinish();
        }, 800);
      }
    } else {
      audioService.playWrongSound();
      setWrongIds([selectedFirst.id, card.id]);
      setTimeout(() => {
        setSelectedFirst(null);
        setWrongIds([]);
      }, 700);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full px-4 animate-pop">
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {isEn ? 'Match pairs: Kana and its reading' : 'Соедините пары: кана и её чтение'}
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          {isEn ? `Pairs left: ${pairsLeft}` : `Осталось пар: ${pairsLeft}`}
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full">
        {cards.map((card) => {
          const isSelected = selectedFirst?.id === card.id;
          const isWrong = wrongIds.includes(card.id);

          if (card.matched) {
            return (
              <div
                key={card.id}
                className="aspect-square rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 flex items-center justify-center opacity-40 transition-all select-none"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            );
          }

          let cardStyle =
            'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700';

          if (isSelected) {
            cardStyle =
              'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 scale-102 shadow-xs';
          } else if (isWrong) {
            cardStyle =
              'border-2 border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-shake';
          }

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`aspect-square rounded-2xl flex items-center justify-center font-bold transition-all shadow-xs cursor-pointer select-none ${cardStyle}`}
            >
              <span
                className={`${
                  card.type === 'kana'
                    ? 'text-3xl sm:text-4xl font-noto-sans font-black'
                    : 'text-xl sm:text-2xl font-mono font-bold'
                }`}
              >
                {card.display}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={initGame}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isEn ? 'Shuffle' : 'Перемешать'}</span>
        </button>
      </div>
    </div>
  );
};
