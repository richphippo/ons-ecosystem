'use client';

import React from 'react';
import type {
  BaseLinkData,
  BaseNodeData,
  CustomSankeyNode,
  SelectedElement
} from '@/types/sankey';
import { ArrowRight, X, Users } from 'lucide-react';
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
      <div className="bg-white border-2 border-[#206095] rounded-lg p-5 shadow-sm animate-in fade-in duration-150 space-y-4 text-[#222222]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#D0D2D3]">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-10 rounded-sm shadow-sm shrink-0"
              style={{ backgroundColor: nodeColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#003C57]">{node.name}</h3>
                {node.stage && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF2F7] text-[#206095] border border-[#BCDCF0]">
                    GSBPM: {node.stage}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#595959] mt-0.5">
                Active Platform in ONS Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-[#595959] font-medium">Surveys Using Platform</div>
              <div className="text-lg font-bold font-mono text-[#0F8243]">
                {surveysUsingNode.length} {surveysUsingNode.length === 1 ? 'Survey' : 'Surveys'}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#595959] hover:text-[#003C57] border border-[#D0D2D3] transition"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Surveys using this platform */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#003C57] mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#206095]" />
              <span>Surveys Supported at this Stage (Click to select in process flow below):</span>
            </span>
            <span className="text-xs text-[#206095] font-mono">
              {surveysUsingNode.length} surveys
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-[#F8F9FA] rounded-md border border-[#D0D2D3]">
            {surveysUsingNode.map(surveyName => (
              <button
                key={surveyName}
                type="button"
                onClick={() => onSelectSurvey(surveyName)}
                title={`Inspect ${surveyName} process flow`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#EBF2F7] border border-[#BCDCF0] hover:border-[#206095] text-xs font-semibold text-[#206095] shadow-xs transition group"
              >
                <span>{surveyName}</span>
                <ArrowRight className="w-3 h-3 text-[#206095] group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Upstream & Downstream Transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-[#F8F9FA] rounded-md p-3 border border-[#D0D2D3]">
            <div className="text-xs font-bold text-[#003C57] mb-1.5 flex justify-between">
              <span>Upstream Inflows</span>
              <span className="font-mono text-[#595959]">{incomingLinks.length}</span>
            </div>
            {incomingLinks.length === 0 ? (
              <span className="text-xs text-[#595959] italic">Entry stage in process</span>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {incomingLinks.map((l, i) => (
                  <div key={i} className="text-xs text-[#222222] flex justify-between bg-white px-2.5 py-1 rounded border border-[#E8EDEE]">
                    <span className="truncate max-w-[70%] font-medium">{l.source}</span>
                    <span className="font-mono font-bold text-[#0F8243] shrink-0">{l.value} surveys</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#F8F9FA] rounded-md p-3 border border-[#D0D2D3]">
            <div className="text-xs font-bold text-[#003C57] mb-1.5 flex justify-between">
              <span>Downstream Outflows</span>
              <span className="font-mono text-[#595959]">{outgoingLinks.length}</span>
            </div>
            {outgoingLinks.length === 0 ? (
              <span className="text-xs text-[#595959] italic">Final stage in process</span>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {outgoingLinks.map((l, i) => (
                  <div key={i} className="text-xs text-[#222222] flex justify-between bg-white px-2.5 py-1 rounded border border-[#E8EDEE]">
                    <span className="truncate max-w-[70%] font-medium">{l.target}</span>
                    <span className="font-mono font-bold text-[#206095] shrink-0">{l.value} surveys</span>
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
    <div className="bg-white border-2 border-[#206095] rounded-lg p-5 shadow-sm animate-in fade-in duration-150 space-y-4 text-[#222222]">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-[#D0D2D3]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#206095]">
            Process Transition Flow
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div>
              <span className="text-base font-bold text-[#003C57]">{sourceName}</span>
              {sourceNode?.stage && (
                <span className="text-[11px] text-[#595959] block font-medium">[{sourceNode.stage}]</span>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-[#206095] shrink-0 mx-2" />
            <div>
              <span className="text-base font-bold text-[#003C57]">{targetName}</span>
              {targetNode?.stage && (
                <span className="text-[11px] text-[#595959] block font-medium">[{targetNode.stage}]</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-[#595959] font-medium">Surveys on this Path</div>
            <div className="text-xl font-bold font-mono text-[#0F8243]">
              {link.value} {link.value === 1 ? 'Survey' : 'Surveys'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#595959] hover:text-[#003C57] border border-[#D0D2D3] transition"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Surveys on this link */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-[#003C57] mb-2">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#206095]" />
            <span>Surveys Traversing this Step (Click to select in process flow below):</span>
          </span>
          <span className="text-xs text-[#206095] font-mono font-bold">
            {surveysTraversing.length} surveys
          </span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-[#F8F9FA] rounded-md border border-[#D0D2D3]">
          {surveysTraversing.map(surveyName => (
            <button
              key={surveyName}
              type="button"
              onClick={() => onSelectSurvey(surveyName)}
              title={`Inspect ${surveyName} process flow`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#EBF2F7] border border-[#BCDCF0] hover:border-[#206095] text-xs font-semibold text-[#206095] shadow-xs transition group"
            >
              <span>{surveyName}</span>
              <ArrowRight className="w-3 h-3 text-[#206095] group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
