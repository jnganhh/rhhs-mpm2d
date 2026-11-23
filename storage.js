// Persistent student progress tracking in localStorage + CSV export

import { FORMS } from './math-engine.js';
import { createDefaultAdaptiveState } from './adaptive.js';

const STORAGE_KEY = 'mpm2d_quadratics_v1';
const MAX_HISTORY = 50;
const SKILL_IDS = [
  'solve',
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

function createEmptySkillStats() {
  const stats = {};
  for (const id of SKILL_IDS) {
    stats[id] = { attempted: 0, correct: 0 };
  }
  return stats;
}

function createEmptyMatrix() {
  const matrix = {};
  for (const form of FORMS) {
    matrix[form] = {};
    for (const lvl of [1, 2, 3, 4]) {
      matrix[form][lvl] = { attempted: 0, correct: 0 };
    }
  }
  return matrix;
}

export function createInitialProgress() {
  return {
    totalAttempted: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    adaptive: createDefaultAdaptiveState(1),
    mode: 'adaptive', // 'adaptive' | 'manual'
    selectedSkill: 'solve',
    selectedForm: 'mixed',
    manualLevel: 1,
    matrix: createEmptyMatrix(),
    skillStats: createEmptySkillStats(),
    history: [], // { timestamp, skill, form, level, equationLatex, correct, assisted, userAnswer }
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw);
    const base = createInitialProgress();
    const mergedMatrix = createEmptyMatrix();
    for (const form of FORMS) {
      for (const lvl of [1, 2, 3, 4]) {
        const cell = parsed?.matrix?.[form]?.[lvl];
        if (cell) {
          mergedMatrix[form][lvl] = {
            attempted: Number(cell.attempted) || 0,
            correct: Number(cell.correct) || 0,
          };
        }
      }
    }
    const mergedSkills = createEmptySkillStats();
    for (const id of SKILL_IDS) {
      const s = parsed?.skillStats?.[id];
      if (s) {
        mergedSkills[id] = {
          attempted: Number(s.attempted) || 0,
          correct: Number(s.correct) || 0,
        };
      }
    }
    return {
      ...base,
      ...parsed,
      adaptive: {
        ...base.adaptive,
        ...(parsed.adaptive || {}),
      },
      matrix: mergedMatrix,
      skillStats: mergedSkills,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY) : [],
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / privacy mode storage errors gracefully
  }
}

export function resetProgressStorage() {
  const fresh = createInitialProgress();
  saveProgress(fresh);
  return fresh;
}

export function recordAttemptInProgress(progress, entry) {
  const { skill = 'solve', form, level, equationLatex, correct, assisted, userAnswer } = entry;
  const next = structuredClone(progress);

  next.totalAttempted += 1;
  if (correct) {
    next.totalCorrect += 1;
    next.currentStreak += 1;
    if (next.currentStreak > next.bestStreak) {
      next.bestStreak = next.currentStreak;
    }
  } else {
    next.currentStreak = 0;
  }

  if (form && next.matrix[form] && next.matrix[form][level]) {
    next.matrix[form][level].attempted += 1;
    if (correct) next.matrix[form][level].correct += 1;
  }

  if (next.skillStats && next.skillStats[skill]) {
    next.skillStats[skill].attempted += 1;
    if (correct) next.skillStats[skill].correct += 1;
  }

  next.history.unshift({
    timestamp: new Date().toISOString(),
    skill,
    form: form || skill,
    level,
    equationLatex,
    correct: Boolean(correct),
    assisted: Boolean(assisted),
    userAnswer: String(userAnswer || ''),
  });
  if (next.history.length > MAX_HISTORY) {
    next.history = next.history.slice(0, MAX_HISTORY);
  }

  return next;
}

export function generateProgressCsv(progress) {
  const rows = [
    ['Timestamp', 'Form', 'Level', 'Equation (LaTeX)', 'Student Answer', 'Status', 'Assisted'],
  ];
  const levelNames = { 1: 'Basic', 2: 'Core', 3: 'Challenging', 4: 'Enrichment' };
  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  for (const item of progress.history) {
    rows.push([
      item.timestamp,
      item.form,
      levelNames[item.level] || item.level,
      item.equationLatex,
      item.userAnswer,
      item.correct ? 'Correct' : 'Incorrect',
      item.assisted ? 'Yes' : 'No',
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}
