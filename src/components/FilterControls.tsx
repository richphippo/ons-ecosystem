'use client';

import React from 'react';
import { Search, RotateCcw, Activity, Layers, GitFork } from 'lucide-react';

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
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
  const isFiltered = searchQuery !== '' || selectedCategory !== null;

  return (
    <div className="bg-white border border-[#D0D2D3] rounded-lg p-4 shadow-sm text-[#222222] space-y-3">
      {/* Filters row: Compact left-aligned Search, GSBPM Stage, and Reset */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#595959]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search platforms, stages, or surveys..."
            className="w-full bg-white border border-[#707071] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#707071] focus:border-black transition"
          />
        </div>

        {/* GSBPM Stage filter */}
        {categories.length > 0 && (
          <div className="w-full sm:w-60">
            <select
              value={selectedCategory || ''}
              onChange={e => onCategoryChange(e.target.value === '' ? null : e.target.value)}
              className="w-full bg-white border border-[#707071] rounded-md px-3 py-1.5 text-xs text-[#222222] focus:border-black transition cursor-pointer font-medium"
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

        {/* Reset button */}
        <button
          type="button"
          disabled={!isFiltered}
          onClick={onReset}
          title="Reset filters"
          className={`p-2 rounded-md border transition flex items-center justify-center ${
            isFiltered
              ? 'border-[#206095] bg-[#EBF2F7] text-[#206095] hover:bg-[#D4E4F0]'
              : 'border-[#E8EDEE] bg-[#F5F5F5] text-[#BCBCBD] cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Metrics Badges */}
      <div className="pt-2.5 border-t border-[#E8EDEE] flex flex-wrap items-center justify-between text-xs text-[#595959] gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#206095]" />
            <span>Total Surveys:</span>
            <span className="font-bold text-[#003C57] font-mono">
              {totalFlow} {totalFlow === 1 ? 'Survey' : 'Surveys'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#0F8243]" />
            <span>Platform Nodes:</span>
            <span className="font-bold text-[#003C57] font-mono">
              {visibleNodeCount} / {totalNodeCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-[#27A0CC]" />
            <span>Transitions:</span>
            <span className="font-bold text-[#003C57] font-mono">
              {visibleLinkCount} / {totalLinkCount}
            </span>
          </div>
        </div>

        {isFiltered && (
          <div className="text-[11px] font-semibold text-[#80276C] bg-[#F4E9F2] border border-[#D5B8D1] px-2 py-0.5 rounded">
            Filtered View Active
          </div>
        )}
      </div>
    </div>
  );
};
