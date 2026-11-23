// MPM2D Linear Systems Engine (Nelson Principles of Mathematics 10, Ch. 1)
// Graphing Drill (y = mx + b, rise/run, initial value), Substitution, Elimination,
// Number of Solutions (unique, perpendicular, parallel, coincident), and Applications.

import { gcd, formatFractionLatex, evaluateMathExpression } from './math-engine.js';

export const LINEAR_SKILL_META = {
  graph_single: { id: 'graph_single', name: 'Graph One Line', short: 'Graph 1 Line' },
  graph_drill: { id: 'graph_drill', name: 'Graph System (2 Lines)', short: 'Graph System' },
  substitution: { id: 'substitution', name: 'Substitution', short: 'Substitution' },
  elimination: { id: 'elimination', name: 'Elimination', short: 'Elimination' },
  num_solutions: { id: 'num_solutions', name: 'Number of Solutions', short: '# Solutions' },
  application: { id: 'application', name: 'Applications', short: 'Applications' },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min, max) {
  let n = 0;
  while (n === 0) n = randInt(min, max);
  return n;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatSlopeInterceptLatex(rise, run, b) {
  const g = gcd(rise, run);
  let r = rise / g;
  let d = run / g;
  if (d < 0) {
    r = -r;
    d = -d;
  }
  let mStr = '';
  if (r !== 0) {
    if (d === 1) {
      mStr = r === 1 ? 'x' : r === -1 ? '-x' : `${r}x`;
    } else {
      mStr = r < 0 ? `-\\frac{${Math.abs(r)}}{${d}}x` : `\\frac{${r}}{${d}}x`;
    }
  }
  let bStr = '';
  if (b !== 0) {
    if (!mStr) bStr = String(b);
    else bStr = b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  }
  return `y = ${mStr}${bStr || (!mStr ? '0' : '')}`;
}

export function formatStandardLinearLatex(A, B, C) {
  let out = '';
  if (A !== 0) {
    out += A === 1 ? 'x' : A === -1 ? '-x' : `${A}x`;
  }
  if (B !== 0) {
    const absB = Math.abs(B);
    const mag = absB === 1 ? 'y' : `${absB}y`;
    if (!out) out += B < 0 ? `-${mag}` : mag;
    else out += B < 0 ? ` - ${mag}` : ` + ${mag}`;
  }
  return `${out || '0'} = ${C}`;
}

function generateGraphSingle(level) {
  let rise, run, b;
  let tries = 0;
  do {
    run = level <= 2 ? 1 : pick([2, 3, 4]);
    rise = randNonZero(-4, 4);
    while (gcd(rise, run) !== 1) rise = randNonZero(-4, 4);
    b = randInt(-6, 6);
    tries++;
  } while ((b + rise < -7 || b + rise > 7) && tries < 100);

  if (b + rise < -7 || b + rise > 7) {
    run = level <= 2 ? 1 : 2;
    rise = level <= 2 ? 2 : 3;
    b = -1;
  }

  const line1 = { m: rise / run, rise, run, b };
  const slopeEq = formatSlopeInterceptLatex(rise, run, b);
  const useStandard = level === 4 && Math.random() < 0.5;
  const eq = useStandard ? formatStandardLinearLatex(-rise, run, run * b) : slopeEq;

  return {
    skill: 'graph_single',
    level,
    inputType: 'graph_single',
    nelsonRef: useStandard
      ? 'Ch. 1.3 / Grade 9 Review — Rearranging & Graphing a Line'
      : 'Ch. 1.3 / Grade 9 Review — Graphing y = mx + b',
    promptText:
      'Plot this linear relation on the grid using initial value (0, b) and slope m = rise / run:',
    equationLatex: eq,
    line1,
    exactExpectedLatex: slopeEq,
    hints: [
      useStandard
        ? `First isolate y to write ${eq} in y = mx + b form.`
        : `Identify initial value b = ${b}, so start by clicking (0, ${b}) on the y-axis.`,
      `From (0, ${b}), move right ${run} and ${rise >= 0 ? `up ${rise}` : `down ${Math.abs(rise)}`} to plot (${run}, ${b + rise}).`,
    ],
    solutionSteps: [
      useStandard ? `\\text{Rearrange to slope-intercept form: } ${slopeEq}` : slopeEq,
      `\\text{Initial value (y-intercept): } b = ${b} \\implies \\text{point } (0, ${b})`,
      `\\text{Slope: } m = \\frac{${rise}}{${run}} \\implies \\text{second point } (${run}, ${b + rise})`,
    ],
  };
}

function generateGraphDrill(level) {
  // Construct 2 lines intersecting at clean integer (px, py) inside [-5, 5],
  // with integer y-intercepts b1, b2 in [-6, 6] and grid-friendly slopes.
  let px, py, rise1, run1, b1, rise2, run2, b2;
  let found = false;

  for (let tries = 0; tries < 250; tries++) {
    px = randNonZero(-5, 5);
    py = randInt(-5, 5);

    run1 = level <= 2 ? 1 : pick([2, 3]);
    if (px % run1 !== 0) continue;
    rise1 = randNonZero(-3, 3);
    while (gcd(rise1, run1) !== 1) rise1 = randNonZero(-3, 3);
    const m1 = rise1 / run1;
    b1 = py - m1 * px;
    if (!Number.isInteger(b1) || b1 < -6 || b1 > 6) continue;
    if (b1 + rise1 < -7 || b1 + rise1 > 7) continue;

    run2 = level <= 2 ? 1 : pick([1, 2, 3]);
    if (px % run2 !== 0) continue;
    rise2 = randNonZero(-3, 3);
    while (gcd(rise2, run2) !== 1) rise2 = randNonZero(-3, 3);
    const m2 = rise2 / run2;
    if (Math.abs(m1 - m2) < 1e-9) continue;
    b2 = py - m2 * px;
    if (!Number.isInteger(b2) || b2 < -6 || b2 > 6) continue;
    if (b2 + rise2 < -7 || b2 + rise2 > 7) continue;

    found = true;
    break;
  }

  if (!found) {
    px = 2;
    py = 3;
    rise1 = 1;
    run1 = level <= 2 ? 1 : 2;
    b1 = level <= 2 ? 1 : 2;
    rise2 = -1;
    run2 = 1;
    b2 = 5;
  }

  const line1 = { m: rise1 / run1, rise: rise1, run: run1, b: b1 };
  const line2 = { m: rise2 / run2, rise: rise2, run: run2, b: b2 };
  const eq1 = formatSlopeInterceptLatex(rise1, run1, b1);
  const eq2 = formatSlopeInterceptLatex(rise2, run2, b2);

  return {
    skill: 'graph_drill',
    level,
    inputType: 'graph_drill',
    nelsonRef: 'Ch. 1.3 — Graphing Linear Systems (Slope & Initial Value)',
    promptText: 'Plot BOTH lines on the grid using initial value (0, b) and rise/run, then enter the Point of Intersection (x, y):',
    equationLatex: `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`,
    line1,
    line2,
    expectedPoi: { x: px, y: py },
    exactExpectedLatex: `(${px}, ${py})`,
    hints: [
      `Line 1 starts at y-intercept (0, ${b1}). From there, move right ${run1} and ${rise1 >= 0 ? `up ${rise1}` : `down ${Math.abs(rise1)}`} to (${run1}, ${b1 + rise1}).`,
      `Line 2 starts at (0, ${b2}) with rise ${rise2} and run ${run2} → (${run2}, ${b2 + rise2}). Look where the two lines cross!`,
    ],
    solutionSteps: [
      `\\text{Line 1: } ${eq1} \\implies b_1 = ${b1}, \\; m_1 = \\frac{${rise1}}{${run1}} \\text{ (points } (0, ${b1}) \\text{ and } (${run1}, ${b1 + rise1})\\text{)}`,
      `\\text{Line 2: } ${eq2} \\implies b_2 = ${b2}, \\; m_2 = \\frac{${rise2}}{${run2}} \\text{ (points } (0, ${b2}) \\text{ and } (${run2}, ${b2 + rise2})\\text{)}`,
      `\\text{Point of Intersection (POI): } (${px}, ${py})`,
    ],
  };
}

function generateSubstitution(level) {
  let x0 = randInt(-6, 6);
  let y0 = randInt(-6, 6);
  let eq1, eq2, m1, b1, A2, B2, C2, steps, hints;

  if (level <= 2) {
    m1 = randNonZero(-3, 3);
    b1 = y0 - m1 * x0;
    A2 = randNonZero(-4, 4);
    B2 = randNonZero(-4, 4);
    while (A2 + B2 * m1 === 0) B2 = randNonZero(-4, 4);
    C2 = A2 * x0 + B2 * y0;

    eq1 = formatSlopeInterceptLatex(m1, 1, b1);
    eq2 = formatStandardLinearLatex(A2, B2, C2);

    const subExpr = `${m1 === 1 ? '' : m1 === -1 ? '-' : m1}x ${b1 >= 0 ? `+ ${b1}` : `- ${Math.abs(b1)}`}`;
    steps = [
      `\\text{Substitute } y = ${subExpr} \\text{ into equation (2):}`,
      `${A2}x ${B2 >= 0 ? `+ ${B2}` : `- ${Math.abs(B2)}`}(${subExpr}) = ${C2}`,
      `(${A2 + B2 * m1})x = ${C2 - B2 * b1} \\implies x = ${x0}`,
      `y = ${m1}(${x0}) ${b1 >= 0 ? `+ ${b1}` : `- ${Math.abs(b1)}`} = ${y0} \\implies \\text{POI: } (${x0}, ${y0})`,
    ];
    hints = [
      `Equation (1) already isolates y. Replace y in equation (2) with (${subExpr}).`,
      `Solve the linear equation for x, then substitute x back to find y.`,
    ];
  } else {
    // Level 3-4: Fractional slope y = (p/q)x + b1 substituted into A2*x + B2*y = C2
    const q = pick([2, 3]);
    let p = randNonZero(-5, 5);
    while (gcd(p, q) !== 1) p = randNonZero(-5, 5);
    m1 = p / q;

    if (level === 3) {
      x0 = randNonZero(-3, 3) * q;
      b1 = randInt(-5, 5);
      y0 = (p * x0) / q + b1;
      B2 = randNonZero(-4, 4);
    } else {
      // Level 4: y0 itself can be a fraction (non-multiple of q)
      x0 = randNonZero(-4, 4);
      while (x0 % q === 0) x0 = randNonZero(-4, 4);
      b1 = randInt(-4, 4);
      y0 = (p * x0) / q + b1;
      B2 = pick([q, -q, 2 * q]); // Keeps C2 integer
    }

    A2 = randNonZero(-4, 4);
    while (A2 * q + B2 * p === 0) A2 = randNonZero(-4, 4);
    C2 = Math.round(A2 * x0 + B2 * y0);

    eq1 = formatSlopeInterceptLatex(p, q, b1);
    eq2 = formatStandardLinearLatex(A2, B2, C2);

    const fracSlope = formatFractionLatex(p, q);
    const subTex = `${fracSlope}x ${b1 >= 0 ? `+ ${b1}` : `- ${Math.abs(b1)}`}`;
    const yTex = Number.isInteger(y0) ? String(y0) : formatFractionLatex(p * x0 + b1 * q, q);

    steps = [
      `\\text{Substitute } y = ${subTex} \\text{ into equation (2):}`,
      `${A2}x ${B2 >= 0 ? `+ ${B2}` : `- ${Math.abs(B2)}`}\\left(${subTex}\\right) = ${C2}`,
      `\\text{Multiply through by } ${q} \\text{ to clear the fraction: } (${A2 * q + B2 * p})x = ${q * (C2 - B2 * b1)} \\implies x = ${x0}`,
      `y = ${fracSlope}(${x0}) ${b1 >= 0 ? `+ ${b1}` : `- ${Math.abs(b1)}`} = ${yTex} \\implies \\text{POI: } (${x0}, ${yTex})`,
    ];
    hints = [
      `Substitute y = (${p}/${q})x ${b1 >= 0 ? `+ ${b1}` : `- ${Math.abs(b1)}`} into equation (2).`,
      `After substituting, multiply every term by ${q} to clear the denominator cleanly.`,
    ];
  }

  const xExact = Number.isInteger(x0) ? String(x0) : String(x0);
  const yExact = Number.isInteger(y0)
    ? String(y0)
    : formatFractionLatex(Math.round(y0 * 6), 6);

  return {
    skill: 'substitution',
    level,
    inputType: 'math',
    nelsonRef:
      level >= 3
        ? 'Ch. 1.4 — Substitution with Fractional Coefficients'
        : 'Ch. 1.4 — Solving Linear Systems by Substitution',
    promptText: 'Solve the linear system by substitution. Enter the Point of Intersection (x, y):',
    equationLatex: `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`,
    expectedPoi: { x: x0, y: y0 },
    exactExpectedLatex: `(${xExact}, ${yExact})`,
    graphData: {
      line1: { m: m1, b: b1 },
      line2: { m: -A2 / B2, b: C2 / B2 },
      poi: { x: x0, y: y0 },
    },
    hints,
    solutionSteps: steps,
  };
}

function formatFracCoeffTerm(num, den, varName, isLeading = false) {
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  const sign = n < 0 ? '-' : '+';
  const absN = Math.abs(n);
  const mag =
    d === 1
      ? absN === 1
        ? varName
        : `${absN}${varName}`
      : `\\frac{${absN}}{${d}}${varName}`;
  if (isLeading) return `${n < 0 ? '-' : ''}${mag}`;
  return ` ${sign} ${mag}`;
}

function generateElimination(level) {
  const x0 = randInt(-6, 6);
  const y0 = randInt(-6, 6);

  let A1, B1, A2, B2, C1, C2, eq1, eq2, steps, hints;

  if (level <= 2) {
    if (level === 1) {
      A1 = randNonZero(-4, 4);
      A2 = randNonZero(-4, 4);
      B1 = randNonZero(-4, 4);
      B2 = pick([B1, -B1]);
      while (A1 * B2 - A2 * B1 === 0) A2 = randNonZero(-4, 4);
    } else {
      A1 = randNonZero(-3, 3);
      B1 = randNonZero(-3, 3);
      const mult = pick([2, -2, 3]);
      if (Math.random() < 0.5) {
        A2 = A1 * mult;
        B2 = randNonZero(-5, 5);
        while (A1 * B2 - A2 * B1 === 0) B2 = randNonZero(-5, 5);
      } else {
        B2 = B1 * mult;
        A2 = randNonZero(-5, 5);
        while (A1 * B2 - A2 * B1 === 0) A2 = randNonZero(-5, 5);
      }
    }

    C1 = A1 * x0 + B1 * y0;
    C2 = A2 * x0 + B2 * y0;
    eq1 = formatStandardLinearLatex(A1, B1, C1);
    eq2 = formatStandardLinearLatex(A2, B2, C2);

    const lcmA = Math.abs((A1 * A2) / gcd(A1, A2));
    const f1 = lcmA / Math.abs(A1);
    const f2 = lcmA / Math.abs(A2);
    const sameSign = (A1 > 0) === (A2 > 0);
    const s1 = A1 < 0 ? -1 : 1;
    const s2 = (A2 < 0 ? -1 : 1) * (sameSign ? -1 : 1);

    steps = [
      f1 === 1 && f2 === 1
        ? `\\text{Eliminate } x \\text{ by ${sameSign ? 'subtracting' : 'adding'} the two equations directly:}`
        : `\\text{Multiply (1) by } ${f1} \\text{ and (2) by } ${f2} \\text{ so the } x \\text{-terms match in magnitude:}`,
      `(${f1 * B1 * s1 + f2 * B2 * s2})y = ${f1 * C1 * s1 + f2 * C2 * s2} \\implies y = ${y0}`,
      `\\text{Substitute } y = ${y0} \\text{ back into (1): } x = ${x0} \\implies \\text{POI: } (${x0}, ${y0})`,
    ];
    hints = [
      'Line up the x, y, and constant terms. Multiply one or both equations so either x or y has equal or opposite coefficients.',
      'Add (if opposite signs) or subtract (if same sign) to eliminate one variable, solve, then back-substitute.',
    ];
  } else {
    // Level 3-4: Fractional linear system (Nelson Ch. 1.6) — clear denominators via LCD
    const d1 = pick([2, 3]);
    const d2 = d1 === 2 ? 3 : pick([2, 4]);
    let n1 = randNonZero(-4, 4);
    while (gcd(n1, d1) !== 1) n1 = randNonZero(-4, 4);
    let n2 = randNonZero(-4, 4);
    while (gcd(n2, d2) !== 1) n2 = randNonZero(-4, 4);

    const lcd = Math.abs((d1 * d2) / gcd(d1, d2));
    A1 = (n1 * lcd) / d1;
    B1 = (n2 * lcd) / d2;
    C1 = A1 * x0 + B1 * y0;

    A2 = randNonZero(-4, 4);
    B2 = randNonZero(-4, 4);
    while (A1 * B2 - A2 * B1 === 0) B2 = randNonZero(-4, 4);
    C2 = A2 * x0 + B2 * y0;

    eq1 = `${formatFracCoeffTerm(n1, d1, 'x', true)}${formatFracCoeffTerm(n2, d2, 'y', false)} = ${formatFractionLatex(C1, lcd)}`;
    eq2 = formatStandardLinearLatex(A2, B2, C2);

    const lcmA = Math.abs((A1 * A2) / gcd(A1, A2));
    const f1 = lcmA / Math.abs(A1);
    const f2 = lcmA / Math.abs(A2);
    const sameSign = (A1 > 0) === (A2 > 0);
    const s1 = A1 < 0 ? -1 : 1;
    const s2 = (A2 < 0 ? -1 : 1) * (sameSign ? -1 : 1);

    steps = [
      `\\text{Clear fractions in (1) by multiplying every term by LCD } = ${lcd}: \\; ${formatStandardLinearLatex(A1, B1, C1)}`,
      `\\text{Eliminate } x \\text{ using (1) } \\times ${f1} \\text{ and (2) } \\times ${f2}:`,
      `(${f1 * B1 * s1 + f2 * B2 * s2})y = ${f1 * C1 * s1 + f2 * C2 * s2} \\implies y = ${y0}`,
      `\\text{Back-substitute } y = ${y0} \\text{ into (2): } x = ${x0} \\implies \\text{POI: } (${x0}, ${y0})`,
    ];
    hints = [
      `First clear the fractions in equation (1) by multiplying every term by the lowest common denominator (${lcd}).`,
      `Now use elimination on ${formatStandardLinearLatex(A1, B1, C1)} and ${eq2}.`,
    ];
  }

  return {
    skill: 'elimination',
    level,
    inputType: 'math',
    nelsonRef:
      level >= 3
        ? 'Ch. 1.6 — Elimination with Fractions (Clear Denominators)'
        : 'Ch. 1.6 — Solving Linear Systems by Elimination',
    promptText: 'Solve the linear system by elimination. Enter the Point of Intersection (x, y):',
    equationLatex: `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`,
    expectedPoi: { x: x0, y: y0 },
    exactExpectedLatex: `(${x0}, ${y0})`,
    graphData: {
      line1: { m: -A1 / B1, b: C1 / B1 },
      line2: { m: -A2 / B2, b: C2 / B2 },
      poi: { x: x0, y: y0 },
    },
    hints,
    solutionSteps: steps,
  };
}

function generateNumSolutions(level) {
  const category = pick(['unique', 'perpendicular', 'parallel', 'coincident']);
  let rise1 = randNonZero(-3, 3);
  let run1 = level <= 2 ? 1 : pick([1, 2, 3]);
  while (gcd(rise1, run1) !== 1) rise1 = randNonZero(-3, 3);
  const m1 = rise1 / run1;
  const b1 = randInt(-5, 5);

  let eq1 = formatSlopeInterceptLatex(rise1, run1, b1);
  let eq2 = '';
  let m2, b2, poi = null;
  let steps = [];

  if (category === 'unique') {
    let rise2 = randNonZero(-3, 3);
    let run2 = 1;
    while (rise2 / run2 === m1 || Math.abs((rise2 / run2) * m1 + 1) < 1e-9) {
      rise2 = randNonZero(-4, 4);
    }
    m2 = rise2 / run2;
    b2 = randInt(-5, 5);
    eq2 = level <= 2
      ? formatSlopeInterceptLatex(rise2, run2, b2)
      : formatStandardLinearLatex(-rise2, run2, run2 * b2);
    const ix = (b2 - b1) / (m1 - m2);
    poi = { x: ix, y: m1 * ix + b1 };
    steps = [
      `\\text{Compare slopes: } m_1 = ${formatFractionLatex(rise1, run1)}, \\; m_2 = ${formatFractionLatex(rise2, run2)}`,
      `m_1 \\neq m_2 \\text{ and } m_1 \\cdot m_2 \\neq -1 \\implies \\text{1 Unique Solution (Intersecting, not } \\perp\\text{)}`,
    ];
  } else if (category === 'perpendicular') {
    // m2 = -run1 / rise1
    const rise2 = rise1 > 0 ? -run1 : run1;
    const run2 = Math.abs(rise1);
    m2 = rise2 / run2;
    b2 = randInt(-5, 5);
    eq2 = level <= 2
      ? formatSlopeInterceptLatex(rise2, run2, b2)
      : formatStandardLinearLatex(-rise2, run2, run2 * b2);
    const ix = (b2 - b1) / (m1 - m2);
    poi = { x: ix, y: m1 * ix + b1 };
    steps = [
      `\\text{Compare slopes: } m_1 = ${formatFractionLatex(rise1, run1)}, \\; m_2 = ${formatFractionLatex(rise2, run2)}`,
      `m_1 \\cdot m_2 = -1 \\implies \\text{Negative reciprocals! 1 Unique Solution (Perpendicular } \\perp\\text{)}`,
    ];
  } else if (category === 'parallel') {
    m2 = m1;
    b2 = b1 + pick([-4, -3, -2, 2, 3, 4]);
    eq2 = level === 1
      ? formatSlopeInterceptLatex(rise1, run1, b2)
      : formatStandardLinearLatex(-rise1, run1, run1 * b2);
    steps = [
      `\\text{Rewrite both in } y = mx + b: \\; m_1 = ${formatFractionLatex(rise1, run1)}, \\; m_2 = ${formatFractionLatex(rise1, run1)}`,
      `b_1 = ${b1} \\neq b_2 = ${b2} \\implies \\text{Parallel lines (}\\parallel\\text{), 0 Solutions}`,
    ];
  } else {
    // coincident
    m2 = m1;
    b2 = b1;
    const scale = pick([2, 3, -2]);
    eq2 = formatStandardLinearLatex(-rise1 * scale, run1 * scale, run1 * b1 * scale);
    steps = [
      `\\text{Divide equation (2) or solve for } y: \\text{ it simplifies to } ${eq1}`,
      `m_1 = m_2 \\text{ and } b_1 = b_2 \\implies \\text{Same line (Coincident), Infinite Solutions}`,
    ];
  }

  return {
    skill: 'num_solutions',
    level,
    inputType: 'linear_choice',
    nelsonRef: 'Ch. 1.7 — Investigating the Number of Solutions',
    promptText: 'Classify the system and determine its number of solutions:',
    equationLatex: `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`,
    expectedCategory: category,
    exactExpectedLatex: category,
    graphData: {
      line1: { m: m1, b: b1 },
      line2: { m: m2, b: b2 },
      poi,
    },
    hints: [
      'Write both equations in slope-intercept form y = mx + b so you can compare their slopes (m) and y-intercepts (b).',
      'Equal slopes + different b → parallel (0); equal slopes + same b → infinite; negative-reciprocal slopes (m₁·m₂ = -1) → perpendicular (1).',
    ],
    solutionSteps: steps,
  };
}

function generateApplication(level) {
  const variant = pick(['tickets', 'membership', 'coins', 'rectangle']);

  if (variant === 'tickets') {
    const x0 = randInt(12, 45); // adult
    const y0 = randInt(15, 55); // student
    const pA = pick([10, 12, 15]);
    const pS = pick([6, 7, 8]);
    const totalTickets = x0 + y0;
    const totalRev = pA * x0 + pS * y0;

    return {
      skill: 'application',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 1.5 / 1.6 — Ticket Sales Application',
      promptText: `A school play sold ${totalTickets} tickets in total, raising $${totalRev}. Adult tickets cost $${pA} and student tickets cost $${pS}. Let x = adult tickets and y = student tickets. Enter (x, y):`,
      equationLatex: `\\text{Total} = ${totalTickets}, \\quad \\text{Revenue} = \\$${totalRev}`,
      expectedPoi: { x: x0, y: y0 },
      exactExpectedLatex: `(${x0}, ${y0})`,
      hints: [
        `Set up two equations: x + y = ${totalTickets} and ${pA}x + ${pS}y = ${totalRev}.`,
        `Isolate y = ${totalTickets} - x and substitute into the revenue equation (or eliminate y by multiplying equation 1 by ${pS}).`,
      ],
      solutionSteps: [
        `\\text{Let } x = \\text{adult tickets}, \\; y = \\text{student tickets.}`,
        `x + y = ${totalTickets} \\quad \\text{and} \\quad ${pA}x + ${pS}y = ${totalRev}`,
        `(${pA - pS})x = ${totalRev - pS * totalTickets} \\implies x = ${x0}, \\; y = ${y0}`,
        `\\text{Answer: } (${x0}, ${y0})`,
      ],
    };
  }

  if (variant === 'membership') {
    const m1 = pick([20, 25, 30]);
    const m2 = pick([35, 40, 45]);
    const months = randInt(3, 10);
    const b2 = randInt(20, 60);
    const b1 = b2 + (m2 - m1) * months;
    const totalCost = m1 * months + b1;

    return {
      skill: 'application',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 1.3 / 1.4 — Break-Even Membership Comparison',
      promptText: `Gym A charges a $${b1} registration fee plus $${m1}/month. Gym B charges a $${b2} fee plus $${m2}/month. Let x = months and y = total cost ($). Find the break-even point (x, y):`,
      equationLatex: `\\text{Plan A: } ${m1}x + ${b1}, \\quad \\text{Plan B: } ${m2}x + ${b2}`,
      expectedPoi: { x: months, y: totalCost },
      exactExpectedLatex: `(${months}, ${totalCost})`,
      hints: [
        `Write C = ${m1}x + ${b1} and C = ${m2}x + ${b2}, then set them equal.`,
        `Solve ${m1}x + ${b1} = ${m2}x + ${b2} for x (months), then compute total cost y.`,
      ],
      solutionSteps: [
        `y = ${m1}x + ${b1} \\quad \\text{and} \\quad y = ${m2}x + ${b2}`,
        `${m1}x + ${b1} = ${m2}x + ${b2} \\implies ${b1 - b2} = ${m2 - m1}x \\implies x = ${months}`,
        `y = ${m1}(${months}) + ${b1} = ${totalCost} \\implies (${months}, ${totalCost})`,
      ],
    };
  }

  if (variant === 'coins') {
    const x0 = randInt(6, 22); // $5 bills
    const y0 = randInt(5, 20); // $10 bills
    const totalBills = x0 + y0;
    const totalVal = 5 * x0 + 10 * y0;

    return {
      skill: 'application',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 1.6 — Money / Quantity-Value Problem',
      promptText: `A cash box holds ${totalBills} bills made up of $5 and $10 bills worth $${totalVal} in total. Let x = number of $5 bills and y = number of $10 bills. Enter (x, y):`,
      equationLatex: `${totalBills}\\text{ bills}, \\quad \\text{Total Value} = \\$${totalVal}`,
      expectedPoi: { x: x0, y: y0 },
      exactExpectedLatex: `(${x0}, ${y0})`,
      hints: [
        `Quantity equation: x + y = ${totalBills}. Value equation: 5x + 10y = ${totalVal}.`,
        `Multiply the quantity equation by 5 and subtract from the value equation to solve for y.`,
      ],
      solutionSteps: [
        `x + y = ${totalBills} \\quad \\text{and} \\quad 5x + 10y = ${totalVal}`,
        `5y = ${totalVal - 5 * totalBills} \\implies y = ${y0}, \\; x = ${x0}`,
        `\\text{Answer: } (${x0}, ${y0})`,
      ],
    };
  }

  // Rectangle perimeter & difference
  const w = randInt(4, 15);
  const diff = randInt(2, 10);
  const l = w + diff;
  const P = 2 * (l + w);

  return {
    skill: 'application',
    level,
    inputType: 'math',
    nelsonRef: 'Ch. 1.4 — Geometry Perimeter System',
    promptText: `A rectangle has a perimeter of ${P} cm. Its length (x) is ${diff} cm longer than its width (y). Enter the dimensions (x, y):`,
    equationLatex: `2x + 2y = ${P}, \\quad x - y = ${diff}`,
    expectedPoi: { x: l, y: w },
    exactExpectedLatex: `(${l}, ${w})`,
    hints: [
      `Divide the perimeter equation by 2: x + y = ${P / 2}.`,
      `Add x + y = ${P / 2} and x - y = ${diff} to eliminate y!`,
    ],
    solutionSteps: [
      `x + y = ${P / 2} \\quad \\text{and} \\quad x - y = ${diff}`,
      `2x = ${P / 2 + diff} \\implies x = ${l}, \\; y = ${w}`,
      `\\text{Answer: } (${l}, ${w})`,
    ],
  };
}

let linCounter = 0;

export function generateLinearProblem(skill = 'graph_drill', level = 1) {
  const lvl = Math.min(4, Math.max(1, Number(level) || 1));
  let prob;
  if (skill === 'graph_single') prob = generateGraphSingle(lvl);
  else if (skill === 'graph_drill') prob = generateGraphDrill(lvl);
  else if (skill === 'substitution') prob = generateSubstitution(lvl);
  else if (skill === 'elimination') prob = generateElimination(lvl);
  else if (skill === 'num_solutions') prob = generateNumSolutions(lvl);
  else if (skill === 'application') prob = generateApplication(lvl);
  else throw new Error(`Unknown linear skill: ${skill}`);

  linCounter += 1;
  prob.id = `lin_${Date.now()}_${linCounter}`;
  return prob;
}

export function checkPlottedLine(points, line) {
  if (!Array.isArray(points) || points.length < 2) {
    return { valid: false, reason: 'Plot 2 distinct points for this line.' };
  }
  const [p1, p2] = points;
  if (p1.x === p2.x && p1.y === p2.y) {
    return { valid: false, reason: 'Pick two different points on the line.' };
  }
  const onLine = (pt) => Math.abs(pt.y - (line.m * pt.x + line.b)) < 1e-6;
  if (!onLine(p1) || !onLine(p2)) {
    return {
      valid: false,
      reason: `Check your initial value (0, ${line.b}) and slope rise/run (${line.rise}/${line.run}).`,
    };
  }
  const usedYInt = (p1.x === 0 && p1.y === line.b) || (p2.x === 0 && p2.y === line.b);
  return { valid: true, usedYInt };
}

export function parseOrderedPair(raw) {
  let s = String(raw || '').trim();
  if (!s) return { error: 'Enter the Point of Intersection as (x, y).' };

  s = s
    .replace(/\u2212/g, '-')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .trim();

  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 2) {
    return { error: 'Enter two numbers separated by a comma, e.g. (2, -3).' };
  }

  const cleanPart = (p) => p.replace(/^[xy]\s*=\s*/i, '').trim();
  try {
    const x = evaluateMathExpression(cleanPart(parts[0]));
    const y = evaluateMathExpression(cleanPart(parts[1]));
    return { x, y, error: null };
  } catch {
    return { error: 'Could not read the coordinates. Use format (x, y) like (2, -3).' };
  }
}

export function checkLinearAnswer(skill, input, problem) {
  if (skill === 'num_solutions') {
    const validCats = ['unique', 'perpendicular', 'parallel', 'coincident'];
    if (!validCats.includes(input)) {
      return { correct: false, parseError: true, message: 'Select one of the 4 classifications.' };
    }
    const ok = input === problem.expectedCategory;
    return {
      correct: ok,
      message: ok
        ? 'Correct classification!'
        : 'Not quite — compare the slopes m₁ and m₂ (and y-intercepts b₁, b₂) in y = mx + b form.',
    };
  }

  if (skill === 'graph_single') {
    const { line1Points } = input || {};
    const c1 = checkPlottedLine(line1Points, problem.line1);
    if (!c1.valid) {
      return { correct: false, parseError: true, message: c1.reason };
    }
    return {
      correct: true,
      message: c1.usedYInt
        ? 'Great job! Line plotted accurately using initial value (0, b) and slope.'
        : 'Correct line! (Tip: starting at (0, b) makes graphing y = mx + b even faster.)',
    };
  }

  if (skill === 'graph_drill') {
    const { line1Points, line2Points, poiText } = input || {};
    const c1 = checkPlottedLine(line1Points, problem.line1);
    if (!c1.valid) {
      return { correct: false, parseError: true, message: `Line 1: ${c1.reason}` };
    }
    const c2 = checkPlottedLine(line2Points, problem.line2);
    if (!c2.valid) {
      return { correct: false, parseError: true, message: `Line 2: ${c2.reason}` };
    }

    const parsed = parseOrderedPair(poiText);
    if (parsed.error) {
      return { correct: false, parseError: true, message: parsed.error };
    }
    const poiOk =
      Math.abs(parsed.x - problem.expectedPoi.x) < 1e-5 &&
      Math.abs(parsed.y - problem.expectedPoi.y) < 1e-5;
    return {
      correct: poiOk,
      message: poiOk
        ? 'Both lines plotted accurately and exact Point of Intersection found!'
        : 'Both lines are plotted accurately, but double-check the Point of Intersection coordinates.',
    };
  }

  // substitution, elimination, application
  const parsed = parseOrderedPair(input);
  if (parsed.error) {
    return { correct: false, parseError: true, message: parsed.error };
  }
  const ok =
    Math.abs(parsed.x - problem.expectedPoi.x) < 1e-5 &&
    Math.abs(parsed.y - problem.expectedPoi.y) < 1e-5;

  return {
    correct: ok,
    message: ok
      ? `Exact match! Solution is (${problem.expectedPoi.x}, ${problem.expectedPoi.y}).`
      : 'Not quite right. Check your algebra and verify by substituting (x, y) into both equations.',
  };
}
