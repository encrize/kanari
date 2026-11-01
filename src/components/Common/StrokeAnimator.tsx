import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { getStrokesForKana } from '../../utils/kanaUtils';

interface StrokeAnimatorProps {
  kana: string;
  size?: number;
  autoPlay?: boolean;
  showNumbers?: boolean;
  showControls?: boolean;
  className?: string;
}

export const StrokeAnimator: React.FC<StrokeAnimatorProps> = ({
  kana,
  size = 200,
  autoPlay = true,
  showNumbers = true,
  showControls = true,
  className = '',
}) => {
  const strokes = useMemo(() => getStrokesForKana(kana) || [], [kana]);
  const [currentStroke, setCurrentStroke] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const timerRef = useRef<number | null>(null);

  // Extract starting points for stroke numbers
  const strokeStarts = useMemo(() => {
    return strokes.map((path) => {
      const match = path.match(/^M\s*([\d.-]+)[,\s]+([\d.-]+)/i);
      if (match) {
        return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      }
      return { x: 50, y: 50 };
    });
  }, [strokes]);

  useEffect(() => {
    setCurrentStroke(0);
    setIsPlaying(autoPlay);
  }, [kana, autoPlay]);

  useEffect(() => {
    if (!isPlaying || strokes.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCurrentStroke((prev) => {
        if (prev >= strokes.length - 1) {
          // Pause slightly before looping
          return 0;
        }
        return prev + 1;
      });
    }, 900);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, strokes.length]);

  if (strokes.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center text-4xl font-black font-noto-sans text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-3xl ${className}`}
      >
        {kana}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* SVG Canvas with traditional 4-quadrant calligraphy grid */}
      <div
        className="relative rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden p-2"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 109 109"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Traditional 4-quadrant calligraphy dashed grid */}
          <line x1="54.5" y1="0" x2="54.5" y2="109" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
          <line x1="0" y1="54.5" x2="109" y2="54.5" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
          <circle cx="54.5" cy="54.5" r="46" fill="none" stroke="currentColor" strokeDasharray="2 4" className="text-slate-100 dark:text-slate-800/60" strokeWidth="1" />

          {/* Faint outline of all strokes */}
          {strokes.map((path, idx) => (
            <path
              key={`faint-${idx}`}
              d={path}
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Completed strokes up to current */}
          {strokes.slice(0, currentStroke).map((path, idx) => (
            <path
              key={`done-${idx}`}
              d={path}
              fill="none"
              stroke="currentColor"
              className="text-slate-800 dark:text-slate-200"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Current animated stroke in vibrant rose/crimson */}
          {strokes[currentStroke] && (
            <path
              key={`active-${currentStroke}`}
              d={strokes[currentStroke]}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 300,
                strokeDashoffset: 300,
                animation: 'strokeDraw 0.8s ease-out forwards',
              }}
            />
          )}

          {/* Stroke numbering circles */}
          {showNumbers &&
            strokeStarts.map((pt, idx) => {
              if (idx > currentStroke) return null;
              const isCurrent = idx === currentStroke;
              return (
                <g key={`num-${idx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={isCurrent ? '#f43f5e' : '#64748b'}
                  />
                  <text
                    x={pt.x}
                    y={pt.y + 1.5}
                    fontSize="4"
                    fill="white"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-1.5 mt-3 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl text-slate-700 dark:text-slate-300">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStroke((prev) => Math.max(0, prev - 1));
            }}
            disabled={currentStroke === 0}
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
            title="Предыдущая черта"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm cursor-pointer"
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStroke((prev) => Math.min(strokes.length - 1, prev + 1));
            }}
            disabled={currentStroke >= strokes.length - 1}
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
            title="Следующая черта"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStroke(0);
            }}
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
            title="Сначала"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
            {currentStroke + 1}/{strokes.length}
          </span>
        </div>
      )}
    </div>
  );
};
