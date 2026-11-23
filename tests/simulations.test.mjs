import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTrigSimMetrics, computeGeoSimMetrics } from '../js/simulations.js';

test('Trig simulation ratios remain invariant when triangle sides are scaled', () => {
  for (const angle of [15, 28, 35, 45, 60, 75]) {
    const base = computeTrigSimMetrics(angle, 1.0);
    assert.ok(Math.abs(base.pythIdentity - 1) < 1e-12);
    assert.equal(base.compAngleDeg, 90 - angle);

    for (const scale of [0.6, 0.85, 1.4, 2.0, 2.4]) {
      const scaled = computeTrigSimMetrics(angle, scale);
      assert.ok(Math.abs(scaled.opp - base.opp * scale) < 1e-10);
      assert.ok(Math.abs(scaled.adj - base.adj * scale) < 1e-10);
      assert.ok(Math.abs(scaled.hyp - base.hyp * scale) < 1e-10);
      assert.ok(Math.abs(scaled.sinVal - base.sinVal) < 1e-12);
      assert.ok(Math.abs(scaled.cosVal - base.cosVal) < 1e-12);
      assert.ok(Math.abs(scaled.tanVal - base.tanVal) < 1e-12);
      assert.ok(Math.abs(scaled.pythIdentity - 1) < 1e-12);
    }
  }

  const clamped = computeTrigSimMetrics(5, 10);
  assert.equal(clamped.angleDeg, 15);
  assert.equal(clamped.scale, 2.4);
});

test('Analytic geometry simulation computes midpoint, distance, slope, and perpendicular slope', () => {
  const g = computeGeoSimMetrics(-1, 2, 2, 6);
  assert.equal(g.dx, 3);
  assert.equal(g.dy, 4);
  assert.equal(g.mx, 0.5);
  assert.equal(g.my, 4);
  assert.equal(g.distSq, 25);
  assert.equal(g.dist, 5);
  assert.ok(Math.abs(g.slope - 4 / 3) < 1e-12);
  assert.ok(Math.abs(g.perpSlope + 3 / 4) < 1e-12);
  assert.ok(Math.abs(g.slope * g.perpSlope + 1) < 1e-12);

  const vert = computeGeoSimMetrics(2, -3, 2, 5);
  assert.equal(vert.slope, null);
  assert.equal(vert.perpSlope, 0);
  assert.equal(vert.dist, 8);

  const horiz = computeGeoSimMetrics(-4, 1, 6, 1);
  assert.equal(horiz.slope, 0);
  assert.equal(horiz.perpSlope, null);
  assert.equal(horiz.dist, 10);
});
