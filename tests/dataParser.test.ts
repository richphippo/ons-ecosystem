import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSpreadsheetRows, parseSurveyMatrix, isSurveyStageMatrix } from '../src/utils/dataParser.ts';

test('isSurveyStageMatrix identifies GSBPM matrix columns', () => {
  const gsbpmColumns = ['Survey Name', 'Specify Needs', 'Design', 'Build', 'Collect', 'Process', 'Analyse', 'Disseminate'];
  assert.equal(isSurveyStageMatrix(gsbpmColumns), true);

  const edgeListColumns = ['Source', 'Target', 'Value'];
  assert.equal(isSurveyStageMatrix(edgeListColumns), false);
});

test('parseSurveyMatrix extracts survey pathways across GSBPM stages', () => {
  const rows = [
    {
      'Survey Name': 'Labour Force Survey',
      'Collect': 'Blaise CATI',
      'Process': 'SAS Server',
      'Analyse': 'R Studio',
      'Disseminate': 'Nomis'
    },
    {
      'Survey Name': 'Monthly Business Survey',
      'Collect': 'EQ',
      'Process': 'PySpark',
      'Analyse': 'R Studio',
      'Disseminate': 'Open Data API'
    }
  ];

  const result = parseSurveyMatrix(rows, 'test_matrix.csv');

  assert.ok(result.dataset);
  assert.equal(result.error, undefined);
  assert.equal(result.dataset.surveys?.length, 2);

  // Check stage-qualified nodes
  const rStudioNode = result.dataset.nodes.find(n => n.name === 'R Studio' && n.stage === 'Analyse');
  assert.ok(rStudioNode);
  assert.equal(rStudioNode.surveys?.length, 2);
  assert.ok(rStudioNode.surveys?.includes('Labour Force Survey'));
  assert.ok(rStudioNode.surveys?.includes('Monthly Business Survey'));

  // Check link generation between consecutive stages
  const lfsLink = result.dataset.links.find(
    l => l.source === 'Collect__Blaise CATI' && l.target === 'Process__SAS Server'
  );
  assert.ok(lfsLink);
  assert.equal(lfsLink.value, 1);
  assert.ok(lfsLink.surveys?.includes('Labour Force Survey'));
});

test('parseSpreadsheetRows falls back to edge-list if matrix headers not present', () => {
  const edgeRows = [
    { Source: 'A', Target: 'B', Value: 10 },
    { Source: 'B', Target: 'C', Value: 10 }
  ];
  const result = parseSpreadsheetRows(edgeRows);
  assert.ok(result.dataset);
  assert.equal(result.dataset.nodes.length, 3);
  assert.equal(result.dataset.links.length, 2);
});
