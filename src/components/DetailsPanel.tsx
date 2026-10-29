'use client';

import React from 'react';
import type {
  BaseLinkData,
  BaseNodeData,
  CustomSankeyNode,
  SelectedElement
} from '@/types/sankey';
import { ArrowRight, X, Users, Sparkles } from 'lucide-react';
import { getNodeColor } from '@/utils/sankeyLayout';

interface DetailsPanelProps {
  selectedElement: SelectedElement;
  onClearSelection: () => void;
  allNodes: BaseNodeData[];
  allLinks: BaseLinkData[];
  onSelectSurvey: (surveyName: string) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedElement,
  onClearSelection,
  allNodes,
  allLinks,
  onSelectSurvey
}) => {
  if (!selectedElement) {
    return null;
  }

  // NODE DETAILS (Platform at Stage)
  if (selectedElement.type === 'node') {
    const node = selectedElement.data;
    const nodeColor = getNodeColor(node.name, node.category, node.stage);
    const surveysUsingNode = node.surveys || [];

    const incomingLinks = allLinks.filter(l => l.target === node.id);
    const outgoingLinks = allLinks.filter(l => l.source === node.id);

    return (
      <div className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-5 shadow-2xl animate-in fade-in duration-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-10 rounded-sm shadow-md shrink-0"
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
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Surveys Supported at this Stage (Click to select in process flow below):</span>
            </span>
            <span className="text-xs text-indigo-400 font-mono">
              {surveysUsingNode.length} surveys
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            {surveysUsingNode.map(surveyName => (
              <button
                key={surveyName}
                type="button"
                onClick={() => onSelectSurvey(surveyName)}
                title={`Inspect ${surveyName} process flow`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-900/60 border border-slate-800 hover:border-indigo-500 text-xs text-slate-200 transition group"
              >
                <span>{surveyName}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Upstream & Downstream Transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
              <span>Upstream Inflows</span>
              <span className="font-mono text-slate-400">{incomingLinks.length}</span>
            </div>
            {incomingLinks.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Entry stage in process</span>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {incomingLinks.map((l, i) => (
                  <div key={i} className="text-xs text-slate-300 flex justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="truncate max-w-[70%]">{l.source}</span>
                    <span className="font-mono text-emerald-400 shrink-0">{l.value} surveys</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
              <span>Downstream Outflows</span>
              <span className="font-mono text-slate-400">{outgoingLinks.length}</span>
            </div>
            {outgoingLinks.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Final stage in process</span>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {outgoingLinks.map((l, i) => (
                  <div key={i} className="text-xs text-slate-300 flex justify-between bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="truncate max-w-[70%]">{l.target}</span>
                    <span className="font-mono text-cyan-400 shrink-0">{l.value} surveys</span>
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
    <div className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-5 shadow-2xl animate-in fade-in duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
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
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Surveys Traversing this Step (Click to select in process flow below):</span>
          </span>
          <span className="text-xs text-indigo-400 font-mono">
            {surveysTraversing.length} surveys
          </span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
          {surveysTraversing.map(surveyName => (
            <button
              key={surveyName}
              type="button"
              onClick={() => onSelectSurvey(surveyName)}
              title={`Inspect ${surveyName} process flow`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-900/60 border border-slate-800 hover:border-indigo-500 text-xs text-slate-200 transition group"
            >
              <span>{surveyName}</span>
              <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
