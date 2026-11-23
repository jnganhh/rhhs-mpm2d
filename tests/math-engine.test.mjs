import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMS,
  generateProblem,
  evaluateMathExpression,
  parseAnswerRoots,
  checkAnswer,
} from '../js/math-engine.js';
import {
  createDefaultAdaptiveState,
  recordAdaptiveAttempt,
} from '../js/adaptive.js';

test('Problem generator produces valid problems across all 3 forms × 4 levels', () => {
  for (const form of FORMS) {
    for (const level of [1, 2, 3, 4]) {
      for (let i = 0; i < 25; i++) {
        const p = generateProblem(form, level);
        assert.equal(p.form, form);
        assert.equal(p.level, level);
        assert.ok(p.equationLatex && p.equationLatex.includes('='), `Invalid equation: ${p.equationLatex}`);
        assert.ok(p.nelsonRef.length > 0);
        assert.equal(p.hints.length, 2);
        assert.ok(p.solutionSteps.length >= 2);
        if (p.noRealRoots) {
          assert.equal(p.expectedRoots.length, 0);
        } else {
          assert.ok(p.expectedRoots.length >= 1, `Expected >=1 root for ${form} L${level}`);
          for (const r of p.expectedRoots) {
            assert.ok(Number.isFinite(r), `Non-finite root in ${form} L${level}`);
          }
        }
      }
    }
  }
});

test('Mixed form selector generates all 3 forms', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    seen.add(generateProblem('mixed', 2).form);
  }
  assert.equal(seen.size, 3);
});

test('LaTeX expression evaluator handles fractions, radicals, and implicit multiplication', () => {
  assert.equal(evaluateMathExpression('\\frac{3}{2}'), 1.5);
  assert.ok(Math.abs(evaluateMathExpression('3 + 2\\sqrt{5}') - (3 + 2 * Math.sqrt(5))) < 1e-10);
  assert.ok(Math.abs(evaluateMathExpression('\\frac{-1 + 2\\sqrt{3}}{2}') - (-1 + 2 * Math.sqrt(3)) / 2) < 1e-10);
  assert.ok(Math.abs(evaluateMathExpression('x = -\\frac{5}{4}') - -1.25) < 1e-10);
});

test('checkAnswer validates exact, order-independent, ± radical, decimal approx, and no real roots', () => {
  const pRad = {
    expectedRoots: [3 - Math.sqrt(5), 3 + Math.sqrt(5)],
    noRealRoots: false,
  };
  assert.equal(checkAnswer('3 \\pm \\sqrt{5}', false, pRad).correct, true);
  assert.equal(checkAnswer('3 + \\sqrt{5}, 3 - \\sqrt{5}', false, pRad).correct, true);
  assert.equal(checkAnswer('x = 5.24, 0.76', false, pRad).correct, true);
  assert.equal(checkAnswer('x = 5.24, 0.76', false, pRad).isApprox, true);
  assert.equal(checkAnswer('3 + \\sqrt{5}', false, pRad).correct, false);

  const pFrac = {
    expectedRoots: [-0.25, 1.5],
    noRealRoots: false,
  };
  assert.equal(checkAnswer('\\frac{3}{2}, -\\frac{1}{4}', false, pFrac).correct, true);
  assert.equal(checkAnswer('-0.25, 1.5', false, pFrac).correct, true);

  const pNoReal = { expectedRoots: [], noRealRoots: true };
  assert.equal(checkAnswer('', true, pNoReal).correct, true);
  assert.equal(checkAnswer('No real roots', false, pNoReal).correct, true);
  assert.equal(checkAnswer('1, 2', false, pNoReal).correct, false);
});

test('parseAnswerRoots rejects invalid syntax cleanly', () => {
  const res = parseAnswerRoots('abc + ???');
  assert.ok(res.error);
});

test('Adaptive engine promotes and steps down properly', () => {
  let state = createDefaultAdaptiveState(1);

  // Assisted correct should NOT promote
  for (let i = 0; i < 3; i++) {
    const out = recordAdaptiveAttempt(state, true, true);
    state = out.nextState;
    assert.equal(out.newLevel, 1);
  }

  // 3 unassisted correct promotes 1 -> 2
  let lastOut;
  for (let i = 0; i < 3; i++) {
    lastOut = recordAdaptiveAttempt(state, true, false);
    state = lastOut.nextState;
  }
  assert.equal(lastOut.change, 'up');
  assert.equal(lastOut.newLevel, 2);

  // 2 consecutive incorrect steps down 2 -> 1
  recordAdaptiveAttempt(state, false, false);
  const downOut = recordAdaptiveAttempt(recordAdaptiveAttempt(state, false, false).nextState, false, false);
  assert.equal(downOut.change, 'down');
  assert.equal(downOut.newLevel, 1);

  // Never goes below 1
  const floorOut = recordAdaptiveAttempt(downOut.nextState, false, false);
  assert.equal(floorOut.newLevel, 1);
});

test('Mastery levels (Levels 3 & 4) include fraction problems and grade exactExpectedLatex', () => {
  const combos = [
    ['factored', 3],
    ['vertex', 3],
    ['vertex', 4],
    ['standard', 3],
    ['standard', 4],
  ];

  for (const [form, level] of combos) {
    let fracCount = 0;
    for (let i = 0; i < 60; i++) {
      const p = generateProblem(form, level);
      assert.equal(checkAnswer(p.exactExpectedLatex, Boolean(p.noRealRoots), p).correct, true);
      if (p.equationLatex.includes('\\frac{')) {
        fracCount += 1;
      }
    }
    assert.ok(fracCount > 0, `Expected fraction problems for ${form} Level ${level}`);
  }
});
