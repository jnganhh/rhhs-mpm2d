import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROP_TYPES,
  STRING_THEMES,
  generateProportionProblem,
  checkProportionAnswer,
  generateProblemString,
  checkStringStep,
  BTC_TASKS,
  BTC_OBSERVATION_ITEMS,
  generateRandomGroups,
} from '../js/mental-engine.js';

test('Proportional reasoning generates valid drills across all types and Levels 1-4', () => {
  for (const type of Object.keys(PROP_TYPES)) {
    for (const level of [1, 2, 3, 4]) {
      for (let i = 0; i < 15; i++) {
        const p = generateProportionProblem(type, level);
        assert.ok(Number.isFinite(p.expectedValue));
        assert.ok(p.equationLatex.length > 0);
        assert.ok(p.strategyHint.length > 0);
        assert.ok(checkProportionAnswer(p.exactExpectedLatex, p).correct);
        assert.equal(checkProportionAnswer(String(p.expectedValue + 5), p).correct, false);
      }
    }
  }
});

test('Algebra problem strings generate 5 connected steps across all themes and grade accurately', () => {
  for (const theme of Object.keys(STRING_THEMES)) {
    const str = generateProblemString(theme);
    assert.equal(str.theme, theme);
    assert.equal(str.steps.length, 5);
    assert.ok(str.teacherGoal.length > 0);

    for (const step of str.steps) {
      assert.ok(checkStringStep(step.answerLatex, step).correct);
      if (step.expectedValue !== null && step.expectedValue !== undefined) {
        assert.equal(checkStringStep(String(step.expectedValue + 3), step).correct, false);
      } else {
        assert.equal(checkStringStep('x + 999', step).correct, false);
      }
    }
  }
});

test('Problem strings include 9 themes and avoid consecutive exact repeats', () => {
  const themes = Object.keys(STRING_THEMES);
  assert.equal(themes.length, 9);
  assert.ok(themes.includes('analytic_geometry'));
  assert.ok(themes.includes('trig_ratios'));

  for (const theme of themes) {
    let prevSig = null;
    const seen = new Set();
    for (let i = 0; i < 12; i++) {
      const str = generateProblemString(theme);
      assert.equal(str.steps.length, 5);
      const sig = str.steps.map((s) => s.equationLatex).join('|');
      assert.notEqual(sig, prevSig, `Theme ${theme} repeated consecutively at iteration ${i}`);
      prevSig = sig;
      seen.add(sig);
      for (const step of str.steps) {
        assert.ok(checkStringStep(step.answerLatex, step).correct);
      }
    }
    assert.ok(seen.size >= 4, `Theme ${theme} produced only ${seen.size} unique strings out of 12`);
  }
});

test('BTC tasks, observation checklist, and visibly random groups work accurately', () => {
  assert.equal(BTC_TASKS.length, 4);
  for (const task of BTC_TASKS) {
    assert.ok(task.id && task.topic && task.title && task.launch);
    assert.ok(task.consolidation && task.cyu);
    assert.equal(task.slices.length, 4);
    for (const s of task.slices) {
      assert.ok(s.tier && s.task);
    }
  }

  assert.equal(BTC_OBSERVATION_ITEMS.length, 8);

  const g24 = generateRandomGroups('24', 3);
  assert.equal(g24.length, 8);
  assert.equal(g24.reduce((acc, g) => acc + g.members.length, 0), 24);
  for (const g of g24) {
    assert.ok(g.station.length > 0);
    assert.equal(g.members.length, 3);
  }

  const roster = ['Alice', 'Bob', 'Cara', 'Dan', 'Eli', 'Fay', 'Gus'];
  const gNames = generateRandomGroups(roster.join(', '), 3);
  const flat = gNames.flatMap((g) => g.members).sort();
  assert.deepEqual(flat, [...roster].sort());
});
