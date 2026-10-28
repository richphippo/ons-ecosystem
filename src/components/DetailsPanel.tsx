'use client';

import React from 'react';
import type {
  BaseLinkData,
  BaseNodeData,
  CustomSankeyNode,
  SelectedElement,
  SurveyRecord,
  ViewMode
} from '@/types/sankey';
import { ArrowRight, CornerDownRight, X, Sparkles, CheckCircle2, CircleDashed, Users, Layers } from 'lucide-react';
import { getNodeColor, STAGE_COLOR_MAP } from '@/utils/sankeyLayout';
import { GSBPM_STAGES } from '@/utils/dataParser';

interface DetailsPanelProps {
  viewMode: ViewMode;
  selectedSurvey: SurveyRecord | null;
  onSelectSurvey: (surveyId: string) => void;
  selectedElement: SelectedElement;
  onClearSelection: () => void;
  allNodes: BaseNodeData[];
  allLinks: BaseLinkData[];
  allSurveys: SurveyRecord[];
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  viewMode,
  selectedSurvey,
  onSelectSurvey,
  selectedElement,
  onClearSelection,
  allNodes,
  allLinks,
  allSurveys
}) => {
  // SINGLE SURVEY MODE VIEW
  if (viewMode === 'single-survey') {
    if (!selectedSurvey) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
          Please select a survey from the dropdown above to view its end-to-end GSBPM process flow.
        </div>
      );
    }

    return (
      <div className="bg-slate-900 border border-indigo-950/80 rounded-xl p-5 shadow-xl space-y-4">
        {/* Survey Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Single Survey Process Flow
              </span>
              {selectedSurvey.metadata?.Division && (
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                  {selectedSurvey.metadata.Division}
                </span>
              )}
              {selectedSurvey.metadata?.Frequency && (
                <span className="bg-slate-800 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                  {selectedSurvey.metadata.Frequency}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{selectedSurvey.name}</h2>
          </div>

          <div className="text-xs text-slate-400">
            End-to-end platforms across GSBPM phases
          </div>
        </div>

        {/* 8-Stage GSBPM Process Journey Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
          {GSBPM_STAGES.map((stageName, idx) => {
            const platformUsed = selectedSurvey.stages[stageName];
            const stageColor = STAGE_COLOR_MAP[stageName] || '#6366f1';

            return (
              <div
                key={stageName}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  platformUsed
                    ? 'bg-slate-950/90 border-slate-800 shadow-md'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: stageColor }}
                    >
                      {idx + 1}. {stageName}
                    </span>
                    {platformUsed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <CircleDashed className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>

                  <div className="mt-2 text-xs font-semibold text-slate-100 min-h-[36px] flex items-center">
                    {platformUsed ? (
                      platformUsed
                    ) : (
                      <span className="text-slate-600 italic text-[11px]">No platform / Skipped</span>
                    )}
                  </div>
                </div>

                {platformUsed && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-indigo-400 font-mono">
                    Active Platform
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ALL SURVEYS ECOSYSTEM VIEW

  // If nothing is selected, show top platforms across GSBPM
  if (!selectedElement) {
    const topPlatforms = [...allNodes]
      .sort((a, b) => (b.surveys?.length || b.totalValue || 0) - (a.surveys?.length || a.totalValue || 0))
      .slice(0, 4);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              High-Usage Platforms Across GSBPM Process Stages
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Click on any platform bar or flow connection above to inspect specific surveys
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {topPlatforms.map((node, idx) => (
            <div
              key={`top-${node.id}`}
              className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="font-semibold text-indigo-400">{node.stage || 'Process Stage'}</span>
                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                  Rank #{idx + 1}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-100 truncate mb-2">
                {node.name}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Surveys Supported:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {node.surveys?.length || node.totalValue || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // NODE DETAILS (Platform at Stage)
  if (selectedElement.type === 'node') {
    const node = selectedElement.data;
    const nodeColor = getNodeColor(node.name, node.category, node.stage);
    const surveysUsingNode = node.surveys || [];

    const incomingLinks = allLinks.filter(l => l.target === node.id);
    const outgoingLinks = allLinks.filter(l => l.source === node.id);

    return (
      <div className="bg-slate-900 border border-indigo-900/50 rounded-xl p-5 shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-9 rounded-sm shadow-md shrink-0"
              style={{ backgroundColor: nodeColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{node.name}</h3>
                {node.stage && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Phase: {node.stage}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Platform in ONS GSBPM Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Surveys Using Platform</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {surveysUsingNode.length} {surveysUsingNode.length === 1 ? 'Survey' : 'Surveys'}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Surveys using this platform */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Surveys Supported at this Stage:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {surveysUsingNode.map(surveyName => (
              <button
                key={surveyName}
                type="button"
                onClick={() => onSelectSurvey(surveyName)}
                title="Switch to Single Survey flow view for this survey"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-600 text-xs text-slate-200 transition"
              >
                <span>{surveyName}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Upstream & Downstream Transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-1.5">
              Upstream Inflows ({incomingLinks.length})
            </div>
            {incomingLinks.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Entry stage in process</span>
            ) : (
              <div className="space-y-1">
                {incomingLinks.map((l, i) => (
                  <div key={i} className="text-xs text-slate-300 flex justify-between">
                    <span>{l.source}</span>
                    <span className="font-mono text-emerald-400">{l.value} surveys</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-1.5">
              Downstream Outflows ({outgoingLinks.length})
            </div>
            {outgoingLinks.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Final stage in process</span>
            ) : (
              <div className="space-y-1">
                {outgoingLinks.map((l, i) => (
                  <div key={i} className="text-xs text-slate-300 flex justify-between">
                    <span>{l.target}</span>
                    <span className="font-mono text-cyan-400">{l.value} surveys</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LINK DETAILS (Platform to Platform Transition)
  const link = selectedElement.data;
  const sourceNode = link.source as CustomSankeyNode;
  const targetNode = link.target as CustomSankeyNode;
  const sourceName = sourceNode?.name || String(link.source);
  const targetName = targetNode?.name || String(link.target);
  const surveysTraversing = link.surveys || [];

  return (
    <div className="bg-slate-900 border border-indigo-900/50 rounded-xl p-5 shadow-2xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Process Transition Flow
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div>
              <span className="text-base font-bold text-white">{sourceName}</span>
              {sourceNode?.stage && (
                <span className="text-[11px] text-slate-400 block">[{sourceNode.stage}]</span>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0 mx-2" />
            <div>
              <span className="text-base font-bold text-white">{targetName}</span>
              {targetNode?.stage && (
                <span className="text-[11px] text-slate-400 block">[{targetNode.stage}]</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Surveys on this Path</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {link.value} {link.value === 1 ? 'Survey' : 'Surveys'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Surveys on this link */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Surveys Traversing this Step:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {surveysTraversing.map(surveyName => (
            <button
              key={surveyName}
              type="button"
              onClick={() => onSelectSurvey(surveyName)}
              title="Switch to Single Survey flow view for this survey"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-600 text-xs text-slate-200 transition"
            >
              <span>{surveyName}</span>
              <ArrowRight className="w-3 h-3 text-indigo-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
