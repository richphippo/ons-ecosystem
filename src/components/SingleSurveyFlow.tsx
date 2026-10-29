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
    <div className="bg-white border border-[#D0D2D3] rounded-lg p-5 shadow-sm space-y-4 text-[#222222]">
      {/* Component Header with Dropdown & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#D0D2D3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#EBF2F7] text-[#206095] border border-[#BCDCF0]">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#206095]">
              Single Survey Process Flow
            </h2>
            <span className="text-xs text-[#595959] font-medium">
              ({activeIndex + 1} of {surveys.length} surveys)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h3 className="text-lg font-bold text-[#003C57]">{currentSurvey.name}</h3>
            {currentSurvey.metadata?.Divison && (
              <span className="bg-[#EBF2F7] text-[#003C57] text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-[#BCDCF0]">
                {currentSurvey.metadata.Divison}
              </span>
            )}
            {currentSurvey.metadata?.Division && (
              <span className="bg-[#EBF2F7] text-[#003C57] text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-[#BCDCF0]">
                {currentSurvey.metadata.Division}
              </span>
            )}
            {currentSurvey.metadata?.Frequency && (
              <span className="bg-[#F0FDF4] text-[#0F8243] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#BBF7D0] font-mono">
                {currentSurvey.metadata.Frequency}
              </span>
            )}
          </div>
        </div>

        {/* Survey Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#707071] rounded-md px-3 py-1.5 focus-within:border-black">
            <Users className="w-3.5 h-3.5 text-[#206095] shrink-0" />
            <select
              value={currentSurvey.id}
              onChange={e => onSelectSurvey(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#003C57] focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[280px] truncate"
            >
              {surveys.map(s => (
                <option key={s.id} value={s.id} className="bg-white text-[#222222]">
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
              className="p-1.5 rounded-md bg-white hover:bg-[#F0F4F7] border border-[#BCBCBD] text-[#206095] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next survey"
              className="p-1.5 rounded-md bg-white hover:bg-[#F0F4F7] border border-[#BCBCBD] text-[#206095] transition"
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
          const stageColor = STAGE_COLOR_MAP[stageName] || '#206095';

          return (
            <div
              key={stageName}
              className={`p-3 rounded-md border flex flex-col justify-between transition-all ${
                platformUsed
                  ? 'bg-white border-[#D0D2D3] shadow-xs hover:border-[#206095]'
                  : 'bg-[#F5F5F5] border-[#E8EDEE] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-xs"
                    style={{ backgroundColor: stageColor }}
                  >
                    {idx + 1}. {stageName}
                  </span>
                  {platformUsed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F8243] shrink-0" />
                  ) : (
                    <CircleDashed className="w-3.5 h-3.5 text-[#BCBCBD] shrink-0" />
                  )}
                </div>

                <div className="mt-1 text-xs font-bold text-[#003C57] min-h-[40px] flex items-center">
                  {platformUsed ? (
                    platformUsed
                  ) : (
                    <span className="text-[#707071] italic text-[11px] font-normal">Skipped / N/A</span>
                  )}
                </div>
              </div>

              {platformUsed && (
                <div className="mt-2 pt-1.5 border-t border-[#E8EDEE] flex items-center justify-between text-[10px] text-[#595959]">
                  <span className="font-medium">Platform</span>
                  <span className="font-mono font-bold text-[#0F8243]">Active</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
