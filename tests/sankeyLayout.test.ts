import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDAG, computeSankeyLayout } from '../src/utils/sankeyLayout.ts';

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
