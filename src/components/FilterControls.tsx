'use client';

import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, Activity, Layers, GitFork } from 'lucide-react';

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  minValue: number;
  maxPossibleValue: number;
  onMinValueChange: (v: number) => void;
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  onReset: () => void;
  totalFlow: number;
  visibleNodeCount: number;
  totalNodeCount: number;
  visibleLinkCount: number;
  totalLinkCount: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  searchQuery,
  onSearchChange,
  minValue,
  maxPossibleValue,
  onMinValueChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onReset,
  totalFlow,
  visibleNodeCount,
  totalNodeCount,
  visibleLinkCount,
  totalLinkCount
}) => {
  const isFiltered = searchQuery !== '' || minValue > 0 || selectedCategory !== null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md backdrop-blur-sm space-y-3">
      {/* Filters row: Search, GSBPM Stage, and Min Surveys Slider */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search platforms, stages, or surveys..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* GSBPM Stage filter */}
        {categories.length > 0 && (
          <div className="md:col-span-3">
            <select
              value={selectedCategory || ''}
              onChange={e => onCategoryChange(e.target.value === '' ? null : e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="">All GSBPM Stages ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Min threshold slider */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Min Surveys:</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(3, maxPossibleValue)}
            value={minValue}
            onChange={e => onMinValueChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-slate-300 w-8 text-right shrink-0">
            {minValue}
          </span>
        </div>

        {/* Reset button */}
        <div className="md:col-span-1 flex justify-end">
          <button
            type="button"
            disabled={!isFiltered}
            onClick={onReset}
            title="Reset filters"
            className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
              isFiltered
                ? 'border-slate-700 bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:text-indigo-300'
                : 'border-slate-800/60 bg-slate-900/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Metrics Badges */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Surveys:</span>
            <span className="font-semibold text-slate-200 font-mono">
              {totalFlow} {totalFlow === 1 ? 'Survey' : 'Surveys'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Platform Nodes:</span>
            <span className="font-semibold text-slate-200 font-mono">
              {visibleNodeCount} / {totalNodeCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transitions:</span>
            <span className="font-semibold text-slate-200 font-mono">
              {visibleLinkCount} / {totalLinkCount}
            </span>
          </div>
        </div>

        {isFiltered && (
          <div className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded">
            Filtered View Active
          </div>
        )}
      </div>
    </div>
  );
};
