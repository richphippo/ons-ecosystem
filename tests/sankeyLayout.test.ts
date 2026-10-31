import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDAG, computeSankeyLayout, getActiveStreamElements } from '../src/utils/sankeyLayout.ts';

test('sanitizeDAG prevents cycles by creating feedback nodes', () => {
  const nodes = [
    { id: 'Node A', name: 'Node A' },
    { id: 'Node B', name: 'Node B' }
  ];

  // A -> B and B -> A creates a cycle
  const links = [
    { source: 'Node A', target: 'Node B', value: 10 },
    { source: 'Node B', target: 'Node A', value: 5 }
  ];

  const sanitized = sanitizeDAG(nodes, links);

  // Sanitized links should no longer loop back directly to 'Node A'
  const backLink = sanitized.links.find(l => l.source === 'Node B');
  assert.ok(backLink);
  assert.equal(backLink.target, 'Node A (Feedback)');

  // A feedback node should have been inserted
  const feedbackNode = sanitized.nodes.find(n => n.id === 'Node A (Feedback)');
  assert.ok(feedbackNode);
});

test('computeSankeyLayout generates coordinates for nodes and paths for links', () => {
  const nodes = [
    { id: 'Source 1', name: 'Source 1' },
    { id: 'Source 2', name: 'Source 2' },
    { id: 'Target', name: 'Target' }
  ];

  const links = [
    { source: 'Source 1', target: 'Target', value: 100 },
    { source: 'Source 2', target: 'Target', value: 50 }
  ];

  const result = computeSankeyLayout(nodes, links, 800, 500);

  assert.ok(result);
  assert.equal(result.nodes.length, 3);
  assert.equal(result.links.length, 2);

  // Check that nodes have calculated coordinates
  for (const node of result.nodes) {
    assert.ok(node.x0 !== undefined && node.x0 >= 0);
    assert.ok(node.x1 !== undefined && node.x1 <= 800);
    assert.ok(node.y0 !== undefined && node.y0 >= 0);
    assert.ok(node.y1 !== undefined && node.y1 <= 500);
  }

  // Check that links have calculated widths
  for (const link of result.links) {
    assert.ok(link.width !== undefined && link.width > 0);
  }
});

test('getActiveStreamElements highlights complete survey journeys from start to end', () => {
  const nodes = [
    { id: 'N1', name: 'N1', surveys: ['Survey1', 'Survey2'] },
    { id: 'N2', name: 'N2', surveys: ['Survey1', 'Survey2'] },
    { id: 'N3', name: 'N3', surveys: ['Survey1', 'Survey3'] },
    { id: 'N4', name: 'N4', surveys: ['Survey1', 'Survey3'] },
    { id: 'N5', name: 'N5', surveys: ['Survey2'] },
    { id: 'N6', name: 'N6', surveys: ['Survey2'] },
    { id: 'N7', name: 'N7', surveys: ['Survey3'] },
    { id: 'N8', name: 'N8', surveys: ['Survey3'] }
  ];

  const links = [
    { source: 'N1', target: 'N2', value: 2, surveys: ['Survey1', 'Survey2'] },
    { source: 'N2', target: 'N3', value: 1, surveys: ['Survey1'] },
    { source: 'N3', target: 'N4', value: 2, surveys: ['Survey1', 'Survey3'] },
    { source: 'N2', target: 'N5', value: 1, surveys: ['Survey2'] },
    { source: 'N5', target: 'N6', value: 1, surveys: ['Survey2'] },
    { source: 'N7', target: 'N8', value: 1, surveys: ['Survey3'] },
    { source: 'N8', target: 'N3', value: 1, surveys: ['Survey3'] }
  ];

  // When N2 is active, Survey1 and Survey2 pass through it
  const result = getActiveStreamElements({ nodeId: 'N2' }, nodes, links);
  assert.ok(result);

  // Nodes for Survey1 and Survey2 must be present
  assert.ok(result.nodeIds.has('N1'));
  assert.ok(result.nodeIds.has('N2'));
  assert.ok(result.nodeIds.has('N3'));
  assert.ok(result.nodeIds.has('N4'));
  assert.ok(result.nodeIds.has('N5'));
  assert.ok(result.nodeIds.has('N6'));

  // N7 and N8 belong strictly to Survey3 (which never passes through N2)
  assert.equal(result.nodeIds.has('N7'), false);
  assert.equal(result.nodeIds.has('N8'), false);

  // Links traversed by Survey1 and Survey2 must be present from start to end
  assert.ok(result.linkKeys.has('N1__to__N2'));
  assert.ok(result.linkKeys.has('N2__to__N3'));
  assert.ok(result.linkKeys.has('N3__to__N4'));
  assert.ok(result.linkKeys.has('N2__to__N5'));
  assert.ok(result.linkKeys.has('N5__to__N6'));

  // Links exclusive to Survey3 must be excluded
  assert.equal(result.linkKeys.has('N7__to__N8'), false);
  assert.equal(result.linkKeys.has('N8__to__N3'), false);
});

test('getActiveStreamElements falls back to topological reachability when surveys metadata is absent', () => {
  const nodes = [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' },
    { id: 'C', name: 'C' },
    { id: 'D', name: 'D' },
    { id: 'E', name: 'E' },
    { id: 'X', name: 'X' },
    { id: 'Y', name: 'Y' }
  ];

  // A -> B -> C -> D, and E -> B; separate component X -> Y
  const links = [
    { source: 'A', target: 'B', value: 1 },
    { source: 'E', target: 'B', value: 1 },
    { source: 'B', target: 'C', value: 2 },
    { source: 'C', target: 'D', value: 2 },
    { source: 'X', target: 'Y', value: 1 }
  ];

  const result = getActiveStreamElements({ nodeId: 'B' }, nodes, links);
  assert.ok(result);

  // Upstream: A, E, B
  assert.ok(result.nodeIds.has('A'));
  assert.ok(result.nodeIds.has('E'));
  assert.ok(result.nodeIds.has('B'));
  // Downstream: C, D
  assert.ok(result.nodeIds.has('C'));
  assert.ok(result.nodeIds.has('D'));

  // Disconnected branch: X, Y
  assert.equal(result.nodeIds.has('X'), false);
  assert.equal(result.nodeIds.has('Y'), false);

  assert.ok(result.linkKeys.has('A__to__B'));
  assert.ok(result.linkKeys.has('E__to__B'));
  assert.ok(result.linkKeys.has('B__to__C'));
  assert.ok(result.linkKeys.has('C__to__D'));
  assert.equal(result.linkKeys.has('X__to__Y'), false);
});
