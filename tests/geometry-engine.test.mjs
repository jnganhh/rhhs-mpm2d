import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGeometryProblem,
  checkGeometryAnswer,
} from '../js/geometry-engine.js';

const GEO_SKILLS = [
  'midpoint',
  'distance',
  'circle_origin',
  'special_lines',
  'special_centres',
  'prove_property',
];

test('All 6 analytic geometry skills generate valid problems across Levels 1-4', () => {
  for (const skill of GEO_SKILLS) {
    for (const level of [1, 2, 3, 4]) {
      for (let i = 0; i < 20; i++) {
        const p = generateGeometryProblem(skill, level);
        assert.equal(p.skill, skill);
        assert.equal(p.level, level);
        assert.ok(p.equationLatex.length > 0);
        assert.ok(p.geogebraCommands && p.geogebraCommands.length > 0);
        assert.equal(p.hints.length, 2);
        assert.ok(p.solutionSteps.length >= 1);
      }
    }
  }
});

test('Midpoint, Distance, Special Lines, Special Centres, and Property Proofs grade accurately', () => {
  for (let i = 0; i < 15; i++) {
    const mp = generateGeometryProblem('midpoint', (i % 4) + 1);
    assert.equal(checkGeometryAnswer('midpoint', mp.exactExpectedLatex, mp).correct, true);
    assert.equal(
      checkGeometryAnswer('midpoint', `(${mp.expectedPoi.x + 1}, ${mp.expectedPoi.y})`, mp).correct,
      false
    );

    const dist = generateGeometryProblem('distance', (i % 4) + 1);
    assert.equal(checkGeometryAnswer('distance', dist.exactExpectedLatex, dist).correct, true);
    assert.equal(
      checkGeometryAnswer('distance', dist.expectedValue.toFixed(2), dist).correct,
      true
    );
    assert.equal(
      checkGeometryAnswer('distance', String(dist.expectedValue + 2), dist).correct,
      false
    );
  }

  for (const sk of ['circle_origin', 'special_lines', 'special_centres', 'prove_property']) {
    for (let lvl = 1; lvl <= 4; lvl++) {
      for (let i = 0; i < 10; i++) {
        const p = generateGeometryProblem(sk, lvl);
        if (p.inputType === 'choice') {
          assert.equal(checkGeometryAnswer(sk, p.expectedChoice, p).correct, true);
          const wrong = p.choices.find((c) => c.id !== p.expectedChoice);
          assert.equal(checkGeometryAnswer(sk, wrong.id, p).correct, false);
        } else {
          assert.equal(checkGeometryAnswer(sk, p.exactExpectedLatex, p).correct, true);
          if (sk === 'circle_origin') {
            assert.equal(checkGeometryAnswer(sk, `r = ${p.expectedValue}`, p).correct, true);
            assert.equal(checkGeometryAnswer(sk, String(p.expectedValue + 3), p).correct, false);
          }
        }
      }
    }
  }
});
