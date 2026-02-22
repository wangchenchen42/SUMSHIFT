/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RotateCcw, Play, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { GameMode, Block } from './types';
import { GRID_COLS, GRID_ROWS, INITIAL_ROWS, TARGET_MIN, TARGET_MAX, TIME_LIMIT } from './constants';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomValue = () => Math.floor(Math.random() * 9) + 1;

const VALUE_COLORS: Record<number, string> = {
  1: 'bg-blue-500 text-white border-2 border-blue-200 shadow-[0_4px_10px_rgba(59,130,246,0.6)]',
  2: 'bg-emerald-500 text-white border-2 border-emerald-200 shadow-[0_4px_10px_rgba(16,185,129,0.6)]',
  3: 'bg-amber-500 text-white border-2 border-amber-200 shadow-[0_4px_10px_rgba(245,158,11,0.6)]',
  4: 'bg-orange-500 text-white border-2 border-orange-200 shadow-[0_4px_10px_rgba(249,115,22,0.6)]',
  5: 'bg-rose-500 text-white border-2 border-rose-200 shadow-[0_4px_10px_rgba(244,63,94,0.6)]',
  6: 'bg-purple-500 text-white border-2 border-purple-200 shadow-[0_4px_10px_rgba(168,85,247,0.6)]',
  7: 'bg-fuchsia-500 text-white border-2 border-fuchsia-200 shadow-[0_4px_10px_rgba(217,70,239,0.6)]',
  8: 'bg-indigo-500 text-white border-2 border-indigo-200 shadow-[0_4px_10px_rgba(99,102,241,0.6)]',
  9: 'bg-cyan-500 text-white border-2 border-cyan-200 shadow-[0_4px_10px_rgba(6,182,212,0.6)]',
};

const SELECTED_COLORS: Record<number, string> = {
  1: 'bg-blue-400 text-white shadow-[0_0_30px_rgba(59,130,246,0.8)] scale-110 ring-4 ring-white/50',
  2: 'bg-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-110 ring-4 ring-white/50',
  3: 'bg-amber-400 text-white shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-110 ring-4 ring-white/50',
  4: 'bg-orange-400 text-white shadow-[0_0_30px_rgba(249,115,22,0.8)] scale-110 ring-4 ring-white/50',
  5: 'bg-rose-400 text-white shadow-[0_0_30px_rgba(244,63,94,0.8)] scale-110 ring-4 ring-white/50',
  6: 'bg-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.8)] scale-110 ring-4 ring-white/50',
  7: 'bg-fuchsia-400 text-white shadow-[0_0_30px_rgba(217,70,239,0.8)] scale-110 ring-4 ring-white/50',
  8: 'bg-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.8)] scale-110 ring-4 ring-white/50',
  9: 'bg-cyan-400 text-white shadow-[0_0_30px_rgba(6,182,212,0.8)] scale-110 ring-4 ring-white/50',
};

export default function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [grid, setGrid] = useState<Block[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [blocksPool, setBlocksPool] = useState(100);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [highScore, setHighScore] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sparkles
  useEffect(() => {
    const newSparkles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setSparkles(newSparkles);
  }, []);

  // Initialize game
  const initGame = useCallback((selectedMode: GameMode) => {
    const initialGrid: Block[] = [];
    const initialPool = 100;
    let usedInInitial = 0;
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialGrid.push({
          id: generateId(),
          value: getRandomValue(),
          row: GRID_ROWS - 1 - r,
          col: c,
        });
        usedInInitial++;
      }
    }
    setGrid(initialGrid);
    setBlocksPool(initialPool - usedInInitial);
    setTarget(Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)) + TARGET_MIN);
    setScore(0);
    setSelectedIds([]);
    setIsGameOver(false);
    setIsWin(false);
    setMode(selectedMode);
    setTimeLeft(TIME_LIMIT);
  }, []);

  const addRow = useCallback(() => {
    setGrid((prev) => {
      // Check if any block is at the top row (row 0)
      const isFull = prev.some((b) => b.row === 0);
      if (isFull) {
        setIsGameOver(true);
        return prev;
      }

      // Move all existing blocks up
      const movedGrid = prev.map((b) => ({ ...b, row: b.row - 1 }));
      
      // Add new row at the bottom if pool allows
      const newRow: Block[] = [];
      let usedInRow = 0;
      
      setBlocksPool((pool) => {
        const canAdd = Math.min(pool, GRID_COLS);
        for (let c = 0; c < canAdd; c++) {
          newRow.push({
            id: generateId(),
            value: getRandomValue(),
            row: GRID_ROWS - 1,
            col: c,
          });
          usedInRow++;
        }
        return pool - usedInRow;
      });
      
      const finalGrid = [...movedGrid, ...newRow];
      
      // If pool is empty and grid is empty, it's game over (handled in effect)
      return finalGrid;
    });
    
    if (mode === GameMode.TIME) {
      setTimeLeft(TIME_LIMIT);
    }
  }, [mode]);

  // Check for game over when grid or pool changes
  useEffect(() => {
    if (mode && grid.length === 0 && blocksPool === 0 && !isWin) {
      setIsGameOver(true);
    }
  }, [grid, blocksPool, mode, isWin]);

  // Handle Time Mode Countdown
  useEffect(() => {
    if (mode === GameMode.TIME && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            addRow();
            return TIME_LIMIT;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, isGameOver, addRow]);

  const handleBlockClick = (id: string) => {
    if (isGameOver) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  // Check sum when selection changes
  useEffect(() => {
    const selectedBlocks = grid.filter((b) => selectedIds.includes(b.id));
    const currentSum = selectedBlocks.reduce((sum, b) => sum + b.value, 0);

    if (currentSum === target) {
      // Success!
      setScore((prev) => prev + selectedIds.length * 10);
      
      // Remove blocks
      let nextGrid: Block[] = [];
      setGrid((prev) => {
        const remaining = prev.filter((b) => !selectedIds.includes(b.id));
        
        // Check for win condition: board cleared
        if (remaining.length === 0) {
          setIsWin(true);
          return [];
        }

        // Apply gravity: for each column, shift blocks down
        const newGrid: Block[] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const colBlocks = remaining
            .filter((b) => b.col === c)
            .sort((a, b) => b.row - a.row); // Bottom to top
          
          colBlocks.forEach((b, idx) => {
            newGrid.push({ ...b, row: GRID_ROWS - 1 - idx });
          });
        }
        nextGrid = newGrid;
        return newGrid;
      });

      setSelectedIds([]);
      
      // Scaling difficulty: Increase target range based on score
      const difficultyMultiplier = Math.floor(score / 500);
      const minTarget = TARGET_MIN + difficultyMultiplier * 5;
      const maxTarget = TARGET_MAX + difficultyMultiplier * 10;
      setTarget(Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget);
      
      // In classic mode, add a row after success IF NOT WON
      if (mode === GameMode.CLASSIC && nextGrid.length > 0) {
        addRow();
      } else if (mode === GameMode.TIME) {
        setTimeLeft(TIME_LIMIT); // Reset timer on success
      }

      // If board is empty but pool has blocks, force add a row
      if (nextGrid.length === 0 && blocksPool > 0) {
        addRow();
      }
    } else if (currentSum > target) {
      // Over target, clear selection
      setSelectedIds([]);
    }
  }, [selectedIds, target, grid, mode, addRow]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  if (!mode) {
    return (
      <div className="min-h-screen flex flex-row items-center justify-center p-6 gap-12 relative overflow-hidden">
        {/* Sparkles */}
        {sparkles.map((s) => (
          <div 
            key={s.id} 
            className="sparkle-particle" 
            style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.delay}s` }} 
          />
        ))}

        {/* Dumbledore - Welcome Screen */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden lg:block relative group"
        >
          <div className="absolute -inset-8 bg-amber-500/20 blur-3xl rounded-full animate-pulse" />
          <img 
            src="https://www.coolmathgames.com/sites/default/files/styles/mobile_game_image/public/blokmatik_game_image.png" 
            alt="Dumbledore" 
            className="relative w-64 h-80 object-cover rounded-[3rem] border-4 border-white/30 shadow-2xl backdrop-blur-sm"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-6 -right-6 bg-white/20 backdrop-blur-2xl p-4 rounded-2xl border border-white/30 max-w-[200px] shadow-2xl">
            <p className="text-xs font-kaiti italic text-zinc-100">"魔法就在数字的律动之中，孩子。"</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center space-y-12"
        >
          <div className="space-y-6">
            <h1 className="text-7xl font-bold font-kaiti magic-text tracking-widest drop-shadow-2xl">数字消除</h1>
            <div className="space-y-4">
              <p className="text-2xl font-kaiti text-zinc-100 leading-relaxed">
                欢迎来到数字消除
              </p>
              <p className="text-lg font-kaiti text-zinc-400">
                一个为你精心定制的魔法数字益智游戏
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl space-y-4 text-left font-kaiti relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <p className="text-lg text-zinc-200">
              💡 <span className="text-amber-400 font-bold">魔法规则：</span>
            </p>
            <ul className="space-y-2 text-zinc-400 list-disc list-inside">
              <li>开始游戏时会显示目标数字。</li>
              <li>目标数字位于屏幕正上方。</li>
              <li>每次消除都会消耗你的<span className="text-amber-400 font-bold">魔法方块储备</span>。</li>
              <li>当储备耗尽且棋盘清空时，游戏结束。</li>
              <li>随着得分增加，目标数字会变得越来越具有挑战性！</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => initGame(GameMode.CLASSIC)}
              className="group relative brutalist-card hover:bg-emerald-500 hover:text-black transition-colors text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold uppercase">经典模式</h3>
                  <p className="text-sm opacity-70">每次成功求和后新增一行。</p>
                </div>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button 
              onClick={() => initGame(GameMode.TIME)}
              className="group relative brutalist-card hover:bg-amber-500 hover:text-black transition-colors text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold uppercase">计时模式</h3>
                  <p className="text-sm opacity-70">在时间耗尽前完成挑战。</p>
                </div>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="pt-8 border-t border-zinc-800 flex justify-center gap-8 text-zinc-500 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Trophy size={14} />
              <span>最高分: {highScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Info size={14} />
              <span>凑出目标数字</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentSum = grid
    .filter((b) => selectedIds.includes(b.id))
    .reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="h-screen flex flex-row items-center justify-center p-4 md:p-8 gap-8 relative overflow-hidden">
      {/* Sparkles */}
      {sparkles.map((s) => (
        <div 
          key={s.id} 
          className="sparkle-particle" 
          style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.delay}s` }} 
        />
      ))}

      {/* Dumbledore - Left Side */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden xl:flex flex-col items-center gap-4 max-w-[250px]"
      >
        <div className="relative group">
          <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full group-hover:bg-amber-400/30 transition-all" />
          <img 
            src="https://www.coolmathgames.com/sites/default/files/styles/mobile_game_image/public/blokmatik_game_image.png" 
            alt="Dumbledore" 
            className="relative w-48 h-64 object-cover rounded-3xl border-2 border-white/30 shadow-2xl backdrop-blur-sm"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/30 text-xs font-kaiti whitespace-nowrap text-white shadow-lg">
            阿不思·邓布利多
          </div>
        </div>
        <p className="text-center text-zinc-100 font-kaiti text-sm leading-relaxed italic drop-shadow-md">
          "决定我们成为什么样的人，不是我们的能力，而是我们的选择。"
        </p>
      </motion.div>

      <div className="flex flex-col h-full max-w-2xl w-full">
        {/* Colorful Title */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold font-kaiti magic-text tracking-widest drop-shadow-lg">
            数字消除
          </h1>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/10 backdrop-blur-2xl p-6 rounded-3xl border border-white/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-zinc-100 uppercase tracking-[0.2em] drop-shadow-md">目标数字</div>
            <div className="text-6xl font-bold text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{target}</div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-100 uppercase">魔法储备</div>
                <div className="text-2xl font-bold tabular-nums text-amber-400">{blocksPool}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-100 uppercase">得分</div>
                <div className="text-2xl font-bold tabular-nums">{score}</div>
              </div>
              {mode === GameMode.TIME && (
                <div className="text-right">
                  <div className="text-[10px] font-mono text-zinc-100 uppercase">倒计时</div>
                  <div className={`text-2xl font-bold tabular-nums ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : ''}`}>
                    {timeLeft}秒
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setMode(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                title="返回菜单"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar for Sum */}
      <div className="w-full h-2 bg-zinc-900 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((currentSum / target) * 100, 100)}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        />
      </div>

      {/* Game Board */}
      <div className="flex-1 relative bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/30 p-4 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
        <div 
          className="grid h-full gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
          }}
        >
          <AnimatePresence mode="popLayout">
            {grid.map((block) => {
              const isSelected = selectedIds.includes(block.id);
              return (
                <motion.button
                  key={block.id}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    gridRowStart: block.row + 1,
                    gridColumnStart: block.col + 1,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => handleBlockClick(block.id)}
                  className={`
                    relative flex items-center justify-center rounded-lg text-xl font-bold transition-all overflow-hidden
                    ${isSelected 
                      ? `${SELECTED_COLORS[block.value]} z-10 scale-110` 
                      : `${VALUE_COLORS[block.value]} hover:brightness-125 hover:scale-105 active:scale-95`
                    }
                    ${block.row === 0 ? 'border-t-2 border-red-500/50' : ''}
                  `}
                >
                  <div className="shimmer-overlay opacity-30" />
                  {isSelected && (
                    <motion.div 
                      layoutId="sparkle-glow"
                      className="absolute inset-0 bg-white/20 blur-md"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  <span className="relative z-10">{block.value}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Danger Zone Indicator */}
        <div className="absolute top-0 left-0 w-full h-1/6 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Footer / Current Sum */}
      <div className="mt-6 flex justify-between items-center font-mono text-sm">
        <div className="flex items-center gap-2 text-zinc-500">
          <AlertCircle size={14} />
          <span>不要让方块触顶！</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">当前总和:</span>
          <span className={`font-bold ${currentSum > target ? 'text-red-500' : 'text-emerald-500'}`}>
            {currentSum}
          </span>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xs w-full brutalist-card bg-zinc-900 border-amber-500 text-center space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-amber-500 italic uppercase">魔法耗尽</h2>
                <p className="text-zinc-500 font-mono text-xs">你的魔法储备已用完</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-zinc-500 text-[10px] uppercase">最终得分</div>
                  <div className="text-5xl font-bold tabular-nums text-white">{score}</div>
                </div>
                <div className="space-y-1 pt-2 border-t border-white/10">
                  <div className="text-zinc-500 text-[10px] uppercase">历史最高</div>
                  <div className="text-2xl font-bold tabular-nums text-amber-400">{highScore}</div>
                </div>
              </div>

              <div className="grid gap-3">
                <button 
                  onClick={() => initGame(mode)}
                  className="w-full py-3 bg-zinc-100 text-black font-bold uppercase hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={18} fill="currentColor" />
                  再试一次
                </button>
                <button 
                  onClick={() => setMode(null)}
                  className="w-full py-3 border border-zinc-700 font-bold uppercase hover:bg-zinc-800 transition-colors"
                >
                  返回主菜单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {isWin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/10 backdrop-blur-xl z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-center space-y-12"
            >
              <div className="relative">
                <h2 
                  className="text-8xl md:text-9xl font-kaiti silver-glitter-text font-bold"
                  data-text="你通关了"
                >
                  你通关了
                </h2>
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-4 bg-white/20 blur-3xl rounded-full -z-10"
                />
              </div>

              <div className="space-y-2">
                <div className="text-emerald-400 font-mono text-sm tracking-widest uppercase">Mission Accomplished</div>
                <div className="text-4xl font-bold text-white tabular-nums">得分: {score}</div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button 
                  onClick={() => initGame(mode)}
                  className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-emerald-400 transition-all hover:scale-110 active:scale-95 shadow-xl"
                >
                  继续挑战
                </button>
                <button 
                  onClick={() => setMode(null)}
                  className="px-8 py-4 bg-black/50 text-white border border-white/20 font-bold rounded-full hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
                >
                  返回菜单
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
