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
  1: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  2: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  3: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  4: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  5: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  6: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  7: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
  8: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  9: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
};

const SELECTED_COLORS: Record<number, string> = {
  1: 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]',
  2: 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]',
  3: 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]',
  4: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]',
  5: 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]',
  6: 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]',
  7: 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]',
  8: 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]',
  9: 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]',
};

export default function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [grid, setGrid] = useState<Block[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [highScore, setHighScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  const initGame = useCallback((selectedMode: GameMode) => {
    const initialGrid: Block[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialGrid.push({
          id: generateId(),
          value: getRandomValue(),
          row: GRID_ROWS - 1 - r,
          col: c,
        });
      }
    }
    setGrid(initialGrid);
    setTarget(Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)) + TARGET_MIN);
    setScore(0);
    setSelectedIds([]);
    setIsGameOver(false);
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
      
      // Add new row at the bottom
      const newRow: Block[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        newRow.push({
          id: generateId(),
          value: getRandomValue(),
          row: GRID_ROWS - 1,
          col: c,
        });
      }
      
      return [...movedGrid, ...newRow];
    });
    
    if (mode === GameMode.TIME) {
      setTimeLeft(TIME_LIMIT);
    }
  }, [mode]);

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
      setGrid((prev) => {
        const remaining = prev.filter((b) => !selectedIds.includes(b.id));
        
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
        return newGrid;
      });

      setSelectedIds([]);
      setTarget(Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)) + TARGET_MIN);
      
      // In classic mode, add a row after success
      if (mode === GameMode.CLASSIC) {
        addRow();
      } else if (mode === GameMode.TIME) {
        setTimeLeft(TIME_LIMIT); // Reset timer on success
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter text-emerald-500 italic">SUMSHIFT</h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">数学求和消除协议</p>
          </div>

          <div className="grid gap-4">
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
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-1">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">目标数字</div>
          <div className="text-5xl font-bold text-emerald-500 tabular-nums">{target}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">得分</div>
              <div className="text-2xl font-bold tabular-nums">{score}</div>
            </div>
            {mode === GameMode.TIME && (
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">倒计时</div>
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
      <div className="flex-1 relative bg-zinc-900/50 rounded-2xl border border-zinc-800 p-2 overflow-hidden">
        <div 
          className="grid h-full gap-1"
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
                    relative flex items-center justify-center rounded-lg text-xl font-bold transition-all
                    ${isSelected 
                      ? `${SELECTED_COLORS[block.value]} z-10` 
                      : `${VALUE_COLORS[block.value]} hover:brightness-125`
                    }
                    ${block.row === 0 ? 'border-t-2 border-red-500/50' : ''}
                  `}
                >
                  {block.value}
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
              className="max-w-xs w-full brutalist-card bg-zinc-900 border-red-500 text-center space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-red-500 italic uppercase">游戏结束</h2>
                <p className="text-zinc-500 font-mono text-xs">协议已终止</p>
              </div>

              <div className="space-y-1">
                <div className="text-zinc-500 text-xs uppercase">最终得分</div>
                <div className="text-5xl font-bold tabular-nums">{score}</div>
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
    </div>
  );
}
