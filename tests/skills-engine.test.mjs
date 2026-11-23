import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FACTOR_TECHNIQUES,
  generateSkillProblem,
  checkSkillAnswer,
  evalExpressionAtX,
} from '../js/skills-engine.js';
import {
  computeQuadraticFeatures,
  computeLineIntersections,
  formatInequalitySolutionLatex,
} from '../js/grapher.js';

const SKILLS = [
  'completing_square',
  'factoring',
  'expansion',
  'key_features',
  'find_equation',
  'finite_differences',
  'linear_quadratic',
  'quad_apps',
  'cemc_enrichment',
];

test('All skills generate valid problems across Levels 1-4', () => {
  for (const skill of SKILLS) {
    for (const level of [1, 2, 3, 4]) {
      for (let i = 0; i < 20; i++) {
        const p = generateSkillProblem(skill, level);
        assert.equal(p.skill, skill);
        assert.equal(p.level, level);
        assert.ok(p.equationLatex.length > 0);
        assert.equal(p.hints.length, 2);
        assert.ok(p.solutionSteps.length >= 2);
        if (skill !== 'factoring' && skill !== 'finite_differences' && skill !== 'cemc_enrichment') {
          assert.ok(p.graphData && typeof p.graphData.a === 'number');
        }
      }
    }
  }
});

test('evalExpressionAtX evaluates polynomials, vertex forms, and fractions', () => {
  assert.ok(Math.abs(evalExpressionAtX('2(x - 3)^2 - 5', 5) - 3) < 1e-9);
  assert.ok(Math.abs(evalExpressionAtX('y = \\frac{1}{2}(x + 2)^2 - 1', 0) - 1) < 1e-9);
  assert.ok(Math.abs(evalExpressionAtX('(2x - 1)(x + 4)', 3) - 35) < 1e-9);
});

test('Completing the square self-check enforces both equivalence and vertex form', () => {
  for (let i = 0; i < 15; i++) {
    const p = generateSkillProblem('completing_square', (i % 4) + 1);
    assert.equal(checkSkillAnswer('completing_square', p.exactExpectedLatex, p).correct, true);
    const { a, b, c } = p.expectedCoeffs;
    const expanded = `${a}x^2 + (${b})x + (${c})`;
    const rejected = checkSkillAnswer('completing_square', expanded, p);
    assert.equal(rejected.correct, false);
  }
});

test('All 5 Factoring techniques and Expansion enforce their respective algebraic forms', () => {
  const techs = Object.keys(FACTOR_TECHNIQUES).filter((t) => t !== 'mixed');
  assert.equal(techs.length, 5);
  for (const tech of techs) {
    for (let lvl = 1; lvl <= 4; lvl++) {
      for (let i = 0; i < 5; i++) {
        const pf = generateSkillProblem('factoring', lvl, { technique: tech });
        assert.equal(pf.technique, tech);
        assert.equal(checkSkillAnswer('factoring', pf.exactExpectedLatex, pf).correct, true);
        const { d = 0, a, b, c } = pf.expectedCoeffs;
        assert.equal(
          checkSkillAnswer('factoring', `${d}x^3 + (${a})x^2 + (${b})x + (${c})`, pf).correct,
          false
        );
      }
    }
  }

  for (let i = 0; i < 15; i++) {
    const pe = generateSkillProblem('expansion', (i % 4) + 1);
    assert.equal(checkSkillAnswer('expansion', pe.exactExpectedLatex, pe).correct, true);
    assert.equal(checkSkillAnswer('expansion', pe.equationLatex, pe).correct, false);
  }
});

test('Find Equation & Finite Differences grade accurately across Levels 1-4', () => {
  for (let i = 0; i < 20; i++) {
    const fe = generateSkillProblem('find_equation', (i % 4) + 1);
    assert.equal(checkSkillAnswer('find_equation', fe.exactExpectedLatex, fe).correct, true);
    const { a, b, c } = fe.expectedCoeffs;
    assert.equal(
      checkSkillAnswer('find_equation', `y = (${a})x^2 + (${b})x + (${c + 1})`, fe).correct,
      false
    );
  }

  for (let lvl = 1; lvl <= 4; lvl++) {
    for (let i = 0; i < 10; i++) {
      const fd = generateSkillProblem('finite_differences', lvl);
      if (fd.inputType === 'choice') {
        assert.equal(checkSkillAnswer('finite_differences', fd.expectedChoice, fd).correct, true);
        const wrong = fd.choices.find((ch) => ch.id !== fd.expectedChoice);
        assert.equal(checkSkillAnswer('finite_differences', wrong.id, fd).correct, false);
      } else {
        assert.equal(checkSkillAnswer('finite_differences', fd.exactExpectedLatex, fd).correct, true);
        assert.equal(
          checkSkillAnswer('finite_differences', String(fd.expectedValue + 1), fd).correct,
          false
        );
      }
    }
  }
});

test('Key features accepts x=, y=, plain value, and (0, c) formats', () => {
  for (let i = 0; i < 20; i++) {
    const p = generateSkillProblem('key_features', (i % 4) + 1);
    assert.equal(checkSkillAnswer('key_features', p.exactExpectedLatex, p).correct, true);
    assert.equal(checkSkillAnswer('key_features', String(p.expectedValue), p).correct, true);
    assert.equal(
      checkSkillAnswer('key_features', String(p.expectedValue + 1), p).correct,
      false
    );
  }
});

test('Linear-quadratic systems match exact intersection counts', () => {
  for (let i = 0; i < 30; i++) {
    const p = generateSkillProblem('linear_quadratic', (i % 4) + 1);
    const { a, b, c, line } = p.graphData;
    const pts = computeLineIntersections(a, b, c, line.m, line.k);
    assert.equal(pts.length, p.expectedCount);
    assert.equal(checkSkillAnswer('linear_quadratic', p.expectedCount, p).correct, true);
    assert.equal(
      checkSkillAnswer('linear_quadratic', (p.expectedCount + 1) % 3, p).correct,
      false
    );
  }
});

test('Grapher quadratic features and inequality solutions are accurate', () => {
  const f = computeQuadraticFeatures(1, -2, -3);
  assert.equal(f.h, 1);
  assert.equal(f.k, -4);
  assert.deepEqual(f.roots, [-1, 3]);

  assert.equal(formatInequalitySolutionLatex(1, -2, -3, '>'), 'x < -1 \\;\\text{ or }\\; x > 3');
  assert.equal(formatInequalitySolutionLatex(1, -2, -3, '<='), '-1 \\le x \\le 3');
  assert.ok(formatInequalitySolutionLatex(1, 0, 1, '>').includes('mathbb{R}'));
  assert.ok(formatInequalitySolutionLatex(1, 0, 1, '<').includes('No real'));
  assert.equal(formatInequalitySolutionLatex(1, -4, 4, '>'), 'x \\neq 2');
});

test('Expansion at Mastery levels (Levels 3 & 4) includes fractions and grades cleanly', () => {
  for (const level of [3, 4]) {
    let fracCount = 0;
    for (let i = 0; i < 60; i++) {
      const p = generateSkillProblem('expansion', level);
      assert.equal(checkSkillAnswer('expansion', p.exactExpectedLatex, p).correct, true);
      assert.equal(checkSkillAnswer('expansion', p.equationLatex, p).correct, false);
      if (p.equationLatex.includes('\\frac{')) {
        fracCount += 1;
      }
    }
    assert.ok(fracCount > 0, `Expected fraction expansion problems at Level ${level}`);
  }
});

test('Factoring by grouping includes opposite-binomial sign-flip (r - x = -(x - r))', () => {
  for (const lvl of [1, 2, 3, 4]) {
    let oppositeCount = 0;
    for (let i = 0; i < 60; i++) {
      const pf = generateSkillProblem('factoring', lvl, { technique: 'grouping' });
      assert.equal(checkSkillAnswer('factoring', pf.exactExpectedLatex, pf).correct, true);
      assert.equal(checkSkillAnswer('factoring', pf.equationLatex, pf).correct, false);
      if (pf.equationLatex.includes('- x)')) {
        oppositeCount += 1;
      }
    }
    assert.ok(oppositeCount > 0, `Expected opposite-binomial grouping problems at Level ${lvl}`);
  }
});

test('Quadratic applications (quad_apps) generate optimization problems and grade exact values across Levels 1-4', () => {
  for (const level of [1, 2, 3, 4]) {
    for (let i = 0; i < 20; i++) {
      const p = generateSkillProblem('quad_apps', level);
      assert.equal(checkSkillAnswer('quad_apps', p.exactExpectedLatex, p).correct, true);
      assert.equal(checkSkillAnswer('quad_apps', String(p.expectedValue), p).correct, true);
      assert.equal(checkSkillAnswer('quad_apps', `$${p.expectedValue}`, p).correct, true);
      assert.equal(checkSkillAnswer('quad_apps', String(p.expectedValue + 10), p).correct, false);
    }
  }
});

test('Waterloo CEMC enrichment generates valid problems across Levels 1-4 and grades accurately', () => {
  const seenRefs = new Set();
  for (const level of [1, 2, 3, 4]) {
    for (let i = 0; i < 30; i++) {
      const p = generateSkillProblem('cemc_enrichment', level);
      assert.ok(Number.isFinite(p.expectedValue));
      assert.ok(p.nelsonRef.includes('Waterloo CEMC'));
      seenRefs.add(p.nelsonRef);
      assert.equal(checkSkillAnswer('cemc_enrichment', p.exactExpectedLatex, p).correct, true);
      assert.equal(checkSkillAnswer('cemc_enrichment', `k = ${p.exactExpectedLatex}`, p).correct, true);
      assert.equal(checkSkillAnswer('cemc_enrichment', String(p.expectedValue + 7), p).correct, false);
    }
  }
  assert.equal(seenRefs.size, 5, `Expected all 5 CEMC archetypes to appear, got ${seenRefs.size}`);
});
