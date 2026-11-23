import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateLinearProblem,
  checkPlottedLine,
  parseOrderedPair,
  checkLinearAnswer,
} from '../js/linear-engine.js';

const LINEAR_SKILLS = [
  'graph_single',
  'graph_drill',
  'substitution',
  'elimination',
  'num_solutions',
  'application',
];

test('All 5 linear skills generate valid problems across Levels 1-4', () => {
  for (const skill of LINEAR_SKILLS) {
    for (const level of [1, 2, 3, 4]) {
      for (let i = 0; i < 20; i++) {
        const p = generateLinearProblem(skill, level);
        assert.equal(p.skill, skill);
        assert.equal(p.level, level);
        assert.ok(p.equationLatex.length > 0);
        assert.equal(p.hints.length, 2);
        assert.ok(p.solutionSteps.length >= 2);
        if (skill === 'graph_drill') {
          assert.ok(Math.abs(p.expectedPoi.x) <= 6 && Math.abs(p.expectedPoi.y) <= 6);
          assert.ok(Math.abs(p.line1.b) <= 6 && Math.abs(p.line2.b) <= 6);
          assert.ok(Math.abs(p.line1.m * p.expectedPoi.x + p.line1.b - p.expectedPoi.y) < 1e-9);
          assert.ok(Math.abs(p.line2.m * p.expectedPoi.x + p.line2.b - p.expectedPoi.y) < 1e-9);
        }
      }
    }
  }
});

test('parseOrderedPair parses parentheses, plain pairs, and x=, y= pairs', () => {
  assert.deepEqual(parseOrderedPair('(2, -3)'), { x: 2, y: -3, error: null });
  assert.deepEqual(parseOrderedPair('4, 5'), { x: 4, y: 5, error: null });
  assert.deepEqual(parseOrderedPair('x = -1, y = \\frac{3}{2}'), { x: -1, y: 1.5, error: null });
  assert.ok(parseOrderedPair('5').error);
});

test('checkPlottedLine validates slope and y-intercept points', () => {
  const line = { m: 2, rise: 2, run: 1, b: -1 };
  assert.equal(
    checkPlottedLine([{ x: 0, y: -1 }, { x: 1, y: 1 }], line).valid,
    true
  );
  assert.equal(
    checkPlottedLine([{ x: 2, y: 3 }, { x: -1, y: -3 }], line).valid,
    true
  );
  assert.equal(
    checkPlottedLine([{ x: 0, y: -1 }, { x: 0, y: -1 }], line).valid,
    false
  );
  assert.equal(
    checkPlottedLine([{ x: 0, y: -1 }, { x: 1, y: 2 }], line).valid,
    false
  );
});

test('checkLinearAnswer grades graph_single, graph_drill, substitution, elimination, num_solutions, and application', () => {
  const gs = generateLinearProblem('graph_single', 2);
  assert.equal(
    checkLinearAnswer(
      'graph_single',
      {
        line1Points: [
          { x: 0, y: gs.line1.b },
          { x: gs.line1.run, y: gs.line1.b + gs.line1.rise },
        ],
      },
      gs
    ).correct,
    true
  );
  assert.equal(
    checkLinearAnswer(
      'graph_single',
      {
        line1Points: [
          { x: 0, y: gs.line1.b + 1 },
          { x: gs.line1.run, y: gs.line1.b + gs.line1.rise },
        ],
      },
      gs
    ).correct,
    false
  );

  const gd = generateLinearProblem('graph_drill', 2);
  const okDrill = checkLinearAnswer(
    'graph_drill',
    {
      line1Points: [
        { x: 0, y: gd.line1.b },
        { x: gd.line1.run, y: gd.line1.b + gd.line1.rise },
      ],
      line2Points: [
        { x: 0, y: gd.line2.b },
        { x: gd.line2.run, y: gd.line2.b + gd.line2.rise },
      ],
      poiText: `(${gd.expectedPoi.x}, ${gd.expectedPoi.y})`,
    },
    gd
  );
  assert.equal(okDrill.correct, true);

  for (const sk of ['substitution', 'elimination', 'application']) {
    const p = generateLinearProblem(sk, 2);
    assert.equal(
      checkLinearAnswer(sk, `(${p.expectedPoi.x}, ${p.expectedPoi.y})`, p).correct,
      true
    );
    assert.equal(
      checkLinearAnswer(sk, `(${p.expectedPoi.x + 1}, ${p.expectedPoi.y})`, p).correct,
      false
    );
  }

  for (let i = 0; i < 20; i++) {
    const ns = generateLinearProblem('num_solutions', (i % 4) + 1);
    assert.equal(checkLinearAnswer('num_solutions', ns.expectedCategory, ns).correct, true);
    if (ns.expectedCategory === 'perpendicular') {
      assert.ok(Math.abs(ns.graphData.line1.m * ns.graphData.line2.m + 1) < 1e-9);
    }
    if (ns.expectedCategory === 'parallel') {
      assert.ok(Math.abs(ns.graphData.line1.m - ns.graphData.line2.m) < 1e-9);
      assert.notEqual(ns.graphData.line1.b, ns.graphData.line2.b);
    }
  }
});

test('Level 3 (Challenging) & Level 4 problems involve fractions and grade exact fraction inputs', () => {
  for (const sk of ['graph_single', 'graph_drill', 'substitution', 'elimination']) {
    for (let i = 0; i < 15; i++) {
      const p = generateLinearProblem(sk, 3);
      assert.ok(
        p.equationLatex.includes('\\frac'),
        `Expected \\frac in Level 3 ${sk}: ${p.equationLatex}`
      );
    }
  }

  for (let i = 0; i < 15; i++) {
    const sub4 = generateLinearProblem('substitution', 4);
    assert.equal(checkLinearAnswer('substitution', sub4.exactExpectedLatex, sub4).correct, true);
    const elim3 = generateLinearProblem('elimination', 3);
    assert.equal(checkLinearAnswer('elimination', elim3.exactExpectedLatex, elim3).correct, true);
  }
});
