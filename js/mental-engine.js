// Proportional Reasoning Drill & Algebra Problem Strings (Mental Math for Students & Teachers)

import { gcd, formatFractionLatex, evaluateMathExpression } from './math-engine.js';
import { evalExpressionAtX } from './skills-engine.js';

export const PROP_TYPES = {
  mixed: { id: 'mixed', name: 'Mixed Proportions' },
  ratios: { id: 'ratios', name: 'Equivalent Ratios' },
  unit_rate: { id: 'unit_rate', name: 'Unit Rates & Scaling' },
  percent: { id: 'percent', name: 'Mental Percents' },
  algebraic_prop: { id: 'algebraic_prop', name: 'Algebraic Proportions' },
};

export const STRING_THEMES = {
  distributive: { id: 'distributive', name: 'Distributive Property' },
  diff_squares: { id: 'diff_squares', name: 'Difference of Squares' },
  mental_solve: { id: 'mental_solve', name: 'Balance / Cover-Up Solving' },
  rate_of_change: { id: 'rate_of_change', name: 'Linear Rate Stepping' },
  perfect_squares: { id: 'perfect_squares', name: 'Squaring & (x + a)²' },
  factoring_mental: { id: 'factoring_mental', name: 'Sum-Product Factoring' },
  fraction_clearing: { id: 'fraction_clearing', name: 'Clearing Fractions Mentally' },
  analytic_geometry: { id: 'analytic_geometry', name: 'Analytic Geometry' },
  trig_ratios: { id: 'trig_ratios', name: 'Trig Ratios & Similar Triangles' },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- Proportional Reasoning Drill ----------

export function generateProportionProblem(type = 'mixed', level = 1) {
  const lvl = Math.min(4, Math.max(1, Number(level) || 1));
  const chosen =
    type === 'mixed' ? pick(['ratios', 'unit_rate', 'percent', 'algebraic_prop']) : type;

  if (chosen === 'ratios') {
    let a = randInt(2, 7);
    let b = randInt(3, 9);
    while (gcd(a, b) !== 1) b = randInt(3, 9);

    if (lvl <= 2) {
      const k = randInt(2, 6);
      const unknownBottom = lvl === 2 && Math.random() < 0.5;
      if (!unknownBottom) {
        const c = b * k;
        const ans = a * k;
        return {
          type: 'ratios',
          level: lvl,
          promptText: 'Solve the proportion mentally using scale factor:',
          equationLatex: `\\frac{${a}}{${b}} = \\frac{x}{${c}}`,
          expectedValue: ans,
          unit: '',
          exactExpectedLatex: String(ans),
          strategyHint: `Look horizontally: ${b} × ${k} = ${c}, so multiply ${a} by ${k} as well!`,
          solutionSteps: [
            `\\text{Scale factor from } ${b} \\text{ to } ${c} \\text{ is } \\times ${k}.`,
            `x = ${a} \\times ${k} = ${ans}`,
          ],
        };
      }
      const c = a * k;
      const ans = b * k;
      return {
        type: 'ratios',
        level: lvl,
        promptText: 'Solve the proportion mentally:',
        equationLatex: `\\frac{${a}}{${b}} = \\frac{${c}}{x}`,
        expectedValue: ans,
        unit: '',
        exactExpectedLatex: String(ans),
        strategyHint: `Look horizontally: ${a} × ${k} = ${c}, so multiply ${b} by ${k}.`,
        solutionSteps: [
          `\\text{Scale factor from } ${a} \\text{ to } ${c} \\text{ is } \\times ${k}.`,
          `x = ${b} \\times ${k} = ${ans}`,
        ],
      };
    }

    // Level 3-4: Half-integer scaling or cross-multiply fraction
    const d = pick([3, 4, 5, 6, 8]);
    const ans = (a * d) / b;
    const ansTex = formatFractionLatex(a * d, b);
    return {
      type: 'ratios',
      level: lvl,
      promptText: 'Solve for x (exact fraction or decimal):',
      equationLatex: `\\frac{${a}}{${b}} = \\frac{x}{${d}}`,
      expectedValue: ans,
      unit: '',
      exactExpectedLatex: ansTex,
      strategyHint: `Multiply both sides by ${d} (or cross-multiply: ${b}x = ${a} × ${d}).`,
      solutionSteps: [
        `${b}x = ${a} \\times ${d} = ${a * d}`,
        `x = ${ansTex}`,
      ],
    };
  }

  if (chosen === 'unit_rate') {
    const scenarios = [
      () => {
        const qty1 = pick([3, 4, 5, 6]);
        const unitPrice = lvl <= 2 ? pick([2, 3, 4, 5]) : pick([1.5, 2.5, 3.5]);
        const cost1 = qty1 * unitPrice;
        const qty2 = qty1 + randInt(2, 6);
        const ans = qty2 * unitPrice;
        return {
          promptText: `If ${qty1} notebooks cost $${cost1}, how much do ${qty2} notebooks cost at the same rate?`,
          equationLatex: `${qty1}\\text{ items} : \\$${cost1} = ${qty2}\\text{ items} : \\$x`,
          expectedValue: ans,
          unit: '$',
          exactExpectedLatex: String(ans),
          strategyHint: `Find the unit rate first: $${cost1} ÷ ${qty1} = $${unitPrice} per notebook, then multiply by ${qty2}.`,
          solutionSteps: [
            `\\text{Unit price} = \\frac{${cost1}}{${qty1}} = \\$${unitPrice}\\text{ each}`,
            `\\text{Total for } ${qty2} = ${qty2} \\times ${unitPrice} = \\$${ans}`,
          ],
        };
      },
      () => {
        const cmMap = pick([2, 3, 4]);
        const scaleKm = pick([5, 10, 15]);
        const distKm1 = cmMap * scaleKm;
        const cm2 = lvl <= 2 ? cmMap * pick([2, 3, 4]) : cmMap + pick([3, 5]);
        const ans = cm2 * scaleKm;
        return {
          promptText: `On a map, ${cmMap} cm represents ${distKm1} km. How many km does ${cm2} cm represent?`,
          equationLatex: `${cmMap}\\text{ cm} : ${distKm1}\\text{ km} = ${cm2}\\text{ cm} : x\\text{ km}`,
          expectedValue: ans,
          unit: 'km',
          exactExpectedLatex: String(ans),
          strategyHint: `1 cm on the map represents ${distKm1} ÷ ${cmMap} = ${scaleKm} km.`,
          solutionSteps: [
            `\\text{Unit scale: } 1\\text{ cm} = ${scaleKm}\\text{ km}`,
            `${cm2} \\times ${scaleKm} = ${ans}\\text{ km}`,
          ],
        };
      },
    ];
    const s = pick(scenarios)();
    return { type: 'unit_rate', level: lvl, ...s };
  }

  if (chosen === 'percent') {
    if (lvl <= 2) {
      const pct = pick([10, 15, 20, 25, 30, 50, 75]);
      const base = pick([40, 60, 80, 120, 160, 200, 240]);
      const ans = (pct / 100) * base;
      return {
        type: 'percent',
        level: lvl,
        promptText: `Calculate ${pct}% of ${base} mentally:`,
        equationLatex: `${pct}\\% \\text{ of } ${base} = ?`,
        expectedValue: ans,
        unit: '',
        exactExpectedLatex: String(ans),
        strategyHint: `Use 10% (${base / 10}) or 25% (1/4 = ${base / 4}) as an anchor!`,
        solutionSteps: [
          `10\\% \\text{ of } ${base} = ${base / 10}, \\; 5\\% = ${base / 20}`,
          `${pct}\\% \\text{ of } ${base} = ${ans}`,
        ],
      };
    }

    // Level 3-4: Reverse percent ("25% of x is 18")
    const pct = pick([15, 20, 25, 40, 60, 75, 120]);
    const whole = pick([40, 50, 60, 80, 100, 120, 140]);
    const part = (pct / 100) * whole;
    return {
      type: 'percent',
      level: lvl,
      promptText: `Find the original number x mentally: ${pct}% of x is ${part}.`,
      equationLatex: `\\frac{${pct}}{100} = \\frac{${part}}{x}`,
      expectedValue: whole,
      unit: '',
      exactExpectedLatex: String(whole),
      strategyHint: `Scale down to 5% or 10% first (divide ${part} to find 10%), then scale up to 100%!`,
      solutionSteps: [
        `${pct}\\% \\to ${part} \\implies 100\\% = ${part} \\times \\frac{100}{${pct}} = ${whole}`,
      ],
    };
  }

  // algebraic_prop: (x + c) / b = p / q
  const q = pick([2, 3, 4]);
  let p = randInt(1, 5);
  while (gcd(p, q) !== 1) p = randInt(1, 5);
  const mult = randInt(2, 5);
  const b = q * mult;
  const c = randInt(-6, 6);
  const ans = p * mult - c;

  return {
    type: 'algebraic_prop',
    level: lvl,
    promptText: 'Solve the algebraic proportion for x:',
    equationLatex: `\\frac{x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}}{${b}} = \\frac{${p}}{${q}}`,
    expectedValue: ans,
    unit: '',
    exactExpectedLatex: String(ans),
    strategyHint: `Scale horizontally: ${q} × ${mult} = ${b}, so x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`} must equal ${p} × ${mult} = ${p * mult}!`,
    solutionSteps: [
      `\\text{Scale factor from } ${q} \\text{ to } ${b} \\text{ is } \\times ${mult}:`,
      `x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`} = ${p} \\times ${mult} = ${p * mult} \\implies x = ${ans}`,
    ],
  };
}

export function checkProportionAnswer(inputRaw, problem) {
  let s = String(inputRaw || '').trim();
  if (!s) return { correct: false, parseError: true, message: 'Please enter a value.' };
  s = s
    .replace(/\u2212/g, '-')
    .replace(/\$|%|°|\bkm\b|\bcm\b|\bm\b/gi, '')
    .replace(/^x\s*=\s*/i, '')
    .trim();

  try {
    const val = evaluateMathExpression(s);
    const ok = Math.abs(val - problem.expectedValue) < 1e-4;
    return {
      correct: ok,
      message: ok
        ? `Correct! Answer is ${problem.expectedValue}.`
        : 'Not quite — try using a unit rate or scale factor!',
    };
  } catch {
    return { correct: false, parseError: true, message: 'Could not read that number or fraction.' };
  }
}

// ---------- Algebra Problem Strings (5-Step Mental Math Chains) ----------

const lastStringSig = {};

function buildStringForTheme(theme) {
  if (theme === 'distributive') {
    const a = randInt(4, 15);
    const k = randInt(2, 8);
    const comp = pick([19, 29, 39, 99]);
    const compBase = comp + 1;
    return {
      sig: `dist_${a}_${k}_${comp}`,
      theme,
      title: 'Distributive Property & Compensation String',
      teacherGoal: `Guide students from friendly base-10 multiples (${a}×10) to mental compensation (${a}×${comp}) and ${a}(x + ${k}).`,
      steps: [
        {
          promptText: 'Anchor (× 10):',
          equationLatex: `${a} \\times 10`,
          answerLatex: String(a * 10),
          expectedValue: a * 10,
          strategyNote: 'Multiply by 10 as your mental anchor.',
        },
        {
          promptText: `Small piece (× ${k}):`,
          equationLatex: `${a} \\times ${k}`,
          answerLatex: String(a * k),
          expectedValue: a * k,
          strategyNote: 'Quick basic fact.',
        },
        {
          promptText: `Combine (${a} × ${10 + k}):`,
          equationLatex: `${a} \\times ${10 + k}`,
          answerLatex: String(a * (10 + k)),
          expectedValue: a * (10 + k),
          strategyNote: `Split into ${a}(10 + ${k}) = ${a * 10} + ${a * k}.`,
        },
        {
          promptText: `Compensation (× ${comp}):`,
          equationLatex: `${a} \\times ${comp}`,
          answerLatex: String(a * comp),
          expectedValue: a * comp,
          strategyNote: `Think ${a}(${compBase} − 1) = ${a * compBase} − ${a} = ${a * comp}.`,
        },
        {
          promptText: 'Algebraic Generalization (expand):',
          equationLatex: `${a}(x + ${k})`,
          answerLatex: `${a}x + ${a * k}`,
          expectedValue: null,
          expectedExpr: `${a}x + ${a * k}`,
          strategyNote: `Distribute ${a} to every term inside: ${a}·x + ${a}·${k}.`,
        },
      ],
    };
  }

  if (theme === 'diff_squares') {
    const m = pick([10, 20, 30, 40, 50, 60, 70, 80, 90]);
    const k = randInt(2, 7);
    const j = pick([1, 2].filter((v) => v !== k));
    return {
      sig: `diff_${m}_${j}_${k}`,
      theme,
      title: 'Difference of Squares Mental Math String',
      teacherGoal: `Connect mental products like (${m}−${k})(${m}+${k}) to a² − b² and (x−${k})(x+${k}).`,
      steps: [
        {
          promptText: 'Friendly square:',
          equationLatex: `${m}^2`,
          answerLatex: String(m * m),
          expectedValue: m * m,
          strategyNote: 'Square the tens digit and append 00.',
        },
        {
          promptText: `Subtract ${j}²:`,
          equationLatex: `${m}^2 - ${j}^2`,
          answerLatex: String(m * m - j * j),
          expectedValue: m * m - j * j,
          strategyNote: `${m * m} − ${j * j}.`,
        },
        {
          promptText: 'Nearby symmetric product:',
          equationLatex: `${m - j} \\times ${m + j}`,
          answerLatex: String((m - j) * (m + j)),
          expectedValue: (m - j) * (m + j),
          strategyNote: `Notice (${m} − ${j})(${m} + ${j}) = ${m}² − ${j}² = ${m * m - j * j}!`,
        },
        {
          promptText: `Wider symmetric product (distance ${k}):`,
          equationLatex: `${m - k} \\times ${m + k}`,
          answerLatex: String((m - k) * (m + k)),
          expectedValue: (m - k) * (m + k),
          strategyNote: `(${m} − ${k})(${m} + ${k}) = ${m}² − ${k}² = ${m * m} − ${k * k}.`,
        },
        {
          promptText: 'Algebraic Generalization (expand):',
          equationLatex: `(x - ${k})(x + ${k})`,
          answerLatex: `x^2 - ${k * k}`,
          expectedValue: null,
          expectedExpr: `x^2 - ${k * k}`,
          strategyNote: `Middle terms cancel: x² − ${k}² = x² − ${k * k}.`,
        },
      ],
    };
  }

  if (theme === 'mental_solve') {
    const xAns = randInt(2, 11);
    const p = randInt(2, 7);
    const a = randInt(2, 6);
    const q = randInt(3, 12);
    const signP = pick([1, -1]);
    const pSigned = signP * p;
    const pStr = pSigned >= 0 ? `+ ${p}` : `- ${p}`;
    const rhs3 = a * xAns + pSigned;
    const rhs4 = a * (xAns + pSigned);
    const rhs5 = rhs4 + q;

    return {
      sig: `solve_${xAns}_${pSigned}_${a}_${q}`,
      theme,
      title: 'Balance & Cover-Up Equation String',
      teacherGoal: 'Build mental solving fluency by peeling off outer operations instead of blindly expanding.',
      steps: [
        {
          promptText: 'Step 1 (Undo addition/subtraction):',
          equationLatex: `x ${pStr} = ${xAns + pSigned}`,
          answerLatex: String(xAns),
          expectedValue: xAns,
          strategyNote: `Inverse operation of ${pStr}.`,
        },
        {
          promptText: 'Step 2 (Undo multiplication):',
          equationLatex: `${a}x = ${a * xAns}`,
          answerLatex: String(xAns),
          expectedValue: xAns,
          strategyNote: `${a * xAns} ÷ ${a} = ${xAns}.`,
        },
        {
          promptText: `Step 3 (Cover up ${a}x):`,
          equationLatex: `${a}x ${pStr} = ${rhs3}`,
          answerLatex: String(xAns),
          expectedValue: xAns,
          strategyNote: `Cover up ${a}x: ${a}x must equal ${a * xAns}, so x = ${xAns}.`,
        },
        {
          promptText: 'Step 4 (Divide outer factor first!):',
          equationLatex: `${a}(x ${pStr}) = ${rhs4}`,
          answerLatex: String(xAns),
          expectedValue: xAns,
          strategyNote: `Divide both sides by ${a} mentally: x ${pStr} = ${xAns + pSigned} → x = ${xAns}.`,
        },
        {
          promptText: 'Step 5 (Peel off outer layers):',
          equationLatex: `${a}(x ${pStr}) + ${q} = ${rhs5}`,
          answerLatex: String(xAns),
          expectedValue: xAns,
          strategyNote: `Subtract ${q} (${rhs4}), divide by ${a} (${xAns + pSigned}), undo ${pStr} (${xAns}).`,
        },
      ],
    };
  }

  if (theme === 'rate_of_change') {
    const m = pick([-6, -5, -4, -3, 3, 4, 5, 6, 7, 8]);
    const b = randInt(2, 18);
    const xTarget = pick([8, 9, 12, 15]);
    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    return {
      sig: `rate_${m}_${b}_${xTarget}`,
      theme,
      title: 'Linear Rate Stepping String (y = mx + b)',
      teacherGoal: 'Develop mental substitution using unit steps and base-10 jumps along a linear relation.',
      steps: [
        {
          promptText: `Given y = ${m}x ${bSign}, find y at x = 0:`,
          equationLatex: `y(0) = ${m}(0) ${bSign}`,
          answerLatex: String(b),
          expectedValue: b,
          strategyNote: 'Initial value is always b.',
        },
        {
          promptText: 'Step forward 1 unit (x = 1):',
          equationLatex: `y(1) = ${m}(1) ${bSign}`,
          answerLatex: String(m + b),
          expectedValue: m + b,
          strategyNote: `Add one rate of change (${m >= 0 ? '+' : ''}${m}) to ${b}.`,
        },
        {
          promptText: 'Jump 10 units (x = 10):',
          equationLatex: `y(10) = ${m}(10) ${bSign}`,
          answerLatex: String(10 * m + b),
          expectedValue: 10 * m + b,
          strategyNote: `10 steps of ${m} is ${10 * m}, plus initial ${b}.`,
        },
        {
          promptText: 'Step +1 from x = 10 (x = 11):',
          equationLatex: `y(11) = ${m}(11) ${bSign}`,
          answerLatex: String(11 * m + b),
          expectedValue: 11 * m + b,
          strategyNote: `Add one more ${m} to y(10): ${10 * m + b} + (${m}).`,
        },
        {
          promptText: `Work backwards: if ${m}x ${bSign} = ${m * xTarget + b}, find x:`,
          equationLatex: `${m}x ${bSign} = ${m * xTarget + b}`,
          answerLatex: String(xTarget),
          expectedValue: xTarget,
          strategyNote: `Remove initial value ${b} (${m * xTarget}), then divide by rate ${m}.`,
        },
      ],
    };
  }

  if (theme === 'factoring_mental') {
    const r = randInt(2, 7);
    const s = randInt(2, 8);
    const sum = r + s;
    const prod = r * s;
    const g = randInt(2, 4);
    return {
      sig: `fac_${r}_${s}_${g}`,
      theme,
      title: 'Sum-Product Mental Factoring String',
      teacherGoal: 'Connect mental factor pairs and sums to factoring simple trinomials and GCFs.',
      steps: [
        {
          promptText: `Product of ${r} and ${s}:`,
          equationLatex: `${r} \\times ${s}`,
          answerLatex: String(prod),
          expectedValue: prod,
          strategyNote: 'Basic multiplication anchor.',
        },
        {
          promptText: `Sum of ${r} and ${s}:`,
          equationLatex: `${r} + ${s}`,
          answerLatex: String(sum),
          expectedValue: sum,
          strategyNote: 'Notice how product and sum link to b and c.',
        },
        {
          promptText: `Find the missing factor: ___ × ${r} = ${prod}`,
          equationLatex: `\\frac{${prod}}{${r}}`,
          answerLatex: String(s),
          expectedValue: s,
          strategyNote: `Divide product ${prod} by ${r}.`,
        },
        {
          promptText: 'Factor mentally:',
          equationLatex: `x^2 + ${sum}x + ${prod}`,
          answerLatex: `(x + ${r})(x + ${s})`,
          expectedValue: null,
          expectedExpr: `(x + ${r})(x + ${s})`,
          strategyNote: `Two numbers with product ${prod} and sum ${sum} are ${r} and ${s}.`,
        },
        {
          promptText: 'With Common Factor GCF:',
          equationLatex: `${g}x^2 + ${g * sum}x + ${g * prod}`,
          answerLatex: `${g}(x + ${r})(x + ${s})`,
          expectedValue: null,
          expectedExpr: `${g}(x + ${r})(x + ${s})`,
          strategyNote: `Factor out ${g} first to reveal the exact same trinomial!`,
        },
      ],
    };
  }

  if (theme === 'fraction_clearing') {
    const d1 = pick([2, 3, 4]);
    const d2 = d1 === 2 ? pick([3, 5]) : d1 === 3 ? pick([2, 4]) : 3;
    const lcd = d1 * d2;
    const xSol = randInt(2, 6) * pick([1, -1]);
    const cVal = (lcd / d1) * xSol + (lcd / d2) * xSol;
    return {
      sig: `frac_${d1}_${d2}_${xSol}`,
      theme,
      title: 'Clearing Fractions Mentally String',
      teacherGoal: 'Use Lowest Common Denominator (LCD) scaling to turn fraction equations into integer equations.',
      steps: [
        {
          promptText: `Scale a half/unit fraction: ${lcd} × (1/${d1})`,
          equationLatex: `${lcd} \\times \\frac{1}{${d1}}`,
          answerLatex: String(lcd / d1),
          expectedValue: lcd / d1,
          strategyNote: `${lcd} divided by ${d1}.`,
        },
        {
          promptText: `Scale the second fraction: ${lcd} × (1/${d2})`,
          equationLatex: `${lcd} \\times \\frac{1}{${d2}}`,
          answerLatex: String(lcd / d2),
          expectedValue: lcd / d2,
          strategyNote: `${lcd} divided by ${d2}.`,
        },
        {
          promptText: 'Solve after clearing denominators:',
          equationLatex: `${lcd / d1}x + ${lcd / d2}x = ${cVal}`,
          answerLatex: String(xSol),
          expectedValue: xSol,
          strategyNote: `Combine like terms: ${lcd / d1 + lcd / d2}x = ${cVal}.`,
        },
        {
          promptText: 'Now solve with fractions directly:',
          equationLatex: `\\frac{x}{${d1}} + \\frac{x}{${d2}} = ${formatFractionLatex(cVal, lcd)}`,
          answerLatex: String(xSol),
          expectedValue: xSol,
          strategyNote: `Multiply every term by LCD = ${lcd} to get Step 3!`,
        },
        {
          promptText: 'Simplify the sum algebraically:',
          equationLatex: `\\frac{x}{${d1}} + \\frac{x}{${d2}}`,
          answerLatex: `\\frac{${lcd / d1 + lcd / d2}x}{${lcd}}`,
          expectedValue: null,
          expectedExpr: `(${lcd / d1 + lcd / d2}x)/(${lcd})`,
          strategyNote: `Common denominator ${lcd}: (${lcd / d1}x + ${lcd / d2}x) / ${lcd}.`,
        },
      ],
    };
  }

  if (theme === 'analytic_geometry') {
    const [dxAbs, dyAbs, dist] = pick([
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13],
      [8, 15, 17],
    ]);
    const dx = pick([1, -1]) * dxAbs;
    const dy = pick([1, -1]) * dyAbs;
    const x1 = randInt(-6, 6);
    const y1 = randInt(-6, 6);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const midXTex = formatFractionLatex(x1 + x2, 2);
    const slopeTex = formatFractionLatex(dy, dx);
    const perpTex = formatFractionLatex(-dx, dy);

    return {
      sig: `geo_${x1}_${y1}_${dx}_${dy}`,
      theme: 'analytic_geometry',
      title: 'Analytic Geometry Mental String',
      teacherGoal: `Build from coordinate run/rise between A(${x1}, ${y1}) and B(${x2}, ${y2}) to midpoint, Pythagorean distance, and perpendicular slope.`,
      steps: [
        {
          promptText: `Run Δx from A(${x1}, ${y1}) to B(${x2}, ${y2}):`,
          equationLatex: `x_2 - x_1 = ${x2} - (${x1})`,
          answerLatex: String(dx),
          expectedValue: dx,
          strategyNote: `Count horizontally from ${x1} to ${x2}.`,
        },
        {
          promptText: `Rise Δy from A(${x1}, ${y1}) to B(${x2}, ${y2}):`,
          equationLatex: `y_2 - y_1 = ${y2} - (${y1})`,
          answerLatex: String(dy),
          expectedValue: dy,
          strategyNote: `Count vertically from ${y1} to ${y2}.`,
        },
        {
          promptText: 'Midpoint x-coordinate Mₓ:',
          equationLatex: `\\frac{${x1} + (${x2})}{2}`,
          answerLatex: midXTex,
          expectedValue: (x1 + x2) / 2,
          strategyNote: `Average the x-coordinates: (${x1} + ${x2}) / 2.`,
        },
        {
          promptText: 'Exact segment length AB (use Pythagorean triple):',
          equationLatex: `\\sqrt{(${dx})^2 + (${dy})^2}`,
          answerLatex: String(dist),
          expectedValue: dist,
          strategyNote: `Recognize the (${dxAbs}, ${dyAbs}, ${dist}) right triangle!`,
        },
        {
          promptText: 'Slope of a line perpendicular to AB (m⊥):',
          equationLatex: `m = ${slopeTex} \\implies m_\\perp = -\\frac{1}{m}`,
          answerLatex: perpTex,
          expectedValue: -dx / dy,
          strategyNote: `Flip ${slopeTex} and negate the sign: ${perpTex}.`,
        },
      ],
    };
  }

  if (theme === 'trig_ratios') {
    const [opp0, adj0, hyp0] = pick([
      [3, 4, 5],
      [4, 3, 5],
      [5, 12, 13],
      [12, 5, 13],
      [8, 15, 17],
      [15, 8, 17],
      [7, 24, 25],
    ]);
    const k = pick([2, 3, 4, 5]);
    const k2 = pick([6, 8, 10, 12]);
    const sinTex = formatFractionLatex(opp0, hyp0);
    const tanTex = formatFractionLatex(opp0, adj0);

    return {
      sig: `trig_${opp0}_${adj0}_${k}_${k2}`,
      theme: 'trig_ratios',
      title: 'Trig Ratios & Similar Triangle Scaling String',
      teacherGoal: 'Discover mentally that scaling a right triangle keeps sin θ and tan θ completely unchanged.',
      steps: [
        {
          promptText: `Base right triangle (Opp = ${opp0}, Adj = ${adj0}, Hyp = ${hyp0}): find sin θ`,
          equationLatex: `\\sin\\theta = \\frac{${opp0}}{${hyp0}}`,
          answerLatex: sinTex,
          expectedValue: opp0 / hyp0,
          strategyNote: `SOH: Opposite over Hypotenuse = ${sinTex}.`,
        },
        {
          promptText: `Scale every side by k = ${k}: new Hypotenuse?`,
          equationLatex: `${hyp0} \\times ${k}`,
          answerLatex: String(hyp0 * k),
          expectedValue: hyp0 * k,
          strategyNote: `Similarity multiplies each side by ${k}.`,
        },
        {
          promptText: `Now find sin θ for the scaled triangle (Opp = ${opp0 * k}, Hyp = ${hyp0 * k}):`,
          equationLatex: `\\sin\\theta = \\frac{${opp0 * k}}{${hyp0 * k}}`,
          answerLatex: sinTex,
          expectedValue: opp0 / hyp0,
          strategyNote: `Both numerator and denominator scaled by ${k}, so the ratio stays ${sinTex}!`,
        },
        {
          promptText: `Base tangent ratio tan θ (Opp = ${opp0}, Adj = ${adj0}):`,
          equationLatex: `\\tan\\theta = \\frac{${opp0}}{${adj0}}`,
          answerLatex: tanTex,
          expectedValue: opp0 / adj0,
          strategyNote: `TOA: Opposite / Adjacent = ${tanTex}.`,
        },
        {
          promptText: `A similar right triangle (same θ) has Adjacent = ${adj0 * k2}. Find Opposite mentally:`,
          equationLatex: `\\frac{\\text{Opp}}{${adj0 * k2}} = \\frac{${opp0}}{${adj0}}`,
          answerLatex: String(opp0 * k2),
          expectedValue: opp0 * k2,
          strategyNote: `Since ${adj0} × ${k2} = ${adj0 * k2}, Opp = ${opp0} × ${k2} = ${opp0 * k2}.`,
        },
      ],
    };
  }

  // perfect_squares
  const b = pick([10, 20, 30, 40, 50, 60, 70, 80]);
  const d = randInt(2, 6);
  return {
    sig: `psq_${b}_${d}`,
    theme: 'perfect_squares',
    title: 'Squaring Mentally & (x + a)² String',
    teacherGoal: 'Discover the 2ab cross-term in (a + b)² = a² + 2ab + b² through mental squaring.',
    steps: [
      {
        promptText: 'Anchor square:',
        equationLatex: `${b}^2`,
        answerLatex: String(b * b),
        expectedValue: b * b,
        strategyNote: 'Friendly multiple of 10 squared.',
      },
      {
        promptText: 'Square +1:',
        equationLatex: `${b + 1}^2`,
        answerLatex: String((b + 1) * (b + 1)),
        expectedValue: (b + 1) * (b + 1),
        strategyNote: `${b}² + 2(${b})(1) + 1² = ${b * b} + ${2 * b} + 1.`,
      },
      {
        promptText: `Square +${d}:`,
        equationLatex: `${b + d}^2`,
        answerLatex: String((b + d) * (b + d)),
        expectedValue: (b + d) * (b + d),
        strategyNote: `${b}² + 2(${b})(${d}) + ${d}² = ${b * b} + ${2 * b * d} + ${d * d}.`,
      },
      {
        promptText: 'Square −1:',
        equationLatex: `${b - 1}^2`,
        answerLatex: String((b - 1) * (b - 1)),
        expectedValue: (b - 1) * (b - 1),
        strategyNote: `${b}² − 2(${b})(1) + 1² = ${b * b} − ${2 * b} + 1.`,
      },
      {
        promptText: 'Algebraic Generalization (expand):',
        equationLatex: `(x + ${d})^2`,
        answerLatex: `x^2 + ${2 * d}x + ${d * d}`,
        expectedValue: null,
        expectedExpr: `x^2 + ${2 * d}x + ${d * d}`,
        strategyNote: `Notice the middle term is DOUBLE the product: x² + 2(${d})x + ${d}².`,
      },
    ],
  };
}

export function generateProblemString(theme = 'distributive') {
  let result = buildStringForTheme(theme);
  let tries = 0;
  while (lastStringSig[theme] === result.sig && tries < 12) {
    result = buildStringForTheme(theme);
    tries++;
  }
  lastStringSig[theme] = result.sig;
  result.id = `str_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return result;
}

// ---------- Building Thinking Classrooms (BTC) Lesson Observation & Tasks ----------

export const BTC_TASKS = [
  {
    id: 'btc_linear',
    topic: 'Linear Systems (Ch. 1)',
    title: 'Cell Phone Plans & Break-Even Inquiry',
    launch: 'Verbal Launch (no worksheet!): "Two wireless plans cost different amounts per month plus a setup fee. When is Plan A cheaper, and when do they cost the exact same?"',
    slices: [
      { tier: 'Mild', task: 'Plan A: $20 setup + $30/mo. Plan B: $50 setup + $20/mo. At how many months do they cost the exact same?' },
      { tier: 'Medium', task: 'Create a 3rd plan (Plan C) that intersects Plan A at 5 months and has a lower monthly rate than Plan B.' },
      { tier: 'Spicy', task: 'Two linear plans intersect at (4.5, 160). Find possible integer-coefficient equations for both lines.' },
      { tier: 'Extension', task: 'Explain when a system of two linear plans has 0 break-even points, 1 break-even point, or infinite.' },
    ],
    consolidation: 'Consolidate from the bottom: compare a student table-of-values board, a graph board, and an algebraic substitution board to surface the Point of Intersection.',
    cyu: 'Check Your Understanding (CYU): Solve y = 2x + 15 and y = 5x − 6 independently in Mild/Medium notes.',
  },
  {
    id: 'btc_factoring',
    topic: 'Factoring Quadratics (Ch. 5)',
    title: 'Area Model Rectangle Puzzles',
    launch: 'Verbal Launch: "I have algebra tiles with total area x² + 7x + 12. What are the dimensions of the rectangle? How many different rectangles can you build if I only tell you x² + bx + 12?"',
    slices: [
      { tier: 'Mild', task: 'Find all integer values of b so that x² + bx + 12 can be factored into two integer binomials.' },
      { tier: 'Medium', task: 'Find all integer values of b (including negatives!) so that x² + bx − 18 factors cleanly.' },
      { tier: 'Spicy', task: 'Find at least three values of b so that 2x² + bx + 6 factors over integers.' },
      { tier: 'Extension', task: 'Why are some values of b always odd and others always even for ax² + bx + c? Prove it.' },
    ],
    consolidation: 'Consolidate by ordering boards from missing negative pairs → complete factor pairs → noticing symmetry in ±b.',
    cyu: 'CYU: Factor x² − 5x − 24 and 3x² + 11x + 6.',
  },
  {
    id: 'btc_transformations',
    topic: 'Quadratic Transformations (Ch. 4)',
    title: 'Parabolic Angry Birds / Bridge Arch',
    launch: 'Verbal Launch: "A parabola starts as y = x². If we stretch it by 2 and shift it up 3, does order matter? Convince another group on your vertical whiteboard!"',
    slices: [
      { tier: 'Mild', task: 'Compare y = 2(x − 1)² + 3 vs. translating up 3 first and then stretching by 2. Where does vertex (0,0) land?' },
      { tier: 'Medium', task: 'Write an equation of a parabola that passes through (0, 5) with vertex (2, −3).' },
      { tier: 'Spicy', task: 'Write two DIFFERENT vertex-form equations that both have x-intercepts at −1 and 5.' },
      { tier: 'Extension', task: 'Describe a single mapping rule (x, y) → (?, ?) that sends y = 2(x − 1)² + 3 directly onto y = −(x + 4)² + 7.' },
    ],
    consolidation: 'Consolidate from the bottom: use two boards showing (h, k) vs (h, a·k) to highlight why vertical stretch/reflection precedes vertical translation.',
    cyu: 'CYU: State the mapping rule and 5 key points for y = −2(x + 3)² + 5.',
  },
  {
    id: 'btc_trig',
    topic: 'Similar Triangles → Trig Ratios (Ch. 7)',
    title: 'Discovering Constant Opposite/Adjacent Ratios',
    launch: 'Verbal Launch: "Every group draw a right triangle with a 35° angle—make yours huge, tiny, or medium! Measure Opp ÷ Adj. What do you notice?"',
    slices: [
      { tier: 'Mild', task: 'Draw two different right triangles with a 35° angle. Verify they are similar by AA~ and compare Opp / Adj.' },
      { tier: 'Medium', task: 'If a 35° right triangle has Adjacent = 12 cm, predict Opposite without measuring, then verify.' },
      { tier: 'Spicy', task: 'Explain why sin(35°) and cos(55°) give the exact same decimal in any right triangle.' },
      { tier: 'Extension', task: 'Prove why sin²θ + cos²θ = 1 using the Pythagorean Theorem and SOH-CAH-TOA.' },
    ],
    consolidation: 'Consolidate by listing every group’s Opp/Adj ratio (~0.70) across different triangle sizes to define tan(35°).',
    cyu: 'CYU: Explain why AA~ guarantees trig ratios depend only on the angle, not the size of the triangle.',
  },
];

export const BTC_OBSERVATION_ITEMS = [
  '1. Thinking Task: Lesson opens with an authentic/thin-sliced thinking task rather than worked examples.',
  '2. Visibly Random Groups: Students placed into visibly random groups of 3 (cards/randomizer) at the start.',
  '3. VNPS (Vertical Non-Permanent Surfaces): Groups work standing at erasable whiteboards with 1 marker per group.',
  '4. Defronted Room: Teacher moves freely among boards; no fixed front lecturing focal point.',
  '5. Verbal Launch & No Premature Answers: Teacher gives task verbally/projected cleanly and walks away without hints for 3–5 min.',
  '6. Thin-Slicing & Flow: Keep-thinking extensions pushed verbally to fast groups to stay in Flow.',
  '7. Knowledge Mobility: Teacher encourages groups to peek at/borrow ideas from neighbouring boards.',
  '8. Consolidate from the Bottom + CYU: Synthesis builds from student boards lowest-to-highest, followed by Check Your Understanding.',
];

export function generateRandomGroups(countOrNames, groupSize = 3) {
  let names = [];
  if (typeof countOrNames === 'string') {
    const trimmed = countOrNames.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Math.min(45, Math.max(2, Number(trimmed)));
      names = Array.from({ length: n }, (_, i) => `Student ${i + 1}`);
    } else {
      names = trimmed
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } else if (Array.isArray(countOrNames)) {
    names = countOrNames.map((s) => String(s).trim()).filter(Boolean);
  } else {
    const n = Math.min(45, Math.max(2, Number(countOrNames) || 24));
    names = Array.from({ length: n }, (_, i) => `Student ${i + 1}`);
  }

  if (names.length === 0) return [];
  // Fisher-Yates shuffle
  const pool = [...names];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const size = Math.max(2, Number(groupSize) || 3);
  const numGroups = Math.max(1, Math.round(pool.length / size));
  const groups = Array.from({ length: numGroups }, () => []);
  pool.forEach((student, idx) => {
    groups[idx % numGroups].push(student);
  });
  return groups.map((members, idx) => ({
    station: `Board ${idx + 1}`,
    members,
  }));
}

export function checkStringStep(inputRaw, step) {
  const s = String(inputRaw || '')
    .trim()
    .replace(/^(?:[a-zA-Z](?:_[a-zA-Z\\]+)?|\\(?:sin|cos|tan)\s*(?:\\theta|A|B|[a-zA-Z]))\s*=\s*/i, '');
  if (!s) return { correct: false, parseError: true };

  if (step.expectedValue !== null && step.expectedValue !== undefined) {
    try {
      const val = evaluateMathExpression(s);
      return { correct: Math.abs(val - step.expectedValue) < 1e-4 };
    } catch {
      return { correct: false, parseError: true };
    }
  }

  // Algebraic expression step
  try {
    const testXs = [-2.1, -0.5, 0.7, 2.3, 4.1];
    for (const xv of testXs) {
      const a = evalExpressionAtX(s, xv);
      const b = evalExpressionAtX(step.expectedExpr, xv);
      if (Math.abs(a - b) > 1e-4) return { correct: false };
    }
    return { correct: true };
  } catch {
    return { correct: false, parseError: true };
  }
}
