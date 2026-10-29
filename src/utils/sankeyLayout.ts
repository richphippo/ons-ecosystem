import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import type { BaseLinkData, BaseNodeData, CustomSankeyLink, CustomSankeyNode } from '../types/sankey.ts';

// Official ONS Brand Guidelines & Design System Color Mapping for GSBPM Phases
export const STAGE_COLOR_MAP: Record<string, string> = {
  'Specify Needs': '#003C57', // ONS Night Blue
  'Design': '#206095',        // ONS Ocean Blue
  'Build': '#27A0CC',         // ONS Sky Blue
  'Collect': '#0F8243',       // ONS Spring Green
  'Process': '#82BB23',       // ONS Leaf Green
  'Analyse': '#008080',       // ONS Teal / Petroleum
  'Disseminate': '#D67B00',   // ONS Warm Amber
  'Evaluate': '#6E328C'       // ONS Heather / Purple
};

const ONS_PALETTE = [
  '#206095', // Ocean Blue
  '#0F8243', // Spring Green
  '#27A0CC', // Sky Blue
  '#82BB23', // Leaf Green
  '#003C57', // Night Blue
  '#D67B00', // Amber
  '#6E328C', // Heather
  '#D0021B'  // Ruby Red
];

export function getNodeColor(nodeName: string, category?: string, stage?: string): string {
  if (stage && STAGE_COLOR_MAP[stage]) {
    return STAGE_COLOR_MAP[stage];
  }
  if (category && STAGE_COLOR_MAP[category]) {
    return STAGE_COLOR_MAP[category];
  }

  const key = category || nodeName;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ONS_PALETTE.length;
  return ONS_PALETTE[index];
}

/**
 * Sanitizes graph into a Directed Acyclic Graph (DAG) for D3-Sankey.
 */
export function sanitizeDAG(
  rawNodes: BaseNodeData[],
  rawLinks: BaseLinkData[]
): { nodes: BaseNodeData[]; links: BaseLinkData[] } {
  const nodes = rawNodes.map(n => ({ ...n }));
  const links = rawLinks.map(l => ({ ...l }));

  const nodeMap = new Map<string, BaseNodeData>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  links.forEach(l => {
    if (adj.has(l.source) && adj.has(l.target)) {
      adj.get(l.source)!.push(l.target);
    }
  });

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  const backEdges = new Set<string>();

  function dfs(u: string) {
    visited.set(u, 1);
    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      const state = visited.get(v) || 0;
      if (state === 1) {
        backEdges.add(`${u}__${v}`);
      } else if (state === 0) {
        dfs(v);
      }
    }
    visited.set(u, 2);
  }

  nodes.forEach(n => {
    if ((visited.get(n.id) || 0) === 0) {
      dfs(n.id);
    }
  });

  if (backEdges.size > 0) {
    links.forEach(l => {
      const key = `${l.source}__${l.target}`;
      if (backEdges.has(key)) {
        const feedbackNodeId = `${l.target} (Feedback)`;
        if (!nodeMap.has(feedbackNodeId)) {
          const original = nodeMap.get(l.target);
          const feedbackNode: BaseNodeData = {
            id: feedbackNodeId,
            name: `${original?.name || l.target} (Feedback)`,
            category: original?.category,
            stage: original?.stage,
            metadata: original?.metadata
          };
          nodes.push(feedbackNode);
          nodeMap.set(feedbackNodeId, feedbackNode);
        }
        l.target = feedbackNodeId;
      }
    });
  }

  return { nodes, links };
}

export function computeSankeyLayout(
  rawNodes: BaseNodeData[],
  rawLinks: BaseLinkData[],
  width: number,
  height: number
): { nodes: CustomSankeyNode[]; links: CustomSankeyLink[] } | null {
  if (rawNodes.length === 0 || rawLinks.length === 0 || width <= 100 || height <= 100) {
    return null;
  }

  const { nodes: safeNodes, links: safeLinks } = sanitizeDAG(rawNodes, rawLinks);

  const nodes = safeNodes.map(d => ({ ...d }));
  const links = safeLinks.map(d => ({ ...d }));

  const nodeIds = new Set(nodes.map(n => n.id));
  const validLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

  if (validLinks.length === 0) {
    return null;
  }

  try {
    const marginLeft = 75;
    const marginRight = 75;
    const marginTop = 58;
    const marginBottom = 20;

    const sankeyGenerator = sankey<BaseNodeData, BaseLinkData>()
      .nodeId(d => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(20)
      .nodePadding(Math.max(12, Math.min(26, height / (nodes.length * 1.2))))
      .extent([
        [marginLeft, marginTop],
        [width - marginRight, height - marginBottom]
      ]);

    const graph = sankeyGenerator({
      nodes,
      links: validLinks
    });

    return {
      nodes: graph.nodes as CustomSankeyNode[],
      links: graph.links as CustomSankeyLink[]
    };
  } catch (err) {
    console.warn('Failed to compute sankey layout:', err);
    return null;
  }
}

export const getLinkPath = sankeyLinkHorizontal();
