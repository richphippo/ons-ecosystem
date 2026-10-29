'use client';

import React from 'react';
import type { SurveyRecord } from '@/types/sankey';
import { GSBPM_STAGES } from '@/utils/dataParser';
import { STAGE_COLOR_MAP } from '@/utils/sankeyLayout';
import { Compass, CheckCircle2, CircleDashed, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface SingleSurveyFlowProps {
  surveys: SurveyRecord[];
  selectedSurveyId: string | null;
  onSelectSurvey: (surveyId: string) => void;
}

export const SingleSurveyFlow: React.FC<SingleSurveyFlowProps> = ({
  surveys,
  selectedSurveyId,
  onSelectSurvey,
}) => {
  if (surveys.length === 0) {
    return null;
  }

  const currentIndex = surveys.findIndex(
    s => s.id === selectedSurveyId || s.name === selectedSurveyId
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentSurvey = surveys[activeIndex] || surveys[0];

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + surveys.length) % surveys.length;
    onSelectSurvey(surveys[nextIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % surveys.length;
    onSelectSurvey(surveys[nextIdx].id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Component Header with Dropdown & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
              Single Survey Process Flow
            </h2>
            <span className="text-xs text-slate-500">
              ({activeIndex + 1} of {surveys.length} surveys)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h3 className="text-base font-bold text-white">{currentSurvey.name}</h3>
            {currentSurvey.metadata?.Divison && (
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {currentSurvey.metadata.Divison}
              </span>
            )}
            {currentSurvey.metadata?.Division && (
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {currentSurvey.metadata.Division}
              </span>
            )}
            {currentSurvey.metadata?.Frequency && (
              <span className="bg-emerald-950/60 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                {currentSurvey.metadata.Frequency}
              </span>
            )}
          </div>
        </div>

        {/* Survey Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={currentSurvey.id}
              onChange={e => onSelectSurvey(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[280px] truncate"
            >
              {surveys.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Prev / Next Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous survey"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next survey"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 8-Stage GSBPM Process Journey Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {GSBPM_STAGES.map((stageName, idx) => {
          const platformUsed = currentSurvey.stages[stageName];
          const stageColor = STAGE_COLOR_MAP[stageName] || '#6366f1';

          return (
            <div
              key={stageName}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                platformUsed
                  ? 'bg-slate-950/90 border-slate-800/90 shadow-md hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900/60 opacity-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm"
                    style={{ backgroundColor: stageColor }}
                  >
                    {idx + 1}. {stageName}
                  </span>
                  {platformUsed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <CircleDashed className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-100 min-h-[40px] flex items-center">
                  {platformUsed ? (
                    platformUsed
                  ) : (
                    <span className="text-slate-600 italic text-[11px]">Skipped / N/A</span>
                  )}
                </div>
              </div>

              {platformUsed && (
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Platform</span>
                  <span className="font-mono text-emerald-400">Active</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
