import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { BaseLinkData, BaseNodeData, SankeyDataset, SurveyRecord } from '../types/sankey.ts';

interface ParseResult {
  dataset: SankeyDataset | null;
  error?: string;
}

// Standard 8 GSBPM Phases
export const GSBPM_STAGES = [
  'Specify Needs',
  'Design',
  'Build',
  'Collect',
  'Process',
  'Analyse',
  'Disseminate',
  'Evaluate'
];

const SURVEY_NAME_KEYWORDS = [
  'survey',
  'survey name',
  'survey title',
  'process',
  'name',
  'study',
  'project',
  'collection'
];

/**
 * Normalizes text for matching column names against GSBPM stages
 */
function cleanString(str: string): string {
  return str.replace(/\u00a0/g, ' ').trim().toLowerCase().replace(/[_\-\s0-9.]+/g, '');
}

/**
 * Determines whether the spreadsheet represents:
 * Type A: Survey-by-Stage matrix (1 row per survey, columns for GSBPM process stages)
 * Type B: Direct Source-to-Target edge list
 */
export function isSurveyStageMatrix(columns: string[]): boolean {
  let matchedStages = 0;
  for (const col of columns) {
    const cleanedCol = cleanString(col);
    for (const stage of GSBPM_STAGES) {
      if (cleanedCol.includes(cleanString(stage))) {
        matchedStages++;
        break;
      }
    }
  }
  // If at least 2 GSBPM stages are detected in the columns, treat as a survey-by-stage matrix
  return matchedStages >= 2;
}

/**
 * Parses a Survey-by-Stage matrix (1 row per survey, columns for stages)
 */
export function parseSurveyMatrix(
  rows: Record<string, any>[],
  fileName: string = 'Survey Process Model'
): ParseResult {
  if (!rows || rows.length === 0) {
    return { dataset: null, error: 'The uploaded file has no data rows.' };
  }

  const columns = Object.keys(rows[0]).filter(k => k.trim() !== '');

  // Detect Survey Name column
  let surveyCol = columns.find(col =>
    SURVEY_NAME_KEYWORDS.some(k => col.trim().toLowerCase() === k)
  );
  if (!surveyCol) {
    surveyCol = columns.find(col =>
      SURVEY_NAME_KEYWORDS.some(k => col.trim().toLowerCase().includes(k))
    );
  }
  if (!surveyCol) {
    surveyCol = columns[0]; // Fallback to first column
  }

  // Detect and order stage columns based on GSBPM canonical ordering
  const detectedStageColumns: { column: string; stageIndex: number; canonicalStage: string }[] = [];

  for (const col of columns) {
    if (col === surveyCol) continue;
    const cleanedCol = cleanString(col);

    let foundIdx = -1;
    for (let i = 0; i < GSBPM_STAGES.length; i++) {
      if (cleanedCol.includes(cleanString(GSBPM_STAGES[i]))) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      detectedStageColumns.push({
        column: col,
        stageIndex: foundIdx,
        canonicalStage: GSBPM_STAGES[foundIdx]
      });
    }
  }

  // Sort detected stages by canonical GSBPM order
  detectedStageColumns.sort((a, b) => a.stageIndex - b.stageIndex);

  // Fallback: If no canonical stages matched by keyword, treat all non-survey columns as stages in order
  const stageCols =
    detectedStageColumns.length >= 2
      ? detectedStageColumns
      : columns
          .filter(c => c !== surveyCol)
          .map((col, idx) => ({
            column: col,
            stageIndex: idx,
            canonicalStage: col
          }));

  if (stageCols.length < 2) {
    return {
      dataset: null,
      error: `Could not identify enough process stages. At least 2 stage columns are required.`
    };
  }

  const nodeMap = new Map<string, BaseNodeData>();
  const linkMap = new Map<string, BaseLinkData>();
  const surveys: SurveyRecord[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const surveyName = String(row[surveyCol] || `Survey #${r + 1}`).trim();
    if (!surveyName) continue;

    const surveyStages: Record<string, string> = {};
    const metadata: Record<string, any> = {};

    for (const col of columns) {
      if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
        metadata[col] = row[col];
      }
    }

    // Trace journey across stages
    let prevNodeId: string | null = null;
    let prevStageName: string | null = null;

    for (const stageInfo of stageCols) {
      const platformRaw = row[stageInfo.column];
      if (platformRaw === undefined || platformRaw === null || String(platformRaw).trim() === '') {
        continue; // Survey does not use a platform or skips this stage
      }

      const platformName = String(platformRaw).trim();
      surveyStages[stageInfo.canonicalStage] = platformName;

      // Unique node ID scoped by stage to prevent cycles and ensure strict left-to-right flow
      const nodeId = `${stageInfo.canonicalStage}__${platformName}`;

      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          name: platformName,
          platformName,
          stage: stageInfo.canonicalStage,
          stageIndex: stageInfo.stageIndex,
          category: stageInfo.canonicalStage,
          surveys: [surveyName],
          totalValue: 1,
          incomingValue: 0,
          outgoingValue: 0,
          metadata: {
            stage: stageInfo.canonicalStage,
            platform: platformName
          }
        });
      } else {
        const existingNode = nodeMap.get(nodeId)!;
        if (!existingNode.surveys?.includes(surveyName)) {
          existingNode.surveys?.push(surveyName);
          existingNode.totalValue = (existingNode.totalValue || 0) + 1;
        }
      }

      // If there is a previous stage, create/aggregate link
      if (prevNodeId && prevStageName) {
        const linkKey = `${prevNodeId}__to__${nodeId}`;
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, {
            source: prevNodeId,
            target: nodeId,
            value: 1,
            sourceStage: prevStageName,
            targetStage: stageInfo.canonicalStage,
            category: `${prevStageName} → ${stageInfo.canonicalStage}`,
            surveys: [surveyName],
            metadata: {
              sourceStage: prevStageName,
              targetStage: stageInfo.canonicalStage
            }
          });
        } else {
          const existingLink = linkMap.get(linkKey)!;
          if (!existingLink.surveys?.includes(surveyName)) {
            existingLink.surveys?.push(surveyName);
            existingLink.value += 1;
          }
        }

        // Update incoming/outgoing values
        const prevNode = nodeMap.get(prevNodeId)!;
        prevNode.outgoingValue = (prevNode.outgoingValue || 0) + 1;

        const currNode = nodeMap.get(nodeId)!;
        currNode.incomingValue = (currNode.incomingValue || 0) + 1;
      }

      prevNodeId = nodeId;
      prevStageName = stageInfo.canonicalStage;
    }

    surveys.push({
      id: surveyName,
      name: surveyName,
      stages: surveyStages,
      metadata
    });
  }

  const finalNodes = Array.from(nodeMap.values());
  const finalLinks = Array.from(linkMap.values());

  if (finalNodes.length === 0 || finalLinks.length === 0) {
    return {
      dataset: null,
      error: 'Could not construct survey pathways. Ensure rows contain platform values across multiple stages.'
    };
  }

  return {
    dataset: {
      name: fileName.replace(/\.[^/.]+$/, ''),
      description: `GSBPM Workflow across ${surveys.length} surveys and ${stageCols.length} process stages.`,
      nodes: finalNodes,
      links: finalLinks,
      surveys,
      stageColumns: stageCols.map(s => s.canonicalStage),
      rawRows: rows,
      columns,
      sourceColumn: 'Survey Stage Platform',
      targetColumn: 'Next Stage Platform',
      valueColumn: 'Surveys'
    }
  };
}

/**
 * Standard edge-list parser (Source, Target, Value) for legacy/arbitrary formats
 */
export function parseEdgeList(
  rows: Record<string, any>[],
  fileName: string = 'Uploaded Dataset'
): ParseResult {
  const firstRow = rows[0];
  const columns = Object.keys(firstRow).filter(k => k.trim() !== '');

  const sourceCol = columns.find(c => /source|from|origin|input/i.test(c)) || columns[0];
  const targetCol = columns.find(c => /target|to|dest|output/i.test(c) && c !== sourceCol) || columns[1];
  const valueCol = columns.find(c => /value|weight|count|amount|surveys/i.test(c));

  const nodeMap = new Map<string, BaseNodeData>();
  const linkMap = new Map<string, BaseLinkData>();

  for (const row of rows) {
    const s = String(row[sourceCol] ?? '').trim();
    const t = String(row[targetCol] ?? '').trim();
    if (!s || !t || s === t) continue;

    let val = 1;
    if (valueCol && row[valueCol] !== undefined) {
      const parsed = parseFloat(String(row[valueCol]).replace(/[^0-9.-]+/g, ''));
      if (!isNaN(parsed) && parsed > 0) val = parsed;
    }

    const linkKey = `${s}__to__${t}`;
    if (!linkMap.has(linkKey)) {
      linkMap.set(linkKey, { source: s, target: t, value: val, metadata: row });
    } else {
      linkMap.get(linkKey)!.value += val;
    }

    if (!nodeMap.has(s)) {
      nodeMap.set(s, { id: s, name: s, totalValue: val });
    } else {
      nodeMap.get(s)!.totalValue = (nodeMap.get(s)!.totalValue || 0) + val;
    }

    if (!nodeMap.has(t)) {
      nodeMap.set(t, { id: t, name: t, totalValue: val });
    } else {
      nodeMap.get(t)!.totalValue = (nodeMap.get(t)!.totalValue || 0) + val;
    }
  }

  return {
    dataset: {
      name: fileName.replace(/\.[^/.]+$/, ''),
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
      rawRows: rows,
      columns
    }
  };
}

/**
 * Master parser: Automatically detects format and routes to parseSurveyMatrix or parseEdgeList
 */
export function parseSpreadsheetRows(
  rows: Record<string, any>[],
  fileName: string = 'Uploaded Dataset'
): ParseResult {
  if (!rows || rows.length === 0) {
    return { dataset: null, error: 'The uploaded file contains no data rows.' };
  }

  const columns = Object.keys(rows[0]).filter(k => k.trim() !== '');
  if (isSurveyStageMatrix(columns)) {
    return parseSurveyMatrix(rows, fileName);
  }

  return parseEdgeList(rows, fileName);
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    if (extension === 'csv') {
      return new Promise(resolve => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: results => {
            const parsed = parseSpreadsheetRows(results.data as Record<string, any>[], file.name);
            resolve(parsed);
          },
          error: err => {
            resolve({ dataset: null, error: `CSV Parsing Error: ${err.message}` });
          }
        });
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return { dataset: null, error: 'The Excel workbook has no sheets.' };
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      return parseSpreadsheetRows(rows, file.name);
    } else {
      return {
        dataset: null,
        error: `Unsupported file format: .${extension}. Please upload a .csv or .xlsx file.`
      };
    }
  } catch (err: any) {
    return {
      dataset: null,
      error: `Failed to process file: ${err.message || 'Unknown error'}`
    };
  }
}
