// Main UI Controller for MPM2D Quadratic Studio (Nelson Principles of Mathematics 10)

import {
  FORMS,
  FORM_META,
  LEVEL_META,
  formatQuadraticLatex,
  generateProblem,
  checkAnswer,
} from './math-engine.js';
import {
  SKILL_META,
  generateSkillProblem,
  checkSkillAnswer,
} from './skills-engine.js';
import {
  computeQuadraticFeatures,
  formatInequalitySolutionLatex,
  drawQuadraticGraph,
  drawTransformationGraph,
  canvasEventToGrid,
  drawLinearSystemGraph,
  drawTrigDiagram,
} from './grapher.js';
import {
  computeTransformation,
  generateTransformationProblem,
} from './transformations.js';
import {
  LINEAR_SKILL_META,
  generateLinearProblem,
  checkLinearAnswer,
} from './linear-engine.js';
import {
  GEO_SKILL_META,
  generateGeometryProblem,
  checkGeometryAnswer,
} from './geometry-engine.js';
import {
  TRIG_SKILL_META,
  generateTrigProblem,
  checkTrigAnswer,
} from './trig-engine.js';
import {
  PROP_TYPES,
  generateProportionProblem,
  checkProportionAnswer,
  generateProblemString,
  checkStringStep,
  BTC_TASKS,
  BTC_OBSERVATION_ITEMS,
  generateRandomGroups,
} from './mental-engine.js';
import {
  computeTrigSimMetrics,
  computeGeoSimMetrics,
  drawTrigSimulation,
  drawGeoSimulation,
} from './simulations.js';
import { recordAdaptiveAttempt } from './adaptive.js';
import {
  loadProgress,
  saveProgress,
  resetProgressStorage,
  recordAttemptInProgress,
  generateProgressCsv,
} from './storage.js';

// ---------- State ----------

let progress = loadProgress();
let currentProblem = null;
let problemSolved = false;
let problemRecordedThisRound = false;
let hintsShown = 0;
let solutionShown = false;
let noRealToggle = false;
let usingFallbackInput = false;
let selectedChoice = null;
let practiceGraphVisible = false;
let selectedFactorTech = 'mixed';

// Graph & Inequalities Lab state
let labState = { a: 1, b: -2, c: -3, op: '=' };

// Transformations Lab state
let trState = {
  tier: 'basic',
  source: { a: 1, h: 0, k: 0 },
  target: { a: 2, h: 3, k: -4 },
  revealedSteps: 1,
  compareWrongOrder: false,
};

// Linear Systems state
let linState = {
  skill: 'graph_single',
  level: 1,
  problem: null,
  solved: false,
  hintsShown: 0,
  solutionShown: false,
  activeLine: 1,
  line1Points: [],
  line2Points: [],
  selectedCategory: null,
  graphVisible: false,
  riseRunStep: 0, // 0 = off, 1 = line1, 2 = line2
};

// Analytic Geometry state
let geoState = {
  skill: 'midpoint',
  level: 1,
  problem: null,
  solved: false,
  hintsShown: 0,
  solutionShown: false,
  selectedChoice: null,
  ggbOpen: false,
};

// Trigonometry state (UDL & DI)
let trigState = {
  skill: 'sine',
  level: 1,
  problem: null,
  solved: false,
  hintsShown: 0,
  solutionShown: false,
  selectedChoice: null,
  colorCoded: true,
  formulaOpen: false,
};

// Mental Math, Proportions & Problem Strings state
let mentalState = {
  mode: 'prop', // 'prop' | 'string' | 'btc'
  propType: 'mixed',
  propLevel: 1,
  propProblem: null,
  propSolved: false,
  propStreak: 0,
  strTheme: 'distributive',
  strData: null,
  strVisibleCount: 1,
  strProjector: false,
  btcTaskId: BTC_TASKS[0]?.id || 'btc_linear',
  btcObserved: new Set(),
};

// Interactive Simulations state
let simState = {
  mode: 'trig', // 'trig' | 'geo'
  angleDeg: 35,
  scale: 1.0,
  ax: -3,
  ay: -2,
  bx: 5,
  by: 4,
  showPerpBisector: true,
};
let simTrigHandles = null;
let simGeoHandles = null;
let simTrigDragMode = null;
let simGeoDragPoint = null;

// ---------- DOM References ----------

const el = {
  statStreak: document.getElementById('stat-streak'),
  statAccuracy: document.getElementById('stat-accuracy'),
  statLevelBadge: document.getElementById('stat-level-badge'),
  tabPractice: document.getElementById('tab-practice'),
  tabGraph: document.getElementById('tab-graph'),
  tabTransform: document.getElementById('tab-transform'),
  tabLinear: document.getElementById('tab-linear'),
  tabGeo: document.getElementById('tab-geo'),
  tabTrig: document.getElementById('tab-trig'),
  tabMental: document.getElementById('tab-mental'),
  tabSim: document.getElementById('tab-sim'),
  tabProgress: document.getElementById('tab-progress'),
  viewPractice: document.getElementById('view-practice'),
  viewGraph: document.getElementById('view-graph'),
  viewTransform: document.getElementById('view-transform'),
  viewLinear: document.getElementById('view-linear'),
  viewGeo: document.getElementById('view-geo'),
  viewTrig: document.getElementById('view-trig'),
  viewMental: document.getElementById('view-mental'),
  viewSim: document.getElementById('view-sim'),
  viewProgress: document.getElementById('view-progress'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),

  // Controls
  skillSegment: document.getElementById('skill-segment'),
  factorTechRow: document.getElementById('factor-technique-row'),
  factorTechSegment: document.getElementById('factor-technique-segment'),
  formControlGroup: document.getElementById('form-control-group'),
  formSegment: document.getElementById('form-segment'),
  modeToggleBtn: document.getElementById('mode-toggle-btn'),
  modeLabel: document.getElementById('mode-label'),
  levelSegment: document.getElementById('level-segment'),
  adaptiveMeterText: document.getElementById('adaptive-meter-text'),
  adaptiveDots: document.getElementById('adaptive-dots'),

  // Problem Card
  problemFormBadge: document.getElementById('problem-form-badge'),
  problemLevelBadge: document.getElementById('problem-level-badge'),
  problemNelsonRef: document.getElementById('problem-nelson-ref'),
  problemPrompt: document.getElementById('problem-prompt'),
  problemEquation: document.getElementById('problem-equation'),
  practiceGraphBtn: document.getElementById('practice-graph-btn'),
  practiceGraphPanel: document.getElementById('practice-graph-panel'),
  practiceCanvas: document.getElementById('practice-canvas'),
  practiceGraphLegend: document.getElementById('practice-graph-legend'),

  // Input & Actions
  mathInputGroup: document.getElementById('math-input-group'),
  choiceInputGroup: document.getElementById('choice-input-group'),
  mathInput: document.getElementById('math-input'),
  mathInputFallback: document.getElementById('math-input-fallback'),
  mathToolbar: document.getElementById('math-toolbar'),
  inputTip: document.getElementById('input-tip'),
  noRealBtn: document.getElementById('no-real-btn'),
  checkBtn: document.getElementById('check-btn'),
  hintBtn: document.getElementById('hint-btn'),
  solutionBtn: document.getElementById('solution-btn'),
  nextBtn: document.getElementById('next-btn'),

  // Feedback, Hints, Solution
  feedbackBanner: document.getElementById('feedback-banner'),
  adaptiveToast: document.getElementById('adaptive-toast'),
  hintsContainer: document.getElementById('hints-container'),
  solutionContainer: document.getElementById('solution-container'),
  solutionSteps: document.getElementById('solution-steps'),

  // Graph & Inequalities Lab
  labARange: document.getElementById('lab-a-range'),
  labANum: document.getElementById('lab-a-num'),
  labBRange: document.getElementById('lab-b-range'),
  labBNum: document.getElementById('lab-b-num'),
  labCRange: document.getElementById('lab-c-range'),
  labCNum: document.getElementById('lab-c-num'),
  labOpSegment: document.getElementById('lab-op-segment'),
  labRandomBtn: document.getElementById('lab-random-btn'),
  labExprTex: document.getElementById('lab-expr-tex'),
  labSolutionTex: document.getElementById('lab-solution-tex'),
  labVertex: document.getElementById('lab-vertex'),
  labAxis: document.getElementById('lab-axis'),
  labYInt: document.getElementById('lab-yint'),
  labRoots: document.getElementById('lab-roots'),
  labExplain: document.getElementById('lab-explain'),
  labCanvas: document.getElementById('lab-canvas'),

  // Transformations Lab
  trTierSegment: document.getElementById('tr-tier-segment'),
  trRandomBtn: document.getElementById('tr-random-btn'),
  trSourceBox: document.getElementById('tr-source-box'),
  trA1: document.getElementById('tr-a1'),
  trH1: document.getElementById('tr-h1'),
  trK1: document.getElementById('tr-k1'),
  trA2: document.getElementById('tr-a2'),
  trH2: document.getElementById('tr-h2'),
  trK2: document.getElementById('tr-k2'),
  trSourceTex: document.getElementById('tr-source-tex'),
  trTargetTex: document.getElementById('tr-target-tex'),
  trMappingTex: document.getElementById('tr-mapping-tex'),
  trVertexRelTex: document.getElementById('tr-vertex-rel-tex'),
  trNextStepBtn: document.getElementById('tr-next-step-btn'),
  trAllStepsBtn: document.getElementById('tr-all-steps-btn'),
  trStepsList: document.getElementById('tr-steps-list'),
  trDescList: document.getElementById('tr-desc-list'),
  trCheckTableBtn: document.getElementById('tr-check-table-btn'),
  trFillTableBtn: document.getElementById('tr-fill-table-btn'),
  trTableBody: document.getElementById('tr-table-body'),
  trTableFeedback: document.getElementById('tr-table-feedback'),
  trCanvas: document.getElementById('transform-canvas'),
  trCompareOrderBtn: document.getElementById('tr-compare-order-btn'),
  trOrderInsight: document.getElementById('tr-order-insight'),

  // Linear Systems View
  linSkillSegment: document.getElementById('lin-skill-segment'),
  linLevelSegment: document.getElementById('lin-level-segment'),
  linSkillBadge: document.getElementById('lin-skill-badge'),
  linLevelBadge: document.getElementById('lin-level-badge'),
  linGraphToggleBtn: document.getElementById('lin-graph-toggle-btn'),
  linNelsonRef: document.getElementById('lin-nelson-ref'),
  linPrompt: document.getElementById('lin-prompt'),
  linEquation: document.getElementById('lin-equation'),
  linGraphWrap: document.getElementById('lin-graph-wrap'),
  linDrillToolbar: document.getElementById('lin-drill-toolbar'),
  linActiveLineSeg: document.getElementById('lin-active-line-seg'),
  linL1Count: document.getElementById('lin-l1-count'),
  linL2Count: document.getElementById('lin-l2-count'),
  linClearL1Btn: document.getElementById('lin-clear-l1-btn'),
  linClearL2Btn: document.getElementById('lin-clear-l2-btn'),
  linRiseRunBtn: document.getElementById('lin-riserun-btn'),
  linCanvas: document.getElementById('linear-canvas'),
  linGraphLegend: document.getElementById('lin-graph-legend'),
  linTextInputGroup: document.getElementById('lin-text-input-group'),
  linPoiInput: document.getElementById('lin-poi-input'),
  linChoiceGroup: document.getElementById('lin-choice-group'),
  linCheckBtn: document.getElementById('lin-check-btn'),
  linHintBtn: document.getElementById('lin-hint-btn'),
  linSolutionBtn: document.getElementById('lin-solution-btn'),
  linNextBtn: document.getElementById('lin-next-btn'),
  linFeedbackBanner: document.getElementById('lin-feedback-banner'),
  linHintsContainer: document.getElementById('lin-hints-container'),
  linSolutionContainer: document.getElementById('lin-solution-container'),
  linSolutionSteps: document.getElementById('lin-solution-steps'),

  // Analytic Geometry View
  geoSkillSegment: document.getElementById('geo-skill-segment'),
  geoLevelSegment: document.getElementById('geo-level-segment'),
  geoSkillBadge: document.getElementById('geo-skill-badge'),
  geoLevelBadge: document.getElementById('geo-level-badge'),
  geoGgbToggleBtn: document.getElementById('geo-ggb-toggle-btn'),
  geoNelsonRef: document.getElementById('geo-nelson-ref'),
  geoPrompt: document.getElementById('geo-prompt'),
  geoEquation: document.getElementById('geo-equation'),
  geoGgbPanel: document.getElementById('geo-ggb-panel'),
  geoGgbCmds: document.getElementById('geo-ggb-cmds'),
  geoCopyGgbBtn: document.getElementById('geo-copy-ggb-btn'),
  geoFrame: document.getElementById('geogebra-frame'),
  geoTextInputGroup: document.getElementById('geo-text-input-group'),
  geoInput: document.getElementById('geo-input'),
  geoChoiceGroup: document.getElementById('geo-choice-group'),
  geoCheckBtn: document.getElementById('geo-check-btn'),
  geoHintBtn: document.getElementById('geo-hint-btn'),
  geoSolutionBtn: document.getElementById('geo-solution-btn'),
  geoNextBtn: document.getElementById('geo-next-btn'),
  geoFeedbackBanner: document.getElementById('geo-feedback-banner'),
  geoHintsContainer: document.getElementById('geo-hints-container'),
  geoSolutionContainer: document.getElementById('geo-solution-container'),
  geoSolutionSteps: document.getElementById('geo-solution-steps'),

  // Trigonometry View
  trigSkillSegment: document.getElementById('trig-skill-segment'),
  trigLevelSegment: document.getElementById('trig-level-segment'),
  trigColorBtn: document.getElementById('trig-color-btn'),
  trigFormulaBtn: document.getElementById('trig-formula-btn'),
  trigSpeakBtn: document.getElementById('trig-speak-btn'),
  trigFormulaSheet: document.getElementById('trig-formula-sheet'),
  trigSkillBadge: document.getElementById('trig-skill-badge'),
  trigLevelBadge: document.getElementById('trig-level-badge'),
  trigNelsonRef: document.getElementById('trig-nelson-ref'),
  trigPrompt: document.getElementById('trig-prompt'),
  trigEquation: document.getElementById('trig-equation'),
  trigCanvas: document.getElementById('trig-canvas'),
  trigUdlLegend: document.getElementById('trig-udl-legend'),
  trigTextInputGroup: document.getElementById('trig-text-input-group'),
  trigInput: document.getElementById('trig-input'),
  trigUnitChip: document.getElementById('trig-unit-chip'),
  trigChoiceGroup: document.getElementById('trig-choice-group'),
  trigCheckBtn: document.getElementById('trig-check-btn'),
  trigHintBtn: document.getElementById('trig-hint-btn'),
  trigSolutionBtn: document.getElementById('trig-solution-btn'),
  trigNextBtn: document.getElementById('trig-next-btn'),
  trigFeedbackBanner: document.getElementById('trig-feedback-banner'),
  trigHintsContainer: document.getElementById('trig-hints-container'),
  trigSolutionContainer: document.getElementById('trig-solution-container'),
  trigSolutionSteps: document.getElementById('trig-solution-steps'),

  // Mental Math & Ratios View
  mentalModeSegment: document.getElementById('mental-mode-segment'),
  propControls: document.getElementById('prop-controls'),
  stringControls: document.getElementById('string-controls'),
  mentalStreakWrap: document.getElementById('mental-streak-badge-wrap'),
  propStreak: document.getElementById('prop-streak'),
  propTypeSegment: document.getElementById('prop-type-segment'),
  propLevelSegment: document.getElementById('prop-level-segment'),
  propPanel: document.getElementById('mental-prop-panel'),
  propTypeBadge: document.getElementById('prop-type-badge'),
  propLevelBadge: document.getElementById('prop-level-badge'),
  propPrompt: document.getElementById('prop-prompt'),
  propEquation: document.getElementById('prop-equation'),
  propInput: document.getElementById('prop-input'),
  propUnitChip: document.getElementById('prop-unit-chip'),
  propCheckBtn: document.getElementById('prop-check-btn'),
  propStrategyBtn: document.getElementById('prop-strategy-btn'),
  propSolutionBtn: document.getElementById('prop-solution-btn'),
  propNextBtn: document.getElementById('prop-next-btn'),
  propFeedbackBanner: document.getElementById('prop-feedback-banner'),
  propStrategyBox: document.getElementById('prop-strategy-box'),
  propSolutionContainer: document.getElementById('prop-solution-container'),
  propSolutionSteps: document.getElementById('prop-solution-steps'),

  strThemeSegment: document.getElementById('str-theme-segment'),
  strNewBtn: document.getElementById('str-new-btn'),
  strRevealNextBtn: document.getElementById('str-reveal-next-btn'),
  strRevealAllBtn: document.getElementById('str-reveal-all-btn'),
  strProjectorBtn: document.getElementById('str-projector-btn'),
  strPanel: document.getElementById('mental-string-panel'),
  strTitleRef: document.getElementById('str-title-ref'),
  strTeacherGoal: document.getElementById('str-teacher-goal'),
  strStepsList: document.getElementById('str-steps-list'),
  btcPanel: document.getElementById('mental-btc-panel'),
  btcTaskSegment: document.getElementById('btc-task-segment'),
  btcLaunchBox: document.getElementById('btc-launch-box'),
  btcSlicesGrid: document.getElementById('btc-slices-grid'),
  btcConsolidationBox: document.getElementById('btc-consolidation-box'),
  btcVrgBtn: document.getElementById('btc-vrg-btn'),
  btcVrgInput: document.getElementById('btc-vrg-input'),
  btcVrgGrid: document.getElementById('btc-vrg-grid'),
  btcObsScore: document.getElementById('btc-obs-score'),
  btcObsList: document.getElementById('btc-obs-list'),
  btcObsResetBtn: document.getElementById('btc-obs-reset-btn'),

  // Simulations Tab
  simModeSegment: document.getElementById('sim-mode-segment'),
  simTrigPanel: document.getElementById('sim-trig-panel'),
  simTrigCanvas: document.getElementById('sim-trig-canvas'),
  simTrigAngle: document.getElementById('sim-trig-angle'),
  simTrigAngleVal: document.getElementById('sim-trig-angle-val'),
  simTrigScale: document.getElementById('sim-trig-scale'),
  simTrigScaleVal: document.getElementById('sim-trig-scale-val'),
  simTrigPresets: document.getElementById('sim-trig-presets'),
  simTrigResetBtn: document.getElementById('sim-trig-reset-btn'),
  simTrigReadout: document.getElementById('sim-trig-readout'),
  simGeoPanel: document.getElementById('sim-geo-panel'),
  simGeoCanvas: document.getElementById('sim-geo-canvas'),
  simGeoPerpBisToggle: document.getElementById('sim-geo-perpbis-toggle'),
  simGeoResetBtn: document.getElementById('sim-geo-reset-btn'),
  simGeoReadout: document.getElementById('sim-geo-readout'),

  // Dashboard
  kpiTotal: document.getElementById('kpi-total'),
  kpiAccuracy: document.getElementById('kpi-accuracy'),
  kpiStreak: document.getElementById('kpi-streak'),
  kpiLevel: document.getElementById('kpi-level'),
  skillsGrid: document.getElementById('skills-grid'),
  masteryGrid: document.getElementById('mastery-grid'),
  historyBody: document.getElementById('history-body'),
  exportCsvBtn: document.getElementById('export-csv-btn'),
  resetDialog: document.getElementById('reset-dialog'),
};

// ---------- KaTeX Helper ----------

function renderTex(target, tex, displayMode = false) {
  if (!target) return;
  if (window.katex && typeof window.katex.render === 'function') {
    try {
      window.katex.render(tex, target, { displayMode, throwOnError: false });
      return;
    } catch {
      // Fall through
    }
  }
  target.textContent = tex;
}

// ---------- Helpers ----------

function getActiveLevel() {
  return progress.mode === 'adaptive' ? progress.adaptive.level : progress.manualLevel;
}

function getActiveSkill() {
  return SKILL_META[progress.selectedSkill] ? progress.selectedSkill : 'solve';
}

function detectMathLive() {
  const isDefined = Boolean(window.customElements && window.customElements.get('math-field'));
  if (!isDefined || typeof el.mathInput?.getValue !== 'function') {
    usingFallbackInput = true;
    el.mathInput.classList.add('hidden');
    el.mathInputFallback.classList.remove('hidden');
  } else {
    usingFallbackInput = false;
    el.mathInput.classList.remove('hidden');
    el.mathInputFallback.classList.add('hidden');
  }
}

function getInputValue() {
  if (usingFallbackInput) return el.mathInputFallback.value || '';
  return el.mathInput.getValue('latex') || '';
}

function clearInputValue() {
  if (usingFallbackInput) {
    el.mathInputFallback.value = '';
  } else if (typeof el.mathInput.setValue === 'function') {
    el.mathInput.setValue('');
  } else {
    el.mathInput.value = '';
  }
}

function focusInput() {
  if (noRealToggle || getActiveSkill() === 'linear_quadratic') return;
  if (usingFallbackInput) el.mathInputFallback.focus();
  else el.mathInput.focus();
}

function insertSnippet(latexSnippet, plainSnippet) {
  if (noRealToggle) setNoRealToggle(false);
  if (usingFallbackInput) {
    const input = el.mathInputFallback;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const val = input.value;
    input.value = val.slice(0, start) + plainSnippet + val.slice(end);
    const cursor = start + plainSnippet.length - (plainSnippet.endsWith('()') ? 1 : 0);
    input.setSelectionRange(cursor, cursor);
    input.focus();
  } else if (typeof el.mathInput.executeCommand === 'function') {
    el.mathInput.executeCommand(['insert', latexSnippet]);
    el.mathInput.focus();
  }
}

function setNoRealToggle(active) {
  noRealToggle = active;
  el.noRealBtn.setAttribute('aria-pressed', String(active));
  el.noRealBtn.classList.toggle('active', active);
  if (usingFallbackInput) {
    el.mathInputFallback.disabled = active;
  } else {
    el.mathInput.disabled = active;
    el.mathInput.classList.toggle('disabled', active);
  }
}

function renderPracticeGraph() {
  if (!practiceGraphVisible || !currentProblem?.graphData) return;
  const g = currentProblem.graphData;
  drawQuadraticGraph(el.practiceCanvas, {
    a: g.a,
    b: g.b,
    c: g.c,
    line: g.line || null,
    theme: getRenderedScheme(),
  });
}

function setPracticeGraphVisibility(show) {
  practiceGraphVisible = Boolean(show && currentProblem?.graphData);
  el.practiceGraphPanel.classList.toggle('hidden', !practiceGraphVisible);
  el.practiceGraphBtn.setAttribute('aria-expanded', String(practiceGraphVisible));
  el.practiceGraphBtn.textContent = practiceGraphVisible ? 'Hide Graph' : 'Show Graph';
  if (practiceGraphVisible) {
    renderPracticeGraph();
  }
}

// ---------- UI Rendering ----------

function updateHeaderStats() {
  const acc =
    progress.totalAttempted > 0
      ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
      : 0;
  el.statStreak.textContent = String(progress.currentStreak);
  el.statAccuracy.textContent = `${acc}%`;

  const lvl = getActiveLevel();
  el.statLevelBadge.textContent = `L${lvl}: ${LEVEL_META[lvl].name}`;
  el.statLevelBadge.dataset.level = String(lvl);
}

function updateControlsUI() {
  const activeSkill = getActiveSkill();
  for (const btn of el.skillSegment.querySelectorAll('button[data-skill]')) {
    const active = btn.dataset.skill === activeSkill;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  el.formControlGroup.classList.toggle('hidden', activeSkill !== 'solve');
  el.factorTechRow.classList.toggle('hidden', activeSkill !== 'factoring');

  for (const btn of el.factorTechSegment.querySelectorAll('button[data-tech]')) {
    const active = btn.dataset.tech === selectedFactorTech;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  for (const btn of el.formSegment.querySelectorAll('button[data-form]')) {
    const active = btn.dataset.form === progress.selectedForm;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  const isAdaptive = progress.mode === 'adaptive';
  el.modeToggleBtn.setAttribute('aria-pressed', String(isAdaptive));
  el.modeToggleBtn.classList.toggle('active', isAdaptive);
  el.modeLabel.textContent = isAdaptive ? 'Adaptive Auto' : 'Manual Level';

  const activeLevel = getActiveLevel();
  for (const btn of el.levelSegment.querySelectorAll('button[data-level]')) {
    const lvl = Number(btn.dataset.level);
    const active = lvl === activeLevel;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.title = isAdaptive
      ? `${LEVEL_META[lvl].desc} (Switch to Manual to lock)`
      : LEVEL_META[lvl].desc;
  }

  if (isAdaptive) {
    const { consecutiveCorrect, level } = progress.adaptive;
    if (level === 4) {
      el.adaptiveMeterText.textContent = 'Max Level Reached (Contest Enrichment)';
      el.adaptiveDots.innerHTML = '';
    } else {
      el.adaptiveMeterText.textContent = `Level-up streak (${consecutiveCorrect}/3):`;
      el.adaptiveDots.innerHTML = [0, 1, 2]
        .map(
          (i) =>
            `<span class="streak-dot ${i < consecutiveCorrect ? 'filled' : ''}" aria-hidden="true"></span>`
        )
        .join('');
    }
  } else {
    el.adaptiveMeterText.textContent = 'Manual level locked';
    el.adaptiveDots.innerHTML = '';
  }
}

function configureInputForSkill(skill, problem) {
  const isChoice = problem?.inputType === 'choice';
  el.mathInputGroup.classList.toggle('hidden', isChoice);
  el.choiceInputGroup.classList.toggle('hidden', !isChoice);
  el.noRealBtn.classList.toggle('hidden', skill !== 'solve');

  if (isChoice && Array.isArray(problem.choices)) {
    el.choiceInputGroup.innerHTML = problem.choices
      .map((c) => `<button type="button" class="btn choice-btn" data-choice="${c.id}">${c.label}</button>`)
      .join('');
  }

  const tips = {
    solve: 'Separate multiple roots with a comma (e.g. -2, 5 or 3 ± √5)',
    completing_square: 'Enter vertex form, e.g. 2(x - 3)^2 - 5 (self-checks equivalence & form)',
    factoring: 'Enter product of factors, e.g. 2(x - 3)(x + 1)',
    expansion: 'Expand completely into ax² + bx + c with no brackets',
    key_features: 'Enter e.g. x = 3 (axis of symmetry) or (0, -5) / -5 (y-intercept)',
    find_equation: 'Enter equation e.g. y = 2(x - 3)^2 - 4, y = 2(x - 1)(x + 3), or y = x^2 - 2x + 5',
    finite_differences: 'Enter the value of a (e.g. 2 or -3/2)',
    quad_apps: 'Enter the optimal value (e.g. 81, 225/2, or 1600)',
    cemc_enrichment: 'Waterloo CEMC Courseware style — enter exact integer or fraction (e.g. 25/4 or -3/2)',
  };
  el.inputTip.textContent = tips[skill] || '';

  for (const btn of el.choiceInputGroup.querySelectorAll('button[data-choice]')) {
    btn.classList.remove('active');
  }
}

function loadNewProblem() {
  const skill = getActiveSkill();
  const level = getActiveLevel();

  currentProblem =
    skill === 'solve'
      ? generateProblem(progress.selectedForm, level)
      : generateSkillProblem(skill, level, { technique: selectedFactorTech });

  problemSolved = false;
  problemRecordedThisRound = false;
  hintsShown = 0;
  solutionShown = false;
  selectedChoice = null;

  clearInputValue();
  setNoRealToggle(false);
  configureInputForSkill(skill, currentProblem);

  const lMeta = LEVEL_META[currentProblem.level];
  if (skill === 'solve') {
    const fMeta = FORM_META[currentProblem.form];
    el.problemFormBadge.textContent = fMeta.name;
    el.problemFormBadge.dataset.form = currentProblem.form;
  } else {
    el.problemFormBadge.textContent = SKILL_META[skill].name;
    el.problemFormBadge.dataset.form = 'standard';
  }

  el.problemLevelBadge.textContent = `${lMeta.badge}: ${lMeta.name}`;
  el.problemLevelBadge.dataset.level = String(currentProblem.level);
  el.problemNelsonRef.textContent = `Nelson MPM2D · ${currentProblem.nelsonRef}`;
  el.problemPrompt.textContent = currentProblem.promptText;
  renderTex(el.problemEquation, currentProblem.equationLatex, true);

  // Graph toggle setup
  const hasGraph = Boolean(currentProblem.graphData);
  el.practiceGraphBtn.classList.toggle('hidden', !hasGraph);
  el.practiceGraphLegend.textContent =
    skill === 'linear_quadratic'
      ? 'Blue: Parabola · Amber: Line · Red: Points of Intersection'
      : 'Blue: Parabola · Green: Roots (x-intercepts) · Purple: Vertex & Axis of Symmetry · Cyan: y-intercept';
  setPracticeGraphVisibility(false);

  // Reset feedback, hints, solution
  el.feedbackBanner.className = 'feedback-banner hidden';
  el.feedbackBanner.textContent = '';
  el.adaptiveToast.className = 'adaptive-toast hidden';
  el.adaptiveToast.textContent = '';
  el.hintsContainer.classList.add('hidden');
  el.hintsContainer.innerHTML = '';
  el.solutionContainer.classList.add('hidden');
  el.solutionSteps.innerHTML = '';

  el.hintBtn.disabled = false;
  el.hintBtn.textContent = 'Hint (0/2)';
  el.checkBtn.disabled = false;

  updateControlsUI();
  updateHeaderStats();
  focusInput();
}

function showFeedback(kind, htmlMessage) {
  el.feedbackBanner.className = `feedback-banner ${kind}`;
  el.feedbackBanner.innerHTML = htmlMessage;
}

function handleCheckAnswer() {
  if (!currentProblem || problemSolved) return;

  const skill = getActiveSkill();
  const rawInput = currentProblem.inputType === 'choice' ? selectedChoice : getInputValue();
  const result =
    skill === 'solve'
      ? checkAnswer(rawInput, noRealToggle, currentProblem)
      : checkSkillAnswer(skill, rawInput, currentProblem);

  if (result.parseError) {
    showFeedback('warning', `<strong>Check Input:</strong> ${result.message}`);
    return;
  }

  const assisted = hintsShown > 0 || solutionShown;

  if (!problemRecordedThisRound) {
    const displayAns =
      skill === 'solve' && noRealToggle ? 'No real roots' : String(rawInput ?? '');
    progress = recordAttemptInProgress(progress, {
      skill,
      form: currentProblem.form || skill,
      level: currentProblem.level,
      equationLatex: currentProblem.equationLatex,
      correct: result.correct,
      assisted,
      userAnswer: displayAns,
    });

    if (progress.mode === 'adaptive') {
      const adaptiveOutcome = recordAdaptiveAttempt(
        progress.adaptive,
        result.correct,
        assisted
      );
      progress.adaptive = adaptiveOutcome.nextState;

      if (adaptiveOutcome.change !== 'same') {
        el.adaptiveToast.className = `adaptive-toast ${adaptiveOutcome.change}`;
        el.adaptiveToast.textContent =
          (adaptiveOutcome.change === 'up' ? '⬆ ' : '⬇ ') + adaptiveOutcome.reason;
      }
    }
    problemRecordedThisRound = true;
    saveProgress(progress);
  }

  if (result.correct) {
    problemSolved = true;
    el.checkBtn.disabled = true;
    const badge = result.isApprox ? 'Almost Exact (Approx.)' : 'Correct!';
    showFeedback('success', `<strong>${badge}</strong> ${result.message}`);
    renderSolutionPanel();
    if (skill === 'linear_quadratic' && currentProblem.graphData) {
      setPracticeGraphVisibility(true);
    }
  } else {
    showFeedback('error', `<strong>Not quite.</strong> ${result.message}`);
  }

  updateControlsUI();
  updateHeaderStats();
  if (!el.viewProgress.classList.contains('hidden')) {
    renderDashboard();
  }
}

function handleHint() {
  if (!currentProblem) return;
  if (hintsShown >= currentProblem.hints.length) return;
  hintsShown += 1;

  el.hintsContainer.classList.remove('hidden');
  const item = document.createElement('div');
  item.className = 'hint-item';
  item.innerHTML = `<span class="hint-tag">Hint ${hintsShown}</span> <span>${currentProblem.hints[hintsShown - 1]}</span>`;
  el.hintsContainer.appendChild(item);

  el.hintBtn.textContent = `Hint (${hintsShown}/${currentProblem.hints.length})`;
  if (hintsShown >= currentProblem.hints.length) {
    el.hintBtn.disabled = true;
  }
}

function renderSolutionPanel() {
  if (!currentProblem) return;
  el.solutionContainer.classList.remove('hidden');
  el.solutionSteps.innerHTML = '';

  for (const stepLatex of currentProblem.solutionSteps) {
    const li = document.createElement('li');
    li.className = 'solution-step';
    const mathSpan = document.createElement('div');
    li.appendChild(mathSpan);
    renderTex(mathSpan, stepLatex, true);
    el.solutionSteps.appendChild(li);
  }
}

function handleShowSolution() {
  if (!currentProblem) return;
  solutionShown = true;
  renderSolutionPanel();
  if (getActiveSkill() === 'linear_quadratic' && currentProblem.graphData) {
    setPracticeGraphVisibility(true);
  }
}

// ---------- Graph & Inequalities Lab ----------

function renderGraphLab() {
  const { a, b, c, op } = labState;
  const opTex = op === '<=' ? '\\le' : op === '>=' ? '\\ge' : op;
  const poly = formatQuadraticLatex(a, b, c);
  renderTex(el.labExprTex, `${poly} ${opTex} 0`, false);

  if (Math.abs(a) < 1e-9) {
    renderTex(el.labSolutionTex, '\\text{Set } a \\neq 0 \\text{ for a parabola}', false);
    el.labVertex.textContent = '—';
    el.labAxis.textContent = '—';
    el.labYInt.textContent = `(0, ${c})`;
    el.labRoots.textContent = '—';
    el.labExplain.textContent = 'A quadratic equation requires a ≠ 0.';
  } else {
    const features = computeQuadraticFeatures(a, b, c);
    renderTex(el.labSolutionTex, formatInequalitySolutionLatex(a, b, c, op), false);
    el.labVertex.textContent = `(${Number(features.h.toFixed(2))}, ${Number(features.k.toFixed(2))})`;
    el.labAxis.textContent = `x = ${Number(features.h.toFixed(2))}`;
    el.labYInt.textContent = `(0, ${Number(c.toFixed(2))})`;
    el.labRoots.textContent =
      features.roots.length === 0
        ? 'No real roots'
        : features.roots.map((r) => Number(r.toFixed(2))).join(', ');

    if (op === '=') {
      el.labExplain.textContent =
        'Graphical Method: Real solutions are the x-intercepts where the parabola crosses y = 0.';
    } else if (op === '>' || op === '>=') {
      el.labExplain.textContent =
        `Shade where the parabola lies ${op === '>' ? 'strictly above' : 'on or above'} the x-axis (y ${op === '>' ? '>' : '≥'} 0).`;
    } else {
      el.labExplain.textContent =
        `Shade where the parabola lies ${op === '<' ? 'strictly below' : 'on or below'} the x-axis (y ${op === '<' ? '<' : '≤'} 0).`;
    }
  }

  drawQuadraticGraph(el.labCanvas, {
    a,
    b,
    c,
    inequality: op,
    theme: getRenderedScheme(),
  });
}

function randomizeLabExample() {
  const ops = ['=', '>', '>=', '<', '<='];
  const r1 = Math.floor(Math.random() * 9) - 4;
  let r2 = Math.floor(Math.random() * 9) - 4;
  if (r1 === r2) r2 += 2;
  const a = [1, -1, 2, -2][Math.floor(Math.random() * 4)];
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;
  const op = ops[Math.floor(Math.random() * ops.length)];

  labState = { a, b, c, op };
  el.labARange.value = el.labANum.value = String(a);
  el.labBRange.value = el.labBNum.value = String(b);
  el.labCRange.value = el.labCNum.value = String(c);
  for (const btn of el.labOpSegment.querySelectorAll('button[data-op]')) {
    const active = btn.dataset.op === op;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  renderGraphLab();
}

// ---------- Progress Dashboard ----------

function renderDashboard() {
  const acc =
    progress.totalAttempted > 0
      ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
      : 0;
  el.kpiTotal.textContent = String(progress.totalAttempted);
  el.kpiAccuracy.textContent = `${acc}%`;
  el.kpiStreak.textContent = `${progress.currentStreak} (Best: ${progress.bestStreak})`;
  const lvl = getActiveLevel();
  el.kpiLevel.textContent = `${LEVEL_META[lvl].badge} · ${LEVEL_META[lvl].name}`;

  // Skills Breakdown Grid
  el.skillsGrid.innerHTML = Object.values(SKILL_META)
    .map((meta) => {
      const s = progress.skillStats?.[meta.id] || { attempted: 0, correct: 0 };
      const pct = s.attempted > 0 ? `${Math.round((s.correct / s.attempted) * 100)}%` : '—';
      return `
        <div class="skill-stat-card">
          <div class="skill-stat-name">${meta.name}</div>
          <div class="skill-stat-val">${pct}</div>
          <div class="skill-stat-sub">${s.correct}/${s.attempted} correct</div>
        </div>
      `;
    })
    .join('');

  // Mastery Matrix (3 Solving Forms × 4 Levels)
  let gridHtml = `<div class="matrix-header"></div>`;
  for (const l of [1, 2, 3, 4]) {
    gridHtml += `<div class="matrix-header">${LEVEL_META[l].name}</div>`;
  }

  for (const form of FORMS) {
    gridHtml += `<div class="matrix-row-label">${FORM_META[form].short}</div>`;
    for (const l of [1, 2, 3, 4]) {
      const cell = progress.matrix[form][l];
      const cellAcc = cell.attempted > 0 ? Math.round((cell.correct / cell.attempted) * 100) : null;
      const statusClass =
        cellAcc === null
          ? 'empty'
          : cellAcc >= 80
          ? 'mastered'
          : cellAcc >= 50
          ? 'developing'
          : 'needs-work';

      gridHtml += `
        <div class="matrix-cell ${statusClass}">
          <div class="cell-pct">${cellAcc === null ? '—' : `${cellAcc}%`}</div>
          <div class="cell-count">${cell.correct}/${cell.attempted}</div>
          <div class="cell-bar"><span style="width: ${cellAcc ?? 0}%"></span></div>
        </div>
      `;
    }
  }
  el.masteryGrid.innerHTML = gridHtml;

  // Recent History
  el.historyBody.innerHTML = '';
  if (progress.history.length === 0) {
    el.historyBody.innerHTML = `<tr><td colspan="5" class="empty-row">No questions attempted yet. Switch to Practice to begin!</td></tr>`;
    return;
  }

  for (const item of progress.history.slice(0, 20)) {
    const tr = document.createElement('tr');

    const tdEq = document.createElement('td');
    tdEq.className = 'eq-cell';
    renderTex(tdEq, item.equationLatex, false);

    const tdForm = document.createElement('td');
    const skillName = item.skill && item.skill !== 'solve' ? SKILL_META[item.skill]?.short : null;
    tdForm.textContent = skillName || FORM_META[item.form]?.short || item.form;

    const tdLevel = document.createElement('td');
    tdLevel.textContent = LEVEL_META[item.level]?.name || item.level;

    const tdStatus = document.createElement('td');
    tdStatus.innerHTML = item.correct
      ? `<span class="status-pill ok">Correct${item.assisted ? ' (Hint)' : ''}</span>`
      : `<span class="status-pill miss">Incorrect</span>`;

    const tdTime = document.createElement('td');
    const date = new Date(item.timestamp);
    tdTime.textContent = Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    tr.append(tdEq, tdForm, tdLevel, tdStatus, tdTime);
    el.historyBody.appendChild(tr);
  }
}

// ---------- Transformations & Mapping Rule Lab ----------

function syncTransformInputs() {
  el.trA1.value = String(trState.source.a);
  el.trH1.value = String(trState.source.h);
  el.trK1.value = String(trState.source.k);
  el.trA2.value = String(trState.target.a);
  el.trH2.value = String(trState.target.h);
  el.trK2.value = String(trState.target.k);

  el.trSourceBox.classList.toggle('hidden', trState.tier === 'basic');
  for (const btn of el.trTierSegment.querySelectorAll('button[data-tier]')) {
    const active = btn.dataset.tier === trState.tier;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
}

function renderTransformSteps(tr) {
  const count = Math.min(tr.steps.length, Math.max(1, trState.revealedSteps));
  el.trStepsList.innerHTML = tr.steps
    .slice(0, count)
    .map((s) => `<li>${s}</li>`)
    .join('');

  el.trDescList.classList.toggle('hidden', count < tr.steps.length);
  el.trDescList.innerHTML = tr.descriptions.map((d) => `<li>${d}</li>`).join('');
  el.trNextStepBtn.disabled = count >= tr.steps.length;
}

function renderTransformLab(resetTable = true) {
  syncTransformInputs();
  const tr = computeTransformation(trState.source, trState.target);

  renderTex(el.trSourceTex, tr.sourceLatex, false);
  renderTex(el.trTargetTex, tr.targetLatex, false);
  renderTex(el.trMappingTex, tr.mappingRuleLatex, false);

  if (tr.vertexRelativeLatex) {
    el.trVertexRelTex.classList.remove('hidden');
    renderTex(el.trVertexRelTex, `\\text{From vertex form: } ${tr.vertexRelativeLatex}`, false);
  } else {
    el.trVertexRelTex.classList.add('hidden');
  }

  renderTransformSteps(tr);

  if (resetTable) {
    el.trTableFeedback.className = 'feedback-banner hidden';
    el.trTableFeedback.textContent = '';
    el.trTableBody.innerHTML = tr.tableRows
      .map(
        (r, idx) => `
        <tr class="${r.isVertex ? 'tr-row-vertex' : ''}" data-row="${idx}">
          <td>${r.x}</td>
          <td>${r.y}</td>
          <td><input type="number" step="any" class="tr-in-x" data-expected="${r.xPrime}" aria-label="New x prime for row ${idx + 1}"></td>
          <td><input type="number" step="any" class="tr-in-y" data-expected="${r.yPrime}" aria-label="New y prime for row ${idx + 1}"></td>
          <td class="tr-row-status">—</td>
        </tr>
      `
      )
      .join('');
  }

  el.trCompareOrderBtn.classList.toggle('active', trState.compareWrongOrder);
  el.trCompareOrderBtn.setAttribute('aria-pressed', String(trState.compareWrongOrder));

  const vScale = tr.vScale;
  const wrongK = Number((tr.source.k + vScale * (tr.target.k - tr.source.k)).toFixed(2));
  if (trState.compareWrongOrder) {
    el.trOrderInsight.classList.remove('hidden');
    if (Math.abs(wrongK - tr.target.k) < 1e-6) {
      el.trOrderInsight.innerHTML =
        '<strong>Try changing a ≠ 1 and k ≠ 0!</strong> Right now both orders give the same vertex because scaling does not alter 0.';
    } else {
      el.trOrderInsight.innerHTML =
        `<strong>Order Discovery:</strong> Translating vertically BEFORE stretching/reflecting scales the shift too, moving the vertex to <strong>(${tr.target.h}, ${wrongK})</strong> instead of <strong>(${tr.target.h}, ${tr.target.k})</strong>. Always <strong>Stretch / Reflect first, Translate last</strong>!`;
    }
  } else {
    el.trOrderInsight.classList.add('hidden');
  }

  drawTransformationGraph(el.trCanvas, {
    source: tr.source,
    target: tr.target,
    tableRows: tr.tableRows,
    compareWrongOrder: trState.compareWrongOrder,
    theme: getRenderedScheme(),
  });
}

function checkTransformTable() {
  const rows = el.trTableBody.querySelectorAll('tr[data-row]');
  let allCorrect = true;
  let filledCount = 0;

  for (const row of rows) {
    const inX = row.querySelector('.tr-in-x');
    const inY = row.querySelector('.tr-in-y');
    const status = row.querySelector('.tr-row-status');
    const expX = parseFloat(inX.dataset.expected);
    const expY = parseFloat(inY.dataset.expected);
    const valX = parseFloat(inX.value);
    const valY = parseFloat(inY.value);

    const hasX = inX.value.trim() !== '' && !Number.isNaN(valX);
    const hasY = inY.value.trim() !== '' && !Number.isNaN(valY);
    if (hasX && hasY) filledCount++;

    const okX = hasX && Math.abs(valX - expX) < 0.02;
    const okY = hasY && Math.abs(valY - expY) < 0.02;

    inX.classList.toggle('ok', okX);
    inX.classList.toggle('miss', !okX);
    inY.classList.toggle('ok', okY);
    inY.classList.toggle('miss', !okY);

    if (okX && okY) {
      status.textContent = '✓';
    } else {
      status.textContent = '✗';
      allCorrect = false;
    }
  }

  if (filledCount === 0) {
    el.trTableFeedback.className = 'feedback-banner warning';
    el.trTableFeedback.textContent = 'Enter values for (x\', y\') using the mapping rule, then click Check Table.';
  } else if (allCorrect) {
    el.trTableFeedback.className = 'feedback-banner success';
    el.trTableFeedback.textContent = 'All 5 mapped points are correct!';
  } else {
    el.trTableFeedback.className = 'feedback-banner error';
    el.trTableFeedback.textContent = 'Some cells need another look — highlighted in red. Apply the mapping rule to (x, y).';
  }
}

function fillTransformTable() {
  for (const row of el.trTableBody.querySelectorAll('tr[data-row]')) {
    const inX = row.querySelector('.tr-in-x');
    const inY = row.querySelector('.tr-in-y');
    const status = row.querySelector('.tr-row-status');
    inX.value = inX.dataset.expected;
    inY.value = inY.dataset.expected;
    inX.classList.remove('miss');
    inY.classList.remove('miss');
    inX.classList.add('ok');
    inY.classList.add('ok');
    status.textContent = '✓';
  }
  el.trTableFeedback.className = 'feedback-banner success';
  el.trTableFeedback.textContent = 'Table filled with mapped target points.';
}

function loadRandomTransformation() {
  const prob = generateTransformationProblem(trState.tier);
  trState.source = prob.source;
  trState.target = prob.target;
  trState.revealedSteps = 1;
  renderTransformLab(true);
}

// ---------- Linear Systems Module (MPM2D Ch. 1) ----------

function renderLinearGraph() {
  const p = linState.problem;
  if (!p) return;
  const isSingle = linState.skill === 'graph_single';
  const isDrill = isSingle || linState.skill === 'graph_drill';
  const visible = isDrill || linState.graphVisible;
  el.linGraphWrap.classList.toggle('hidden', !visible);
  el.linDrillToolbar.classList.toggle('hidden', !isDrill);
  if (!visible) return;

  const sol1 = isDrill ? p.line1 : p.graphData?.line1 || null;
  const sol2 = isSingle ? null : isDrill ? p.line2 : p.graphData?.line2 || null;
  const poi = isSingle ? null : isDrill ? p.expectedPoi : p.graphData?.poi || null;

  let hintLine = null;
  if (isDrill && linState.riseRunStep === 1) hintLine = p.line1;
  else if (linState.skill === 'graph_drill' && linState.riseRunStep === 2) hintLine = p.line2;

  drawLinearSystemGraph(el.linCanvas, {
    range: 8,
    line1Points: linState.line1Points,
    line2Points: isSingle ? [] : linState.line2Points,
    solutionLine1: sol1,
    solutionLine2: sol2,
    poi,
    showSolution: !isDrill || linState.solved || linState.solutionShown,
    riseRunHintLine: hintLine,
    theme: getRenderedScheme(),
  });
}

function updateLinearDrillCounters() {
  el.linL1Count.textContent = `${linState.line1Points.length}/2`;
  el.linL2Count.textContent = `${linState.line2Points.length}/2`;
  for (const btn of el.linActiveLineSeg.querySelectorAll('button[data-line]')) {
    const active = Number(btn.dataset.line) === linState.activeLine;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
}

function loadLinearProblem() {
  linState.problem = generateLinearProblem(linState.skill, linState.level);
  linState.solved = false;
  linState.hintsShown = 0;
  linState.solutionShown = false;
  linState.activeLine = 1;
  linState.line1Points = [];
  linState.line2Points = [];
  linState.selectedCategory = null;
  linState.graphVisible = false;
  linState.riseRunStep = 0;

  const p = linState.problem;
  const sMeta = LINEAR_SKILL_META[linState.skill];
  const lMeta = LEVEL_META[linState.level];

  for (const btn of el.linSkillSegment.querySelectorAll('button[data-skill]')) {
    const active = btn.dataset.skill === linState.skill;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  for (const btn of el.linLevelSegment.querySelectorAll('button[data-level]')) {
    const active = Number(btn.dataset.level) === linState.level;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  el.linSkillBadge.textContent = sMeta.name;
  el.linLevelBadge.textContent = `${lMeta.badge}: ${lMeta.name}`;
  el.linLevelBadge.dataset.level = String(linState.level);
  el.linNelsonRef.textContent = `Nelson MPM2D · ${p.nelsonRef}`;
  el.linPrompt.textContent = p.promptText;
  renderTex(el.linEquation, p.equationLatex, true);

  const isChoice = p.inputType === 'linear_choice';
  const isSingle = linState.skill === 'graph_single';
  const isDrill = isSingle || linState.skill === 'graph_drill';

  el.linTextInputGroup.classList.toggle('hidden', isChoice || isSingle);
  el.linChoiceGroup.classList.toggle('hidden', !isChoice);
  const line2Btn = el.linActiveLineSeg.querySelector('button[data-line="2"]');
  if (line2Btn) line2Btn.classList.toggle('hidden', isSingle);
  el.linClearL2Btn.classList.toggle('hidden', isSingle);

  for (const b of el.linChoiceGroup.querySelectorAll('button[data-choice]')) {
    b.classList.remove('active');
  }
  el.linPoiInput.value = '';
  el.linPoiInput.placeholder =
    linState.skill === 'application'
      ? 'Enter answer as (x, y) e.g. (15, 25)'
      : 'Enter Point of Intersection e.g. (2, -3)';

  const hasOptionalGraph = !isDrill && Boolean(p.graphData);
  el.linGraphToggleBtn.classList.toggle('hidden', !hasOptionalGraph);
  el.linGraphToggleBtn.textContent = 'Show Graph';
  el.linGraphToggleBtn.setAttribute('aria-expanded', 'false');
  el.linGraphLegend.textContent = isDrill
    ? 'Click the grid to place initial value (0, b) and a second point using slope m = rise / run.'
    : 'Blue Dashed: Line 1 · Teal Dashed: Line 2 · Red Dot: Point of Intersection';

  el.linFeedbackBanner.className = 'feedback-banner hidden';
  el.linFeedbackBanner.textContent = '';
  el.linHintsContainer.classList.add('hidden');
  el.linHintsContainer.innerHTML = '';
  el.linSolutionContainer.classList.add('hidden');
  el.linSolutionSteps.innerHTML = '';
  el.linHintBtn.disabled = false;
  el.linHintBtn.textContent = 'Hint (0/2)';
  el.linCheckBtn.disabled = false;
  el.linRiseRunBtn.textContent = 'Rise/Run Guide';

  updateLinearDrillCounters();
  renderLinearGraph();
}

function handleLinearCheck() {
  const p = linState.problem;
  if (!p || linState.solved) return;

  let payload;
  if (linState.skill === 'graph_single') {
    payload = { line1Points: linState.line1Points };
  } else if (linState.skill === 'graph_drill') {
    payload = {
      line1Points: linState.line1Points,
      line2Points: linState.line2Points,
      poiText: el.linPoiInput.value,
    };
  } else if (linState.skill === 'num_solutions') {
    payload = linState.selectedCategory;
  } else {
    payload = el.linPoiInput.value;
  }

  const res = checkLinearAnswer(linState.skill, payload, p);
  if (res.parseError) {
    el.linFeedbackBanner.className = 'feedback-banner warning';
    el.linFeedbackBanner.innerHTML = `<strong>Check Input:</strong> ${res.message}`;
    return;
  }

  if (res.correct) {
    linState.solved = true;
    el.linCheckBtn.disabled = true;
    el.linFeedbackBanner.className = 'feedback-banner success';
    el.linFeedbackBanner.innerHTML = `<strong>Correct!</strong> ${res.message}`;
    handleLinearShowSolution();
  } else {
    el.linFeedbackBanner.className = 'feedback-banner error';
    el.linFeedbackBanner.innerHTML = `<strong>Not quite.</strong> ${res.message}`;
  }
}

function handleLinearHint() {
  const p = linState.problem;
  if (!p || linState.hintsShown >= p.hints.length) return;
  linState.hintsShown += 1;
  el.linHintsContainer.classList.remove('hidden');
  const div = document.createElement('div');
  div.className = 'hint-item';
  div.innerHTML = `<span class="hint-tag">Hint ${linState.hintsShown}</span> <span>${p.hints[linState.hintsShown - 1]}</span>`;
  el.linHintsContainer.appendChild(div);
  el.linHintBtn.textContent = `Hint (${linState.hintsShown}/${p.hints.length})`;
  if (linState.hintsShown >= p.hints.length) el.linHintBtn.disabled = true;
}

function handleLinearShowSolution() {
  const p = linState.problem;
  if (!p) return;
  linState.solutionShown = true;
  el.linSolutionContainer.classList.remove('hidden');
  el.linSolutionSteps.innerHTML = '';
  for (const step of p.solutionSteps) {
    const li = document.createElement('li');
    li.className = 'solution-step';
    const d = document.createElement('div');
    li.appendChild(d);
    renderTex(d, step, true);
    el.linSolutionSteps.appendChild(li);
  }
  if (p.graphData && linState.skill !== 'graph_drill') {
    linState.graphVisible = true;
    el.linGraphToggleBtn.textContent = 'Hide Graph';
    el.linGraphToggleBtn.setAttribute('aria-expanded', 'true');
  }
  renderLinearGraph();
}

function loadGeoProblem() {
  geoState.problem = generateGeometryProblem(geoState.skill, geoState.level);
  geoState.solved = false;
  geoState.hintsShown = 0;
  geoState.solutionShown = false;
  geoState.selectedChoice = null;

  const p = geoState.problem;
  const sMeta = GEO_SKILL_META[geoState.skill];
  const lMeta = LEVEL_META[geoState.level];

  for (const btn of el.geoSkillSegment.querySelectorAll('button[data-skill]')) {
    const active = btn.dataset.skill === geoState.skill;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  for (const btn of el.geoLevelSegment.querySelectorAll('button[data-level]')) {
    const active = Number(btn.dataset.level) === geoState.level;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  el.geoSkillBadge.textContent = sMeta.name;
  el.geoLevelBadge.textContent = `${lMeta.badge}: ${lMeta.name}`;
  el.geoLevelBadge.dataset.level = String(geoState.level);
  el.geoNelsonRef.textContent = `Nelson MPM2D · ${p.nelsonRef}`;
  el.geoPrompt.textContent = p.promptText;
  renderTex(el.geoEquation, p.equationLatex, true);
  el.geoGgbCmds.textContent = p.geogebraCommands || '';

  const isChoice = p.inputType === 'choice';
  el.geoTextInputGroup.classList.toggle('hidden', isChoice);
  el.geoChoiceGroup.classList.toggle('hidden', !isChoice);
  el.geoChoiceGroup.innerHTML = isChoice
    ? p.choices
        .map(
          (c) =>
            `<button type="button" class="btn choice-btn" data-choice="${c.id}">${c.label}</button>`
        )
        .join('')
    : '';

  el.geoInput.value = '';
  el.geoInput.placeholder =
    p.inputType === 'math'
      ? 'Enter coordinates e.g. (3/2, -4)'
      : 'Enter exact value e.g. 5, -3/2, or 2sqrt(5)';

  el.geoFeedbackBanner.className = 'feedback-banner hidden';
  el.geoFeedbackBanner.textContent = '';
  el.geoHintsContainer.classList.add('hidden');
  el.geoHintsContainer.innerHTML = '';
  el.geoSolutionContainer.classList.add('hidden');
  el.geoSolutionSteps.innerHTML = '';
  el.geoHintBtn.disabled = false;
  el.geoHintBtn.textContent = 'Hint (0/2)';
  el.geoCheckBtn.disabled = false;
}

function handleGeoCheck() {
  const p = geoState.problem;
  if (!p || geoState.solved) return;
  const payload = p.inputType === 'choice' ? geoState.selectedChoice : el.geoInput.value;
  const res = checkGeometryAnswer(geoState.skill, payload, p);

  if (res.parseError) {
    el.geoFeedbackBanner.className = 'feedback-banner warning';
    el.geoFeedbackBanner.innerHTML = `<strong>Check Input:</strong> ${res.message}`;
    return;
  }

  if (res.correct) {
    geoState.solved = true;
    el.geoCheckBtn.disabled = true;
    el.geoFeedbackBanner.className = 'feedback-banner success';
    el.geoFeedbackBanner.innerHTML = `<strong>${res.isApprox ? 'Almost Exact!' : 'Correct!'}</strong> ${res.message}`;
    handleGeoShowSolution();
  } else {
    el.geoFeedbackBanner.className = 'feedback-banner error';
    el.geoFeedbackBanner.innerHTML = `<strong>Not quite.</strong> ${res.message}`;
  }
}

function handleGeoHint() {
  const p = geoState.problem;
  if (!p || geoState.hintsShown >= p.hints.length) return;
  geoState.hintsShown += 1;
  el.geoHintsContainer.classList.remove('hidden');
  const div = document.createElement('div');
  div.className = 'hint-item';
  div.innerHTML = `<span class="hint-tag">Hint ${geoState.hintsShown}</span> <span>${p.hints[geoState.hintsShown - 1]}</span>`;
  el.geoHintsContainer.appendChild(div);
  el.geoHintBtn.textContent = `Hint (${geoState.hintsShown}/${p.hints.length})`;
  if (geoState.hintsShown >= p.hints.length) el.geoHintBtn.disabled = true;
}

function handleGeoShowSolution() {
  const p = geoState.problem;
  if (!p) return;
  geoState.solutionShown = true;
  el.geoSolutionContainer.classList.remove('hidden');
  el.geoSolutionSteps.innerHTML = '';
  for (const step of p.solutionSteps) {
    const li = document.createElement('li');
    li.className = 'solution-step';
    const d = document.createElement('div');
    li.appendChild(d);
    renderTex(d, step, true);
    el.geoSolutionSteps.appendChild(li);
  }
}

// ---------- Trigonometry Module (MPM2D Ch. 7 & 8, UDL & DI) ----------

function renderTrigCanvas() {
  if (!trigState.problem?.diagram) return;
  drawTrigDiagram(el.trigCanvas, trigState.problem.diagram, {
    colorCoded: trigState.colorCoded,
    theme: getRenderedScheme(),
  });
}

function loadTrigProblem() {
  trigState.problem = generateTrigProblem(trigState.skill, trigState.level);
  trigState.solved = false;
  trigState.hintsShown = 0;
  trigState.solutionShown = false;
  trigState.selectedChoice = null;

  const p = trigState.problem;
  const sMeta = TRIG_SKILL_META[trigState.skill];
  const lMeta = LEVEL_META[trigState.level];

  for (const btn of el.trigSkillSegment.querySelectorAll('button[data-skill]')) {
    const active = btn.dataset.skill === trigState.skill;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  for (const btn of el.trigLevelSegment.querySelectorAll('button[data-level]')) {
    const active = Number(btn.dataset.level) === trigState.level;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  el.trigSkillBadge.textContent = sMeta.name;
  el.trigLevelBadge.textContent = `${lMeta.badge}: ${lMeta.name}`;
  el.trigLevelBadge.dataset.level = String(trigState.level);
  el.trigNelsonRef.textContent = `Nelson MPM2D · ${p.nelsonRef}`;
  el.trigPrompt.textContent = p.promptText;
  renderTex(el.trigEquation, p.equationLatex, true);
  el.trigUnitChip.textContent = p.unit || '';
  el.trigInput.value = '';

  const isChoice = p.inputType === 'choice';
  el.trigTextInputGroup.classList.toggle('hidden', isChoice);
  el.trigChoiceGroup.classList.toggle('hidden', !isChoice);
  el.trigChoiceGroup.innerHTML = isChoice
    ? p.choices
        .map(
          (c) =>
            `<button type="button" class="btn choice-btn" data-choice="${c.id}">${c.label}</button>`
        )
        .join('')
    : '';

  el.trigUdlLegend.textContent =
    p.diagram?.type === 'right'
      ? 'UDL Color Guide: Green = Opposite · Amber = Adjacent · Blue = Hypotenuse · Purple = Angle (Degree Mode)'
      : p.diagram?.type === 'similar'
      ? 'UDL Color Guide: Corresponding sides share matching colors (AB↔DE Blue, BC↔EF Green, CA↔FD Amber); Purple = Angles'
      : 'UDL Color Guide: Color-coded sides/angles match opposite pairs (Sine Law) or included angle (Cosine Law) — Degree Mode';

  el.trigFeedbackBanner.className = 'feedback-banner hidden';
  el.trigFeedbackBanner.textContent = '';
  el.trigHintsContainer.classList.add('hidden');
  el.trigHintsContainer.innerHTML = '';
  el.trigSolutionContainer.classList.add('hidden');
  el.trigSolutionSteps.innerHTML = '';
  el.trigHintBtn.disabled = false;
  el.trigHintBtn.textContent = 'Hint (0/2)';
  el.trigCheckBtn.disabled = false;

  // Differentiated Instruction: Level 1 auto-scaffolds Hint 1
  if (trigState.level === 1) {
    handleTrigHint();
  }

  renderTrigCanvas();
}

function handleTrigCheck() {
  const p = trigState.problem;
  if (!p || trigState.solved) return;
  const payload = p.inputType === 'choice' ? trigState.selectedChoice : el.trigInput.value;
  const res = checkTrigAnswer(payload, p);

  if (res.parseError) {
    el.trigFeedbackBanner.className = 'feedback-banner warning';
    el.trigFeedbackBanner.innerHTML = `<strong>Check Input:</strong> ${res.message}`;
    return;
  }

  if (res.correct) {
    trigState.solved = true;
    el.trigCheckBtn.disabled = true;
    el.trigFeedbackBanner.className = 'feedback-banner success';
    el.trigFeedbackBanner.innerHTML = `<strong>Correct!</strong> ${res.message}`;
    handleTrigShowSolution();
  } else {
    el.trigFeedbackBanner.className = 'feedback-banner error';
    el.trigFeedbackBanner.innerHTML = `<strong>Not quite.</strong> ${res.message}`;
  }
}

function handleTrigHint() {
  const p = trigState.problem;
  if (!p || trigState.hintsShown >= p.hints.length) return;
  trigState.hintsShown += 1;
  el.trigHintsContainer.classList.remove('hidden');
  const div = document.createElement('div');
  div.className = 'hint-item';
  div.innerHTML = `<span class="hint-tag">Hint ${trigState.hintsShown}</span> <span>${p.hints[trigState.hintsShown - 1]}</span>`;
  el.trigHintsContainer.appendChild(div);
  el.trigHintBtn.textContent = `Hint (${trigState.hintsShown}/${p.hints.length})`;
  if (trigState.hintsShown >= p.hints.length) el.trigHintBtn.disabled = true;
}

function handleTrigShowSolution() {
  const p = trigState.problem;
  if (!p) return;
  trigState.solutionShown = true;
  el.trigSolutionContainer.classList.remove('hidden');
  el.trigSolutionSteps.innerHTML = '';
  for (const step of p.solutionSteps) {
    const li = document.createElement('li');
    li.className = 'solution-step';
    const d = document.createElement('div');
    li.appendChild(d);
    renderTex(d, step, true);
    el.trigSolutionSteps.appendChild(li);
  }
}

// ---------- Mental Math: Proportional Reasoning & Algebra Strings ----------

function setMentalMode(mode) {
  mentalState.mode = mode;
  const isProp = mode === 'prop';
  const isString = mode === 'string';
  const isBtc = mode === 'btc';
  for (const btn of el.mentalModeSegment.querySelectorAll('button[data-mode]')) {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  el.propControls.classList.toggle('hidden', !isProp);
  el.propPanel.classList.toggle('hidden', !isProp);
  el.mentalStreakWrap.classList.toggle('hidden', !isProp);
  el.stringControls.classList.toggle('hidden', !isString);
  el.strPanel.classList.toggle('hidden', !isString);
  el.btcPanel.classList.toggle('hidden', !isBtc);

  if (isProp && mentalState.propProblem) {
    renderTex(el.propEquation, mentalState.propProblem.equationLatex, true);
  } else if (isString) {
    renderStringSteps();
  } else if (isBtc) {
    renderBtcHub();
  }
}

function loadProportionProblem() {
  mentalState.propProblem = generateProportionProblem(mentalState.propType, mentalState.propLevel);
  mentalState.propSolved = false;
  const p = mentalState.propProblem;
  const lMeta = LEVEL_META[mentalState.propLevel];

  for (const btn of el.propTypeSegment.querySelectorAll('button[data-type]')) {
    const active = btn.dataset.type === mentalState.propType;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  for (const btn of el.propLevelSegment.querySelectorAll('button[data-level]')) {
    const active = Number(btn.dataset.level) === mentalState.propLevel;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  el.propTypeBadge.textContent = PROP_TYPES[p.type]?.name || 'Proportion';
  el.propLevelBadge.textContent = `${lMeta.badge}: ${lMeta.name}`;
  el.propLevelBadge.dataset.level = String(mentalState.propLevel);
  el.propPrompt.textContent = p.promptText;
  renderTex(el.propEquation, p.equationLatex, true);
  el.propUnitChip.textContent = p.unit || '';
  el.propUnitChip.classList.toggle('hidden', !p.unit);
  el.propInput.value = '';
  el.propCheckBtn.disabled = false;
  el.propFeedbackBanner.className = 'feedback-banner hidden';
  el.propStrategyBox.classList.add('hidden');
  el.propStrategyBox.innerHTML = '';
  el.propSolutionContainer.classList.add('hidden');
  el.propSolutionSteps.innerHTML = '';
}

function handlePropCheck() {
  const p = mentalState.propProblem;
  if (!p || mentalState.propSolved) return;
  const res = checkProportionAnswer(el.propInput.value, p);
  if (res.parseError) {
    el.propFeedbackBanner.className = 'feedback-banner warning';
    el.propFeedbackBanner.innerHTML = `<strong>Check Input:</strong> ${res.message}`;
    return;
  }
  if (res.correct) {
    mentalState.propSolved = true;
    mentalState.propStreak += 1;
    el.propStreak.textContent = String(mentalState.propStreak);
    el.propCheckBtn.disabled = true;
    el.propFeedbackBanner.className = 'feedback-banner success';
    el.propFeedbackBanner.innerHTML = `<strong>Nice Mental Math!</strong> ${res.message}`;
    showPropSolution();
  } else {
    mentalState.propStreak = 0;
    el.propStreak.textContent = '0';
    el.propFeedbackBanner.className = 'feedback-banner error';
    el.propFeedbackBanner.innerHTML = `<strong>Try again!</strong> ${res.message}`;
  }
}

function showPropSolution() {
  const p = mentalState.propProblem;
  if (!p) return;
  el.propSolutionContainer.classList.remove('hidden');
  el.propSolutionSteps.innerHTML = '';
  for (const step of p.solutionSteps) {
    const li = document.createElement('li');
    li.className = 'solution-step';
    const d = document.createElement('div');
    li.appendChild(d);
    renderTex(d, step, true);
    el.propSolutionSteps.appendChild(li);
  }
}

function loadProblemString() {
  mentalState.strData = generateProblemString(mentalState.strTheme);
  mentalState.strVisibleCount = 1;
  for (const btn of el.strThemeSegment.querySelectorAll('button[data-theme]')) {
    const active = btn.dataset.theme === mentalState.strTheme;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  renderStringSteps();
}

function renderStringSteps() {
  const str = mentalState.strData;
  if (!str) return;
  el.strTitleRef.textContent = str.title;
  el.strTeacherGoal.innerHTML = `<span class="hint-tag">Teacher / Mental Goal</span> <span>${str.teacherGoal}</span>`;
  el.strRevealNextBtn.disabled = mentalState.strVisibleCount >= str.steps.length;

  el.strStepsList.innerHTML = '';
  str.steps.slice(0, mentalState.strVisibleCount).forEach((step, idx) => {
    const card = document.createElement('div');
    card.className = 'string-step-card';

    const left = document.createElement('div');
    left.className = 'string-step-left';
    const lbl = document.createElement('div');
    lbl.className = 'string-step-label';
    lbl.textContent = `${idx + 1}. ${step.promptText}`;
    const eqDiv = document.createElement('div');
    eqDiv.className = 'string-step-eq';
    renderTex(eqDiv, step.equationLatex, false);
    left.append(lbl, eqDiv);

    const right = document.createElement('div');
    right.className = 'string-step-right';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'string-step-input';
    input.placeholder = step.expectedExpr ? 'e.g. 6x + 12' : 'Mental answer';
    input.setAttribute('aria-label', `Answer for step ${idx + 1}`);

    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'btn btn-primary btn-sm';
    checkBtn.textContent = 'Check';

    const showBtn = document.createElement('button');
    showBtn.type = 'button';
    showBtn.className = 'btn btn-sm';
    showBtn.textContent = 'Reveal';

    const note = document.createElement('div');
    note.className = 'string-step-note hidden';
    note.textContent = `Answer: ${step.answerLatex} — Strategy: ${step.strategyNote}`;

    const doCheck = () => {
      const r = checkStringStep(input.value, step);
      input.classList.toggle('ok', r.correct);
      input.classList.toggle('miss', !r.correct);
      if (r.correct) {
        note.classList.remove('hidden');
      }
    };

    checkBtn.addEventListener('click', doCheck);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doCheck();
      }
    });
    showBtn.addEventListener('click', () => {
      input.value = step.answerLatex;
      input.classList.remove('miss');
      input.classList.add('ok');
      note.classList.remove('hidden');
    });

    right.append(input, checkBtn, showBtn);
    card.append(left, right, note);
    el.strStepsList.appendChild(card);
  });
}

function renderBtcHub() {
  if (!el.btcPanel || !el.btcTaskSegment) return;
  const tasks = BTC_TASKS || [];
  if (!tasks.length) return;

  el.btcTaskSegment.innerHTML = '';
  for (const t of tasks) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg-btn';
    btn.dataset.task = t.id;
    btn.textContent = t.topic;
    btn.title = t.title;
    const active = t.id === mentalState.btcTaskId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
    el.btcTaskSegment.appendChild(btn);
  }

  const task = tasks.find((t) => t.id === mentalState.btcTaskId) || tasks[0];
  mentalState.btcTaskId = task.id;

  if (el.btcLaunchBox) {
    el.btcLaunchBox.innerHTML = '';
    const titleEl = document.createElement('strong');
    titleEl.textContent = task.title;
    const launchP = document.createElement('p');
    launchP.textContent = `Verbal Launch (Non-Permanent Vertical Surfaces): ${task.launch}`;
    el.btcLaunchBox.append(titleEl, launchP);
  }

  if (el.btcSlicesGrid) {
    el.btcSlicesGrid.innerHTML = '';
    for (const s of task.slices) {
      const card = document.createElement('div');
      card.className = 'btc-slice-card';
      const tierEl = document.createElement('div');
      tierEl.className = 'btc-slice-tier';
      tierEl.textContent = s.tier;
      const bodyEl = document.createElement('p');
      bodyEl.textContent = s.task;
      card.append(tierEl, bodyEl);
      el.btcSlicesGrid.appendChild(card);
    }
  }

  if (el.btcConsolidationBox) {
    el.btcConsolidationBox.innerHTML = '';
    const consP = document.createElement('p');
    const consLabel = document.createElement('strong');
    consLabel.textContent = 'Consolidation from the Bottom: ';
    consP.append(consLabel, document.createTextNode(task.consolidation));

    const cyuP = document.createElement('p');
    const cyuLabel = document.createElement('strong');
    cyuLabel.textContent = 'Check Your Understanding (Mild / Medium / Spicy): ';
    cyuP.append(cyuLabel, document.createTextNode(task.cyu));

    el.btcConsolidationBox.append(consP, cyuP);
  }
}

function renderBtcVrg() {
  if (!el.btcVrgGrid) return;
  const raw = el.btcVrgInput ? el.btcVrgInput.value.trim() : '';
  const groups = generateRandomGroups(raw || '24', 3);
  el.btcVrgGrid.innerHTML = '';
  for (const g of groups) {
    const card = document.createElement('div');
    card.className = 'btc-station-card';
    const title = document.createElement('div');
    title.className = 'btc-station-title';
    title.textContent = g.station;
    const list = document.createElement('div');
    list.textContent = g.members.join(' · ');
    card.append(title, list);
    el.btcVrgGrid.appendChild(card);
  }
}

function renderBtcChecklist() {
  if (!el.btcObsList) return;
  el.btcObsList.innerHTML = '';
  BTC_OBSERVATION_ITEMS.forEach((item, idx) => {
    const label = document.createElement('label');
    label.className = 'btc-check-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.idx = String(idx);
    cb.checked = mentalState.btcObserved.has(idx);
    const span = document.createElement('span');
    span.textContent = item;
    label.append(cb, span);
    el.btcObsList.appendChild(label);
  });
  if (el.btcObsScore) {
    el.btcObsScore.textContent = `${mentalState.btcObserved.size} / ${BTC_OBSERVATION_ITEMS.length} Observed`;
  }
}

function appendSimMetricCard(container, label, value, invariant = false) {
  const card = document.createElement('div');
  card.className = invariant ? 'sim-metric-card invariant' : 'sim-metric-card';
  const lbl = document.createElement('div');
  lbl.className = 'sim-metric-label';
  lbl.textContent = label;
  const val = document.createElement('div');
  val.className = 'sim-metric-val';
  val.textContent = value;
  card.append(lbl, val);
  container.appendChild(card);
}

function renderSimLab() {
  if (!el.viewSim) return;
  const theme = getRenderedScheme();

  if (simState.mode === 'trig') {
    const m = computeTrigSimMetrics(simState.angleDeg, simState.scale);
    simState.angleDeg = m.angleDeg;
    simState.scale = m.scale;
    if (el.simTrigAngle) el.simTrigAngle.value = String(m.angleDeg);
    if (el.simTrigAngleVal) el.simTrigAngleVal.textContent = `${m.angleDeg}°`;
    if (el.simTrigScale) el.simTrigScale.value = m.scale.toFixed(2);
    if (el.simTrigScaleVal) el.simTrigScaleVal.textContent = `${m.scale.toFixed(2)}×`;

    simTrigHandles = drawTrigSimulation(el.simTrigCanvas, {
      angleDeg: m.angleDeg,
      scale: m.scale,
      theme,
    });

    if (el.simTrigReadout) {
      el.simTrigReadout.innerHTML = '';
      appendSimMetricCard(el.simTrigReadout, 'Opposite (Opp)', m.opp.toFixed(2));
      appendSimMetricCard(el.simTrigReadout, 'Adjacent (Adj)', m.adj.toFixed(2));
      appendSimMetricCard(el.simTrigReadout, 'Hypotenuse (Hyp)', m.hyp.toFixed(2));
      appendSimMetricCard(el.simTrigReadout, '90° − θ (Angle B)', `${m.compAngleDeg.toFixed(0)}°`);
      appendSimMetricCard(el.simTrigReadout, 'sin θ = Opp / Hyp', m.sinVal.toFixed(4), true);
      appendSimMetricCard(el.simTrigReadout, 'cos θ = Adj / Hyp', m.cosVal.toFixed(4), true);
      appendSimMetricCard(el.simTrigReadout, 'tan θ = Opp / Adj', m.tanVal.toFixed(4), true);
      appendSimMetricCard(el.simTrigReadout, 'sin²θ + cos²θ', m.pythIdentity.toFixed(4), true);
    }
  } else {
    const gm = computeGeoSimMetrics(simState.ax, simState.ay, simState.bx, simState.by);
    simGeoHandles = drawGeoSimulation(el.simGeoCanvas, {
      ax: gm.ax,
      ay: gm.ay,
      bx: gm.bx,
      by: gm.by,
      showPerpBisector: simState.showPerpBisector,
      theme,
    });

    if (el.simGeoReadout) {
      el.simGeoReadout.innerHTML = '';
      const slopeStr = gm.slope === null ? 'Undefined (vertical)' : gm.slope.toFixed(3);
      const perpStr = gm.perpSlope === null ? 'Undefined (vertical)' : gm.perpSlope.toFixed(3);
      const distStr =
        Number.isInteger(gm.distSq) && !Number.isInteger(gm.dist)
          ? `${gm.dist.toFixed(2)} (√${gm.distSq})`
          : gm.dist.toFixed(2);
      const prodStr =
        gm.slope !== null && gm.perpSlope !== null
          ? (gm.slope * gm.perpSlope).toFixed(2)
          : gm.dist > 0
            ? 'Horiz / Vert (90°)'
            : 'N/A';

      appendSimMetricCard(el.simGeoReadout, 'Endpoint A', `(${gm.ax}, ${gm.ay})`);
      appendSimMetricCard(el.simGeoReadout, 'Endpoint B', `(${gm.bx}, ${gm.by})`);
      appendSimMetricCard(el.simGeoReadout, 'Midpoint M', `(${gm.mx}, ${gm.my})`, true);
      appendSimMetricCard(el.simGeoReadout, 'Run & Rise', `Δx = ${gm.dx}, Δy = ${gm.dy}`);
      appendSimMetricCard(el.simGeoReadout, 'Distance AB', distStr, true);
      appendSimMetricCard(el.simGeoReadout, 'Slope m', slopeStr);
      appendSimMetricCard(el.simGeoReadout, 'Perp Slope m⊥', perpStr, true);
      appendSimMetricCard(el.simGeoReadout, 'm × m⊥', prodStr);
    }
  }
}

function setSimMode(mode) {
  simState.mode = mode === 'geo' ? 'geo' : 'trig';
  const isTrig = simState.mode === 'trig';
  if (el.simModeSegment) {
    for (const btn of el.simModeSegment.querySelectorAll('button[data-sim]')) {
      const active = btn.dataset.sim === simState.mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }
  el.simTrigPanel?.classList.toggle('hidden', !isTrig);
  el.simGeoPanel?.classList.toggle('hidden', isTrig);
  renderSimLab();
}

function switchTab(tabName) {
  const tabs = [
    ['practice', el.tabPractice, el.viewPractice],
    ['graph', el.tabGraph, el.viewGraph],
    ['transform', el.tabTransform, el.viewTransform],
    ['linear', el.tabLinear, el.viewLinear],
    ['geo', el.tabGeo, el.viewGeo],
    ['trig', el.tabTrig, el.viewTrig],
    ['mental', el.tabMental, el.viewMental],
    ['sim', el.tabSim, el.viewSim],
    ['progress', el.tabProgress, el.viewProgress],
  ];
  for (const [name, btn, view] of tabs) {
    const active = name === tabName;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
    view.classList.toggle('hidden', !active);
  }

  if (tabName === 'graph') {
    renderGraphLab();
  } else if (tabName === 'transform') {
    renderTransformLab(false);
  } else if (tabName === 'linear') {
    renderLinearGraph();
  } else if (tabName === 'geo') {
    if (geoState.problem) renderTex(el.geoEquation, geoState.problem.equationLatex, true);
  } else if (tabName === 'trig') {
    if (trigState.problem) renderTex(el.trigEquation, trigState.problem.equationLatex, true);
    renderTrigCanvas();
  } else if (tabName === 'mental') {
    if (mentalState.mode === 'prop' && mentalState.propProblem) {
      renderTex(el.propEquation, mentalState.propProblem.equationLatex, true);
    } else if (mentalState.mode === 'string') {
      renderStringSteps();
    } else {
      renderBtcHub();
    }
  } else if (tabName === 'sim') {
    renderSimLab();
  } else if (tabName === 'progress') {
    renderDashboard();
  } else {
    focusInput();
  }
}

// ---------- Theme Toggle ----------

function getSystemScheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getRenderedScheme() {
  const stored = localStorage.getItem('color-scheme');
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemScheme();
}

function updateThemeButtonUI() {
  const current = getRenderedScheme();
  document.documentElement.dataset.theme = current;
  el.themeToggleBtn.setAttribute(
    'aria-label',
    current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  );
  el.themeToggleBtn.textContent = current === 'dark' ? '☀ Light' : '☾ Dark';
}

function toggleTheme() {
  const target = getRenderedScheme() === 'dark' ? 'light' : 'dark';
  const sys = getSystemScheme();
  const meta = document.querySelector('meta[name="color-scheme"]');
  try {
    if (target === sys) {
      localStorage.removeItem('color-scheme');
      if (meta) meta.content = 'light dark';
    } else {
      localStorage.setItem('color-scheme', target);
      if (meta) meta.content = target;
    }
  } catch {
    if (meta) meta.content = target;
  }
  updateThemeButtonUI();
  renderPracticeGraph();
  if (!el.viewGraph.classList.contains('hidden')) renderGraphLab();
  if (!el.viewTransform.classList.contains('hidden')) renderTransformLab(false);
  if (!el.viewLinear.classList.contains('hidden')) renderLinearGraph();
  if (!el.viewTrig.classList.contains('hidden')) renderTrigCanvas();
  if (!el.viewSim.classList.contains('hidden')) renderSimLab();
}

// ---------- Event Listeners ----------

function bindEvents() {
  el.tabPractice.addEventListener('click', () => switchTab('practice'));
  el.tabGraph.addEventListener('click', () => switchTab('graph'));
  el.tabTransform.addEventListener('click', () => switchTab('transform'));
  el.tabLinear.addEventListener('click', () => switchTab('linear'));
  el.tabGeo.addEventListener('click', () => switchTab('geo'));
  el.tabTrig.addEventListener('click', () => switchTab('trig'));
  el.tabMental.addEventListener('click', () => switchTab('mental'));
  el.tabSim.addEventListener('click', () => switchTab('sim'));
  el.tabProgress.addEventListener('click', () => switchTab('progress'));
  el.themeToggleBtn.addEventListener('click', toggleTheme);

  window.addEventListener('storage', (e) => {
    if (e.key === 'color-scheme') {
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.content = e.newValue ?? 'light dark';
      updateThemeButtonUI();
      renderPracticeGraph();
      if (!el.viewGraph.classList.contains('hidden')) renderGraphLab();
      if (!el.viewTransform.classList.contains('hidden')) renderTransformLab(false);
      if (!el.viewLinear.classList.contains('hidden')) renderLinearGraph();
      if (!el.viewSim.classList.contains('hidden')) renderSimLab();
    }
  });

  el.skillSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-skill]');
    if (!btn) return;
    progress.selectedSkill = btn.dataset.skill;
    saveProgress(progress);
    loadNewProblem();
  });

  el.factorTechSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tech]');
    if (!btn) return;
    selectedFactorTech = btn.dataset.tech;
    loadNewProblem();
  });

  el.formSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-form]');
    if (!btn) return;
    progress.selectedForm = btn.dataset.form;
    saveProgress(progress);
    loadNewProblem();
  });

  el.modeToggleBtn.addEventListener('click', () => {
    progress.mode = progress.mode === 'adaptive' ? 'manual' : 'adaptive';
    if (progress.mode === 'manual') {
      progress.manualLevel = progress.adaptive.level;
    }
    saveProgress(progress);
    loadNewProblem();
  });

  el.levelSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    progress.mode = 'manual';
    progress.manualLevel = Number(btn.dataset.level);
    saveProgress(progress);
    loadNewProblem();
  });

  el.practiceGraphBtn.addEventListener('click', () => {
    setPracticeGraphVisibility(!practiceGraphVisible);
  });

  el.mathToolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-latex]');
    if (!btn) return;
    insertSnippet(btn.dataset.latex, btn.dataset.plain || btn.dataset.latex);
  });

  el.choiceInputGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-choice]');
    if (!btn) return;
    selectedChoice = btn.dataset.choice;
    for (const b of el.choiceInputGroup.querySelectorAll('button[data-choice]')) {
      b.classList.toggle('active', b === btn);
    }
  });

  el.noRealBtn.addEventListener('click', () => {
    setNoRealToggle(!noRealToggle);
  });

  el.checkBtn.addEventListener('click', handleCheckAnswer);
  el.hintBtn.addEventListener('click', handleHint);
  el.solutionBtn.addEventListener('click', handleShowSolution);
  el.nextBtn.addEventListener('click', loadNewProblem);

  const onEnter = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (problemSolved) loadNewProblem();
      else handleCheckAnswer();
    }
  };
  el.mathInput.addEventListener('keydown', onEnter);
  el.mathInputFallback.addEventListener('keydown', onEnter);

  // Graph & Inequalities Lab bindings
  const bindCoeffPair = (rangeEl, numEl, key) => {
    const update = (val) => {
      const n = parseFloat(val);
      if (Number.isNaN(n)) return;
      labState[key] = n;
      rangeEl.value = String(n);
      numEl.value = String(n);
      renderGraphLab();
    };
    rangeEl.addEventListener('input', (e) => update(e.target.value));
    numEl.addEventListener('input', (e) => update(e.target.value));
  };
  bindCoeffPair(el.labARange, el.labANum, 'a');
  bindCoeffPair(el.labBRange, el.labBNum, 'b');
  bindCoeffPair(el.labCRange, el.labCNum, 'c');

  el.labOpSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-op]');
    if (!btn) return;
    labState.op = btn.dataset.op;
    for (const b of el.labOpSegment.querySelectorAll('button[data-op]')) {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    }
    renderGraphLab();
  });

  el.labRandomBtn.addEventListener('click', randomizeLabExample);

  // Transformations Lab bindings
  el.trTierSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tier]');
    if (!btn) return;
    trState.tier = btn.dataset.tier;
    if (trState.tier === 'basic') {
      trState.source = { a: 1, h: 0, k: 0 };
      trState.revealedSteps = 1;
      renderTransformLab(true);
    } else {
      loadRandomTransformation();
    }
  });

  el.trRandomBtn.addEventListener('click', loadRandomTransformation);

  const bindTrInput = (inputEl, group, key) => {
    inputEl.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (Number.isNaN(val)) return;
      if (key === 'a' && Math.abs(val) < 1e-6) return;
      trState[group][key] = val;
      renderTransformLab(true);
    });
  };
  bindTrInput(el.trA1, 'source', 'a');
  bindTrInput(el.trH1, 'source', 'h');
  bindTrInput(el.trK1, 'source', 'k');
  bindTrInput(el.trA2, 'target', 'a');
  bindTrInput(el.trH2, 'target', 'h');
  bindTrInput(el.trK2, 'target', 'k');

  el.trNextStepBtn.addEventListener('click', () => {
    trState.revealedSteps = Math.min(3, trState.revealedSteps + 1);
    renderTransformSteps(computeTransformation(trState.source, trState.target));
  });

  el.trAllStepsBtn.addEventListener('click', () => {
    trState.revealedSteps = 3;
    renderTransformSteps(computeTransformation(trState.source, trState.target));
  });

  el.trCheckTableBtn.addEventListener('click', checkTransformTable);
  el.trFillTableBtn.addEventListener('click', fillTransformTable);
  el.trCompareOrderBtn.addEventListener('click', () => {
    trState.compareWrongOrder = !trState.compareWrongOrder;
    renderTransformLab(false);
  });

  // Linear Systems bindings
  el.linSkillSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-skill]');
    if (!btn) return;
    linState.skill = btn.dataset.skill;
    loadLinearProblem();
  });

  el.linLevelSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    linState.level = Number(btn.dataset.level);
    loadLinearProblem();
  });

  el.linActiveLineSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-line]');
    if (!btn) return;
    linState.activeLine = Number(btn.dataset.line);
    updateLinearDrillCounters();
  });

  el.linClearL1Btn.addEventListener('click', () => {
    linState.line1Points = [];
    linState.activeLine = 1;
    updateLinearDrillCounters();
    renderLinearGraph();
  });

  el.linClearL2Btn.addEventListener('click', () => {
    linState.line2Points = [];
    linState.activeLine = 2;
    updateLinearDrillCounters();
    renderLinearGraph();
  });

  el.linRiseRunBtn.addEventListener('click', () => {
    const maxModes = linState.skill === 'graph_single' ? 2 : 3;
    linState.riseRunStep = (linState.riseRunStep + 1) % maxModes;
    el.linRiseRunBtn.textContent =
      linState.riseRunStep === 0
        ? 'Rise/Run Guide'
        : `Rise/Run: Line ${linState.riseRunStep}`;
    renderLinearGraph();
  });

  el.linCanvas.addEventListener('click', (e) => {
    const isSingle = linState.skill === 'graph_single';
    if ((!isSingle && linState.skill !== 'graph_drill') || linState.solved) return;
    const pt = canvasEventToGrid(el.linCanvas, e.clientX, e.clientY, 8);
    if (isSingle || linState.activeLine === 1) {
      if (linState.line1Points.length >= 2) linState.line1Points = [pt];
      else linState.line1Points.push(pt);
      if (!isSingle && linState.line1Points.length === 2 && linState.line2Points.length < 2) {
        linState.activeLine = 2;
      }
    } else {
      if (linState.line2Points.length >= 2) linState.line2Points = [pt];
      else linState.line2Points.push(pt);
    }
    updateLinearDrillCounters();
    renderLinearGraph();
  });

  el.linGraphToggleBtn.addEventListener('click', () => {
    linState.graphVisible = !linState.graphVisible;
    el.linGraphToggleBtn.textContent = linState.graphVisible ? 'Hide Graph' : 'Show Graph';
    el.linGraphToggleBtn.setAttribute('aria-expanded', String(linState.graphVisible));
    renderLinearGraph();
  });

  el.linChoiceGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-choice]');
    if (!btn) return;
    linState.selectedCategory = btn.dataset.choice;
    for (const b of el.linChoiceGroup.querySelectorAll('button[data-choice]')) {
      b.classList.toggle('active', b === btn);
    }
  });

  el.linPoiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (linState.solved) loadLinearProblem();
      else handleLinearCheck();
    }
  });

  el.linCheckBtn.addEventListener('click', handleLinearCheck);
  el.linHintBtn.addEventListener('click', handleLinearHint);
  el.linSolutionBtn.addEventListener('click', handleLinearShowSolution);
  el.linNextBtn.addEventListener('click', loadLinearProblem);

  // Analytic Geometry bindings
  el.geoSkillSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-skill]');
    if (!btn) return;
    geoState.skill = btn.dataset.skill;
    loadGeoProblem();
  });

  el.geoLevelSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    geoState.level = Number(btn.dataset.level);
    loadGeoProblem();
  });

  el.geoGgbToggleBtn.addEventListener('click', () => {
    geoState.ggbOpen = !geoState.ggbOpen;
    el.geoGgbPanel.classList.toggle('hidden', !geoState.ggbOpen);
    el.geoGgbToggleBtn.setAttribute('aria-expanded', String(geoState.ggbOpen));
    el.geoGgbToggleBtn.textContent = geoState.ggbOpen
      ? 'Hide GeoGebra Sandbox'
      : 'Open GeoGebra Sandbox';
    if (geoState.ggbOpen && !el.geoFrame.getAttribute('src')) {
      el.geoFrame.setAttribute('src', el.geoFrame.dataset.src);
    }
  });

  el.geoCopyGgbBtn.addEventListener('click', () => {
    const text = el.geoGgbCmds.textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        el.geoCopyGgbBtn.textContent = 'Copied!';
        setTimeout(() => {
          el.geoCopyGgbBtn.textContent = 'Copy Commands';
        }, 1500);
      });
    }
  });

  el.geoChoiceGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-choice]');
    if (!btn) return;
    geoState.selectedChoice = btn.dataset.choice;
    for (const b of el.geoChoiceGroup.querySelectorAll('button[data-choice]')) {
      b.classList.toggle('active', b === btn);
    }
  });

  el.geoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (geoState.solved) loadGeoProblem();
      else handleGeoCheck();
    }
  });

  el.geoCheckBtn.addEventListener('click', handleGeoCheck);
  el.geoHintBtn.addEventListener('click', handleGeoHint);
  el.geoSolutionBtn.addEventListener('click', handleGeoShowSolution);
  el.geoNextBtn.addEventListener('click', loadGeoProblem);

  // Trigonometry bindings (UDL & DI)
  el.trigSkillSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-skill]');
    if (!btn) return;
    trigState.skill = btn.dataset.skill;
    loadTrigProblem();
  });

  el.trigLevelSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    trigState.level = Number(btn.dataset.level);
    loadTrigProblem();
  });

  el.trigColorBtn.addEventListener('click', () => {
    trigState.colorCoded = !trigState.colorCoded;
    el.trigColorBtn.classList.toggle('active', trigState.colorCoded);
    el.trigColorBtn.setAttribute('aria-pressed', String(trigState.colorCoded));
    renderTrigCanvas();
  });

  el.trigFormulaBtn.addEventListener('click', () => {
    trigState.formulaOpen = !trigState.formulaOpen;
    el.trigFormulaSheet.classList.toggle('hidden', !trigState.formulaOpen);
    el.trigFormulaBtn.setAttribute('aria-expanded', String(trigState.formulaOpen));
  });

  el.trigSpeakBtn.addEventListener('click', () => {
    if (!trigState.problem) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `${trigState.problem.promptText}`;
      const utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    }
  });

  el.trigChoiceGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-choice]');
    if (!btn) return;
    trigState.selectedChoice = btn.dataset.choice;
    for (const b of el.trigChoiceGroup.querySelectorAll('button[data-choice]')) {
      b.classList.toggle('active', b === btn);
    }
  });

  el.trigInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (trigState.solved) loadTrigProblem();
      else handleTrigCheck();
    }
  });

  el.trigCheckBtn.addEventListener('click', handleTrigCheck);
  el.trigHintBtn.addEventListener('click', handleTrigHint);
  el.trigSolutionBtn.addEventListener('click', handleTrigShowSolution);
  el.trigNextBtn.addEventListener('click', loadTrigProblem);

  // Mental Math, Proportions & Problem Strings bindings
  el.mentalModeSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    setMentalMode(btn.dataset.mode);
  });

  el.propTypeSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-type]');
    if (!btn) return;
    mentalState.propType = btn.dataset.type;
    loadProportionProblem();
  });

  el.propLevelSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    mentalState.propLevel = Number(btn.dataset.level);
    loadProportionProblem();
  });

  el.propInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mentalState.propSolved) loadProportionProblem();
      else handlePropCheck();
    }
  });

  el.propCheckBtn.addEventListener('click', handlePropCheck);
  el.propStrategyBtn.addEventListener('click', () => {
    const p = mentalState.propProblem;
    if (!p) return;
    el.propStrategyBox.classList.remove('hidden');
    el.propStrategyBox.innerHTML = `<div class="hint-item"><span class="hint-tag">Mental Strategy</span> <span>${p.strategyHint}</span></div>`;
  });
  el.propSolutionBtn.addEventListener('click', showPropSolution);
  el.propNextBtn.addEventListener('click', loadProportionProblem);

  el.strThemeSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    mentalState.strTheme = btn.dataset.theme;
    loadProblemString();
  });

  el.strNewBtn.addEventListener('click', loadProblemString);
  el.strRevealNextBtn.addEventListener('click', () => {
    if (!mentalState.strData) return;
    mentalState.strVisibleCount = Math.min(
      mentalState.strData.steps.length,
      mentalState.strVisibleCount + 1
    );
    renderStringSteps();
  });
  el.strRevealAllBtn.addEventListener('click', () => {
    if (!mentalState.strData) return;
    mentalState.strVisibleCount = mentalState.strData.steps.length;
    renderStringSteps();
  });
  el.strProjectorBtn.addEventListener('click', () => {
    mentalState.strProjector = !mentalState.strProjector;
    el.strProjectorBtn.classList.toggle('active', mentalState.strProjector);
    el.strProjectorBtn.setAttribute('aria-pressed', String(mentalState.strProjector));
    el.strPanel.classList.toggle('projector-mode', mentalState.strProjector);
  });

  if (el.btcTaskSegment) {
    el.btcTaskSegment.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-task]');
      if (!btn) return;
      mentalState.btcTaskId = btn.dataset.task;
      renderBtcHub();
    });
  }

  if (el.btcVrgBtn) {
    el.btcVrgBtn.addEventListener('click', renderBtcVrg);
  }

  if (el.btcObsList) {
    el.btcObsList.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type="checkbox"][data-idx]');
      if (!cb) return;
      const idx = Number(cb.dataset.idx);
      if (cb.checked) mentalState.btcObserved.add(idx);
      else mentalState.btcObserved.delete(idx);
      if (el.btcObsScore) {
        el.btcObsScore.textContent = `${mentalState.btcObserved.size} / ${BTC_OBSERVATION_ITEMS.length} Observed`;
      }
    });
  }

  if (el.btcObsResetBtn) {
    el.btcObsResetBtn.addEventListener('click', () => {
      mentalState.btcObserved.clear();
      renderBtcChecklist();
    });
  }

  // Interactive Simulations events
  if (el.simModeSegment) {
    el.simModeSegment.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-sim]');
      if (!btn) return;
      setSimMode(btn.dataset.sim);
    });
  }

  if (el.simTrigAngle) {
    el.simTrigAngle.addEventListener('input', () => {
      simState.angleDeg = Number(el.simTrigAngle.value);
      renderSimLab();
    });
  }

  if (el.simTrigScale) {
    el.simTrigScale.addEventListener('input', () => {
      simState.scale = Number(el.simTrigScale.value);
      renderSimLab();
    });
  }

  if (el.simTrigPresets) {
    el.simTrigPresets.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-angle]');
      if (!btn) return;
      simState.angleDeg = Number(btn.dataset.angle);
      renderSimLab();
    });
  }

  if (el.simTrigResetBtn) {
    el.simTrigResetBtn.addEventListener('click', () => {
      simState.angleDeg = 35;
      simState.scale = 1.0;
      renderSimLab();
    });
  }

  if (el.simTrigCanvas) {
    const getCanvasPos = (e) => {
      const r = el.simTrigCanvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    el.simTrigCanvas.addEventListener('pointerdown', (e) => {
      if (!simTrigHandles) return;
      const p = getCanvasPos(e);
      const dAngle = Math.hypot(p.x - simTrigHandles.angleHandle.x, p.y - simTrigHandles.angleHandle.y);
      const dScale = Math.hypot(p.x - simTrigHandles.resizeHandle.x, p.y - simTrigHandles.resizeHandle.y);
      const dSide = simTrigHandles.sideHandle
        ? Math.hypot(p.x - simTrigHandles.sideHandle.x, p.y - simTrigHandles.sideHandle.y)
        : Infinity;

      const best = Math.min(dAngle, dScale, dSide);
      if (best > 30) return;
      if (best === dAngle) simTrigDragMode = 'angle';
      else if (best === dScale) simTrigDragMode = 'scale';
      else simTrigDragMode = 'side_adj';
      el.simTrigCanvas.setPointerCapture(e.pointerId);
    });
    el.simTrigCanvas.addEventListener('pointermove', (e) => {
      if (!simTrigDragMode || !simTrigHandles) return;
      const p = getCanvasPos(e);
      const dx = p.x - simTrigHandles.originA.x;
      const dy = simTrigHandles.originA.y - p.y;
      if (simTrigDragMode === 'angle') {
        const deg = Math.round((Math.atan2(Math.max(1, dy), Math.max(1, dx)) * 180) / Math.PI);
        simState.angleDeg = Math.min(75, Math.max(15, deg));
      } else if (simTrigDragMode === 'scale') {
        const hypUnits = Math.hypot(Math.max(0, dx), Math.max(0, dy)) / simTrigHandles.pxPerUnit;
        simState.scale = Math.min(2.4, Math.max(0.6, Math.round((hypUnits / 10) * 20) / 20));
      } else {
        const adjUnits = Math.max(1, dx) / simTrigHandles.pxPerUnit;
        const hypUnits = adjUnits / Math.cos((simState.angleDeg * Math.PI) / 180);
        simState.scale = Math.min(2.4, Math.max(0.6, Math.round((hypUnits / 10) * 20) / 20));
      }
      renderSimLab();
    });
    const endTrigDrag = () => {
      simTrigDragMode = null;
    };
    el.simTrigCanvas.addEventListener('pointerup', endTrigDrag);
    el.simTrigCanvas.addEventListener('pointercancel', endTrigDrag);
  }

  if (el.simGeoPerpBisToggle) {
    el.simGeoPerpBisToggle.addEventListener('change', () => {
      simState.showPerpBisector = Boolean(el.simGeoPerpBisToggle.checked);
      renderSimLab();
    });
  }

  if (el.simGeoResetBtn) {
    el.simGeoResetBtn.addEventListener('click', () => {
      simState.ax = -3;
      simState.ay = -2;
      simState.bx = 5;
      simState.by = 4;
      renderSimLab();
    });
  }

  if (el.simGeoCanvas) {
    const getGeoPos = (e) => {
      const r = el.simGeoCanvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    el.simGeoCanvas.addEventListener('pointerdown', (e) => {
      if (!simGeoHandles) return;
      const p = getGeoPos(e);
      const dA = Math.hypot(p.x - simGeoHandles.handleA.x, p.y - simGeoHandles.handleA.y);
      const dB = Math.hypot(p.x - simGeoHandles.handleB.x, p.y - simGeoHandles.handleB.y);
      if (Math.min(dA, dB) > 28) return;
      simGeoDragPoint = dA <= dB ? 'A' : 'B';
      el.simGeoCanvas.setPointerCapture(e.pointerId);
    });
    el.simGeoCanvas.addEventListener('pointermove', (e) => {
      if (!simGeoDragPoint || !simGeoHandles) return;
      const p = getGeoPos(e);
      const w = simGeoHandles.toWorld(p.x, p.y);
      if (simGeoDragPoint === 'A') {
        simState.ax = w.x;
        simState.ay = w.y;
      } else {
        simState.bx = w.x;
        simState.by = w.y;
      }
      renderSimLab();
    });
    const endGeoDrag = () => {
      simGeoDragPoint = null;
    };
    el.simGeoCanvas.addEventListener('pointerup', endGeoDrag);
    el.simGeoCanvas.addEventListener('pointercancel', endGeoDrag);
  }

  el.exportCsvBtn.addEventListener('click', () => {
    const csv = generateProgressCsv(progress);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mpm2d-quadratics-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  el.resetDialog.addEventListener('close', () => {
    const choice = el.resetDialog.returnValue;
    el.resetDialog.returnValue = '';
    if (choice === 'confirm') {
      progress = resetProgressStorage();
      renderDashboard();
      loadNewProblem();
    }
  });
}

// ---------- Bootstrap ----------

function init() {
  updateThemeButtonUI();
  detectMathLive();
  bindEvents();
  loadNewProblem();
  renderTransformLab(true);
  loadLinearProblem();
  loadGeoProblem();
  loadTrigProblem();
  loadProportionProblem();
  loadProblemString();
  renderBtcHub();
  renderBtcVrg();
  renderBtcChecklist();
  renderSimLab();

  if (window.customElements && typeof window.customElements.whenDefined === 'function') {
    window.customElements.whenDefined('math-field').then(() => {
      detectMathLive();
      focusInput();
    });
  }

  window.addEventListener('load', () => {
    if (currentProblem) {
      renderTex(el.problemEquation, currentProblem.equationLatex, true);
      if (solutionShown || problemSolved) renderSolutionPanel();
    }
    if (!el.viewGraph.classList.contains('hidden')) {
      renderGraphLab();
    }
    if (!el.viewTransform.classList.contains('hidden')) {
      renderTransformLab(false);
    }
    if (!el.viewLinear.classList.contains('hidden')) {
      renderLinearGraph();
    }
    if (linState.problem) {
      renderTex(el.linEquation, linState.problem.equationLatex, true);
    }
    if (geoState.problem) {
      renderTex(el.geoEquation, geoState.problem.equationLatex, true);
    }
    if (trigState.problem) {
      renderTex(el.trigEquation, trigState.problem.equationLatex, true);
    }
    if (mentalState.propProblem) {
      renderTex(el.propEquation, mentalState.propProblem.equationLatex, true);
    }
    if (!el.viewMental.classList.contains('hidden') && mentalState.mode === 'string') {
      renderStringSteps();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
