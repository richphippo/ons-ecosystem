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

export interface ActiveStreamResult {
  nodeIds: Set<string>;
  linkKeys: Set<string>;
}

/**
 * Computes all nodes and links belonging to the individual streams that flow through
 * a selected or hovered node/link from the start of the diagram to the end.
 *
 * Prioritizes survey-based journey tracking when survey metadata is available,
 * and falls back to complete topological graph reachability (upstream ancestors + downstream descendants).
 */
export function getActiveStreamElements(
  target: { nodeId?: string | null; link?: BaseLinkData | null } | null,
  nodes: BaseNodeData[],
  links: (BaseLinkData & { source: any; target: any })[]
): ActiveStreamResult | null {
  if (!target || (!target.nodeId && !target.link)) {
    return null;
  }

  const getSourceId = (l: any) =>
    typeof l.source === 'object' && l.source !== null ? l.source.id : String(l.source);
  const getTargetId = (l: any) =>
    typeof l.target === 'object' && l.target !== null ? l.target.id : String(l.target);

  if (target.nodeId) {
    const activeNode = nodes.find(n => n.id === target.nodeId);
    if (!activeNode) return null;

    // Survey-based journey tracing (full end-to-end paths of all surveys touching this node)
    if (activeNode.surveys && activeNode.surveys.length > 0) {
      const surveySet = new Set(activeNode.surveys);
      const nodeIds = new Set<string>();
      const linkKeys = new Set<string>();

      nodes.forEach(n => {
        if (n.id === activeNode.id || (n.surveys && n.surveys.some(s => surveySet.has(s)))) {
          nodeIds.add(n.id);
        }
      });

      links.forEach(l => {
        const sId = getSourceId(l);
        const tId = getTargetId(l);
        if (l.surveys && l.surveys.some(s => surveySet.has(s))) {
          linkKeys.add(`${sId}__to__${tId}`);
          nodeIds.add(sId);
          nodeIds.add(tId);
        }
      });

      return { nodeIds, linkKeys };
    }

    // Topological reachability fallback (DAG ancestor & descendant traversal)
    const nodeIds = new Set<string>([activeNode.id]);
    const linkKeys = new Set<string>();

    const incoming = new Map<string, Array<{ sourceId: string; key: string }>>();
    const outgoing = new Map<string, Array<{ targetId: string; key: string }>>();

    links.forEach(l => {
      const sId = getSourceId(l);
      const tId = getTargetId(l);
      const key = `${sId}__to__${tId}`;

      if (!outgoing.has(sId)) outgoing.set(sId, []);
      outgoing.get(sId)!.push({ targetId: tId, key });

      if (!incoming.has(tId)) incoming.set(tId, []);
      incoming.get(tId)!.push({ sourceId: sId, key });
    });

    // Upstream traversal (ancestors)
    const upQueue = [activeNode.id];
    const visitedUp = new Set<string>([activeNode.id]);
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      const inEdges = incoming.get(curr) || [];
      for (const edge of inEdges) {
        linkKeys.add(edge.key);
        nodeIds.add(edge.sourceId);
        if (!visitedUp.has(edge.sourceId)) {
          visitedUp.add(edge.sourceId);
          upQueue.push(edge.sourceId);
        }
      }
    }

    // Downstream traversal (descendants)
    const downQueue = [activeNode.id];
    const visitedDown = new Set<string>([activeNode.id]);
    while (downQueue.length > 0) {
      const curr = downQueue.shift()!;
      const outEdges = outgoing.get(curr) || [];
      for (const edge of outEdges) {
        linkKeys.add(edge.key);
        nodeIds.add(edge.targetId);
        if (!visitedDown.has(edge.targetId)) {
          visitedDown.add(edge.targetId);
          downQueue.push(edge.targetId);
        }
      }
    }

    return { nodeIds, linkKeys };
  }

  if (target.link) {
    const sId = getSourceId(target.link);
    const tId = getTargetId(target.link);
    const linkKey = `${sId}__to__${tId}`;

    if (target.link.surveys && target.link.surveys.length > 0) {
      const surveySet = new Set(target.link.surveys);
      const nodeIds = new Set<string>();
      const linkKeys = new Set<string>();

      nodes.forEach(n => {
        if (n.surveys && n.surveys.some(s => surveySet.has(s))) {
          nodeIds.add(n.id);
        }
      });

      links.forEach(l => {
        const s = getSourceId(l);
        const t = getTargetId(l);
        if (l.surveys && l.surveys.some(s => surveySet.has(s))) {
          linkKeys.add(`${s}__to__${t}`);
          nodeIds.add(s);
          nodeIds.add(t);
        }
      });

      return { nodeIds, linkKeys };
    }

    return {
      nodeIds: new Set<string>([sId, tId]),
      linkKeys: new Set<string>([linkKey])
    };
  }

  return null;
}
