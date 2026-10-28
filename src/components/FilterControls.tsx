'use client';

import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, Activity, Layers, GitFork, Users, Compass } from 'lucide-react';
import type { SurveyRecord, ViewMode } from '@/types/sankey';

interface FilterControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  surveys: SurveyRecord[];
  selectedSurveyId: string | null;
  onSelectedSurveyChange: (id: string | null) => void;
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
  viewMode,
  onViewModeChange,
  surveys,
  selectedSurveyId,
  onSelectedSurveyChange,
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
      {/* Top row: View Mode Switcher and Survey Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onViewModeChange('all-surveys')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'all-surveys'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Surveys Ecosystem</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onViewModeChange('single-survey');
              if (!selectedSurveyId && surveys.length > 0) {
                onSelectedSurveyChange(surveys[0].id);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'single-survey'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Single Survey Process Flow</span>
          </button>
        </div>

        {/* Survey selector dropdown (visible in Single Survey mode or as a quick filter) */}
        {viewMode === 'single-survey' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Survey:</span>
            </span>
            <select
              value={selectedSurveyId || ''}
              onChange={e => onSelectedSurveyChange(e.target.value)}
              className="bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 font-medium"
            >
              {surveys.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Middle row: Search, Category, and Threshold Slider */}
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
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
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

        {/* Min threshold slider (only in All Surveys mode) */}
        <div className="md:col-span-4 flex items-center gap-3">
          {viewMode === 'all-surveys' ? (
            <>
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
            </>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Displaying single end-to-end pathway for selected survey
            </div>
          )}
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

      {/* Bottom row: Live Metrics Badges */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Flow Traversed:</span>
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
