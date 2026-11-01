import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Zap, RotateCcw, Trophy } from 'lucide-react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { normalizeRomajiInput } from '../../utils/kanaUtils';

interface StreamItem {
  id: string;
  symbol: KanaSymbol;
  progress: number; // 0 to 100
  lane: number; // 0 to 3
}

interface StageTypeStreamProps {
  activeSymbols: KanaSymbol[];
  settings: AppSettings;
  onFinish: (score: number) => void;
}

export const StageTypeStream: React.FC<StageTypeStreamProps> = ({
  activeSymbols,
  settings,
  onFinish,
}) => {
  const isEn = settings.language === 'en';
  const [items, setItems] = useState<StreamItem[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [gameOver, setGameOver] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<StreamItem[]>([]);
  const livesRef = useRef(3);
  const gameOverRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastSpawnTimeRef = useRef<number>(performance.now());

  // Keep ref sync
  itemsRef.current = items;
  livesRef.current = lives;
  gameOverRef.current = gameOver;

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setGameOver(true);
      gameOverRef.current = true;
      audioService.playWrongSound();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    },
    []
  );

  // Smooth requestAnimationFrame game loop
  useEffect(() => {
    if (gameOver || activeSymbols.length === 0) return;

    lastTimeRef.current = performance.now();
    lastSpawnTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(100, now - lastTimeRef.current); // ms delta
      lastTimeRef.current = now;

      if (gameOverRef.current) return;

      // 1. Move items down (progress from 0 to 100 in ~8 seconds)
      const speed = 0.0125 * dt; // ~12.5% per second
      let currentItems = itemsRef.current;
      const survivingItems: StreamItem[] = [];
      let missedCount = 0;

      for (const item of currentItems) {
        const nextProgress = item.progress + speed;
        if (nextProgress >= 100) {
          missedCount++;
        } else {
          survivingItems.push({ ...item, progress: nextProgress });
        }
      }

      if (missedCount > 0) {
        audioService.playWrongSound();
        setCombo(0);
        const newLives = Math.max(0, livesRef.current - missedCount);
        setLives(newLives);
        livesRef.current = newLives;

        if (newLives <= 0) {
          handleGameOver(score);
          return;
        }
      }

      // 2. Spawn new kana item every 1.8 seconds (max 4 on screen)
      if (now - lastSpawnTimeRef.current > 1800 && survivingItems.length < 4) {
        const randomSymbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
        const usedLanes = new Set(survivingItems.filter((i) => i.progress < 25).map((i) => i.lane));
        const availableLanes = [0, 1, 2, 3].filter((l) => !usedLanes.has(l));
        const lane = availableLanes.length > 0
          ? availableLanes[Math.floor(Math.random() * availableLanes.length)]
          : Math.floor(Math.random() * 4);

        survivingItems.push({
          id: `${randomSymbol.kana}-${Math.random()}`,
          symbol: randomSymbol,
          progress: 0,
          lane,
        });
        lastSpawnTimeRef.current = now;
      }

      setItems(survivingItems);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameOver, activeSymbols, handleGameOver, score]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputVal(rawVal);

    const val = normalizeRomajiInput(rawVal);
    if (!val) return;

    // Find all falling items matching this romaji
    const matchingItems = items.filter((it) =>
      it.symbol.romaji.some((r) => r.toLowerCase() === val)
    );

    if (matchingItems.length > 0) {
      // Pick the item closest to the critical line (highest progress)
      matchingItems.sort((a, b) => b.progress - a.progress);
      const targetItem = matchingItems[0];

      audioService.playCorrectSound();

      setItems((prev) => prev.filter((it) => it.id !== targetItem.id));
      setScore((s) => s + 10 + combo * 2);
      setCombo((c) => c + 1);
      setInputVal('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Hitting enter clears typed input on typo
      setInputVal('');
    }
  };

  const restartGame = () => {
    setLives(3);
    livesRef.current = 3;
    setScore(0);
    setCombo(0);
    setItems([]);
    itemsRef.current = [];
    setGameOver(false);
    gameOverRef.current = false;
    setInputVal('');
    lastSpawnTimeRef.current = performance.now();
    setTimeout(focusInput, 50);
  };

  return (
    <div
      onClick={focusInput}
      className="flex flex-col items-center max-w-lg mx-auto w-full px-4 animate-pop select-none cursor-pointer"
    >
      {/* HUD: Lives, Score, Combo */}
      <div className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-4 py-2.5 rounded-2xl mb-4 shadow-xs">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((heartIndex) => (
            <Heart
              key={heartIndex}
              className={`w-4 h-4 transition-transform ${
                heartIndex <= lives
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Zap className="w-3.5 h-3.5 fill-amber-500" />
              <span>{combo}x Combo</span>
            </div>
          )}

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">
              {isEn ? 'Score' : 'Очки'}
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Stream Playfield */}
      <div className="relative w-full h-[360px] bg-slate-900 dark:bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-md">
        {/* Stream lanes */}
        <div className="absolute inset-0 grid grid-cols-4 divide-x divide-slate-800/40 pointer-events-none" />

        {/* Danger line */}
        <div className="absolute bottom-10 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 opacity-70" />
        <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-mono font-bold tracking-widest uppercase text-rose-400">
          {isEn ? 'Critical Line' : 'Критическая линия'}
        </div>

        {/* Falling kana characters */}
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              left: `${item.lane * 25 + 2.5}%`,
              top: `${item.progress * 0.72}%`,
            }}
            className="absolute w-[20%] aspect-square rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center text-white shadow-md transition-all pointer-events-none"
          >
            <span className="text-3xl font-black font-noto-sans drop-shadow-sm">
              {item.symbol.kana}
            </span>
          </div>
        ))}

        {/* Game over screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-pop z-20">
            <Trophy className="w-10 h-10 text-amber-400 mb-2" />
            <h3 className="text-xl font-black text-white">{isEn ? 'Game Over!' : 'Игра завершена!'}</h3>
            <p className="text-xs text-slate-300 mt-1">
              {isEn ? 'Your final score: ' : 'Ваш итоговый счет: '}
              <span className="text-rose-400 font-bold font-mono text-base">{score}</span>
            </p>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restartGame();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isEn ? 'Play Again' : 'Еще раз'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFinish(score);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                {isEn ? 'Finish' : 'Завершить'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Typing Input */}
      {!gameOver && (
        <div className="w-full mt-4">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={isEn ? 'Type falling kana romaji...' : 'Печатайте ромаджи падающих знаков...'}
            className="w-full px-5 py-3.5 rounded-2xl text-center text-base font-bold font-mono tracking-wider border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-rose-500 outline-none shadow-xs"
          />
        </div>
      )}
    </div>
  );
};
