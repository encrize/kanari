import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Volume2, Trash2, Undo2, Eye, EyeOff, CheckCircle2, ArrowRight, PenTool } from 'lucide-react';
import { KanaSymbol, AppSettings } from '../../types/kana';
import { audioService } from '../../services/audioService';
import { StrokeAnimator } from '../Common/StrokeAnimator';

interface StageDrawKanaProps {
  symbol: KanaSymbol;
  settings: AppSettings;
  onAnswer: (isCorrect: boolean) => void;
}

export const StageDrawKana: React.FC<StageDrawKanaProps> = ({
  symbol,
  settings,
  onAnswer,
}) => {
  const isEn = settings.language === 'en';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [pressureDetected, setPressureDetected] = useState(false);
  const [currentPressure, setCurrentPressure] = useState<number>(0);

  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const undoHistoryRef = useRef<ImageData[]>([]);

  // Resize canvas to physical pixels matching devicePixelRatio
  const setupCanvasResolution = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    undoHistoryRef.current = [];
    lastPosRef.current = null;
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (undoHistoryRef.current.length > 0) {
      const prevState = undoHistoryRef.current.pop()!;
      ctx.putImageData(prevState, 0, 0);
      if (undoHistoryRef.current.length === 0) {
        setHasDrawn(false);
      }
    }
  }, []);

  // Support Ctrl+Z / Cmd+Z shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я')) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Initialize canvas on mount & when symbol changes
  useEffect(() => {
    setupCanvasResolution();
    clearCanvas();
    setHasDrawn(false);
    setRevealed(false);

    const handleResize = () => {
      setupCanvasResolution();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [symbol, setupCanvasResolution, clearCanvas]);

  // Pointer Events Coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Calculate stroke width from pointer pressure
  const getStrokeWidth = (e: React.PointerEvent<HTMLCanvasElement>): number => {
    const isPen = e.pointerType === 'pen';
    const rawPressure = e.pressure;

    // Detect stylus pressure if value is between 0 and 1 and non-default
    if (isPen && rawPressure > 0 && rawPressure !== 0.5) {
      setPressureDetected(true);
      setCurrentPressure(rawPressure);
      // Map pressure 0.0 - 1.0 to width 4px - 22px
      return 4 + rawPressure * 18;
    }

    // Default thickness for mouse or standard touch
    return 11;
  };

  // Pointer Events Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Prevent default scroll behavior
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture pointer
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Snapshot canvas state before stroke for Ctrl+Z undo
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoHistoryRef.current.push(snap);
      if (undoHistoryRef.current.length > 25) {
        undoHistoryRef.current.shift();
      }
    } catch {
      // ignore
    }

    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
    setIsDrawing(true);
    setHasDrawn(true);

    const strokeColor = settings.theme === 'dark' ? '#f8fafc' : '#0f172a';
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const width = getStrokeWidth(e);
    ctx.lineWidth = width;

    // Draw initial dot
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Snapshot canvas state before stroke for Ctrl+Z undo
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoHistoryRef.current.push(snap);
      if (undoHistoryRef.current.length > 25) {
        undoHistoryRef.current.shift();
      }
    } catch {
      // ignore
    }

    const coords = getCanvasCoords(e);
    const strokeColor = settings.theme === 'dark' ? '#f8fafc' : '#0f172a';
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const width = getStrokeWidth(e);
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPosRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPosRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    }
  };

  const handleConfirm = (correct: boolean) => {
    if (correct) {
      audioService.playCorrectSound();
    } else {
      audioService.playWrongSound();
    }
    onAnswer(correct);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full px-4 animate-pop">
      {/* Target prompt */}
      <div className="flex flex-col items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {isEn ? 'Draw the kana for syllable:' : 'Нарисуйте символ для слога:'}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-4xl font-black text-rose-500 font-mono">
            {symbol.romaji[0]}
          </span>
          <button
            onClick={() => audioService.playKana(symbol.kana)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={isEn ? 'Hear pronunciation' : 'Прослушать произношение'}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pressure Sensitivity Indicator */}
      {pressureDetected && (
        <div className="mb-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-pulse">
          <PenTool className="w-3 h-3" />
          <span>
            {isEn
              ? `Stylus Pressure Active: ${Math.round(currentPressure * 100)}%`
              : `Нажим стилуса активен: ${Math.round(currentPressure * 100)}%`}
          </span>
        </div>
      )}

      {/* Drawing Canvas Card */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[320px] aspect-square rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Background Calligraphy Grid */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-full h-px border-b border-dashed border-slate-200 dark:border-slate-800" />
          <div className="h-full w-px border-r border-dashed border-slate-200 dark:border-slate-800 absolute" />
          <div className="w-3/4 h-3/4 rounded-full border border-dashed border-slate-100 dark:border-slate-800/60" />
        </div>

        {/* Ghost guide overlay */}
        {showGuide && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 font-noto-sans text-[180px] font-black text-rose-500">
            {symbol.kana}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair relative z-10 block"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />
      </div>

      {/* Canvas Tool Buttons */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title="Undo last stroke (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5 text-slate-500" />
          <span>{isEn ? 'Undo (Ctrl+Z)' : 'Отмена (Ctrl+Z)'}</span>
        </button>

        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-500" />
          <span>{isEn ? 'Clear' : 'Очистить'}</span>
        </button>

        <button
          onClick={() => setShowGuide((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            showGuide
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {showGuide ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
          <span>{isEn ? 'Ghost Guide' : 'Подсказка контура'}</span>
        </button>
      </div>

      {/* Answer verification area */}
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          disabled={!hasDrawn && !showGuide}
          className="w-full max-w-[320px] mt-4 py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>{isEn ? 'Compare with original' : 'Сверить с оригиналом'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="w-full max-w-[340px] mt-4 p-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex flex-col items-center animate-pop shadow-xs">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                {isEn ? 'Stroke Order' : 'Порядок черт'}
              </span>
              <StrokeAnimator kana={symbol.kana} size={100} autoPlay={true} showControls={false} />
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-black font-noto-sans text-slate-900 dark:text-white">
                {symbol.kana}
              </span>
              <span className="text-xs font-bold text-rose-500 font-mono mt-1">
                {symbol.romaji.join(', ')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
            {isEn ? 'How did it look? Rate your result:' : 'Как получилось? Оцените свой результат:'}
          </p>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => handleConfirm(false)}
              className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
            >
              {isEn ? 'Needs practice' : 'Нужно повторить'}
            </button>
            <button
              onClick={() => handleConfirm(true)}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEn ? 'Correct!' : 'Правильно!'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
