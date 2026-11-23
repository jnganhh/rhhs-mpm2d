import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRIG_SKILL_META,
  generateTrigProblem,
  checkTrigAnswer,
} from '../js/trig-engine.js';

const TRIG_SKILLS = Object.keys(TRIG_SKILL_META);

test('All 10 trigonometry skills (including Similar Triangles) generate valid problems across Levels 1-4', () => {
  assert.equal(TRIG_SKILLS.length, 10);
  for (const skill of TRIG_SKILLS) {
    for (const level of [1, 2, 3, 4]) {
      for (let i = 0; i < 20; i++) {
        const p = generateTrigProblem(skill, level);
        assert.equal(p.skill, skill);
        assert.equal(p.level, level);
        assert.equal(p.hints.length, 2);
        assert.ok(p.solutionSteps.length >= 2);
        if (skill === 'similar_triangles') {
          assert.equal(p.inputType, 'choice');
          assert.equal(p.diagram.type, 'similar');
          assert.ok(['aa', 'sas', 'sss', 'not_similar'].includes(p.expectedChoice));
        } else {
          assert.ok(Number.isFinite(p.expectedValue) && p.expectedValue > 0, `Bad value in ${skill} L${level}`);
          assert.ok(p.diagram && (p.diagram.type === 'right' || p.diagram.type === 'acute'));
          if (p.unit === '°') {
            assert.ok(p.expectedValue > 0 && p.expectedValue < 180, `Invalid angle ${p.expectedValue}`);
          }
        }
      }
    }
  }
});

test('checkTrigAnswer grades numeric 1 d.p. answers and similar_triangles choices accurately', () => {
  for (const skill of TRIG_SKILLS) {
    const p = generateTrigProblem(skill, 3);
    if (skill === 'similar_triangles') {
      assert.equal(checkTrigAnswer(p.expectedChoice, p).correct, true);
      const wrong = p.choices.find((c) => c.id !== p.expectedChoice);
      assert.equal(checkTrigAnswer(wrong.id, p).correct, false);
    } else {
      const rounded = p.expectedValue.toFixed(1);
      assert.equal(checkTrigAnswer(rounded, p).correct, true);
      assert.equal(checkTrigAnswer(`${rounded} ${p.unit}`, p).correct, true);
      assert.equal(checkTrigAnswer(String(p.expectedValue + 5), p).correct, false);
    }
  }
});
