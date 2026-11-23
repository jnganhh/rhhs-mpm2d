// Adaptive difficulty engine for MPM2D Quadratic Solver
// Levels: 1 (Basic) -> 2 (Core) -> 3 (Challenging) -> 4 (Enrichment)

import { LEVEL_META } from './math-engine.js';

export function createDefaultAdaptiveState(initialLevel = 1) {
  return {
    level: initialLevel,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    recentWindow: [], // boolean[] max length 5 (true = unassisted correct)
  };
}

/**
 * Updates adaptive state based on a problem attempt.
 * @param {object} state - Current adaptive state
 * @param {boolean} isCorrect - Whether the student solved the problem correctly
 * @param {boolean} assisted - Whether hints or solution were revealed before solving
 * @returns {{ nextState: object, newLevel: number, change: 'up'|'down'|'same', reason: string }}
 */
export function recordAdaptiveAttempt(state, isCorrect, assisted = false) {
  const prevLevel = Math.min(4, Math.max(1, Number(state.level) || 1));
  const cleanSuccess = Boolean(isCorrect && !assisted);

  let consecutiveCorrect = cleanSuccess ? (state.consecutiveCorrect || 0) + 1 : 0;
  let consecutiveIncorrect = !isCorrect ? (state.consecutiveIncorrect || 0) + 1 : 0;
  const recentWindow = [...(state.recentWindow || []), cleanSuccess].slice(-5);

  let newLevel = prevLevel;
  let change = 'same';
  let reason = '';

  const windowSuccesses = recentWindow.filter(Boolean).length;

  if (prevLevel < 4 && (consecutiveCorrect >= 3 || (recentWindow.length >= 5 && windowSuccesses >= 4))) {
    newLevel = prevLevel + 1;
    change = 'up';
    reason =
      consecutiveCorrect >= 3
        ? `3 unassisted correct in a row! Advancing to ${LEVEL_META[newLevel].name}.`
        : `${windowSuccesses}/5 recent mastery! Advancing to ${LEVEL_META[newLevel].name}.`;
    // Reset streaks and window upon level transition
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
    recentWindow.length = 0;
  } else if (prevLevel > 1 && (consecutiveIncorrect >= 2 || (recentWindow.length >= 5 && windowSuccesses <= 1))) {
    newLevel = prevLevel - 1;
    change = 'down';
    reason =
      consecutiveIncorrect >= 2
        ? `Stepping back to ${LEVEL_META[newLevel].name} to build confidence.`
        : `Let's reinforce fundamentals at ${LEVEL_META[newLevel].name} first.`;
    consecutiveCorrect = 0;
    consecutiveIncorrect = 0;
    recentWindow.length = 0;
  }

  return {
    nextState: {
      level: newLevel,
      consecutiveCorrect,
      consecutiveIncorrect,
      recentWindow,
    },
    newLevel,
    change,
    reason,
  };
}
