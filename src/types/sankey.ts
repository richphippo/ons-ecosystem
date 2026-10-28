import type { SankeyNode as D3SankeyNode, SankeyLink as D3SankeyLink } from 'd3-sankey';

export interface BaseNodeData {
  id: string;
  name: string;
  platformName?: string;
  stage?: string;
  stageIndex?: number;
  category?: string;
  color?: string;
  surveys?: string[];
  metadata?: Record<string, any>;
  incomingValue?: number;
  outgoingValue?: number;
  totalValue?: number;
  value?: number;
}

export interface BaseLinkData {
  source: string;
  target: string;
  value: number;
  sourceStage?: string;
  targetStage?: string;
  surveys?: string[];
  category?: string;
  color?: string;
  metadata?: Record<string, any>;
}

// D3 Sankey Layout types
export type CustomSankeyNode = D3SankeyNode<BaseNodeData, BaseLinkData> & BaseNodeData;
export type CustomSankeyLink = D3SankeyLink<BaseNodeData, BaseLinkData> & BaseLinkData;

export interface SurveyRecord {
  id: string;
  name: string;
  stages: Record<string, string>;
  metadata?: Record<string, any>;
}

export type ViewMode = 'all-surveys' | 'single-survey';

export interface SankeyDataset {
  name: string;
  description?: string;
  nodes: BaseNodeData[];
  links: BaseLinkData[];
  surveys?: SurveyRecord[];
  stageColumns?: string[];
  rawRows?: Record<string, any>[];
  columns?: string[];
  sourceColumn?: string;
  targetColumn?: string;
  valueColumn?: string;
}

export interface FilterState {
  searchQuery: string;
  minValue: number;
  selectedCategory: string | null;
  excludedNodeIds: Set<string>;
}

export type SelectedElement =
  | { type: 'node'; data: CustomSankeyNode }
  | { type: 'link'; data: CustomSankeyLink }
  | null;
