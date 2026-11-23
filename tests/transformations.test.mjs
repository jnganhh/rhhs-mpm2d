import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatVertexEquationLatex,
  computeTransformation,
  generateTransformationProblem,
} from '../js/transformations.js';

test('Basic transformations map y = x^2 points accurately onto y = a(x - h)^2 + k', () => {
  for (let i = 0; i < 20; i++) {
    const prob = generateTransformationProblem('basic');
    assert.deepEqual(prob.source, { a: 1, h: 0, k: 0 });
    const tr = computeTransformation(prob.source, prob.target);

    assert.equal(tr.isParentSource, true);
    assert.equal(tr.tableRows.length, 5);
    assert.ok(tr.mappingRuleLatex.includes('longrightarrow'));
    assert.ok(tr.descriptions.length >= 1);
    assert.equal(tr.steps.length, 3);

    for (const row of tr.tableRows) {
      const expectedSrcY = prob.source.a * (row.x - prob.source.h) ** 2 + prob.source.k;
      const expectedTgtY = prob.target.a * (row.xPrime - prob.target.h) ** 2 + prob.target.k;
      assert.ok(Math.abs(row.y - expectedSrcY) < 1e-9);
      assert.ok(Math.abs(row.yPrime - expectedTgtY) < 1e-9);
    }
  }
});

test('Challenging transformations map arbitrary parabola points accurately onto target parabola', () => {
  for (let i = 0; i < 20; i++) {
    const prob = generateTransformationProblem('challenging');
    const tr = computeTransformation(prob.source, prob.target);

    assert.equal(tr.isParentSource, false);
    assert.equal(tr.tableRows.length, 5);
    assert.ok(tr.vertexRelativeLatex && tr.vertexRelativeLatex.includes('longrightarrow'));
    assert.ok(tr.descriptions.length >= 1);
    assert.equal(tr.steps.length, 3);

    for (const row of tr.tableRows) {
      const expectedSrcY = prob.source.a * (row.x - prob.source.h) ** 2 + prob.source.k;
      const expectedTgtY = prob.target.a * (row.xPrime - prob.target.h) ** 2 + prob.target.k;
      assert.ok(Math.abs(row.y - expectedSrcY) < 1e-9);
      assert.ok(Math.abs(row.yPrime - expectedTgtY) < 1e-9);
    }
  }
});

test('formatVertexEquationLatex formats parent and transformed parabolas cleanly', () => {
  assert.equal(formatVertexEquationLatex(1, 0, 0), 'y = x^2');
  assert.equal(formatVertexEquationLatex(-2, 3, -4), 'y = -2(x - 3)^2 - 4');
  assert.equal(formatVertexEquationLatex(0.5, -2, 5), 'y = 0.5(x + 2)^2 + 5');
});
