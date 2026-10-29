'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BaseLinkData,
  BaseNodeData,
  CustomSankeyLink,
  CustomSankeyNode,
  SelectedElement
} from '@/types/sankey';
import { computeSankeyLayout, getLinkPath, getNodeColor } from '@/utils/sankeyLayout';
import { Info } from 'lucide-react';

interface SankeyDiagramProps {
  nodes: BaseNodeData[];
  links: BaseLinkData[];
  selectedElement: SelectedElement;
  onSelectElement: (element: SelectedElement) => void;
  valueUnitName?: string;
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
  selectedElement,
  onSelectElement,
  valueUnitName = 'Surveys'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 600
  });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkKey, setHoveredLinkKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    stage?: string;
    value: string;
    surveys?: string[];
  } | null>(null);

  // Resize observer to ensure the diagram fills the available viewport
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.max(500, height) });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute D3 Sankey Layout
  const layout = useMemo(() => {
    return computeSankeyLayout(nodes, links, dimensions.width, dimensions.height);
  }, [nodes, links, dimensions.width, dimensions.height]);

  // Compute connected nodes and links for highlight effects
  const activeNodeId = hoveredNodeId || (selectedElement?.type === 'node' ? selectedElement.data.id : null);
  const activeLink = selectedElement?.type === 'link' ? selectedElement.data : null;

  const connectedLinkKeys = useMemo(() => {
    if (!activeNodeId) return null;
    const keys = new Set<string>();
    links.forEach(l => {
      if (l.source === activeNodeId || l.target === activeNodeId) {
        keys.add(`${l.source}__to__${l.target}`);
      }
    });
    return keys;
  }, [activeNodeId, links]);

  if (!layout || layout.nodes.length === 0 || layout.links.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-[#D0D2D3]"
      >
        <div className="w-14 h-14 rounded-full bg-[#EBF2F7] border border-[#206095] flex items-center justify-center mb-3 text-[#206095]">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#003C57] mb-1">No Flow Data to Display</h3>
        <p className="text-sm text-[#595959] max-w-md">
          {nodes.length === 0
            ? 'No platforms or stages match the current filter criteria.'
            : 'Try adjusting your filter settings.'}
        </p>
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip && containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      setTooltip(prev =>
        prev
          ? {
              ...prev,
              x: e.clientX - bounds.left,
              y: e.clientY - bounds.top
            }
          : null
      );
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-[550px] bg-white border border-[#D0D2D3] rounded-lg shadow-sm overflow-hidden select-none"
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {layout.links.map((link, idx) => {
            const sourceNode = link.source as CustomSankeyNode;
            const targetNode = link.target as CustomSankeyNode;
            const sourceColor = getNodeColor(sourceNode.name, sourceNode.category, sourceNode.stage);
            const targetColor = getNodeColor(targetNode.name, targetNode.category, targetNode.stage);
            const gradId = `link-grad-${idx}`;

            return (
              <linearGradient
                key={gradId}
                id={gradId}
                gradientUnits="userSpaceOnUse"
                x1={sourceNode.x1}
                x2={targetNode.x0}
              >
                <stop offset="0%" stopColor={sourceColor} stopOpacity={0.45} />
                <stop offset="100%" stopColor={targetColor} stopOpacity={0.45} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Links Layer */}
        <g className="links-layer">
          {layout.links.map((link, idx) => {
            const pathData = getLinkPath(link as any) || '';
            const sourceNode = link.source as CustomSankeyNode;
            const targetNode = link.target as CustomSankeyNode;
            const linkKey = `${sourceNode.id}__to__${targetNode.id}`;
            const gradId = `link-grad-${idx}`;

            const isHovered = hoveredLinkKey === linkKey;
            const isSelected =
              selectedElement?.type === 'link' &&
              (selectedElement.data.source as CustomSankeyNode).id === sourceNode.id &&
              (selectedElement.data.target as CustomSankeyNode).id === targetNode.id;

            let isDimmed = false;
            if (activeNodeId) {
              isDimmed = !connectedLinkKeys?.has(linkKey);
            } else if (activeLink) {
              const activeSource = (activeLink.source as CustomSankeyNode).id;
              const activeTarget = (activeLink.target as CustomSankeyNode).id;
              isDimmed = !(activeSource === sourceNode.id && activeTarget === targetNode.id);
            }

            const strokeOpacity = isSelected
              ? 0.95
              : isHovered
              ? 0.8
              : isDimmed
              ? 0.08
              : 0.38;

            return (
              <path
                key={`link-${idx}`}
                d={pathData}
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth={Math.max(2.5, link.width || 1)}
                strokeOpacity={strokeOpacity}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={e => {
                  setHoveredLinkKey(linkKey);
                  const bounds = containerRef.current?.getBoundingClientRect();
                  setTooltip({
                    x: e.clientX - (bounds?.left || 0),
                    y: e.clientY - (bounds?.top || 0) - 20,
                    title: `${sourceNode.name} → ${targetNode.name}`,
                    stage: `${sourceNode.stage || 'Source'} → ${targetNode.stage || 'Target'}`,
                    value: `${link.value} ${link.value === 1 ? 'Survey' : 'Surveys'}`,
                    surveys: link.surveys
                  });
                }}
                onMouseLeave={() => {
                  setHoveredLinkKey(null);
                  setTooltip(null);
                }}
                onClick={e => {
                  e.stopPropagation();
                  onSelectElement({ type: 'link', data: link });
                }}
              />
            );
          })}
        </g>

        {/* Nodes Layer */}
        <g className="nodes-layer">
          {layout.nodes.map(node => {
            const nodeWidth = (node.x1 || 0) - (node.x0 || 0);
            const nodeHeight = Math.max(5, (node.y1 || 0) - (node.y0 || 0));
            const nodeColor = getNodeColor(node.name, node.category, node.stage);

            const isHovered = hoveredNodeId === node.id;
            const isSelected = selectedElement?.type === 'node' && selectedElement.data.id === node.id;

            let isDimmed = false;
            if (hoveredNodeId && hoveredNodeId !== node.id) {
              const isDirectlyConnected = layout.links.some(l => {
                const s = (l.source as CustomSankeyNode).id;
                const t = (l.target as CustomSankeyNode).id;
                return (s === hoveredNodeId && t === node.id) || (t === hoveredNodeId && s === node.id);
              });
              isDimmed = !isDirectlyConnected;
            }

            const isLeftAligned = (node.x0 || 0) < dimensions.width / 2;

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${node.x0}, ${node.y0})`}
                className="cursor-pointer transition-opacity duration-150"
                opacity={isDimmed ? 0.25 : 1}
                onMouseEnter={e => {
                  setHoveredNodeId(node.id);
                  const bounds = containerRef.current?.getBoundingClientRect();
                  setTooltip({
                    x: e.clientX - (bounds?.left || 0),
                    y: e.clientY - (bounds?.top || 0) - 20,
                    title: node.name,
                    stage: node.stage ? `GSBPM Phase: ${node.stage}` : undefined,
                    value: `${node.value || 0} ${(node.value || 0) === 1 ? 'Survey' : 'Surveys'}`,
                    surveys: node.surveys
                  });
                }}
                onMouseLeave={() => {
                  setHoveredNodeId(null);
                  setTooltip(null);
                }}
                onClick={e => {
                  e.stopPropagation();
                  onSelectElement({ type: 'node', data: node });
                }}
              >
                {/* Node Bar with ONS accessible focus/selected border */}
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  fill={nodeColor}
                  rx={2}
                  stroke={isSelected ? '#FBC900' : isHovered ? '#003C57' : '#FFFFFF'}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                  className="transition-all duration-150"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 6px rgba(251, 201, 0, 0.8))' : undefined
                  }}
                />

                {/* Node Platform Name */}
                <text
                  x={isLeftAligned ? nodeWidth + 8 : -8}
                  y={nodeHeight / 2 - 4}
                  dy="0.35em"
                  textAnchor={isLeftAligned ? 'start' : 'end'}
                  className="text-xs font-bold fill-[#003C57] pointer-events-none"
                >
                  {node.name}
                </text>

                {/* Stage Badge & Flow Volume */}
                <text
                  x={isLeftAligned ? nodeWidth + 8 : -8}
                  y={nodeHeight / 2 + 10}
                  dy="0.35em"
                  textAnchor={isLeftAligned ? 'start' : 'end'}
                  className="text-[10px] font-mono font-semibold fill-[#595959] pointer-events-none"
                >
                  {node.stage ? `${node.stage} • ` : ''}
                  {node.value || 0} {(node.value || 0) === 1 ? 'survey' : 'surveys'}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Dynamic Tooltip with ONS Styling */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 px-3.5 py-2.5 rounded-md bg-white border-2 border-[#003C57] shadow-xl text-xs text-[#222222] max-w-sm -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          <div className="font-bold text-[#003C57] text-sm">{tooltip.title}</div>
          {tooltip.stage && <div className="text-[11px] text-[#206095] font-semibold mb-1">{tooltip.stage}</div>}
          <div className="font-mono text-[#0F8243] font-bold mb-1.5">{tooltip.value}</div>

          {tooltip.surveys && tooltip.surveys.length > 0 && (
            <div className="border-t border-[#D0D2D3] pt-1.5 mt-1">
              <span className="text-[10px] uppercase tracking-wider text-[#595959] font-bold block mb-1">
                Surveys Traversing ({tooltip.surveys.length}):
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {tooltip.surveys.map(s => (
                  <span key={s} className="bg-[#EBF2F7] text-[#206095] border border-[#BCDCF0] px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background click to dismiss selection */}
      <div
        className="absolute inset-0 pointer-events-none"
        onClick={() => onSelectElement(null)}
      />
    </div>
  );
};
