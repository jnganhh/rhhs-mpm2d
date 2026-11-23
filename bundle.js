(function () {
"use strict";
const __factories = {
"./math-engine.js": function(__require) {
// MPM2D Quadratic Equations Engine (Nelson Principles of Mathematics 10)
// Procedural problem generation, LaTeX formatting, and recursive-descent equivalence checking.

const FORMS = ['factored', 'vertex', 'standard'];

const LEVEL_META = {
  1: { name: 'Basic', badge: 'Level 1', desc: 'Foundational integer roots & simple forms' },
  2: { name: 'Core', badge: 'Level 2', desc: 'Rational roots, decomposition & no-real-root cases' },
  3: { name: 'Challenging', badge: 'Level 3', desc: 'Fractions, non-zero RHS, exact radicals & Quadratic Formula' },
  4: { name: 'Enrichment', badge: 'Level 4', desc: 'Fractional & contest substitutions, parameters & rationals' },
};

const FORM_META = {
  factored: { name: 'Factored Form', short: 'Factored', template: 'a(x − r)(x − s) = 0' },
  vertex: { name: 'Vertex Form', short: 'Vertex', template: 'a(x − h)² + k = 0' },
  standard: { name: 'Standard Form', short: 'Standard', template: 'ax² + bx + c = 0' },
};

// ---------- Math Utilities ----------

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

function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function reduceFraction(num, den) {
  if (den === 0) throw new Error('Division by zero');
  if (num === 0) return { num: 0, den: 1 };
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  const g = gcd(num, den);
  return { num: sign * Math.abs(num) / g, den: Math.abs(den) / g };
}

function simplifyRadical(n) {
  if (n <= 0) return { coeff: 0, radicand: 0 };
  let coeff = 1;
  let rem = n;
  for (let i = 2; i * i <= rem; i++) {
    while (rem % (i * i) === 0) {
      coeff *= i;
      rem /= i * i;
    }
  }
  return { coeff, radicand: rem };
}

// ---------- LaTeX Formatting Helpers ----------

function formatCoeffVar(c, suffix, isLeading = false) {
  if (c === 0) return '';
  const abs = Math.abs(c);
  const mag = abs === 1 && suffix ? '' : String(abs);
  if (isLeading) {
    return `${c < 0 ? '-' : ''}${mag}${suffix}`;
  }
  return `${c < 0 ? ' - ' : ' + '}${mag}${suffix}`;
}

function formatConst(c, isLeading = false) {
  if (c === 0) return '';
  if (isLeading) return String(c);
  return `${c < 0 ? ' - ' : ' + '}${Math.abs(c)}`;
}

function formatQuadraticLatex(a, b, c, varName = 'x') {
  let out = '';
  if (a !== 0) {
    out += formatCoeffVar(a, `${varName}^2`, true);
  }
  if (b !== 0) {
    out += formatCoeffVar(b, varName, out === '');
  }
  if (c !== 0) {
    out += formatConst(c, out === '');
  }
  return out || '0';
}

function formatLinearFactor(p, q, varName = 'x') {
  // Represents (px - q) where root is q/p
  // Wait: let's pass explicit coefficients (px + c) to avoid sign confusion!
  return formatLinearSum(p, -q, varName);
}

function formatLinearSum(p, c, varName = 'x') {
  // Formats (px + c)
  if (p === 1 && c === 0) return varName;
  if (p === -1 && c === 0) return `-${varName}`;
  const xPart = formatCoeffVar(p, varName, true);
  const cPart = formatConst(c, xPart === '');
  return `(${xPart}${cPart})`;
}

function formatFractionLatex(num, den) {
  const { num: n, den: d } = reduceFraction(num, den);
  if (d === 1) return String(n);
  if (n < 0) return `-\\frac{${Math.abs(n)}}{${d}}`;
  return `\\frac{${n}}{${d}}`;
}

function formatRationalCoeffVar(num, den, suffix, isLeading = false) {
  const { num: n, den: d } = reduceFraction(num, den);
  if (n === 0) return '';
  let mag = '';
  if (d === 1) {
    const abs = Math.abs(n);
    mag = abs === 1 && suffix ? '' : String(abs);
  } else {
    mag = `\\frac{${Math.abs(n)}}{${d}}`;
  }
  if (isLeading) {
    return `${n < 0 ? '-' : ''}${mag}${suffix}`;
  }
  return `${n < 0 ? ' - ' : ' + '}${mag}${suffix}`;
}

function formatRationalQuadraticLatex(aNum, aDen, bNum, bDen, cNum, cDen, varName = 'x') {
  let out = '';
  if (aNum !== 0) {
    out += formatRationalCoeffVar(aNum, aDen, `${varName}^2`, true);
  }
  if (bNum !== 0) {
    out += formatRationalCoeffVar(bNum, bDen, varName, out === '');
  }
  if (cNum !== 0) {
    out += formatRationalCoeffVar(cNum, cDen, '', out === '');
  }
  return out || '0';
}

function formatPmRadicalRoot(baseNum, radCoeff, radicand, den) {
  // Formats (baseNum ± radCoeff*sqrt(radicand)) / den in lowest terms
  if (den < 0) {
    baseNum = -baseNum;
    den = -den;
  }
  const g = gcd(gcd(Math.abs(baseNum), Math.abs(radCoeff)), den);
  baseNum /= g;
  radCoeff /= g;
  den /= g;

  const radStr =
    radicand === 1
      ? String(radCoeff)
      : radCoeff === 1
      ? `\\sqrt{${radicand}}`
      : `${radCoeff}\\sqrt{${radicand}}`;

  if (baseNum === 0) {
    if (den === 1) return `\\pm ${radStr}`;
    return `\\pm \\frac{${radStr}}{${den}}`;
  }
  const numerator = `${baseNum} \\pm ${radStr}`;
  if (den === 1) return numerator;
  return `\\frac{${numerator}}{${den}}`;
}

function uniqueSorted(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const res = [];
  for (const v of sorted) {
    if (res.length === 0 || Math.abs(v - res[res.length - 1]) > 1e-9) {
      res.push(v);
    }
  }
  return res;
}

function formatRootsListLatex(roots, varName = 'x') {
  if (!roots || roots.length === 0) return '\\text{No real roots}';
  return `${varName} = ${roots.map((r) => (Number.isInteger(r) ? String(r) : r)).join(', ')}`;
}

// ---------- Problem Generators ----------

function generateFactored(level) {
  if (level === 1) {
    // Level 1: (x - r)(x - s) = 0 or x(x - r) = 0, optional simple leading coeff
    const r = randInt(-7, 7);
    let s = randInt(-7, 7);
    const hasZeroRoot = Math.random() < 0.2;
    const r1 = hasZeroRoot ? 0 : r;
    const r2 = s === r1 && Math.random() < 0.7 ? (r1 >= 0 ? r1 - 2 : r1 + 2) : s;
    const a = pick([1, 1, 1, 2, -1]);

    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const f1 = r1 === 0 ? 'x' : formatLinearSum(1, -r1);
    const f2 = r2 === 0 ? 'x' : formatLinearSum(1, -r2);
    const eq = `${aStr}${f1}${f2} = 0`;
    const roots = uniqueSorted([r1, r2]);

    const steps = [
      `\\text{Set each factor containing } x \\text{ equal to } 0:`,
      roots.length === 1
        ? `${f1} = 0 \\implies x = ${roots[0]}`
        : `${f1} = 0 \\quad \\text{or} \\quad ${f2} = 0`,
      `x = ${roots.join(', \\; ')}`,
    ];

    return {
      form: 'factored',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.1 — Solving Quadratic Equations by Factoring',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a, b: -a * (r1 + r2), c: a * r1 * r2 },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.join(', '),
      hints: [
        'Use the Zero Product Property: if A · B = 0, then A = 0 or B = 0.',
        `Set ${f1} = 0 and ${f2} = 0, then solve each linear equation.`,
      ],
      solutionSteps: steps,
    };
  }

  if (level === 2) {
    // Level 2: a(px + q)(rx + s) = 0 with rational roots
    const p = pick([2, 3, 4]);
    let q = randNonZero(-7, 7);
    while (gcd(p, q) !== 1) q = randNonZero(-7, 7);

    const r = pick([1, 2, 3]);
    let s = randInt(-7, 7);
    if (r > 1) {
      while (s === 0 || gcd(r, s) !== 1) s = randNonZero(-7, 7);
    }

    const a = pick([1, 2, -2, 3, -1]);
    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const f1 = formatLinearSum(p, q);
    const f2 = s === 0 && r === 1 ? 'x' : formatLinearSum(r, s);
    const eq = `${aStr}${f1}${f2} = 0`;

    const root1 = -q / p;
    const root2 = -s / r;
    const roots = uniqueSorted([root1, root2]);
    const r1Tex = formatFractionLatex(-q, p);
    const r2Tex = formatFractionLatex(-s, r);

    const steps = [
      `\\text{By the Zero Product Property, divide out } ${a !== 1 ? a : '\\text{the constant}'} \\text{ and set each factor to } 0:`,
      `${f1} = 0 \\implies ${p}x = ${-q} \\implies x = ${r1Tex}`,
      `${f2} = 0 \\implies ${r === 1 ? '' : r}x = ${-s} \\implies x = ${r2Tex}`,
      `x = ${roots.length === 1 ? r1Tex : `${r1Tex}, \\; ${r2Tex}`}`,
    ];

    return {
      form: 'factored',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.1 — Solving Quadratic Equations (Rational Roots)',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a: a * p * r, b: a * (p * s + q * r), c: a * q * s },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.length === 1 ? r1Tex : `${r1Tex}, ${r2Tex}`,
      hints: [
        'A leading constant factor like 2 or -3 cannot equal 0, so focus on the binomial factors.',
        `Set ${f1} = 0 and ${f2} = 0. Express non-integer answers as fractions.`,
      ],
      solutionSteps: steps,
    };
  }

  if (level === 3) {
    if (Math.random() < 0.5) {
      let d = pick([2, 3]);
      let s1 = randInt(-6, 6);
      let s2 = randInt(-6, 6);
      while (s2 === s1) s2 = randInt(-6, 6);

      const sum = s1 + s2;
      let r1 = s1 + pick([-3, -2, -1, 1, 2, 3]);
      let r2 = sum - r1;
      let c = r1 * r2 - s1 * s2;
      if (c === 0 || c % d === 0) {
        const altD = d === 2 ? 3 : 2;
        if (c !== 0 && c % altD !== 0) {
          d = altD;
        } else {
          r1 += 1;
          r2 -= 1;
          c = r1 * r2 - s1 * s2;
          if (c === 0 || c % d === 0) {
            d = 3;
            s1 = -2;
            s2 = 5;
            r1 = 0;
            r2 = 3;
            c = 10;
          }
        }
      }

      const rhsTex = formatFractionLatex(c, d);
      const f1 = r1 === 0 ? 'x' : formatLinearSum(1, -r1);
      const f2 = r2 === 0 ? 'x' : formatLinearSum(1, -r2);
      const eq = `\\frac{1}{${d}}${f1}${f2} = ${rhsTex}`;

      const expandedLHS = formatQuadraticLatex(1, -(s1 + s2), r1 * r2);
      const stdLHS = formatQuadraticLatex(1, -(s1 + s2), s1 * s2);
      const sf1 = s1 === 0 ? 'x' : formatLinearSum(1, -s1);
      const sf2 = s2 === 0 ? 'x' : formatLinearSum(1, -s2);
      const roots = uniqueSorted([s1, s2]);

      const steps = [
        `\\text{Multiply both sides by } ${d} \\text{ to clear fractions: } ${f1}${f2} = ${c}`,
        `\\text{Expand the left side: } ${expandedLHS} = ${c}`,
        `\\text{Rewrite in standard form } (= 0): \\; ${stdLHS} = 0`,
        `\\text{Factor: } ${sf1}${sf2} = 0`,
        `x = ${roots.join(', \\; ')}`,
      ];

      return {
        form: 'factored',
        level,
        variable: 'x',
        nelsonRef: 'Ch. 6.1 — Clearing Fractions & Rearranging',
        promptText: 'Solve for x:',
        equationLatex: eq,
        graphData: { a: 1 / d, b: -(s1 + s2) / d, c: (s1 * s2) / d },
        expectedRoots: roots,
        noRealRoots: false,
        exactExpectedLatex: roots.join(', '),
        hints: [
          `Clear the fraction first by multiplying every term on both sides by ${d}.`,
          'Expand brackets first, move the constant to the left to get = 0, then re-factor.',
        ],
        solutionSteps: steps,
      };
    }

    // Level 3: Non-zero RHS: (x - r1)(x - r2) = c that expands & refactors into (x - s1)(x - s2) = 0
    const s1 = randInt(-6, 6);
    let s2 = randInt(-6, 6);
    while (s2 === s1) s2 = randInt(-6, 6);

    const sum = s1 + s2;
    let r1 = s1 + pick([-3, -2, -1, 1, 2, 3]);
    let r2 = sum - r1;
    // Ensure c = r1*r2 - s1*s2 != 0
    let c = r1 * r2 - s1 * s2;
    if (c === 0) {
      r1 += 1;
      r2 -= 1;
      c = r1 * r2 - s1 * s2;
    }

    const f1 = r1 === 0 ? 'x' : formatLinearSum(1, -r1);
    const f2 = r2 === 0 ? 'x' : formatLinearSum(1, -r2);
    const eq = `${f1}${f2} = ${c}`;

    const expandedLHS = formatQuadraticLatex(1, -sum, r1 * r2);
    const stdLHS = formatQuadraticLatex(1, -sum, s1 * s2);
    const sf1 = s1 === 0 ? 'x' : formatLinearSum(1, -s1);
    const sf2 = s2 === 0 ? 'x' : formatLinearSum(1, -s2);
    const roots = uniqueSorted([s1, s2]);

    const steps = [
      `\\text{Notice the right-hand side is } ${c} \\neq 0, \\text{ so we cannot set the factors to } ${c}.`,
      `\\text{Expand the left side: } ${expandedLHS} = ${c}`,
      `\\text{Rewrite in standard form } (= 0): \\; ${stdLHS} = 0`,
      `\\text{Factor: } ${sf1}${sf2} = 0`,
      `x = ${roots.join(', \\; ')}`,
    ];

    return {
      form: 'factored',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.1 — Rearranging & Factoring',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a: 1, b: -sum, c: s1 * s2 },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.join(', '),
      hints: [
        'The Zero Product Property only works when one side is 0!',
        'Expand the brackets first, move the constant to the left to get = 0, then re-factor.',
      ],
      solutionSteps: steps,
    };
  }

  // Level 4: Enrichment (Contest Level)
  if (Math.random() < 0.5) {
    // Variant A: Symmetric squared equation (px + q)^2 = (rx + s)^2
    const p = pick([2, 3, 4]);
    const r = pick([1, 2, 3].filter((v) => v !== p));
    const q = randNonZero(-6, 6);
    const s = randNonZero(-6, 6);

    const lhs = formatLinearSum(p, q);
    const rhs = formatLinearSum(r, s);
    const eq = `${lhs}^2 = ${rhs}^2`;

    // px + q = rx + s  => (p-r)x = s-q
    // px + q = -(rx + s) => (p+r)x = -s-q
    const root1 = (s - q) / (p - r);
    const root2 = (-s - q) / (p + r);
    const roots = uniqueSorted([root1, root2]);
    const r1Tex = formatFractionLatex(s - q, p - r);
    const r2Tex = formatFractionLatex(-s - q, p + r);

    const steps = [
      `\\text{Rearrange as a difference of squares: } ${lhs}^2 - ${rhs}^2 = 0`,
      `\\text{Or take the square root of both sides: } ${p}x ${formatConst(q)} = \\pm(${r === 1 ? '' : r}x ${formatConst(s)})`,
      `\\text{Case 1 (+): } ${p - r}x = ${s - q} \\implies x = ${r1Tex}`,
      `\\text{Case 2 (-): } ${p + r}x = ${-s - q} \\implies x = ${r2Tex}`,
      `x = ${roots.length === 1 ? r1Tex : `${r1Tex}, \\; ${r2Tex}`}`,
    ];

    return {
      form: 'factored',
      level,
      variable: 'x',
      nelsonRef: 'Contest Enrichment — Difference of Squares Structure',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a: p * p - r * r, b: 2 * (p * q - r * s), c: q * q - s * s },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.length === 1 ? r1Tex : `${r1Tex}, ${r2Tex}`,
      hints: [
        'Avoid expanding if possible! Move both squared terms to one side and factor a² − b² = (a − b)(a + b).',
        `Equivalently, ${p}x ${formatConst(q)} = +(${r === 1 ? '' : r}x ${formatConst(s)}) or −(${r === 1 ? '' : r}x ${formatConst(s)}).`,
      ],
      solutionSteps: steps,
    };
  } else {
    // Variant B: Biquadratic disguised factored equation (x^2 - r1)(x^2 - r2) = c => (x^2 - s1)(x^2 - s2) = 0
    const s1 = pick([1, 4, 9, 2, 3, 5]);
    const s2 = pick([-4, -1, 1, 4, 9]);
    const sum = s1 + s2;
    const r1 = s1 + pick([-2, -1, 1, 2]);
    const r2 = sum - r1;
    let c = r1 * r2 - s1 * s2;
    if (c === 0) {
      return generateFactored(4); // Retry cleanly for non-zero c
    }

    const f1 = r1 === 0 ? 'x^2' : `(x^2 ${formatConst(-r1)})`;
    const f2 = r2 === 0 ? 'x^2' : `(x^2 ${formatConst(-r2)})`;
    const eq = `${f1}${f2} = ${c}`;

    const rootsRaw = [];
    if (s1 >= 0) {
      rootsRaw.push(-Math.sqrt(s1), Math.sqrt(s1));
    }
    if (s2 >= 0) {
      rootsRaw.push(-Math.sqrt(s2), Math.sqrt(s2));
    }
    const roots = uniqueSorted(rootsRaw);

    const exactParts = [];
    for (const sVal of [s1, s2]) {
      if (sVal === 0) exactParts.push('0');
      else if (sVal > 0) {
        const sr = Math.sqrt(sVal);
        if (Number.isInteger(sr)) exactParts.push(`\\pm ${sr}`);
        else exactParts.push(`\\pm \\sqrt{${sVal}}`);
      }
    }
    const exactTex = [...new Set(exactParts)].join(', ');

    const steps = [
      `\\text{Substitute } u = x^2: \\; (u ${formatConst(-r1)})(u ${formatConst(-r2)}) = ${c}`,
      `\\text{Expand and collect terms: } ${formatQuadraticLatex(1, -sum, s1 * s2, 'u')} = 0`,
      `\\text{Factor in } u: \\; (u ${formatConst(-s1)})(u ${formatConst(-s2)}) = 0 \\implies u = ${s1}, \\; ${s2}`,
      `\\text{Back-substitute } x^2 = u: \\; x = ${exactTex}`,
    ];

    return {
      form: 'factored',
      level,
      variable: 'x',
      nelsonRef: 'Contest Enrichment — Biquadratic Substitution',
      promptText: 'Find all real solutions for x:',
      equationLatex: eq,
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: exactTex,
      hints: [
        'Let u = x² so the equation becomes a quadratic in u.',
        'Expand in u, subtract the right-hand side to get = 0, factor for u, then solve x² = u (ignoring negative u values).',
      ],
      solutionSteps: steps,
    };
  }
}

function generateVertex(level) {
  if (level === 1) {
    // Level 1: (x - h)^2 - d^2 = 0 or (x - h)^2 = d^2
    const h = randInt(-6, 6);
    const d = randInt(1, 6);
    const k = -(d * d);
    const useEquals = Math.random() < 0.35;
    const inner = h === 0 ? 'x^2' : `(x ${formatConst(-h)})^2`;
    const eq = useEquals ? `${inner} = ${d * d}` : `${inner} - ${d * d} = 0`;

    const roots = uniqueSorted([h - d, h + d]);
    const steps = [
      useEquals
        ? `\\text{Take the square root of both sides:}`
        : `\\text{Isolate the squared term: } ${inner} = ${d * d}`,
      `${h === 0 ? 'x' : `x ${formatConst(-h)}`} = \\pm ${d}`,
      `x = ${h} + ${d} = ${h + d} \\quad \\text{or} \\quad x = ${h} - ${d} = ${h - d}`,
      `x = ${roots.join(', \\; ')}`,
    ];

    return {
      form: 'vertex',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.3 — Solving Vertex Form by Square Roots',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a: 1, b: -2 * h, c: h * h - d * d },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.join(', '),
      hints: [
        `Isolate ${inner}, then take the positive and negative square root (±).`,
        `${h === 0 ? 'x' : `x ${formatConst(-h)}`} = ±${d}. Remember there are TWO square roots!`,
      ],
      solutionSteps: steps,
    };
  }

  if (level === 2) {
    // Level 2: a(x - h)^2 + k = 0 with rational roots, k=0, or No Real Roots
    const roll = Math.random();
    const h = randInt(-5, 5);
    const inner = h === 0 ? 'x^2' : `(x ${formatConst(-h)})^2`;

    if (roll < 0.25) {
      // No real roots: a and k have the same sign
      const a = pick([2, 3, 4, -2, -3]);
      const k = a > 0 ? randInt(1, 15) : randInt(-15, -1);
      const eq = `${a}${inner} ${formatConst(k)} = 0`;
      const rhs = formatFractionLatex(-k, a);

      return {
        form: 'vertex',
        level,
        variable: 'x',
        nelsonRef: 'Ch. 6.3 — Vertex Form & Number of Roots',
        promptText: 'Solve for x (or select No Real Roots):',
        equationLatex: eq,
        graphData: { a, b: -2 * a * h, c: a * h * h + k },
        expectedRoots: [],
        noRealRoots: true,
        exactExpectedLatex: '\\text{No real roots}',
        hints: [
          `Isolate ${inner} by moving ${k} to the other side and dividing by ${a}.`,
          `Check the sign of the right-hand side: can a real number squared ever be negative?`,
        ],
        solutionSteps: [
          `\\text{Isolate the squared term: } ${a}${inner} = ${-k}`,
          `${inner} = ${rhs}`,
          `\\text{Since a squared real expression cannot be negative, there are no real roots.}`,
        ],
      };
    }

    if (roll < 0.4) {
      // Double root k = 0
      const a = pick([2, 3, -2, -4]);
      const eq = `${a}${inner} = 0`;
      return {
        form: 'vertex',
        level,
        variable: 'x',
        nelsonRef: 'Ch. 6.3 — Vertex on the x-Axis',
        promptText: 'Solve for x:',
        equationLatex: eq,
        graphData: { a, b: -2 * a * h, c: a * h * h },
        expectedRoots: [h],
        noRealRoots: false,
        exactExpectedLatex: String(h),
        hints: [
          `Divide both sides by ${a}.`,
          `When a squared term equals 0, there is only one real root.`,
        ],
        solutionSteps: [
          `${inner} = 0`,
          `${h === 0 ? 'x' : `x ${formatConst(-h)}`} = 0 \\implies x = ${h}`,
        ],
      };
    }

    // Rational roots: a(x - h)^2 + k = 0 where -k/a = (p/q)^2
    const q = pick([2, 3]);
    let p = randInt(1, 5);
    while (gcd(p, q) !== 1) p = randInt(1, 5);
    const mult = pick([1, 2]);
    const aSign = pick([1, -1]);
    const a = aSign * mult * q * q;
    const k = -aSign * mult * p * p;

    const eq = `${a}${inner} ${formatConst(k)} = 0`;
    const sqTex = formatFractionLatex(p * p, q * q);
    const pmTex = formatFractionLatex(p, q);
    const r1Num = h * q - p;
    const r2Num = h * q + p;
    const r1Tex = formatFractionLatex(r1Num, q);
    const r2Tex = formatFractionLatex(r2Num, q);
    const roots = uniqueSorted([r1Num / q, r2Num / q]);

    return {
      form: 'vertex',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.3 — Vertex Form (Rational Roots)',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a, b: -2 * a * h, c: a * h * h + k },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: `${r1Tex}, ${r2Tex}`,
      hints: [
        `Isolate ${inner} first: move ${k} and divide by ${a}.`,
        `You get ${inner} = ${p * p}/${q * q}. Take ± the square root, then add ${h}.`,
      ],
      solutionSteps: [
        `${a}${inner} = ${-k}`,
        `${inner} = ${sqTex}`,
        `${h === 0 ? 'x' : `x ${formatConst(-h)}`} = \\pm ${pmTex}`,
        `x = ${h} \\pm ${pmTex} \\implies x = ${r1Tex}, \\; ${r2Tex}`,
      ],
    };
  }

  if (level === 3) {
    if (Math.random() < 0.5) {
      const fracA = pick([
        { n: 1, d: 2 },
        { n: -1, d: 2 },
        { n: 2, d: 3 },
        { n: -2, d: 3 },
        { n: 3, d: 4 },
      ]);
      const h = randNonZero(-6, 6);
      const m = pick([2, 3, 5, 6, 7, 8, 10, 12].filter((v) => v % fracA.d !== 0));
      const kNum = -fracA.n * m;
      const kDen = fracA.d;

      const aTex = formatFractionLatex(fracA.n, fracA.d);
      const inner = `(x ${formatConst(-h)})^2`;
      const kSign = kNum >= 0 ? '+' : '-';
      const kAbsTex = formatFractionLatex(Math.abs(kNum), kDen);
      const eq = `${aTex}${inner} ${kSign} ${kAbsTex} = 0`;

      const { coeff, radicand } = simplifyRadical(m);
      const radTex = coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`;
      const exactTex = `${h} \\pm ${radTex}`;
      const roots = uniqueSorted([h - Math.sqrt(m), h + Math.sqrt(m)]);
      const recipTex = formatFractionLatex(fracA.d, fracA.n);
      const kOppTex = formatFractionLatex(-kNum, kDen);
      const aVal = fracA.n / fracA.d;

      const steps = [
        `${aTex}${inner} = ${kOppTex}`,
        `\\text{Multiply both sides by } ${recipTex}: \\; ${inner} = ${m}`,
        `x ${formatConst(-h)} = \\pm \\sqrt{${m}}${coeff > 1 ? ` = \\pm ${radTex}` : ''}`,
        `x = ${exactTex}`,
      ];

      return {
        form: 'vertex',
        level,
        variable: 'x',
        nelsonRef: 'Ch. 6.3 — Fractional Vertex Form & Exact Radicals',
        promptText: 'Solve for x (give exact answer):',
        equationLatex: eq,
        graphData: { a: aVal, b: -2 * aVal * h, c: aVal * h * h + kNum / kDen },
        expectedRoots: roots,
        noRealRoots: false,
        exactExpectedLatex: exactTex,
        hints: [
          `Move ${kSign} ${kAbsTex} to the right side, then multiply by the reciprocal ${recipTex} to isolate ${inner}.`,
          `Take ±√${m}${coeff > 1 ? ` (which simplifies to ±${radTex})` : ''}, then solve for x.`,
        ],
        solutionSteps: steps,
      };
    }

    // Level 3: Irrational exact radical roots: a(x - h)^2 + k = 0 where -k/a = m (non-square integer)
    const h = randNonZero(-6, 6);
    const m = pick([2, 3, 5, 6, 7, 8, 10, 12, 18, 20, 24]);
    const a = pick([1, 2, 3, -2, -3]);
    const k = -a * m;

    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const inner = `(x ${formatConst(-h)})^2`;
    const eq = `${aStr}${inner} ${formatConst(k)} = 0`;

    const { coeff, radicand } = simplifyRadical(m);
    const radTex = coeff === 1 ? `\\sqrt{${radicand}}` : `${coeff}\\sqrt{${radicand}}`;
    const exactTex = `${h} \\pm ${radTex}`;
    const roots = uniqueSorted([h - Math.sqrt(m), h + Math.sqrt(m)]);

    const steps = [
      a !== 1 ? `${aStr}${inner} = ${-k}` : `${inner} = ${m}`,
      a !== 1 ? `${inner} = \\frac{${-k}}{${a}} = ${m}` : null,
      `x ${formatConst(-h)} = \\pm \\sqrt{${m}}${coeff > 1 ? ` = \\pm ${radTex}` : ''}`,
      `x = ${exactTex}`,
    ].filter(Boolean);

    return {
      form: 'vertex',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.3 — Exact Radical Solutions in Vertex Form',
      promptText: 'Solve for x (give exact answer):',
      equationLatex: eq,
      graphData: { a, b: -2 * a * h, c: a * h * h + k },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: exactTex,
      hints: [
        `Isolate ${inner} to get ${inner} = ${m}.`,
        `Take ±√${m}${coeff > 1 ? ` (which simplifies to ±${radTex})` : ''}, then solve for x.`,
      ],
      solutionSteps: steps,
    };
  }

  // Level 4: Enrichment — Quadratic in (x - h): a(x - h)^2 + b(x - h) + c = 0
  const useFractionsL4 = Math.random() < 0.5;
  const h = randNonZero(-4, 4);
  const u1 = randNonZero(-5, 5);
  let u2 = randNonZero(-5, 5);
  while (u2 === u1) u2 = randNonZero(-5, 5);

  const b = -(u1 + u2);
  const c = u1 * u2;
  const binom = `(x ${formatConst(-h)})`;
  const x1 = h + u1;
  const x2 = h + u2;
  const roots = uniqueSorted([x1, x2]);

  if (useFractionsL4) {
    const d = pick([2, 3]);
    const eq = `\\frac{1}{${d}}${binom}^2${formatRationalCoeffVar(b, d, binom, false)}${formatRationalCoeffVar(c, d, '', false)} = 0`;
    const steps = [
      `\\text{Multiply both sides by } ${d} \\text{ to clear fractions, then substitute } u = ${binom}:`,
      `${formatQuadraticLatex(1, b, c, 'u')} = 0`,
      `(u ${formatConst(-u1)})(u ${formatConst(-u2)}) = 0 \\implies u = ${u1} \\text{ or } u = ${u2}`,
      `x ${formatConst(-h)} = ${u1} \\implies x = ${x1}; \\quad x ${formatConst(-h)} = ${u2} \\implies x = ${x2}`,
      `x = ${roots.join(', \\; ')}`,
    ];

    return {
      form: 'vertex',
      level,
      variable: 'x',
      nelsonRef: 'Contest Enrichment — Fractions & Substitution with (x − h)',
      promptText: 'Solve for x without expanding unnecessarily:',
      equationLatex: eq,
      graphData: { a: 1 / d, b: (-2 * h + b) / d, c: (h * h - b * h + c) / d },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.join(', '),
      hints: [
        `Multiply every term by ${d} to clear the fractions first, then substitute u = ${binom}.`,
        `Solve u² ${formatCoeffVar(b, 'u')} ${formatConst(c)} = 0 for u, then find x = u ${formatConst(h)}.`,
      ],
      solutionSteps: steps,
    };
  }

  const eq = `${binom}^2 ${formatCoeffVar(b, binom, false)} ${formatConst(c, false)} = 0`;

  const steps = [
    `\\text{Substitute } u = ${binom}:`,
    `${formatQuadraticLatex(1, b, c, 'u')} = 0`,
    `(u ${formatConst(-u1)})(u ${formatConst(-u2)}) = 0 \\implies u = ${u1} \\text{ or } u = ${u2}`,
    `x ${formatConst(-h)} = ${u1} \\implies x = ${x1}; \\quad x ${formatConst(-h)} = ${u2} \\implies x = ${x2}`,
    `x = ${roots.join(', \\; ')}`,
  ];

  return {
    form: 'vertex',
    level,
    variable: 'x',
    nelsonRef: 'Contest Enrichment — Substitution with (x − h)',
    promptText: 'Solve for x without expanding unnecessarily:',
    equationLatex: eq,
    graphData: { a: 1, b: -2 * h + b, c: h * h - b * h + c },
    expectedRoots: roots,
    noRealRoots: false,
    exactExpectedLatex: roots.join(', '),
    hints: [
      `Notice ${binom} appears twice! Let u = ${binom}.`,
      `Solve u² ${formatCoeffVar(b, 'u')} ${formatConst(c)} = 0 for u, then find x = u ${formatConst(h)}.`,
    ],
    solutionSteps: steps,
  };
}

function generateStandard(level) {
  if (level === 1) {
    // Level 1: x^2 + bx + c = 0 factorable over integers, or x^2 - d^2 = 0
    if (Math.random() < 0.2) {
      const d = randInt(2, 9);
      const eq = `x^2 - ${d * d} = 0`;
      const roots = [-d, d];
      return {
        form: 'standard',
        level,
        variable: 'x',
        nelsonRef: 'Ch. 6.1 — Difference of Squares',
        promptText: 'Solve for x:',
        equationLatex: eq,
        graphData: { a: 1, b: 0, c: -(d * d) },
        expectedRoots: roots,
        noRealRoots: false,
        exactExpectedLatex: `\\pm ${d}`,
        hints: [
          'This is a difference of squares: a² − b² = (a − b)(a + b).',
          `Factor as (x − ${d})(x + ${d}) = 0, or isolate x² = ${d * d}.`,
        ],
        solutionSteps: [
          `(x - ${d})(x + ${d}) = 0`,
          `x = ${-d}, \\; ${d}`,
        ],
      };
    }

    const r1 = randInt(-8, 8);
    let r2 = randInt(-8, 8);
    while (r1 === 0 && r2 === 0) r2 = randNonZero(-8, 8);

    const b = -(r1 + r2);
    const c = r1 * r2;
    const eq = `${formatQuadraticLatex(1, b, c)} = 0`;
    const roots = uniqueSorted([r1, r2]);
    const f1 = r1 === 0 ? 'x' : formatLinearSum(1, -r1);
    const f2 = r2 === 0 ? 'x' : formatLinearSum(1, -r2);

    const steps = [
      c === 0
        ? `\\text{Common factor } x: \\; x${formatLinearSum(1, b)} = 0`
        : `\\text{Find two integers that multiply to } ${c} \\text{ and add to } ${b}: \\; ${-r1} \\text{ and } ${-r2}`,
      `${f1}${f2} = 0`,
      `x = ${roots.join(', \\; ')}`,
    ];

    return {
      form: 'standard',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.1 — Factoring Simple Trinomials',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a: 1, b, c },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.join(', '),
      hints: [
        c === 0
          ? 'Factor out the greatest common factor x first.'
          : `Find two numbers whose product is ${c} and sum is ${b}.`,
        `Write in factored form ${f1}${f2} = 0 and solve.`,
      ],
      solutionSteps: steps,
    };
  }

  if (level === 2) {
    // Level 2: Complex trinomials ax^2 + bx + c = 0 (a > 1), rearranged, or discriminant < 0
    const roll = Math.random();
    if (roll < 0.22) {
      // Discriminant < 0 => No Real Roots
      const a = pick([1, 2, 3]);
      const b = randInt(-5, 5);
      const minC = Math.floor((b * b) / (4 * a)) + 1;
      const c = minC + randInt(1, 5);
      const disc = b * b - 4 * a * c;
      const eq = `${formatQuadraticLatex(a, b, c)} = 0`;

      return {
        form: 'standard',
        level,
        variable: 'x',
        nelsonRef: 'Ch. 6.4 — The Discriminant (b² − 4ac < 0)',
        promptText: 'Solve for x (or select No Real Roots):',
        equationLatex: eq,
        graphData: { a, b, c },
        expectedRoots: [],
        noRealRoots: true,
        exactExpectedLatex: '\\text{No real roots}',
        hints: [
          'Check the discriminant Δ = b² − 4ac before trying to factor.',
          `Here Δ = (${b})² − 4(${a})(${c}) = ${disc}. What does a negative discriminant mean?`,
        ],
        solutionSteps: [
          `\\text{Compute the discriminant } \\Delta = b^2 - 4ac:`,
          `\\Delta = (${b})^2 - 4(${a})(${c}) = ${b * b} - ${4 * a * c} = ${disc} < 0`,
          `\\text{Since } \\Delta < 0, \\text{ there are no real roots.}`,
        ],
      };
    }

    // Complex trinomial (px + q)(rx + s) = 0
    const p = pick([2, 3, 4, 5]);
    let q = randNonZero(-6, 6);
    while (gcd(p, q) !== 1) q = randNonZero(-6, 6);

    const r = pick([1, 2, 3]);
    let s = randNonZero(-6, 6);
    if (r > 1) {
      while (gcd(r, s) !== 1) s = randNonZero(-6, 6);
    }

    const a = p * r;
    const b = p * s + q * r;
    const c = q * s;

    const rearranged = roll > 0.68;
    const eq = rearranged
      ? `${formatQuadraticLatex(a, b, 0)} = ${-c}`
      : `${formatQuadraticLatex(a, b, c)} = 0`;

    const roots = uniqueSorted([-q / p, -s / r]);
    const r1Tex = formatFractionLatex(-q, p);
    const r2Tex = formatFractionLatex(-s, r);
    const f1 = formatLinearSum(p, q);
    const f2 = formatLinearSum(r, s);

    const steps = [
      rearranged ? `\\text{Rearrange to standard form: } ${formatQuadraticLatex(a, b, c)} = 0` : null,
      `\\text{Decomposition: find two numbers with product } ac = ${a * c} \\text{ and sum } b = ${b} \\; (${p * s} \\text{ and } ${q * r}).`,
      `\\text{Factor: } ${f1}${f2} = 0`,
      `x = ${roots.length === 1 ? r1Tex : `${r1Tex}, \\; ${r2Tex}`}`,
    ].filter(Boolean);

    return {
      form: 'standard',
      level,
      variable: 'x',
      nelsonRef: 'Ch. 6.1 — Solving Complex Trinomials by Decomposition',
      promptText: 'Solve for x:',
      equationLatex: eq,
      graphData: { a, b, c },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.length === 1 ? r1Tex : `${r1Tex}, ${r2Tex}`,
      hints: [
        rearranged
          ? `First move ${-c} to the left-hand side so the equation equals 0.`
          : `Use decomposition: find two numbers multiplying to a·c = ${a * c} and adding to ${b}.`,
        `The factors are ${f1} and ${f2}.`,
      ],
      solutionSteps: steps,
    };
  }

  if (level === 3) {
    // Level 3: Quadratic Formula with simplified exact radical roots
    let a = pick([1, 2, 3, 4]);
    let b = randNonZero(-9, 9);
    let c = randNonZero(-9, 9);
    let D = b * b - 4 * a * c;

    // Ensure D > 0 and NOT a perfect square
    let attempts = 0;
    while ((D <= 0 || Number.isInteger(Math.sqrt(D))) && attempts < 80) {
      a = pick([1, 2, 3, 4]);
      b = randNonZero(-9, 9);
      c = randNonZero(-9, 9);
      D = b * b - 4 * a * c;
      attempts++;
    }
    if (D <= 0 || Number.isInteger(Math.sqrt(D))) {
      a = 2;
      b = -4;
      c = -3;
      D = 40;
    }

    const useFractions = Math.random() < 0.5;
    const d = useFractions
      ? pick([2, 3, 4].filter((v) => a % v !== 0 || b % v !== 0 || c % v !== 0))
      : 1;
    const eq = useFractions
      ? `${formatRationalQuadraticLatex(a, d, b, d, c, d)} = 0`
      : `${formatQuadraticLatex(a, b, c)} = 0`;
    const { coeff: radCoeff, radicand } = simplifyRadical(D);
    const exactTex = formatPmRadicalRoot(-b, radCoeff, radicand, 2 * a);
    const sqrtD = Math.sqrt(D);
    const roots = uniqueSorted([(-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a)]);

    const radStep =
      radCoeff > 1
        ? `\\sqrt{${D}} = ${radCoeff}\\sqrt{${radicand}}`
        : `\\sqrt{${D}} \\text{ is already in simplest radical form.}`;

    const steps = [
      useFractions
        ? `\\text{Multiply both sides by } ${d} \\text{ to clear fractions: } ${formatQuadraticLatex(a, b, c)} = 0`
        : null,
      `\\text{Apply the Quadratic Formula with } a = ${a}, \\; b = ${b}, \\; c = ${c}:`,
      `x = \\frac{-(${b}) \\pm \\sqrt{(${b})^2 - 4(${a})(${c})}}{2(${a})} = \\frac{${-b} \\pm \\sqrt{${D}}}{${2 * a}}`,
      radStep,
      `x = ${exactTex}`,
    ].filter(Boolean);

    return {
      form: 'standard',
      level,
      variable: 'x',
      nelsonRef: useFractions
        ? 'Ch. 6.4 — Fractions & The Quadratic Formula'
        : 'Ch. 6.4 — The Quadratic Formula',
      promptText: 'Solve for x (give exact answer in simplest radical form):',
      equationLatex: eq,
      graphData: { a: a / d, b: b / d, c: c / d },
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: exactTex,
      hints: [
        useFractions
          ? `First multiply every term by ${d} to clear the fractions into integers, then apply the Quadratic Formula.`
          : 'This trinomial does not factor over integers. Use x = (−b ± √(b² − 4ac)) / (2a).',
        `Discriminant b² − 4ac = ${D}. Simplify √${D} and reduce the fraction if all terms share a common factor.`,
      ],
      solutionSteps: steps,
    };
  }

  // Level 4: Enrichment — Contest Level
  const variant = pick(['biquadratic', 'parameter', 'rational']);

  if (variant === 'biquadratic') {
    const p = pick([1, 4, 9, 2, 3, 5]);
    const q = pick([-4, -1, 1, 4, 9].filter((v) => v !== p));
    const b = -(p + q);
    const c = p * q;
    const eq = `x^4 ${formatCoeffVar(b, 'x^2', false)} ${formatConst(c, false)} = 0`;

    const rootsRaw = [];
    const exactParts = [];
    for (const sVal of [p, q]) {
      if (sVal > 0) {
        const sr = Math.sqrt(sVal);
        rootsRaw.push(-sr, sr);
        exactParts.push(Number.isInteger(sr) ? `\\pm ${sr}` : `\\pm \\sqrt{${sVal}}`);
      }
    }
    const roots = uniqueSorted(rootsRaw);
    const exactTex = exactParts.join(', ');

    const steps = [
      `\\text{Let } u = x^2: \\; ${formatQuadraticLatex(1, b, c, 'u')} = 0`,
      `(u ${formatConst(-p)})(u ${formatConst(-q)}) = 0 \\implies u = ${p}, \\; ${q}`,
      `\\text{Solve } x^2 = u \\text{ for non-negative } u:`,
      `x = ${exactTex}`,
    ];

    return {
      form: 'standard',
      level,
      variable: 'x',
      nelsonRef: 'Contest Enrichment — Biquadratic Equations',
      promptText: 'Find all real solutions for x:',
      equationLatex: eq,
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: exactTex,
      hints: [
        'Substitute u = x² to rewrite as a quadratic equation in u.',
        `Find two numbers multiplying to ${c} and adding to ${b}. Remember x² cannot be negative!`,
      ],
      solutionSteps: steps,
    };
  }

  if (variant === 'parameter') {
    // Find all values of k such that x^2 + (k - d)x + ... has exactly one real root
    // Construct: x^2 + kx + m^2 = 0 (simple) OR x^2 + (k + p)x + (a*k + b) = 0 with clean integer roots for k!
    const m = randInt(2, 7);
    const useSimple = Math.random() < 0.45;

    if (useSimple) {
      const eq = `x^2 + kx + ${m * m} = 0`;
      const roots = [-2 * m, 2 * m];
      return {
        form: 'standard',
        level,
        variable: 'k',
        nelsonRef: 'Contest Enrichment — Discriminant & Parameter k',
        promptText: 'Find all values of k so that the equation has exactly one real root:',
        equationLatex: eq,
        expectedRoots: roots,
        noRealRoots: false,
        exactExpectedLatex: `\\pm ${2 * m}`,
        hints: [
          'A quadratic has exactly one real root when its discriminant b² − 4ac = 0.',
          `Here a = 1, b = k, c = ${m * m}. Set k² − 4(${m * m}) = 0 and solve for k.`,
        ],
        solutionSteps: [
          `\\text{For exactly one real root, set } \\Delta = b^2 - 4ac = 0:`,
          `k^2 - 4(1)(${m * m}) = 0 \\implies k^2 = ${4 * m * m}`,
          `k = \\pm ${2 * m}`,
        ],
      };
    }

    // Harder parameter: x^2 + (k + p)x + (2k + q) = 0
    // Discriminant: (k + p)^2 - 4(2k + q) = k^2 + (2p - 8)k + (p^2 - 4q) = (k - k1)(k - k2)
    // Pick k1, k2 with same parity so 2p - 8 = -(k1 + k2) => p = (8 - (k1 + k2)) / 2
    const k1 = randInt(-5, 5);
    const k2 = k1 + pick([2, 4, 6]); // Ensures k1 + k2 has same parity -> integer p!
    const p = (8 - (k1 + k2)) / 2;
    const q = (p * p - k1 * k2) / 4;
    if (!Number.isInteger(q)) {
      return generateStandard(4); // Fallback clean retry
    }

    const bTerm = p === 0 ? 'kx' : `(k ${formatConst(p)})x`;
    const cTerm = `2k ${formatConst(q)}`;
    const eq = `x^2 + ${bTerm} + (${cTerm}) = 0`;
    const roots = uniqueSorted([k1, k2]);

    const steps = [
      `\\text{Set the discriminant } \\Delta = b^2 - 4ac = 0:`,
      `${p === 0 ? 'k^2' : `(k ${formatConst(p)})^2`} - 4(1)(2k ${formatConst(q)}) = 0`,
      `\\text{Expand and simplify: } ${formatQuadraticLatex(1, -(k1 + k2), k1 * k2, 'k')} = 0`,
      `(k ${formatConst(-k1)})(k ${formatConst(-k2)}) = 0 \\implies k = ${roots.join(', \\; ')}`,
    ];

    return {
      form: 'standard',
      level,
      variable: 'k',
      nelsonRef: 'Contest Enrichment — Parameter Discriminant Quadratic',
      promptText: 'Find all values of k so that the equation has exactly one real root:',
      equationLatex: eq,
      expectedRoots: roots,
      noRealRoots: false,
      exactExpectedLatex: roots.join(', '),
      hints: [
        'A quadratic equation has one real root (equal roots) when b² − 4ac = 0.',
        `Substitute a = 1, b = ${p === 0 ? 'k' : `k ${formatConst(p)}`}, c = 2k ${formatConst(q)} into b² − 4ac = 0, then solve the resulting quadratic in k.`,
      ],
      solutionSteps: steps,
    };
  }

  // Variant C: Rational equation x + c/x = b
  const r1 = randNonZero(-7, 7);
  let r2 = randNonZero(-7, 7);
  while (r2 === r1) r2 = randNonZero(-7, 7);
  const b = r1 + r2;
  const c = r1 * r2;
  const signC = c < 0 ? '-' : '+';
  const eq = `x ${signC} \\frac{${Math.abs(c)}}{x} = ${b}`;
  const roots = uniqueSorted([r1, r2]);
  const f1 = formatLinearSum(1, -r1);
  const f2 = formatLinearSum(1, -r2);

  const steps = [
    `\\text{Note } x \\neq 0. \\text{ Multiply every term by } x:`,
    `x^2 ${formatConst(c)} = ${b}x`,
    `\\text{Rearrange to standard form: } ${formatQuadraticLatex(1, -b, c)} = 0`,
    `\\text{Factor: } ${f1}${f2} = 0 \\implies x = ${roots.join(', \\; ')}`,
  ];

  return {
    form: 'standard',
    level,
    variable: 'x',
    nelsonRef: 'Contest Enrichment — Equations Reducing to Quadratics',
    promptText: 'Solve for x:',
    equationLatex: eq,
    graphData: { a: 1, b: -b, c },
    expectedRoots: roots,
    noRealRoots: false,
    exactExpectedLatex: roots.join(', '),
    hints: [
      'Multiply both sides of the equation by x (noting x ≠ 0) to clear the fraction.',
      `Rearrange into standard form ax² + bx + c = 0 and factor.`,
    ],
    solutionSteps: steps,
  };
}

let problemCounter = 0;

function generateProblem(form = 'mixed', level = 1) {
  const chosenForm = form === 'mixed' ? pick(FORMS) : FORMS.includes(form) ? form : 'standard';
  const clampedLevel = Math.min(4, Math.max(1, Number(level) || 1));

  let problem;
  if (chosenForm === 'factored') problem = generateFactored(clampedLevel);
  else if (chosenForm === 'vertex') problem = generateVertex(clampedLevel);
  else problem = generateStandard(clampedLevel);

  problemCounter += 1;
  problem.id = `q_${Date.now()}_${problemCounter}`;
  return problem;
}

// ---------- Safe LaTeX / Math Expression Parser ----------

function replaceBalancedCommand(str, cmd, replacer) {
  let result = str;
  const token = `\\${cmd}`;
  let guard = 0;
  while (result.includes(token) && guard < 30) {
    guard++;
    const idx = result.indexOf(token);
    let pos = idx + token.length;
    while (pos < result.length && result[pos] === ' ') pos++;

    const readGroup = () => {
      while (pos < result.length && result[pos] === ' ') pos++;
      if (result[pos] === '{') {
        let depth = 0;
        const start = pos + 1;
        while (pos < result.length) {
          if (result[pos] === '{') depth++;
          else if (result[pos] === '}') {
            depth--;
            if (depth === 0) {
              const content = result.slice(start, pos);
              pos++;
              return content;
            }
          }
          pos++;
        }
        return null;
      }
      // Single character fallback (e.g. \frac12 or \sqrt5)
      if (pos < result.length) {
        const ch = result[pos];
        pos++;
        return ch;
      }
      return null;
    };

    const replacement = replacer(readGroup, () => {
      while (pos < result.length && result[pos] === ' ') pos++;
      if (result[pos] === '[') {
        const end = result.indexOf(']', pos + 1);
        if (end !== -1) {
          const opt = result.slice(pos + 1, end);
          pos = end + 1;
          return opt;
        }
      }
      return null;
    });

    if (replacement === null) break;
    result = result.slice(0, idx) + replacement + result.slice(pos);
  }
  return result;
}

function normalizeMathString(raw) {
  let s = String(raw || '').trim();
  // Replace Unicode math symbols
  s = s
    .replace(/\u2212/g, '-')
    .replace(/\u00b1/g, '\\pm')
    .replace(/\+\/-/g, '\\pm')
    .replace(/\+-/g, '\\pm')
    .replace(/\u221a/g, '\\sqrt')
    .replace(/\u00d7/g, '*')
    .replace(/\u00f7/g, '/');

  // Remove MathLive / LaTeX formatting noise
  s = s
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\text\{([^}]*)\}/g, ' $1 ')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\dfrac/g, '\\frac')
    .replace(/\\tfrac/g, '\\frac')
    .replace(/\$/g, '');

  return s.trim();
}

function preprocessSingleExpression(expr) {
  let s = expr.trim();
  // Strip leading variable assignment like x=, k=, x_1=
  s = s.replace(/^[a-zA-Z](?:_\{?\d+\}?)?\s*=\s*/, '');

  // Convert \frac{a}{b} -> ((a)/(b))
  s = replaceBalancedCommand(s, 'frac', (readGroup) => {
    const num = readGroup();
    const den = readGroup();
    if (num === null || den === null) return null;
    return `((${num})/(${den}))`;
  });

  // Convert \sqrt[n]{a} or \sqrt{a} -> sqrt(a) (or nthroot(n,a))
  s = replaceBalancedCommand(s, 'sqrt', (readGroup, readOpt) => {
    const opt = readOpt();
    const inner = readGroup();
    if (inner === null) return null;
    if (opt !== null) return `((${inner})^(1/(${opt})))`;
    return `sqrt(${inner})`;
  });

  // Replace remaining braces with parentheses
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  return s.trim();
}

function tokenizeMath(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      let dotCount = 0;
      while (i < str.length && /[0-9.]/.test(str[i])) {
        if (str[i] === '.') dotCount++;
        numStr += str[i++];
      }
      if (dotCount > 1 || numStr === '.') throw new Error('Invalid number');
      tokens.push({ type: 'num', value: parseFloat(numStr) });
      continue;
    }
    if (str.slice(i, i + 4).toLowerCase() === 'sqrt') {
      tokens.push({ type: 'fn', value: 'sqrt' });
      i += 4;
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${ch}"`);
  }

  // Insert implicit multiplication where appropriate:
  // num before '(', num before 'sqrt', ')' before '(', ')' before num, ')' before 'sqrt'
  const out = [];
  for (let idx = 0; idx < tokens.length; idx++) {
    const curr = tokens[idx];
    if (out.length > 0) {
      const prev = out[out.length - 1];
      const prevIsVal = prev.type === 'num' || (prev.type === 'op' && prev.value === ')');
      const currIsVal =
        curr.type === 'num' ||
        curr.type === 'fn' ||
        (curr.type === 'op' && curr.value === '(');
      if (prevIsVal && currIsVal) {
        out.push({ type: 'op', value: '*' });
      }
    }
    out.push(curr);
  }
  return out;
}

function evaluateMathExpression(expr) {
  const processed = preprocessSingleExpression(expr);
  if (!processed) throw new Error('Empty expression');
  const tokens = tokenizeMath(processed);
  let pos = 0;

  function peek() {
    return tokens[pos] || null;
  }
  function consume() {
    return tokens[pos++];
  }

  function parseExpr() {
    let val = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const rhs = parseTerm();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  }

  function parseTerm() {
    let val = parsePower();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value;
      const rhs = parsePower();
      if (op === '/' && Math.abs(rhs) < 1e-12) throw new Error('Division by zero');
      val = op === '*' ? val * rhs : val / rhs;
    }
    return val;
  }

  function parsePower() {
    let base = parseUnary();
    if (peek() && peek().type === 'op' && peek().value === '^') {
      consume();
      const exp = parsePower();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary() {
    if (peek() && peek().type === 'op' && peek().value === '-') {
      consume();
      return -parseUnary();
    }
    if (peek() && peek().type === 'op' && peek().value === '+') {
      consume();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');
    if (tok.type === 'num') {
      consume();
      return tok.value;
    }
    if (tok.type === 'fn' && tok.value === 'sqrt') {
      consume();
      const arg = parsePrimary();
      if (arg < -1e-12) throw new Error('Negative value inside square root');
      return Math.sqrt(Math.max(0, arg));
    }
    if (tok.type === 'op' && tok.value === '(') {
      consume();
      const val = parseExpr();
      const close = consume();
      if (!close || close.type !== 'op' || close.value !== ')') {
        throw new Error('Mismatched parentheses');
      }
      return val;
    }
    throw new Error('Invalid syntax');
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error('Unexpected trailing tokens');
  if (!Number.isFinite(result)) throw new Error('Non-finite value');
  return result;
}

function parseAnswerRoots(inputRaw) {
  const norm = normalizeMathString(inputRaw);
  if (!norm) return { roots: [], textNoReal: false, error: 'Please enter a solution or select "No Real Roots".' };

  const lower = norm.toLowerCase();
  if (
    lower === 'no real roots' ||
    lower === 'no solution' ||
    lower === 'none' ||
    lower === 'no real solution' ||
    lower === 'dne'
  ) {
    return { roots: [], textNoReal: true, error: null };
  }

  // Split multiple roots on comma, semicolon, or "or"
  const parts = norm
    .split(/[,;]|\bor\b/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { roots: [], textNoReal: false, error: 'Could not read your answer.' };
  }

  const values = [];
  for (const part of parts) {
    if (part.includes('\\pm')) {
      // Expand each \pm occurrence (supports single \pm cleanly)
      const plusBranch = part.replace(/\\pm/g, '+');
      const minusBranch = part.replace(/\\pm/g, '-');
      try {
        values.push(evaluateMathExpression(plusBranch));
        values.push(evaluateMathExpression(minusBranch));
      } catch (err) {
        return { roots: [], textNoReal: false, error: `Could not evaluate "${part}". Check parentheses or radicals.` };
      }
    } else {
      try {
        values.push(evaluateMathExpression(part));
      } catch (err) {
        return { roots: [], textNoReal: false, error: `Could not evaluate "${part}". Check syntax.` };
      }
    }
  }

  return { roots: uniqueSorted(values), textNoReal: false, error: null };
}

function checkAnswer(inputRaw, isNoRealToggle, problem) {
  if (isNoRealToggle) {
    if (problem.noRealRoots) {
      return {
        correct: true,
        isApprox: false,
        parsedValues: [],
        message: 'Correct! This quadratic equation has no real roots.',
      };
    }
    return {
      correct: false,
      isApprox: false,
      parsedValues: [],
      message: 'Not quite — this equation does have real root(s). Try solving again or use a hint.',
    };
  }

  const parsed = parseAnswerRoots(inputRaw);
  if (parsed.error) {
    return {
      correct: false,
      isApprox: false,
      parsedValues: [],
      parseError: true,
      message: parsed.error,
    };
  }

  if (parsed.textNoReal) {
    return checkAnswer('', true, problem);
  }

  if (problem.noRealRoots) {
    return {
      correct: false,
      isApprox: false,
      parsedValues: parsed.roots,
      message: 'This equation actually has NO real roots (click "No Real Roots" when the discriminant < 0 or a squared term equals a negative number).',
    };
  }

  const expected = uniqueSorted(problem.expectedRoots);
  const actual = parsed.roots;

  if (actual.length !== expected.length) {
    return {
      correct: false,
      isApprox: false,
      parsedValues: actual,
      message:
        actual.length < expected.length
          ? `You entered ${actual.length} root(s), but this equation has ${expected.length} distinct real roots. Did you remember both ± branches?`
          : `You entered ${actual.length} values, but this equation only has ${expected.length} distinct real root(s).`,
    };
  }

  let maxDiff = 0;
  for (let i = 0; i < expected.length; i++) {
    maxDiff = Math.max(maxDiff, Math.abs(expected[i] - actual[i]));
  }

  if (maxDiff < 1e-5) {
    return {
      correct: true,
      isApprox: false,
      parsedValues: actual,
      message: 'Exact match! Great work.',
    };
  }

  if (maxDiff < 0.015) {
    return {
      correct: true,
      isApprox: true,
      parsedValues: actual,
      message: 'Correct decimal approximation! (Tip: exact radical/fraction form is preferred in MPM2D.)',
    };
  }

  return {
    correct: false,
    isApprox: false,
    parsedValues: actual,
    message: 'Not quite right. Double-check your signs, factoring, or formula substitution.',
  };
}
return { FORMS, LEVEL_META, FORM_META, gcd, reduceFraction, simplifyRadical, formatQuadraticLatex, formatLinearFactor, formatLinearSum, formatFractionLatex, formatRationalCoeffVar, formatRationalQuadraticLatex, generateProblem, evaluateMathExpression, parseAnswerRoots, checkAnswer };

},

"./grapher.js": function(__require) {
// Interactive Canvas Grapher & Quadratic Inequality Solver for MPM2D

const { gcd, simplifyRadical, formatFractionLatex } = __require("./math-engine.js");
function computeQuadraticFeatures(a, b, c) {
  if (Math.abs(a) < 1e-12) {
    // Degenerate linear fallback
    const root = Math.abs(b) > 1e-12 ? [-c / b] : [];
    return { h: 0, k: c, disc: b * b, roots: root, yInt: c };
  }
  const h = -b / (2 * a);
  const k = a * h * h + b * h + c;
  const disc = b * b - 4 * a * c;
  let roots = [];
  if (Math.abs(disc) < 1e-9) {
    roots = [h];
  } else if (disc > 0) {
    const s = Math.sqrt(disc);
    const r1 = (-b - s) / (2 * a);
    const r2 = (-b + s) / (2 * a);
    roots = r1 < r2 ? [r1, r2] : [r2, r1];
  }
  return { h, k, disc, roots, yInt: c };
}

function computeLineIntersections(a, b, c, m, kLine) {
  // ax^2 + (b - m)x + (c - kLine) = 0
  const A = a;
  const B = b - m;
  const C = c - kLine;
  const disc = B * B - 4 * A * C;
  if (Math.abs(disc) < 1e-9) {
    const x = -B / (2 * A);
    return [{ x, y: m * x + kLine }];
  }
  if (disc > 0) {
    const s = Math.sqrt(disc);
    const x1 = (-B - s) / (2 * A);
    const x2 = (-B + s) / (2 * A);
    const xs = x1 < x2 ? [x1, x2] : [x2, x1];
    return xs.map((x) => ({ x, y: m * x + kLine }));
  }
  return [];
}

function formatExactRootPairLatex(a, b, D) {
  // Returns [smallerLatex, largerLatex] for roots (-b ± sqrt(D)) / (2a)
  if (Math.abs(D) < 1e-9) {
    const single = formatFractionLatex(-b, 2 * a);
    return [single, single];
  }
  const sqrtD = Math.sqrt(D);
  if (Number.isInteger(sqrtD)) {
    const r1Num = -b - sqrtD;
    const r2Num = -b + sqrtD;
    const den = 2 * a;
    const v1 = r1Num / den;
    const v2 = r2Num / den;
    if (v1 <= v2) {
      return [formatFractionLatex(r1Num, den), formatFractionLatex(r2Num, den)];
    }
    return [formatFractionLatex(r2Num, den), formatFractionLatex(r1Num, den)];
  }
  const { coeff: rc, radicand } = simplifyRadical(Math.round(D));
  let baseNum = -b;
  let radCoeff = rc;
  let den = 2 * a;
  if (den < 0) {
    baseNum = -baseNum;
    den = -den;
  }
  const g = gcd(gcd(Math.abs(baseNum), Math.abs(radCoeff)), den);
  baseNum /= g;
  radCoeff /= g;
  den /= g;

  const radStr = radCoeff === 1 ? `\\sqrt{${radicand}}` : `${radCoeff}\\sqrt{${radicand}}`;
  const build = (sign) => {
    if (baseNum === 0) {
      const signed = sign === '-' ? `-${radStr}` : radStr;
      return den === 1 ? signed : sign === '-' ? `-\\frac{${radStr}}{${den}}` : `\\frac{${radStr}}{${den}}`;
    }
    const numStr = `${baseNum} ${sign} ${radStr}`;
    return den === 1 ? numStr : `\\frac{${numStr}}{${den}}`;
  };
  return [build('-'), build('+')];
}

function formatInequalitySolutionLatex(a, b, c, op = '=') {
  if (Math.abs(a) < 1e-12) {
    return '\\text{Requires } a \\neq 0';
  }
  const { h, disc } = computeQuadraticFeatures(a, b, c);
  const hTex = Number.isInteger(h) ? String(h) : formatFractionLatex(-b, 2 * a);

  if (op === '=') {
    if (disc < -1e-9) return '\\text{No real roots}';
    if (Math.abs(disc) < 1e-9) return `x = ${hTex}`;
    const [r1, r2] = formatExactRootPairLatex(a, b, disc);
    return `x = ${r1}, \\; ${r2}`;
  }

  // Normalize so we think about whether parabola is positive on outer tails or inside
  const wantsPositive = op === '>' || op === '>=';
  const strict = op === '>' || op === '<';
  const ltSym = strict ? '<' : '\\le';
  const gtSym = strict ? '>' : '\\ge';

  // When a > 0, ax^2+bx+c > 0 on outer tails; when a < 0, ax^2+bx+c > 0 strictly inside
  const isOuter = (a > 0 && wantsPositive) || (a < 0 && !wantsPositive);

  if (disc < -1e-9) {
    // Parabola never crosses x-axis; sign everywhere equals sign(a)
    const alwaysTrue = (a > 0 && wantsPositive) || (a < 0 && !wantsPositive);
    return alwaysTrue ? 'x \\in \\mathbb{R} \\; (\\text{All real numbers})' : '\\text{No real solutions}';
  }

  if (Math.abs(disc) < 1e-9) {
    // Touches x-axis at x = h
    if (isOuter) {
      return strict ? `x \\neq ${hTex}` : 'x \\in \\mathbb{R} \\; (\\text{All real numbers})';
    }
    return strict ? '\\text{No real solutions}' : `x = ${hTex}`;
  }

  const [r1, r2] = formatExactRootPairLatex(a, b, disc);
  if (isOuter) {
    return `x ${ltSym} ${r1} \\;\\text{ or }\\; x ${gtSym} ${r2}`;
  }
  return `${r1} ${ltSym} x ${ltSym} ${r2}`;
}

function drawQuadraticGraph(canvas, opts = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    a = 1,
    b = 0,
    c = 0,
    line = null,
    inequality = '=',
    showVertex = true,
    showAxis = true,
    showYInt = true,
    showRoots = true,
    theme = 'light',
  } = opts;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.width || 560;
  const cssH = canvas.clientHeight || canvas.height || 340;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#121826' : '#f8fafc',
    grid: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(100, 116, 139, 0.16)',
    axis: isDark ? '#94a3b8' : '#475569',
    text: isDark ? '#cbd5e1' : '#334155',
    parabola: isDark ? '#60a5fa' : '#2563eb',
    line: isDark ? '#f59e0b' : '#d97706',
    vertex: isDark ? '#c084fc' : '#7c3aed',
    root: isDark ? '#4ade80' : '#16a34a',
    yInt: isDark ? '#38bdf8' : '#0284c7',
    intersection: isDark ? '#f87171' : '#dc2626',
    shade: isDark ? 'rgba(74, 222, 128, 0.16)' : 'rgba(22, 163, 74, 0.14)',
    axisHighlight: isDark ? '#4ade80' : '#16a34a',
  };

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const features = computeQuadraticFeatures(a, b, c);
  const intersections = line ? computeLineIntersections(a, b, c, line.m, line.k) : [];

  // Determine viewport bounds around key features
  const xs = [0, features.h, ...features.roots, ...intersections.map((p) => p.x)];
  const ys = [0, features.k, c, ...intersections.map((p) => p.y)];
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  const padX = Math.max(4, (maxX - minX) * 0.45);
  const padY = Math.max(4, (maxY - minY) * 0.35);
  minX = Math.floor(minX - padX);
  maxX = Math.ceil(maxX + padX);
  minY = Math.floor(minY - padY);
  maxY = Math.ceil(maxY + padY);

  // Enforce reasonable symmetric minimum span
  if (maxX - minX < 12) {
    const midX = (minX + maxX) / 2;
    minX = Math.floor(midX - 6);
    maxX = Math.ceil(midX + 6);
  }
  if (maxY - minY < 10) {
    const midY = (minY + maxY) / 2;
    minY = Math.floor(midY - 5);
    maxY = Math.ceil(midY + 5);
  }

  const toPxX = (x) => ((x - minX) / (maxX - minX)) * cssW;
  const toPxY = (y) => cssH - ((y - minY) / (maxY - minY)) * cssH;
  const toMathX = (px) => minX + (px / cssW) * (maxX - minX);

  const niceStep = (span) => {
    const raw = span / 8;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / pow;
    if (norm < 1.5) return 1 * pow;
    if (norm < 3.5) return 2 * pow;
    if (norm < 7.5) return 5 * pow;
    return 10 * pow;
  };

  const stepX = Math.max(1, niceStep(maxX - minX));
  const stepY = Math.max(1, niceStep(maxY - minY));

  // Inequality shading along satisfied x-intervals
  if (inequality !== '=' && Math.abs(a) > 1e-12) {
    const evalInequality = (yVal) => {
      if (inequality === '>') return yVal > 1e-9;
      if (inequality === '>=') return yVal >= -1e-9;
      if (inequality === '<') return yVal < -1e-9;
      if (inequality === '<=') return yVal <= 1e-9;
      return false;
    };

    ctx.fillStyle = colors.shade;
    for (let px = 0; px < cssW; px += 2) {
      const mx = toMathX(px + 1);
      const yVal = a * mx * mx + b * mx + c;
      if (evalInequality(yVal)) {
        ctx.fillRect(px, 0, 2, cssH);
      }
    }
  }

  // Gridlines
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = Math.ceil(minX / stepX) * stepX; gx <= maxX; gx += stepX) {
    const px = toPxX(gx);
    ctx.moveTo(px, 0);
    ctx.lineTo(px, cssH);
  }
  for (let gy = Math.ceil(minY / stepY) * stepY; gy <= maxY; gy += stepY) {
    const py = toPxY(gy);
    ctx.moveTo(0, py);
    ctx.lineTo(cssW, py);
  }
  ctx.stroke();

  // Axes
  const originX = toPxX(0);
  const originY = toPxY(0);
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (originX >= 0 && originX <= cssW) {
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, cssH);
  }
  if (originY >= 0 && originY <= cssH) {
    ctx.moveTo(0, originY);
    ctx.lineTo(cssW, originY);
  }
  ctx.stroke();

  // Tick labels
  ctx.fillStyle = colors.text;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  const xLabelY = Math.min(cssH - 6, Math.max(14, originY + 14));
  for (let gx = Math.ceil(minX / stepX) * stepX; gx <= maxX; gx += stepX) {
    if (Math.abs(gx) < 1e-9) continue;
    ctx.fillText(String(Number(gx.toFixed(2))), toPxX(gx), xLabelY);
  }
  ctx.textAlign = 'right';
  const yLabelX = Math.min(cssW - 6, Math.max(24, originX - 6));
  for (let gy = Math.ceil(minY / stepY) * stepY; gy <= maxY; gy += stepY) {
    if (Math.abs(gy) < 1e-9) continue;
    ctx.fillText(String(Number(gy.toFixed(2))), yLabelX, toPxY(gy) + 4);
  }

  // Highlight x-axis solution intervals for inequalities
  if (inequality !== '=' && originY >= 0 && originY <= cssH && Math.abs(a) > 1e-12) {
    ctx.strokeStyle = colors.axisHighlight;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    let drawing = false;
    for (let px = 0; px <= cssW; px += 2) {
      const mx = toMathX(px);
      const yVal = a * mx * mx + b * mx + c;
      const ok =
        inequality === '>'
          ? yVal > 1e-9
          : inequality === '>='
          ? yVal >= -1e-9
          : inequality === '<'
          ? yVal < -1e-9
          : yVal <= 1e-9;
      if (ok) {
        if (!drawing) {
          ctx.moveTo(px, originY);
          drawing = true;
        } else {
          ctx.lineTo(px, originY);
        }
      } else {
        drawing = false;
      }
    }
    ctx.stroke();
  }

  // Axis of symmetry
  if (showAxis && Math.abs(a) > 1e-12) {
    const axPx = toPxX(features.h);
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colors.vertex;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(axPx, 0);
    ctx.lineTo(axPx, cssH);
    ctx.stroke();
    ctx.restore();
  }

  // Parabola curve
  ctx.strokeStyle = colors.parabola;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let px = 0; px <= cssW; px += 2) {
    const mx = toMathX(px);
    const my = a * mx * mx + b * mx + c;
    const py = toPxY(my);
    if (px === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Optional line y = mx + k
  if (line) {
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const yStart = line.m * minX + line.k;
    const yEnd = line.m * maxX + line.k;
    ctx.moveTo(toPxX(minX), toPxY(yStart));
    ctx.lineTo(toPxX(maxX), toPxY(yEnd));
    ctx.stroke();
  }

  // Helper to draw labeled point
  const drawPoint = (x, y, fill, stroke, label, openCircle = false) => {
    const px = toPxX(x);
    const py = toPxY(y);
    if (px < -10 || px > cssW + 10 || py < -10 || py > cssH + 10) return;
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, Math.PI * 2);
    if (openCircle) {
      ctx.fillStyle = colors.bg;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    } else {
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = colors.bg;
      ctx.stroke();
    }
    if (label) {
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(label, px + 7, py - 6);
    }
  };

  // Y-intercept
  if (showYInt) {
    drawPoint(0, c, colors.yInt, colors.yInt, `(0, ${Number(c.toFixed(2))})`);
  }

  // Roots (with open circles for strict inequalities < or >)
  if (showRoots) {
    const open = inequality === '<' || inequality === '>';
    for (const r of features.roots) {
      drawPoint(r, 0, colors.root, colors.root, `${Number(r.toFixed(2))}`, open);
    }
  }

  // Vertex
  if (showVertex && Math.abs(a) > 1e-12) {
    drawPoint(
      features.h,
      features.k,
      colors.vertex,
      colors.vertex,
      `V(${Number(features.h.toFixed(2))}, ${Number(features.k.toFixed(2))})`
    );
  }

  // Linear-Quadratic Intersections
  for (const pt of intersections) {
    drawPoint(
      pt.x,
      pt.y,
      colors.intersection,
      colors.intersection,
      `(${Number(pt.x.toFixed(2))}, ${Number(pt.y.toFixed(2))})`
    );
  }

  ctx.restore();
}

function drawTransformationGraph(canvas, opts = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    source = { a: 1, h: 0, k: 0 },
    target = { a: 1, h: 0, k: 0 },
    tableRows = [],
    compareWrongOrder = false,
    theme = 'light',
  } = opts;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.width || 560;
  const cssH = canvas.clientHeight || canvas.height || 360;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#121826' : '#f8fafc',
    grid: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(100, 116, 139, 0.16)',
    axis: isDark ? '#94a3b8' : '#475569',
    text: isDark ? '#cbd5e1' : '#334155',
    sourceCurve: isDark ? '#94a3b8' : '#64748b',
    targetCurve: isDark ? '#60a5fa' : '#2563eb',
    targetPoint: isDark ? '#4ade80' : '#16a34a',
    arrow: isDark ? '#c084fc' : '#7c3aed',
    wrongOrder: isDark ? '#fb923c' : '#ea580c',
  };

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const vScale = target.a / (source.a || 1);
  const wrongVertexK = source.k + vScale * (target.k - source.k);

  const xs = [0, source.h, target.h, ...tableRows.flatMap((r) => [r.x, r.xPrime])];
  const ys = [
    0,
    source.k,
    target.k,
    ...(compareWrongOrder ? [wrongVertexK] : []),
    ...tableRows.flatMap((r) => [r.y, r.yPrime]),
  ];
  let minX = Math.floor(Math.min(...xs) - 3);
  let maxX = Math.ceil(Math.max(...xs) + 3);
  let minY = Math.floor(Math.min(...ys) - 3);
  let maxY = Math.ceil(Math.max(...ys) + 3);

  if (maxX - minX < 12) {
    const mid = (minX + maxX) / 2;
    minX = Math.floor(mid - 6);
    maxX = Math.ceil(mid + 6);
  }
  if (maxY - minY < 10) {
    const mid = (minY + maxY) / 2;
    minY = Math.floor(mid - 5);
    maxY = Math.ceil(mid + 5);
  }

  const toPxX = (x) => ((x - minX) / (maxX - minX)) * cssW;
  const toPxY = (y) => cssH - ((y - minY) / (maxY - minY)) * cssH;
  const toMathX = (px) => minX + (px / cssW) * (maxX - minX);

  const niceStep = (span) => {
    const raw = span / 8;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / pow;
    if (norm < 1.5) return 1 * pow;
    if (norm < 3.5) return 2 * pow;
    if (norm < 7.5) return 5 * pow;
    return 10 * pow;
  };
  const stepX = Math.max(1, niceStep(maxX - minX));
  const stepY = Math.max(1, niceStep(maxY - minY));

  // Grid
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = Math.ceil(minX / stepX) * stepX; gx <= maxX; gx += stepX) {
    ctx.moveTo(toPxX(gx), 0);
    ctx.lineTo(toPxX(gx), cssH);
  }
  for (let gy = Math.ceil(minY / stepY) * stepY; gy <= maxY; gy += stepY) {
    ctx.moveTo(0, toPxY(gy));
    ctx.lineTo(cssW, toPxY(gy));
  }
  ctx.stroke();

  // Axes
  const originX = toPxX(0);
  const originY = toPxY(0);
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (originX >= 0 && originX <= cssW) {
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, cssH);
  }
  if (originY >= 0 && originY <= cssH) {
    ctx.moveTo(0, originY);
    ctx.lineTo(cssW, originY);
  }
  ctx.stroke();

  // Ticks
  ctx.fillStyle = colors.text;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  const xLabelY = Math.min(cssH - 6, Math.max(14, originY + 14));
  for (let gx = Math.ceil(minX / stepX) * stepX; gx <= maxX; gx += stepX) {
    if (Math.abs(gx) < 1e-9) continue;
    ctx.fillText(String(Number(gx.toFixed(2))), toPxX(gx), xLabelY);
  }
  ctx.textAlign = 'right';
  const yLabelX = Math.min(cssW - 6, Math.max(24, originX - 6));
  for (let gy = Math.ceil(minY / stepY) * stepY; gy <= maxY; gy += stepY) {
    if (Math.abs(gy) < 1e-9) continue;
    ctx.fillText(String(Number(gy.toFixed(2))), yLabelX, toPxY(gy) + 4);
  }

  // Source parabola (dashed)
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = colors.sourceCurve;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 0; px <= cssW; px += 2) {
    const mx = toMathX(px);
    const my = source.a * (mx - source.h) * (mx - source.h) + source.k;
    const py = toPxY(my);
    if (px === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // Target parabola (solid)
  ctx.strokeStyle = colors.targetCurve;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let px = 0; px <= cssW; px += 2) {
    const mx = toMathX(px);
    const my = target.a * (mx - target.h) * (mx - target.h) + target.k;
    const py = toPxY(my);
    if (px === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Optional "Wrong Order: Translate First, Then Stretch/Reflect" curve
  if (compareWrongOrder) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.wrongOrder;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let px = 0; px <= cssW; px += 2) {
      const mx = toMathX(px);
      const my = target.a * (mx - target.h) * (mx - target.h) + wrongVertexK;
      const py = toPxY(my);
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    const wvx = toPxX(target.h);
    const wvy = toPxY(wrongVertexK);
    ctx.beginPath();
    ctx.arc(wvx, wvy, 5, 0, Math.PI * 2);
    ctx.fillStyle = colors.wrongOrder;
    ctx.fill();
    ctx.fillStyle = colors.wrongOrder;
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(
      `Wrong Order V(${Number(target.h.toFixed(2))}, ${Number(wrongVertexK.toFixed(2))})`,
      wvx + 7,
      wvy + 14
    );
  }

  // Vertex shift arrow from (h1, k1) to (h2, k2)
  const sx = toPxX(source.h);
  const sy = toPxY(source.k);
  const tx = toPxX(target.h);
  const ty = toPxY(target.k);
  if (Math.hypot(tx - sx, ty - sy) > 10) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.arrow;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
    // Arrowhead
    const angle = Math.atan2(ty - sy, tx - sx);
    ctx.fillStyle = colors.arrow;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 9 * Math.cos(angle - 0.4), ty - 9 * Math.sin(angle - 0.4));
    ctx.lineTo(tx - 9 * Math.cos(angle + 0.4), ty - 9 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  // Key points (source hollow, target filled)
  for (const row of tableRows) {
    const px1 = toPxX(row.x);
    const py1 = toPxY(row.y);
    ctx.beginPath();
    ctx.arc(px1, py1, row.isVertex ? 5.2 : 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.sourceCurve;
    ctx.stroke();

    const px2 = toPxX(row.xPrime);
    const py2 = toPxY(row.yPrime);
    ctx.beginPath();
    ctx.arc(px2, py2, row.isVertex ? 5.6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = row.isVertex ? colors.arrow : colors.targetPoint;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.bg;
    ctx.stroke();

    if (row.isVertex) {
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(
        `V'(${Number(row.xPrime.toFixed(2))}, ${Number(row.yPrime.toFixed(2))})`,
        px2 + 7,
        py2 - 6
      );
    }
  }

  ctx.restore();
}

function canvasEventToGrid(canvas, clientX, clientY, range = 8) {
  const rect = canvas.getBoundingClientRect();
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  const x = Math.round(-range + relX * (2 * range));
  const y = Math.round(range - relY * (2 * range));
  return {
    x: Math.max(-range, Math.min(range, x)),
    y: Math.max(-range, Math.min(range, y)),
  };
}

function drawLinearSystemGraph(canvas, opts = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    range = 8,
    line1Points = [],
    line2Points = [],
    solutionLine1 = null,
    solutionLine2 = null,
    poi = null,
    showSolution = false,
    riseRunHintLine = null,
    theme = 'light',
  } = opts;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.width || 480;
  const cssH = canvas.clientHeight || canvas.height || 480;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#121826' : '#f8fafc',
    grid: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.18)',
    axis: isDark ? '#94a3b8' : '#334155',
    text: isDark ? '#cbd5e1' : '#334155',
    line1: isDark ? '#60a5fa' : '#2563eb',
    line2: isDark ? '#2dd4bf' : '#0f766e',
    sol1: isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(37, 99, 235, 0.35)',
    sol2: isDark ? 'rgba(45, 212, 191, 0.45)' : 'rgba(15, 118, 110, 0.35)',
    poi: isDark ? '#f87171' : '#dc2626',
    hint: isDark ? '#fbbf24' : '#d97706',
  };

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const toPxX = (x) => ((x + range) / (2 * range)) * cssW;
  const toPxY = (y) => cssH - ((y + range) / (2 * range)) * cssH;

  // Gridlines at every integer
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let g = -range; g <= range; g++) {
    const px = toPxX(g);
    const py = toPxY(g);
    ctx.moveTo(px, 0);
    ctx.lineTo(px, cssH);
    ctx.moveTo(0, py);
    ctx.lineTo(cssW, py);
  }
  ctx.stroke();

  // Axes
  const originX = toPxX(0);
  const originY = toPxY(0);
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, cssH);
  ctx.moveTo(0, originY);
  ctx.lineTo(cssW, originY);
  ctx.stroke();

  // Integer ticks
  ctx.fillStyle = colors.text;
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  for (let g = -range + 1; g <= range - 1; g += 2) {
    if (g === 0) continue;
    ctx.fillText(String(g), toPxX(g), originY + 13);
  }
  ctx.textAlign = 'right';
  for (let g = -range + 1; g <= range - 1; g += 2) {
    if (g === 0) continue;
    ctx.fillText(String(g), originX - 5, toPxY(g) + 3);
  }

  const drawInfiniteLineFromSlope = (m, b, color, dashed = false, width = 2.4) => {
    ctx.save();
    if (dashed) ctx.setLineDash([6, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(toPxX(-range), toPxY(m * -range + b));
    ctx.lineTo(toPxX(range), toPxY(m * range + b));
    ctx.stroke();
    ctx.restore();
  };

  const drawInfiniteLineFromTwoPoints = (p1, p2, color) => {
    if (p1.x === p2.x && p1.y === p2.y) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    if (p1.x === p2.x) {
      ctx.moveTo(toPxX(p1.x), 0);
      ctx.lineTo(toPxX(p1.x), cssH);
    } else {
      const m = (p2.y - p1.y) / (p2.x - p1.x);
      const b = p1.y - m * p1.x;
      ctx.moveTo(toPxX(-range), toPxY(m * -range + b));
      ctx.lineTo(toPxX(range), toPxY(m * range + b));
    }
    ctx.stroke();
    ctx.restore();
  };

  // Optional true solution lines (shown in non-drill mode or after reveal)
  if (showSolution) {
    if (solutionLine1) drawInfiniteLineFromSlope(solutionLine1.m, solutionLine1.b, colors.sol1, true, 3.5);
    if (solutionLine2) drawInfiniteLineFromSlope(solutionLine2.m, solutionLine2.b, colors.sol2, true, 3.5);
  }

  // Optional Rise/Run guide triangle
  if (riseRunHintLine) {
    const { b, rise, run } = riseRunHintLine;
    const x0 = 0;
    const y0 = b;
    const x1 = run;
    const y1 = b + rise;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.hint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toPxX(x0), toPxY(y0));
    ctx.lineTo(toPxX(x1), toPxY(y0));
    ctx.lineTo(toPxX(x1), toPxY(y1));
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = colors.hint;
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`run ${run}`, (toPxX(x0) + toPxX(x1)) / 2 - 12, toPxY(y0) + (rise >= 0 ? 14 : -6));
    ctx.fillText(`rise ${rise}`, toPxX(x1) + 6, (toPxY(y0) + toPxY(y1)) / 2 + 4);
  }

  // Student-plotted lines & points
  const drawUserSet = (pts, color, labelPrefix) => {
    if (pts.length >= 2) {
      drawInfiniteLineFromTwoPoints(pts[0], pts[1], color);
    }
    for (const pt of pts) {
      const px = toPxX(pt.x);
      const py = toPxY(pt.y);
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = colors.bg;
      ctx.stroke();
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${labelPrefix}(${pt.x}, ${pt.y})`, px + 7, py - 6);
    }
  };

  drawUserSet(line1Points, colors.line1, 'L1');
  drawUserSet(line2Points, colors.line2, 'L2');

  // POI marker if revealed
  if (showSolution && poi) {
    const px = toPxX(poi.x);
    const py = toPxY(poi.y);
    ctx.beginPath();
    ctx.arc(px, py, 6.2, 0, Math.PI * 2);
    ctx.fillStyle = colors.poi;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.bg;
    ctx.stroke();
    ctx.fillStyle = colors.poi;
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`POI(${Number(poi.x.toFixed(2))}, ${Number(poi.y.toFixed(2))})`, px + 8, py - 8);
  }

  ctx.restore();
}

function drawTrigDiagram(canvas, diagram, opts = {}) {
  if (!canvas || typeof canvas.getContext !== 'function' || !diagram) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { colorCoded = true, theme = 'light' } = opts;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.width || 420;
  const cssH = canvas.clientHeight || canvas.height || 260;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = theme === 'dark';
  const c = {
    bg: isDark ? '#121826' : '#f8fafc',
    neutral: isDark ? '#cbd5e1' : '#334155',
    opp: isDark ? '#4ade80' : '#16a34a',
    adj: isDark ? '#fbbf24' : '#d97706',
    hyp: isDark ? '#60a5fa' : '#2563eb',
    angle: isDark ? '#c084fc' : '#7c3aed',
  };

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  if (diagram.type === 'right') {
    // Right-angle vertex at bottom-left P90, top vertex PTop, right angle-theta vertex PTheta
    const p90 = { x: cssW * 0.22, y: cssH * 0.78 };
    const pTop = { x: cssW * 0.22, y: cssH * 0.2 };
    const pTheta = { x: cssW * 0.78, y: cssH * 0.78 };

    const drawSide = (a, b, color) => {
      ctx.strokeStyle = colorCoded ? color : c.neutral;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    drawSide(p90, pTop, c.opp); // Opposite
    drawSide(p90, pTheta, c.adj); // Adjacent
    drawSide(pTop, pTheta, c.hyp); // Hypotenuse

    // 90° square marker
    ctx.strokeStyle = c.neutral;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(p90.x, p90.y - 16, 16, 16);

    // Angle arc at pTheta
    const ang = Math.atan2(pTop.y - pTheta.y, pTop.x - pTheta.x);
    ctx.strokeStyle = colorCoded ? c.angle : c.neutral;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(pTheta.x, pTheta.y, 34, Math.PI, ang, false);
    ctx.stroke();

    // Angle label
    ctx.fillStyle = colorCoded ? c.angle : c.neutral;
    ctx.textAlign = 'right';
    ctx.fillText(diagram.angleLabel || 'θ', pTheta.x - 42, pTheta.y - 14);

    // Opposite label
    ctx.fillStyle = colorCoded ? c.opp : c.neutral;
    ctx.textAlign = 'right';
    const oppTxt = diagram.oppLabel
      ? `${diagram.oppLabel}${colorCoded ? ' (Opp)' : ''}`
      : colorCoded
      ? 'Opp'
      : '';
    if (oppTxt) ctx.fillText(oppTxt, p90.x - 10, (p90.y + pTop.y) / 2);

    // Adjacent label
    ctx.fillStyle = colorCoded ? c.adj : c.neutral;
    ctx.textAlign = 'center';
    const adjTxt = diagram.adjLabel
      ? `${diagram.adjLabel}${colorCoded ? ' (Adj)' : ''}`
      : colorCoded
      ? 'Adj'
      : '';
    if (adjTxt) ctx.fillText(adjTxt, (p90.x + pTheta.x) / 2, p90.y + 22);

    // Hypotenuse label
    ctx.fillStyle = colorCoded ? c.hyp : c.neutral;
    ctx.textAlign = 'left';
    const hypTxt = diagram.hypLabel
      ? `${diagram.hypLabel}${colorCoded ? ' (Hyp)' : ''}`
      : colorCoded
      ? 'Hyp'
      : '';
    if (hypTxt) ctx.fillText(hypTxt, (pTop.x + pTheta.x) / 2 + 12, (pTop.y + pTheta.y) / 2 - 8);
  } else if (diagram.type === 'similar') {
    const drawPairTri = (pts, labels, sides) => {
      const [p1, p2, p3] = pts;
      const edgeCols = colorCoded ? [c.hyp, c.opp, c.adj] : [c.neutral, c.neutral, c.neutral];
      const edges = [
        [p1, p2, sides[0], edgeCols[0], 'right'],
        [p2, p3, sides[1], edgeCols[1], 'center'],
        [p3, p1, sides[2], edgeCols[2], 'left'],
      ];
      for (const [u, v, sLbl, col, align] of edges) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();
        if (sLbl) {
          ctx.fillStyle = col;
          ctx.textAlign = align;
          const mx = (u.x + v.x) / 2;
          const my = (u.y + v.y) / 2;
          const dy = align === 'center' ? 16 : -2;
          const dx = align === 'right' ? -8 : align === 'left' ? 8 : 0;
          ctx.fillText(sLbl, mx + dx, my + dy);
        }
      }
      ctx.fillStyle = colorCoded ? c.angle : c.neutral;
      ctx.textAlign = 'center';
      ctx.fillText(labels[0], p1.x, p1.y - 10);
      ctx.textAlign = 'right';
      ctx.fillText(labels[1], p2.x - 4, p2.y + 16);
      ctx.textAlign = 'left';
      ctx.fillText(labels[2], p3.x + 4, p3.y + 16);
    };

    const { t1, t2 } = diagram;
    drawPairTri(
      [
        { x: cssW * 0.21, y: cssH * 0.28 },
        { x: cssW * 0.1, y: cssH * 0.76 },
        { x: cssW * 0.35, y: cssH * 0.76 },
      ],
      [`A${t1.A ? `(${t1.A})` : ''}`, `B${t1.B ? `(${t1.B})` : ''}`, `C${t1.C ? `(${t1.C})` : ''}`],
      [t1.ab, t1.bc, t1.ca]
    );

    drawPairTri(
      [
        { x: cssW * 0.71, y: cssH * 0.16 },
        { x: cssW * 0.52, y: cssH * 0.8 },
        { x: cssW * 0.89, y: cssH * 0.8 },
      ],
      [`D${t2.D ? `(${t2.D})` : ''}`, `E${t2.E ? `(${t2.E})` : ''}`, `F${t2.F ? `(${t2.F})` : ''}`],
      [t2.de, t2.ef, t2.fd]
    );
  } else {
    // Acute/Oblique triangle: A (bottom-left), B (bottom-right), C (top)
    const pA = { x: cssW * 0.18, y: cssH * 0.78 };
    const pB = { x: cssW * 0.82, y: cssH * 0.78 };
    const pC = { x: cssW * 0.44, y: cssH * 0.18 };

    const isSine = diagram.highlightLaw === 'sine';
    const sideColors = colorCoded
      ? {
          a: isSine ? c.opp : c.hyp, // opposite A
          b: isSine ? c.hyp : c.hyp, // opposite B
          c: isSine ? c.neutral : c.adj, // opposite C
        }
      : { a: c.neutral, b: c.neutral, c: c.neutral };

    const drawEdge = (p1, p2, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };

    drawEdge(pB, pC, sideColors.a); // side a
    drawEdge(pA, pC, sideColors.b); // side b
    drawEdge(pA, pB, sideColors.c); // side c

    // Vertex / Angle labels
    ctx.fillStyle = colorCoded ? c.angle : c.neutral;
    ctx.textAlign = 'right';
    ctx.fillText(`A: ${diagram.A || ''}`, pA.x - 6, pA.y + 18);
    ctx.textAlign = 'left';
    ctx.fillText(`B: ${diagram.B || ''}`, pB.x - 14, pB.y + 18);
    ctx.textAlign = 'center';
    ctx.fillText(`C: ${diagram.C || ''}`, pC.x, pC.y - 12);

    // Side labels
    ctx.fillStyle = sideColors.a;
    ctx.textAlign = 'left';
    ctx.fillText(`a = ${diagram.a || ''}`, (pB.x + pC.x) / 2 + 10, (pB.y + pC.y) / 2);

    ctx.fillStyle = sideColors.b;
    ctx.textAlign = 'right';
    ctx.fillText(`b = ${diagram.b || ''}`, (pA.x + pC.x) / 2 - 10, (pA.y + pC.y) / 2);

    ctx.fillStyle = sideColors.c;
    ctx.textAlign = 'center';
    ctx.fillText(`c = ${diagram.c || ''}`, (pA.x + pB.x) / 2, pA.y + 20);
  }

  ctx.restore();
}
return { computeQuadraticFeatures, computeLineIntersections, formatInequalitySolutionLatex, drawQuadraticGraph, drawTransformationGraph, canvasEventToGrid, drawLinearSystemGraph, drawTrigDiagram };

},

"./skills-engine.js": function(__require) {
// Additional MPM2D Skills Engine:
// Completing the Square (Self-Check), Factoring, Expansion,
// Key Features (Axis of Symmetry & y-Intercept), and Linear-Quadratic Systems.

const { gcd, formatQuadraticLatex, formatRationalQuadraticLatex, formatLinearSum, formatFractionLatex, evaluateMathExpression, } = __require("./math-engine.js");
const SKILL_META = {
  solve: { id: 'solve', name: 'Solve Equations', short: 'Solve' },
  completing_square: { id: 'completing_square', name: 'Completing the Square', short: 'Complete Sq.' },
  factoring: { id: 'factoring', name: 'Factoring', short: 'Factor' },
  expansion: { id: 'expansion', name: 'Expansion', short: 'Expand' },
  key_features: { id: 'key_features', name: 'Axis of Sym. & y-Int', short: 'Key Features' },
  find_equation: { id: 'find_equation', name: 'Find Equation & Graph', short: 'Find Eq.' },
  finite_differences: { id: 'finite_differences', name: 'Finite Differences', short: 'Differences' },
  linear_quadratic: { id: 'linear_quadratic', name: 'Linear-Quadratic Systems', short: 'Lin-Quad' },
  quad_apps: { id: 'quad_apps', name: 'Quadratic Applications (Max/Min)', short: 'Applications' },
  cemc_enrichment: { id: 'cemc_enrichment', name: 'Waterloo CEMC Enrichment', short: 'CEMC Waterloo' },
};

const FACTOR_TECHNIQUES = {
  mixed: { id: 'mixed', name: 'Mixed Techniques' },
  gcf: { id: 'gcf', name: 'Common Factoring' },
  grouping: { id: 'grouping', name: 'Grouping' },
  special_product: { id: 'special_product', name: 'Special Products' },
  decomposition: { id: 'decomposition', name: 'Decomposition' },
  criss_cross: { id: 'criss_cross', name: 'Criss-Cross (Enrichment)' },
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

function formatConst(c) {
  if (c === 0) return '';
  return c < 0 ? ` - ${Math.abs(c)}` : ` + ${c}`;
}

function formatLinearExprLatex(m, k) {
  let s = '';
  if (m !== 0) {
    s += m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  }
  if (k !== 0) {
    if (!s) s += String(k);
    else s += k < 0 ? ` - ${Math.abs(k)}` : ` + ${k}`;
  }
  return s || '0';
}

// ---------- Safe Expression-in-x Evaluator (No eval) ----------

function replaceBalancedCmd(str, cmd, replacer) {
  let result = str;
  const token = `\\${cmd}`;
  let guard = 0;
  while (result.includes(token) && guard < 30) {
    guard++;
    const idx = result.indexOf(token);
    let pos = idx + token.length;
    while (pos < result.length && result[pos] === ' ') pos++;

    const readGroup = () => {
      while (pos < result.length && result[pos] === ' ') pos++;
      if (result[pos] === '{') {
        let depth = 0;
        const start = pos + 1;
        while (pos < result.length) {
          if (result[pos] === '{') depth++;
          else if (result[pos] === '}') {
            depth--;
            if (depth === 0) {
              const content = result.slice(start, pos);
              pos++;
              return content;
            }
          }
          pos++;
        }
        return null;
      }
      if (pos < result.length) {
        const ch = result[pos++];
        return ch;
      }
      return null;
    };

    const rep = replacer(readGroup);
    if (rep === null) break;
    result = result.slice(0, idx) + rep + result.slice(pos);
  }
  return result;
}

function normalizeAlgebraLatex(raw) {
  let s = String(raw || '').trim();
  s = s
    .replace(/\u2212/g, '-')
    .replace(/\u00d7/g, '*')
    .replace(/\u00f7/g, '/')
    .replace(/\u221a/g, '\\sqrt')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\dfrac/g, '\\frac')
    .replace(/\\tfrac/g, '\\frac')
    .replace(/\$/g, '');

  // Strip leading "y =" or "f(x) ="
  s = s.replace(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '');

  s = replaceBalancedCmd(s, 'frac', (readGroup) => {
    const num = readGroup();
    const den = readGroup();
    if (num === null || den === null) return null;
    return `((${num})/(${den}))`;
  });

  s = replaceBalancedCmd(s, 'sqrt', (readGroup) => {
    const inner = readGroup();
    if (inner === null) return null;
    return `sqrt(${inner})`;
  });

  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  return s.trim();
}

function tokenizeAlgebra(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = '';
      let dots = 0;
      while (i < str.length && /[0-9.]/.test(str[i])) {
        if (str[i] === '.') dots++;
        num += str[i++];
      }
      if (dots > 1 || num === '.') throw new Error('Invalid number');
      tokens.push({ type: 'num', value: parseFloat(num) });
      continue;
    }
    if (str.slice(i, i + 4).toLowerCase() === 'sqrt') {
      tokens.push({ type: 'fn', value: 'sqrt' });
      i += 4;
      continue;
    }
    if (ch === 'x' || ch === 'X') {
      tokens.push({ type: 'var', value: 'x' });
      i++;
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected symbol "${ch}"`);
  }

  // Insert implicit multiplication
  const out = [];
  for (const curr of tokens) {
    if (out.length > 0) {
      const prev = out[out.length - 1];
      const prevVal =
        prev.type === 'num' ||
        prev.type === 'var' ||
        (prev.type === 'op' && prev.value === ')');
      const currVal =
        curr.type === 'num' ||
        curr.type === 'var' ||
        curr.type === 'fn' ||
        (curr.type === 'op' && curr.value === '(');
      if (prevVal && currVal) {
        out.push({ type: 'op', value: '*' });
      }
    }
    out.push(curr);
  }
  return out;
}

function evalExpressionAtX(rawLatex, xVal) {
  const norm = normalizeAlgebraLatex(rawLatex);
  if (!norm) throw new Error('Empty expression');
  const tokens = tokenizeAlgebra(norm);
  let pos = 0;

  const peek = () => tokens[pos] || null;
  const consume = () => tokens[pos++];

  function parseExpr() {
    let val = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const rhs = parseTerm();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  }

  function parseTerm() {
    let val = parseUnary();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value;
      const rhs = parseUnary();
      if (op === '/' && Math.abs(rhs) < 1e-12) throw new Error('Division by zero');
      val = op === '*' ? val * rhs : val / rhs;
    }
    return val;
  }

  function parseUnary() {
    if (peek() && peek().type === 'op' && peek().value === '-') {
      consume();
      return -parseUnary();
    }
    if (peek() && peek().type === 'op' && peek().value === '+') {
      consume();
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower() {
    let base = parsePrimary();
    if (peek() && peek().type === 'op' && peek().value === '^') {
      consume();
      const exp = parseUnary();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');
    if (tok.type === 'num') {
      consume();
      return tok.value;
    }
    if (tok.type === 'var') {
      consume();
      return xVal;
    }
    if (tok.type === 'fn' && tok.value === 'sqrt') {
      consume();
      const arg = parsePrimary();
      if (arg < -1e-12) throw new Error('Negative inside sqrt');
      return Math.sqrt(Math.max(0, arg));
    }
    if (tok.type === 'op' && tok.value === '(') {
      consume();
      const val = parseExpr();
      const close = consume();
      if (!close || close.type !== 'op' || close.value !== ')') {
        throw new Error('Mismatched parentheses');
      }
      return val;
    }
    throw new Error('Invalid syntax');
  }

  const res = parseExpr();
  if (pos < tokens.length) throw new Error('Unexpected trailing tokens');
  if (!Number.isFinite(res)) throw new Error('Non-finite value');
  return res;
}

function isAlgebraicallyEquivalent(inputRaw, expectedFn) {
  const testXs = [-2.3, -0.7, 0.4, 1.5, 3.1];
  for (const xv of testXs) {
    const actual = evalExpressionAtX(inputRaw, xv);
    const expected = expectedFn(xv);
    if (Math.abs(actual - expected) > 1e-5) {
      return false;
    }
  }
  return true;
}

function hasTopLevelAddSub(norm) {
  let depth = 0;
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (depth === 0 && (ch === '+' || ch === '-')) {
      // Allow leading unary sign at start or right after '*'
      const prevNonSpace = norm.slice(0, i).trimEnd().slice(-1);
      if (i === 0 || prevNonSpace === '' || prevNonSpace === '*') continue;
      return true;
    }
  }
  return false;
}

function isVertexFormStructure(norm) {
  // Check for a balanced (...)^2 group containing 'x' (even with nested fraction parens)
  let foundSquaredBinomial = false;
  let depth = 0;
  let start = -1;
  let outside = '';

  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    if (ch === '(') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && start !== -1) {
        const group = norm.slice(start, i + 1);
        const after = norm.slice(i + 1);
        if (/x/i.test(group) && /^\s*\^\s*\(?\s*2\s*\)?/.test(after)) {
          foundSquaredBinomial = true;
        }
        start = -1;
      }
    } else if (depth === 0) {
      outside += ch;
    }
  }

  return foundSquaredBinomial && !/x/i.test(outside);
}

// ---------- Skill Generators ----------

function generateCompletingSquare(level) {
  let a = 1;
  let hNum = 0;
  let hDen = 1;
  let kNum = 0;
  let kDen = 1;

  if (level === 1) {
    a = 1;
    hNum = randNonZero(-6, 6);
    kNum = randNonZero(-10, 10);
  } else if (level === 2) {
    a = pick([2, 3, -1, -2]);
    hNum = randNonZero(-5, 5);
    kNum = randNonZero(-9, 9);
  } else if (level === 3) {
    a = 1;
    hNum = pick([-7, -5, -3, -1, 1, 3, 5, 7]);
    hDen = 2;
    const c = randInt(-6, 6);
    // (x + hNum/2)^2 + k = x^2 + hNum*x + c => k = c - (hNum^2)/4
    kNum = 4 * c - hNum * hNum;
    kDen = 4;
  } else {
    a = pick([2, 3, -2, -3]);
    const b = randNonZero(-7, 7);
    const c = randInt(-6, 6);
    // ax^2 + bx + c => h = -b/(2a), k = c - b^2/(4a)
    const hr = -b;
    const hd = 2 * a;
    const g1 = gcd(hr, hd);
    hNum = (hr / g1) * (hd < 0 ? -1 : 1);
    hDen = Math.abs(hd / g1);
    const kn = 4 * a * c - b * b;
    const kd = 4 * a;
    const g2 = gcd(kn, kd);
    kNum = (kn / g2) * (kd < 0 ? -1 : 1);
    kDen = Math.abs(kd / g2);

    const eq = `y = ${formatQuadraticLatex(a, b, c)}`;
    const hTex = formatFractionLatex(-b, 2 * a);
    const inner = -b / (2 * a) < 0 ? `(x + ${formatFractionLatex(Math.abs(b), Math.abs(2 * a))})` : `(x - ${hTex})`;
    const signK = kn / kd >= 0 ? '+' : '-';
    const absKTex = formatFractionLatex(Math.abs(kn), Math.abs(kd));
    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const expectedLatex = `${aStr}${inner}^2 ${kn === 0 ? '' : `${signK} ${absKTex}`}`.trim();

    return {
      skill: 'completing_square',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 4.4 / 6.2 — Completing the Square (General a)',
      promptText: 'Rewrite in vertex form y = a(x − h)² + k (self-check):',
      equationLatex: eq,
      graphData: { a, b, c },
      expectedCoeffs: { a, b, c },
      exactExpectedLatex: `y = ${expectedLatex}`,
      hints: [
        `Factor ${a} out of the first two terms: y = ${a}(x² ${formatFractionLatex(b, a)}x) ${formatConst(c)}.`,
        `Take half of ${formatFractionLatex(b, a)}, square it, add & subtract inside the bracket, then distribute ${a}.`,
      ],
      solutionSteps: [
        `y = ${a}\\left(x^2 + ${formatFractionLatex(b, a)}x\\right) ${formatConst(c)}`,
        `\\text{Half of } ${formatFractionLatex(b, a)} \\text{ is } ${formatFractionLatex(b, 2 * a)}, \\; \\left(${formatFractionLatex(b, 2 * a)}\\right)^2 = ${formatFractionLatex(b * b, 4 * a * a)}`,
        `y = ${expectedLatex}`,
      ],
    };
  }

  // Levels 1-3 compute b, c from a, h = hNum/hDen, k = kNum/kDen
  // y = a(x - h)^2 + k = ax^2 - 2ah x + (ah^2 + k)
  const h = hNum / hDen;
  const k = kNum / kDen;
  const b = Math.round(-2 * a * h);
  const c = Math.round(a * h * h + k);
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const hAbsTex = formatFractionLatex(Math.abs(hNum), hDen);
  const inner = h < 0 ? `(x + ${hAbsTex})` : `(x - ${hAbsTex})`;
  const kTex = formatFractionLatex(Math.abs(kNum), kDen);
  const kSign = kNum >= 0 ? '+' : '-';
  const expectedLatex = `${aStr}${inner}^2 ${kNum === 0 ? '' : `${kSign} ${kTex}`}`.trim();

  const eq = `y = ${formatQuadraticLatex(a, b, c)}`;
  const halfB = formatFractionLatex(b, 2 * a);
  const halfBSq = formatFractionLatex(b * b, 4 * a * a);

  const steps = [
    a !== 1
      ? `\\text{Factor } ${a} \\text{ from the } x^2 \\text{ and } x \\text{ terms: } y = ${a}(x^2 ${formatConst(b / a)}x) ${formatConst(c)}`
      : `\\text{Group the } x^2 \\text{ and } x \\text{ terms: } y = (x^2 ${formatConst(b)}x) ${formatConst(c)}`,
    `\\text{Complete the square with } \\left(${halfB}\\right)^2 = ${halfBSq}:`,
    `y = ${expectedLatex}`,
  ];

  return {
    skill: 'completing_square',
    level,
    inputType: 'math',
    nelsonRef: 'Ch. 4.4 / 6.2 — Completing the Square',
    promptText: 'Rewrite in vertex form y = a(x − h)² + k (self-check):',
    equationLatex: eq,
    graphData: { a, b, c },
    expectedCoeffs: { a, b, c },
    exactExpectedLatex: `y = ${expectedLatex}`,
    hints: [
      a !== 1
        ? `Factor out ${a} from the first two terms before completing the square.`
        : `Take half of ${b}, square it (${(b / 2) * (b / 2)}), then add and subtract it.`,
      `Your binomial squared will be ${inner}². Combine the remaining constants to find k.`,
    ],
    solutionSteps: steps,
  };
}

function generateFactoring(level, technique = 'mixed') {
  const chosenTech =
    technique === 'mixed'
      ? level === 1
        ? pick(['gcf', 'special_product', 'decomposition'])
        : level === 2
        ? pick(['gcf', 'grouping', 'special_product'])
        : level === 3
        ? pick(['grouping', 'special_product', 'decomposition'])
        : pick(['gcf', 'grouping', 'criss_cross'])
      : technique;

  let d = 0; // optional cubic x^3 coeff
  let a = 1;
  let b = 0;
  let c = 0;
  let exprLatex = '';
  let factoredLatex = '';
  let steps = [];
  let hints = [];
  let nelsonRef = 'Ch. 5.3 / 5.4 / 5.5 — Factoring Quadratic Expressions';

  if (chosenTech === 'gcf') {
    nelsonRef = 'Ch. 5.3 — Common Factoring (Numbers, Variables, Binomials & Mixture)';
    const sub = pick(['numbers', 'variable', 'binomial', 'mixture']);

    if (sub === 'numbers') {
      const k = pick([2, 3, 4, -2, -3]);
      const r1 = randNonZero(-6, 6);
      let r2 = randNonZero(-6, 6);
      while (r1 + r2 === 0) r2 = randNonZero(-6, 6);
      a = k;
      b = k * (r1 + r2);
      c = k * r1 * r2;
      exprLatex = formatQuadraticLatex(a, b, c);
      const kStr = k === -1 ? '-' : String(k);
      factoredLatex = `${kStr}${formatLinearSum(1, r1)}${formatLinearSum(1, r2)}`;
      steps = [
        `\\text{Common factor the greatest numerical GCF } ${k}: \\; ${kStr}(${formatQuadraticLatex(1, r1 + r2, r1 * r2)})`,
        `\\text{Factor the simple trinomial: } ${factoredLatex}`,
      ];
      hints = [
        `Every term is divisible by ${k}. Factor out ${k} first!`,
        `Then factor ${formatQuadraticLatex(1, r1 + r2, r1 * r2)}.`,
      ];
    } else if (sub === 'variable') {
      const k = pick([2, 3, 4, 5]);
      const p = pick([1, 2, 3]);
      let q = randNonZero(-5, 5);
      while (gcd(p, q) !== 1) q = randNonZero(-5, 5);
      const useCubic = level >= 3;
      if (useCubic) {
        d = k * p;
        a = k * q;
        b = 0;
        c = 0;
        exprLatex = `${d}x^3 ${formatConst(a)}x^2`;
        factoredLatex = `${k}x^2${formatLinearSum(p, q)}`;
        steps = [
          `\\text{GCF is } ${k}x^2 \\text{ (common number } ${k} \\text{ and lowest power } x^2\\text{):}`,
          `${factoredLatex}`,
        ];
        hints = [
          `Find the greatest common factor of both the numbers and the powers of x.`,
          `Both terms share ${k}x².`,
        ];
      } else {
        a = k * p;
        b = k * q;
        c = 0;
        exprLatex = formatQuadraticLatex(a, b, 0);
        factoredLatex = `${k}x${formatLinearSum(p, q)}`;
        steps = [
          `\\text{Factor out the variable and numerical GCF } ${k}x:`,
          `${factoredLatex}`,
        ];
        hints = [
          'Every term contains x, and the coefficients share a common divisor.',
          `Factor out ${k}x.`,
        ];
      }
    } else if (sub === 'binomial') {
      const p = pick([2, 3, 4]);
      let q = randNonZero(-5, 5);
      while (gcd(p, q) !== 1) q = randNonZero(-5, 5);
      const r = randNonZero(-6, 6);
      const binom = formatLinearSum(1, r);
      a = p;
      b = p * r + q;
      c = q * r;
      exprLatex = `${p}x${binom} ${q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`}${binom}`;
      factoredLatex = `${binom}${formatLinearSum(p, q)}`;
      steps = [
        `\\text{Notice the common binomial factor } ${binom}:`,
        `\\text{Factor out } ${binom}: \\; ${factoredLatex}`,
      ];
      hints = [
        `Look at the repeated bracket ${binom} in both terms.`,
        `Pull out ${binom} as the GCF, leaving (${p}x ${formatConst(q)}).`,
      ];
    } else {
      // mixture: k x^2 (x + r) + k m x (x + r) = k x (x + r)(x + m)
      const k = pick([2, 3]);
      const r = randNonZero(-5, 5);
      let m = randNonZero(-5, 5);
      while (m === r) m = randNonZero(-5, 5);
      const binom = formatLinearSum(1, r);
      d = k;
      a = k * (r + m);
      b = k * r * m;
      c = 0;
      exprLatex = `${k}x^2${binom} ${k * m >= 0 ? `+ ${k * m}` : `- ${Math.abs(k * m)}`}x${binom}`;
      factoredLatex = `${k}x${binom}${formatLinearSum(1, m)}`;
      steps = [
        `\\text{Factor out the common binomial } ${binom}: \\; ${binom}(${k}x^2 ${formatConst(k * m)}x)`,
        `\\text{Now factor out the monomial GCF } ${k}x: \\; ${factoredLatex}`,
      ];
      hints = [
        `Both terms share BOTH a binomial ${binom} and a monomial ${k}x.`,
        `Factor out ${binom} first, then pull out ${k}x from the remaining bracket.`,
      ];
    }
  } else if (chosenTech === 'grouping') {
    nelsonRef = 'Ch. 5.3 — Factoring by Grouping (4 Terms)';
    if (Math.random() < 0.4) {
      // Opposite-binomial sign flip: px(x - r) + q(r - x) = (x - r)(px - q)
      nelsonRef = 'Ch. 5.3 — Factoring by Grouping (Opposite Binomials: r − x = −(x − r))';
      const r = randInt(1, 7);
      const p = level === 1 ? pick([1, 2]) : pick([2, 3, 4]);
      let q = randNonZero(-6, 6);
      while (gcd(p, q) !== 1) q = randNonZero(-6, 6);

      d = 0;
      a = p;
      b = -p * r - q;
      c = q * r;

      const pStr = p === 1 ? '' : String(p);
      const qTerm = q === 1 ? '+ ' : q === -1 ? '- ' : q > 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
      const negQ = -q;
      const flippedTerm =
        negQ === 1 ? '+ ' : negQ === -1 ? '- ' : negQ > 0 ? `+ ${negQ}` : `- ${Math.abs(negQ)}`;

      exprLatex = `${pStr}x(x - ${r}) ${qTerm}(${r} - x)`;
      factoredLatex = `(x - ${r})${formatLinearSum(p, -q)}`;
      steps = [
        `\\text{Use the opposite-binomial identity } (${r} - x) = -(x - ${r}):`,
        `${pStr}x(x - ${r}) ${flippedTerm}(x - ${r})`,
        `\\text{Factor out the common binomial } (x - ${r}): \\; ${factoredLatex}`,
      ];
      hints = [
        `Notice the two brackets are exact opposites: (${r} − x) = −(x − ${r}).`,
        `Factor out −1 from (${r} − x) to flip the sign in front of ${qTerm.trim()}(${r} − x), then pull out (x − ${r}).`,
      ];
    } else if (level >= 3 && Math.random() < 0.5) {
      // 4-term cubic x^3 + r x^2 + k x + r k = (x + r)(x^2 + k), k prime/non-square positive
      const r = randNonZero(-6, 6);
      const k = pick([2, 3, 5, 7]);
      d = 1;
      a = r;
      b = k;
      c = r * k;
      exprLatex = `x^3 ${r >= 0 ? `+ ${r === 1 ? '' : r}` : `- ${Math.abs(r) === 1 ? '' : Math.abs(r)}`}x^2 + ${k}x ${r * k >= 0 ? `+ ${r * k}` : `- ${Math.abs(r * k)}`}`;
      factoredLatex = `${formatLinearSum(1, r)}(x^2 + ${k})`;
      steps = [
        `\\text{Group the first two terms and last two terms: } x^2${formatLinearSum(1, r)} + ${k}${formatLinearSum(1, r)}`,
        `\\text{Factor out the common binomial } ${formatLinearSum(1, r)}: \\; ${factoredLatex}`,
      ];
      hints = [
        'Group into two pairs: (first 2 terms) + (last 2 terms).',
        `Factor x² out of the first pair and ${k} out of the second pair.`,
      ];
    } else {
      // 4-term un-combined quadratic: pr x^2 + ps x + qr x + qs
      const p = pick([1, 2, 3]);
      const r = pick([1, 2, 3]);
      let q = randNonZero(-5, 5);
      while (gcd(p, q) !== 1) q = randNonZero(-5, 5);
      let s = randNonZero(-5, 5);
      while (gcd(r, s) !== 1) s = randNonZero(-5, 5);

      const t1 = p * r;
      const t2 = p * s;
      const t3 = q * r;
      const t4 = q * s;
      a = t1;
      b = t2 + t3;
      c = t4;
      exprLatex = `${t1 === 1 ? '' : t1}x^2 ${t2 >= 0 ? `+ ${t2}` : `- ${Math.abs(t2)}`}x ${t3 >= 0 ? `+ ${t3}` : `- ${Math.abs(t3)}`}x ${t4 >= 0 ? `+ ${t4}` : `- ${Math.abs(t4)}`}`;
      factoredLatex = `${formatLinearSum(p, q)}${formatLinearSum(r, s)}`;
      steps = [
        `\\text{Group first two and last two terms: } (${t1 === 1 ? '' : t1}x^2 ${t2 >= 0 ? `+ ${t2}` : `- ${Math.abs(t2)}`}x) + (${t3}x ${t4 >= 0 ? `+ ${t4}` : `- ${Math.abs(t4)}`})`,
        `\\text{Factor each pair: } ${p === 1 ? '' : p}x${formatLinearSum(r, s)} ${q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`}${formatLinearSum(r, s)}`,
        `\\text{Pull out common binomial } ${formatLinearSum(r, s)}: \\; ${factoredLatex}`,
      ];
      hints = [
        'Factor the GCF from the first two terms and the GCF from the last two terms.',
        `Both groups will reveal the shared binomial ${formatLinearSum(r, s)}.`,
      ];
    }
  } else if (chosenTech === 'special_product') {
    nelsonRef = 'Ch. 5.5 — Special Products (Difference of Squares & Perfect Square Trinomials)';
    if (Math.random() < 0.5) {
      // Difference of squares: (px)^2 - q^2 = (px - q)(px + q)
      const p = level <= 1 ? 1 : pick([1, 2, 3, 4]);
      let q = randInt(2, 9);
      while (p > 1 && gcd(p, q) !== 1) q = randInt(2, 9);
      a = p * p;
      b = 0;
      c = -(q * q);
      exprLatex = formatQuadraticLatex(a, 0, c);
      factoredLatex = `${formatLinearSum(p, -q)}${formatLinearSum(p, q)}`;
      steps = [
        `\\text{Recognize difference of squares } A^2 - B^2 = (A - B)(A + B) \\text{ with } A = ${p === 1 ? '' : p}x, \\; B = ${q}:`,
        `${factoredLatex}`,
      ];
      hints = [
        'Both terms are perfect squares separated by a minus sign: A² − B².',
        `Use A = ${p === 1 ? '' : p}x and B = ${q}.`,
      ];
    } else {
      // Perfect square trinomial: (px ± q)^2
      const p = level <= 1 ? 1 : pick([1, 2, 3]);
      let q = randNonZero(-7, 7);
      while (p > 1 && gcd(p, q) !== 1) q = randNonZero(-7, 7);
      a = p * p;
      b = 2 * p * q;
      c = q * q;
      exprLatex = formatQuadraticLatex(a, b, c);
      factoredLatex = `${formatLinearSum(p, q)}^2`;
      steps = [
        `\\text{Check } A^2 + 2AB + B^2 \\text{ with } A = ${p === 1 ? '' : p}x, \\; B = ${q}:`,
        `2AB = 2(${p === 1 ? '' : p}x)(${q}) = ${b}x \\implies ${factoredLatex}`,
      ];
      hints = [
        'Check if the first and last terms are perfect squares and the middle term equals 2·√first·√last.',
        `Your answer will be a squared binomial (${p === 1 ? '' : p}x ± ${Math.abs(q)})².`,
      ];
    }
  } else if (chosenTech === 'criss_cross') {
    nelsonRef = 'Enrichment — Criss-Cross Factoring (Large Composite Coefficients)';
    const p = pick([2, 3, 4, 5]);
    const r = pick([2, 3]);
    let q = randNonZero(-7, 7);
    while (gcd(p, q) !== 1) q = randNonZero(-7, 7);
    let s = randNonZero(-7, 7);
    while (gcd(r, s) !== 1) s = randNonZero(-7, 7);
    a = p * r;
    b = p * s + q * r;
    c = q * s;
    exprLatex = formatQuadraticLatex(a, b, c);
    factoredLatex = `${formatLinearSum(p, q)}${formatLinearSum(r, s)}`;
    steps = [
      `\\text{Criss-Cross setup: find factor pair of } a = ${a} \\; (${p}, ${r}) \\text{ and factor pair of } c = ${c} \\; (${q}, ${s}):`,
      `\\text{Cross-multiply products: } (${p})(${s}) + (${r})(${q}) = ${p * s} + (${q * r}) = ${b} = b`,
      `\\text{Read rows across: } ${factoredLatex}`,
    ];
    hints = [
      `Write factor pairs of a = ${a} on the left and factor pairs of c = ${c} on the right, then cross-multiply to sum to ${b}.`,
      `Try (${p}x ± ...) and (${r}x ± ...).`,
    ];
  } else {
    // Decomposition
    nelsonRef = 'Ch. 5.4 — Factoring Complex Trinomials by Decomposition';
    const p = level === 1 ? 1 : pick([2, 3, 4]);
    let q = randNonZero(-6, 6);
    while (p > 1 && gcd(p, q) !== 1) q = randNonZero(-6, 6);
    const r = level === 1 ? 1 : pick([1, 2, 3]);
    let s = randNonZero(-6, 6);
    if (r > 1) while (gcd(r, s) !== 1) s = randNonZero(-6, 6);
    a = p * r;
    b = p * s + q * r;
    c = q * s;
    exprLatex = formatQuadraticLatex(a, b, c);
    factoredLatex = `${formatLinearSum(p, q)}${formatLinearSum(r, s)}`;
    steps = [
      `\\text{Find two numbers multiplying to } ac = ${a * c} \\text{ and adding to } b = ${b}: \\; ${p * s} \\text{ and } ${q * r}`,
      `\\text{Decompose middle term and factor by grouping: } ${factoredLatex}`,
    ];
    hints = [
      `Compute a·c = ${a * c} and find two integers whose product is ${a * c} and sum is ${b}.`,
      `Split ${b}x into ${p * s}x + ${q * r}x and factor by grouping.`,
    ];
  }

  return {
    skill: 'factoring',
    technique: chosenTech,
    level,
    inputType: 'math',
    nelsonRef,
    promptText: `Factor completely (${FACTOR_TECHNIQUES[chosenTech]?.name || 'Factoring'}):`,
    equationLatex: exprLatex,
    graphData: d === 0 ? { a, b, c } : null,
    expectedCoeffs: { d, a, b, c },
    exactExpectedLatex: factoredLatex,
    hints,
    solutionSteps: steps,
  };
}

function generateExpansion(level) {
  const fromVertex = Math.random() < 0.45;
  const useFractions = level >= 3 && Math.random() < 0.5;
  let a = 1;
  let b = 0;
  let c = 0;
  let promptExpr = '';
  let exactExpectedLatex = '';
  let steps = [];

  if (useFractions) {
    const fracA = pick([
      { n: 1, d: 2 },
      { n: -1, d: 2 },
      { n: 1, d: 3 },
      { n: 2, d: 3 },
      { n: -1, d: 4 },
    ]);
    const aTex = formatFractionLatex(fracA.n, fracA.d);

    if (fromVertex) {
      const h = randNonZero(-5, 5);
      const k = randNonZero(-9, 9);
      const inner = formatLinearSum(1, -h);
      promptExpr = `${aTex}${inner}^2 ${formatConst(k)}`;
      a = fracA.n / fracA.d;
      b = (-2 * fracA.n * h) / fracA.d;
      c = (fracA.n * h * h) / fracA.d + k;
      const step2 = formatRationalQuadraticLatex(fracA.n, fracA.d, -2 * fracA.n * h, fracA.d, fracA.n * h * h, fracA.d);
      exactExpectedLatex = formatRationalQuadraticLatex(
        fracA.n,
        fracA.d,
        -2 * fracA.n * h,
        fracA.d,
        fracA.n * h * h + k * fracA.d,
        fracA.d
      );
      steps = [
        `\\text{Expand the squared binomial first: } ${inner}^2 = ${formatQuadraticLatex(1, -2 * h, h * h)}`,
        `\\text{Multiply by } ${aTex}: \\; ${step2}`,
        `\\text{Combine the constant term: } ${exactExpectedLatex}`,
      ];
    } else {
      const p = pick([1, 2]);
      const r = level === 4 ? pick([1, 2]) : 1;
      const q = randNonZero(-6, 6);
      const s = randNonZero(-6, 6);
      const f1 = formatLinearSum(p, q);
      const f2 = formatLinearSum(r, s);
      promptExpr = `${aTex}${f1}${f2}`;

      const baseA = p * r;
      const baseB = p * s + q * r;
      const baseC = q * s;
      a = (fracA.n * baseA) / fracA.d;
      b = (fracA.n * baseB) / fracA.d;
      c = (fracA.n * baseC) / fracA.d;
      exactExpectedLatex = formatRationalQuadraticLatex(
        fracA.n * baseA,
        fracA.d,
        fracA.n * baseB,
        fracA.d,
        fracA.n * baseC,
        fracA.d
      );
      steps = [
        `\\text{Use FOIL on } ${f1}${f2} = ${formatQuadraticLatex(baseA, baseB, baseC)}`,
        `\\text{Distribute } ${aTex}: \\; ${exactExpectedLatex}`,
      ];
    }
  } else if (fromVertex) {
    a = level === 1 ? 1 : pick([2, 3, -1, -2, -3]);
    const h = randNonZero(-5, 5);
    const k = level === 1 ? randInt(-6, 6) : randNonZero(-9, 9);
    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const inner = formatLinearSum(1, -h);
    promptExpr = `${aStr}${inner}^2 ${formatConst(k)}`;
    b = -2 * a * h;
    c = a * h * h + k;
    exactExpectedLatex = formatQuadraticLatex(a, b, c);
    steps = [
      `\\text{Expand the squared binomial first: } ${inner}^2 = ${formatQuadraticLatex(1, -2 * h, h * h)}`,
      a !== 1
        ? `\\text{Multiply by } ${a}: \\; ${formatQuadraticLatex(a, -2 * a * h, a * h * h)}`
        : null,
      `\\text{Combine the constant term: } ${exactExpectedLatex}`,
    ].filter(Boolean);
  } else {
    const p = level <= 2 ? 1 : pick([2, 3]);
    const r = level <= 3 ? 1 : pick([1, 2]);
    const q = randNonZero(-6, 6);
    const s = randNonZero(-6, 6);
    a = level === 1 ? 1 : pick([1, 2, -1, -2, 3]);
    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const f1 = formatLinearSum(p, q);
    const f2 = formatLinearSum(r, s);
    promptExpr = `${aStr}${f1}${f2}`;

    const baseA = p * r;
    const baseB = p * s + q * r;
    const baseC = q * s;
    b = a * baseB;
    c = a * baseC;
    a = a * baseA;
    exactExpectedLatex = formatQuadraticLatex(a, b, c);
    steps = [
      `\\text{Use FOIL on } ${f1}${f2} = ${formatQuadraticLatex(baseA, baseB, baseC)}`,
      promptExpr.startsWith('(')
        ? `\\text{Standard form: } ${exactExpectedLatex}`
        : `\\text{Distribute the leading coefficient: } ${exactExpectedLatex}`,
    ];
  }

  return {
    skill: 'expansion',
    level,
    inputType: 'math',
    nelsonRef: useFractions
      ? 'Ch. 5.1 / 4.3 — Expanding Quadratic Expressions with Fractions'
      : 'Ch. 5.1 / 4.3 — Expanding Quadratic Expressions',
    promptText: 'Expand and simplify into standard form ax² + bx + c:',
    equationLatex: promptExpr,
    graphData: { a, b, c },
    expectedCoeffs: { a, b, c },
    exactExpectedLatex,
    hints: [
      fromVertex
        ? 'Expand (x − h)² = (x − h)(x − h) BEFORE multiplying by a or adding k.'
        : 'Multiply the two binomials using FOIL (First, Outer, Inner, Last), then distribute any leading factor.',
      'Combine like x terms and constant terms so no parentheses remain.',
    ],
    solutionSteps: steps,
  };
}

function generateKeyFeatures(level) {
  const mode = pick(['axis_factored', 'axis_vertex', 'y_int_standard']);

  if (mode === 'axis_factored') {
    const a = pick([1, 2, -1, -2, 3]);
    let r = randInt(-7, 7);
    let s = randInt(-7, 7);
    while (s === r) s = randInt(-7, 7);
    if (level <= 2 && (r + s) % 2 !== 0) {
      s += 1; // Keep integer axis of symmetry in Levels 1-2
      if (s === r) s += 2;
    }
    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const eq = `y = ${aStr}${formatLinearSum(1, -r)}${formatLinearSum(1, -s)}`;
    const axisVal = (r + s) / 2;
    const axisTex = formatFractionLatex(r + s, 2);
    const b = -a * (r + s);
    const c = a * r * s;

    return {
      skill: 'key_features',
      subType: 'axis',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 4.2 — Axis of Symmetry from Factored Form',
      promptText: 'Determine the axis of symmetry (enter x = value or just the value):',
      equationLatex: eq,
      graphData: { a, b, c },
      expectedValue: axisVal,
      exactExpectedLatex: `x = ${axisTex}`,
      hints: [
        'In factored form y = a(x − r)(x − s), the x-intercepts are r and s.',
        'The axis of symmetry lies halfway between the zeros: x = (r + s) / 2.',
      ],
      solutionSteps: [
        `\\text{Identify the zeros (x-intercepts): } r = ${r}, \\; s = ${s}`,
        `\\text{Average the zeros: } x = \\frac{${r} + (${s})}{2} = ${axisTex}`,
      ],
    };
  }

  if (mode === 'axis_vertex') {
    const a = pick([1, 2, -1, -3, 4]);
    const h = randNonZero(-8, 8);
    const k = randInt(-9, 9);
    const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
    const eq = `y = ${aStr}${formatLinearSum(1, -h)}^2 ${formatConst(k)}`;
    const b = -2 * a * h;
    const c = a * h * h + k;

    return {
      skill: 'key_features',
      subType: 'axis',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 4.4 — Axis of Symmetry from Vertex Form',
      promptText: 'Determine the axis of symmetry (enter x = value or just the value):',
      equationLatex: eq,
      graphData: { a, b, c },
      expectedValue: h,
      exactExpectedLatex: `x = ${h}`,
      hints: [
        'In vertex form y = a(x − h)² + k, the vertex is (h, k).',
        'Watch the sign inside (x − h): the axis of symmetry is x = h.',
      ],
      solutionSteps: [
        `\\text{Read } h = ${h} \\text{ and } k = ${k} \\text{ from vertex form } y = a(x - h)^2 + k.`,
        `\\text{Vertex is } (${h}, ${k}), \\text{ so the axis of symmetry is } x = ${h}.`,
      ],
    };
  }

  // y-Intercept from Standard Form
  const a = pick([1, 2, -1, -2, 3]);
  const b = randNonZero(-8, 8);
  const c = randInt(-12, 12);
  const eq = `y = ${formatQuadraticLatex(a, b, c)}`;

  return {
    skill: 'key_features',
    subType: 'y_int',
    level,
    inputType: 'math',
    nelsonRef: 'Ch. 4.1 — y-Intercept from Standard Form',
    promptText: 'Determine the y-intercept (enter y = value, value, or (0, value)):',
    equationLatex: eq,
    graphData: { a, b, c },
    expectedValue: c,
    exactExpectedLatex: `(0, ${c})`,
    hints: [
      'Every point on the y-axis has x = 0.',
      'Substitute x = 0 into y = ax² + bx + c: the y-intercept is always c.',
    ],
    solutionSteps: [
      `\\text{Set } x = 0: \\; y = ${a}(0)^2 + (${b})(0) + (${c}) = ${c}`,
      `\\text{The y-intercept is } y = ${c} \\text{ or } (0, ${c}).`,
    ],
  };
}

function generateFindEquation(level) {
  const mode = pick(['vertex_pt', 'roots_pt', 'standard_pts']);

  if (mode === 'vertex_pt') {
    const h = randNonZero(-5, 5);
    const k = randInt(-6, 6);
    const a = level <= 2 ? pick([-2, -1, 2, 3]) : pick([-1.5, -0.5, 0.5, 1.5, -2, 3]);
    const dx = Number.isInteger(a) ? pick([-2, -1, 1, 2]) : pick([-2, 2]);
    const x1 = h + dx;
    const y1 = a * dx * dx + k;
    const aTex = Number.isInteger(a) ? String(a) : formatFractionLatex(Math.round(a * 2), 2);
    const inner = formatLinearSum(1, -h);
    const eqAns = `y = ${a === 1 ? '' : a === -1 ? '-' : aTex}${inner}^2 ${formatConst(k)}`;
    const b = -2 * a * h;
    const c = a * h * h + k;

    return {
      skill: 'find_equation',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 4.4 — Finding Quadratic Equation from Vertex & 1 Point',
      promptText: 'Determine the quadratic equation in vertex (or standard) form:',
      equationLatex: `\\text{Vertex } V(${h}, ${k}), \\quad \\text{passes through } P(${x1}, ${y1})`,
      graphData: { a, b, c },
      expectedCoeffs: { d: 0, a, b, c },
      exactExpectedLatex: eqAns,
      hints: [
        `Start with vertex form: y = a(x ${formatConst(-h)})² ${formatConst(k)}.`,
        `Substitute (${x1}, ${y1}) for (x, y) to solve for a, then write the full equation.`,
      ],
      solutionSteps: [
        `y = a${inner}^2 ${formatConst(k)}`,
        `${y1} = a(${x1} ${formatConst(-h)})^2 ${formatConst(k)} \\implies ${y1 - k} = ${dx * dx}a \\implies a = ${aTex}`,
        eqAns,
      ],
    };
  }

  if (mode === 'roots_pt') {
    const r = randInt(-5, 2);
    const s = r + pick([2, 3, 4, 5]);
    const a = level <= 2 ? pick([-2, -1, 1, 2]) : pick([-1.5, -0.5, 0.5, 2]);
    const x1 = r + 1 === s ? s + 1 : r + 1;
    const prod = (x1 - r) * (x1 - s);
    const y1 = Number.isInteger(a) ? a * prod : a * (prod % 2 === 0 ? prod : 2 * prod);
    const ptX = Number.isInteger(a) || prod % 2 === 0 ? x1 : s + (s - r === 2 ? 2 : 1);
    const ptY = a * (ptX - r) * (ptX - s);
    if (!Number.isInteger(ptY)) return generateFindEquation(level);

    const aTex = Number.isInteger(a) ? String(a) : formatFractionLatex(Math.round(a * 2), 2);
    const f1 = formatLinearSum(1, -r);
    const f2 = formatLinearSum(1, -s);
    const eqAns = `y = ${a === 1 ? '' : a === -1 ? '-' : aTex}${f1}${f2}`;
    const b = -a * (r + s);
    const c = a * r * s;

    return {
      skill: 'find_equation',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 4.2 — Finding Quadratic Equation from x-Intercepts & 1 Point',
      promptText: 'Determine the quadratic equation in factored (or standard) form:',
      equationLatex: `x\\text{-intercepts: } ${r} \\text{ and } ${s}, \\quad \\text{passes through } P(${ptX}, ${ptY})`,
      graphData: { a, b, c },
      expectedCoeffs: { d: 0, a, b, c },
      exactExpectedLatex: eqAns,
      hints: [
        `Start with factored form: y = a${f1}${f2}.`,
        `Substitute (${ptX}, ${ptY}) to solve for a.`,
      ],
      solutionSteps: [
        `y = a${f1}${f2}`,
        `${ptY} = a(${ptX} ${formatConst(-r)})(${ptX} ${formatConst(-s)}) = ${(ptX - r) * (ptX - s)}a \\implies a = ${aTex}`,
        eqAns,
      ],
    };
  }

  // Standard form from y-intercept (0, c) + 2 key symmetric/adjacent points (-1, yNeg), (1, yPos)
  const a = pick([-2, -1, 1, 2, 3]);
  const b = randNonZero(-5, 5);
  const c = randInt(-6, 6);
  const yNeg = a - b + c;
  const yPos = a + b + c;
  const eqAns = `y = ${formatQuadraticLatex(a, b, c)}`;

  return {
    skill: 'find_equation',
    level,
    inputType: 'math',
    nelsonRef: 'Ch. 4.1 / Ch. 4.5 — Standard Form from Key Points',
    promptText: 'Find the quadratic equation y = ax² + bx + c passing through these 3 points:',
    equationLatex: `(-1, ${yNeg}), \\quad y\\text{-int } (0, ${c}), \\quad (1, ${yPos})`,
    graphData: { a, b, c },
    expectedCoeffs: { d: 0, a, b, c },
    exactExpectedLatex: eqAns,
    hints: [
      `From the y-intercept (0, ${c}), you immediately know c = ${c}.`,
      `Substitute (-1, ${yNeg}) and (1, ${yPos}) into y = ax² + bx + ${c} to get a linear system in a and b.`,
    ],
    solutionSteps: [
      `c = ${c} \\text{ directly from } (0, ${c}).`,
      `a + b + ${c} = ${yPos} \\implies a + b = ${yPos - c}; \\quad a - b + ${c} = ${yNeg} \\implies a - b = ${yNeg - c}`,
      `\\text{Add equations: } 2a = ${2 * a} \\implies a = ${a}, \\; b = ${b} \\implies ${eqAns}`,
    ],
  };
}

function generateFiniteDifferences(level) {
  const xs = [-1, 0, 1, 2, 3];

  if (level <= 2) {
    const kind = pick(['linear', 'quadratic', 'neither']);
    let ys, steps, hints;

    if (kind === 'linear') {
      const m = randNonZero(-5, 5);
      const b = randInt(-6, 6);
      ys = xs.map((x) => m * x + b);
      steps = [
        `\\text{1st differences } (\\Delta y): \\; ${m}, \\; ${m}, \\; ${m}, \\; ${m} \\text{ (constant!)}`,
        `\\text{Constant 1st differences} \\implies \\text{Linear Relation.}`,
      ];
      hints = [
        'Subtract consecutive y-values (y₂ − y₁) to check the 1st differences.',
        'If 1st differences are constant, the relation is Linear.',
      ];
    } else if (kind === 'quadratic') {
      const a = randNonZero(-3, 3);
      const b = randInt(-4, 4);
      const c = randInt(-5, 5);
      ys = xs.map((x) => a * x * x + b * x + c);
      const d1 = ys.slice(1).map((y, i) => y - ys[i]);
      const d2 = d1.slice(1).map((d, i) => d - d1[i]);
      steps = [
        `\\text{1st differences } (\\Delta y): \\; ${d1.join(', \\; ')} \\text{ (not constant)}`,
        `\\text{2nd differences } (\\Delta^2 y): \\; ${d2.join(', \\; ')} \\text{ (constant } = 2a!\\text{)}`,
        `\\text{Constant non-zero 2nd differences} \\implies \\text{Quadratic Relation.}`,
      ];
      hints = [
        'Compute 1st differences (Δy), then subtract consecutive 1st differences to get 2nd differences (Δ²y).',
        'If 2nd differences are constant (and non-zero), the relation is Quadratic.',
      ];
    } else {
      // Neither (exponential 2^(x+1) or cubic x^3)
      const useExp = Math.random() < 0.5;
      ys = useExp ? xs.map((x) => Math.pow(2, x + 1)) : xs.map((x) => x * x * x);
      const d1 = ys.slice(1).map((y, i) => y - ys[i]);
      const d2 = d1.slice(1).map((d, i) => d - d1[i]);
      steps = [
        `\\text{1st differences } (\\Delta y): \\; ${d1.join(', \\; ')} \\text{ (not constant)}`,
        `\\text{2nd differences } (\\Delta^2 y): \\; ${d2.join(', \\; ')} \\text{ (not constant)}`,
        `\\text{Neither 1st nor 2nd differences are constant} \\implies \\text{Neither.}`,
      ];
      hints = [
        'Compute both 1st differences and 2nd differences.',
        'Check whether the 2nd differences stay equal across all intervals.',
      ];
    }

    const tableLatex = `\\begin{array}{c|ccccc} x & ${xs.join(' & ')} \\\\ \\hline y & ${ys.join(' & ')} \\end{array}`;
    return {
      skill: 'finite_differences',
      level,
      inputType: 'choice',
      choices: [
        { id: 'linear', label: 'Linear (1st Differences Constant)' },
        { id: 'quadratic', label: 'Quadratic (2nd Differences Constant)' },
        { id: 'neither', label: 'Neither (Not Linear or Quadratic)' },
      ],
      expectedChoice: kind,
      exactExpectedLatex: kind,
      nelsonRef: 'Ch. 3.1 / 4.1 — Finite Differences (1st & 2nd Differences)',
      promptText: 'Use 1st and 2nd finite differences to classify the relation shown in the table:',
      equationLatex: tableLatex,
      hints,
      solutionSteps: steps,
    };
  }

  // Level 3-4: Given a quadratic table, find leading coefficient a = Δ²y / 2
  const a = level === 3 ? pick([-3, -2, -1, 1, 2, 3, 4]) : pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]);
  const b = randInt(-3, 3);
  const c = randInt(-5, 5);
  const ys = xs.map((x) => a * x * x + b * x + c);
  const d1 = ys.slice(1).map((y, i) => y - ys[i]);
  const d2 = d1[1] - d1[0]; // equals 2a (always integer!)
  const aTex = Number.isInteger(a) ? String(a) : formatFractionLatex(Math.round(a * 2), 2);
  const tableLatex = `\\begin{array}{c|ccccc} x & ${xs.join(' & ')} \\\\ \\hline y & ${ys.join(' & ')} \\end{array}`;

  return {
    skill: 'finite_differences',
    level,
    inputType: 'number',
    nelsonRef: 'Ch. 4.1 — Finding Leading Coefficient a from 2nd Differences',
    promptText: 'This table represents a quadratic relation y = ax² + bx + c. Use finite differences to find the value of a:',
    equationLatex: tableLatex,
    expectedValue: a,
    exactExpectedLatex: aTex,
    hints: [
      'When Δx = 1, the constant 2nd difference equals 2a (Δ²y = 2a).',
      `Compute Δy = [${d1.join(', ')}], then Δ²y = ${d2}, and divide by 2.`,
    ],
    solutionSteps: [
      `\\text{1st differences } (\\Delta y): \\; ${d1.join(', \\; ')}`,
      `\\text{Constant 2nd difference: } \\Delta^2 y = ${d2}`,
      `2a = \\Delta^2 y \\implies a = \\frac{${d2}}{2} = ${aTex}`,
    ],
  };
}

function generateLinearQuadratic(level) {
  const expectedCount = pick([0, 1, 2]);
  const a = level <= 2 ? pick([1, -1, 2]) : pick([1, -1, 2, -2, 3]);
  const b = randInt(-6, 6);
  const c = randInt(-8, 8);
  const t = randInt(-3, 3);

  const B = 2 * a * t;
  const m = b - B;
  let C;
  if (expectedCount === 1) C = a * t * t;
  else if (expectedCount === 2) C = a * t * t - a * randInt(1, 5);
  else C = a * t * t + a * randInt(1, 5);
  const k = c - C;

  const disc = B * B - 4 * a * C;
  const eqQuad = `y = ${formatQuadraticLatex(a, b, c)}`;
  const eqLine = `y = ${formatLinearExprLatex(m, k)}`;

  const compText =
    disc > 0
      ? '> 0 \\implies 2 \\text{ points of intersection}'
      : disc === 0
      ? '= 0 \\implies 1 \\text{ point of intersection (tangent)}'
      : '< 0 \\implies 0 \\text{ points of intersection}';

  return {
    skill: 'linear_quadratic',
    level,
    inputType: 'choice',
    choices: [
      { id: '0', label: '0 Intersections' },
      { id: '1', label: '1 Intersection (Tangent)' },
      { id: '2', label: '2 Intersections' },
    ],
    nelsonRef: 'Ch. 6.5 / Enrichment — Linear-Quadratic Systems',
    promptText: 'How many points of intersection does this linear-quadratic system have?',
    equationLatex: `\\begin{cases} ${eqQuad} \\\\ ${eqLine} \\end{cases}`,
    graphData: { a, b, c, line: { m, k } },
    expectedCount,
    exactExpectedLatex: String(expectedCount),
    hints: [
      'Set the two equations equal: ax² + bx + c = mx + k, then move all terms to one side.',
      `Evaluate the discriminant Δ = B² − 4AC of ${formatQuadraticLatex(a, B, C)} = 0.`,
    ],
    solutionSteps: [
      `\\text{Equate the expressions: } ${formatQuadraticLatex(a, b, c)} = ${formatLinearExprLatex(m, k)}`,
      `\\text{Collect terms: } ${formatQuadraticLatex(a, B, C)} = 0`,
      `\\Delta = (${B})^2 - 4(${a})(${C}) = ${disc} ${compText}`,
    ],
  };
}

function generateQuadAppProblem(level) {
  const mode =
    level <= 2 ? pick(['projectile', 'fencing']) : pick(['projectile', 'fencing', 'revenue']);

  if (mode === 'projectile') {
    const k = level <= 2 ? pick([2, 3, 4]) : pick([1.5, 2.5, 3.5, 4.5]);
    const b = Math.round(10 * k);
    const c = randInt(2, 18);
    const tMax = b / 10;
    const hMax = 5 * tMax * tMax + c;
    const tMaxTex = Number.isInteger(tMax) ? String(tMax) : formatFractionLatex(b, 10);
    const hMaxTex = formatFractionLatex(5 * b * b + 100 * c, 100);

    return {
      skill: 'quad_apps',
      level,
      inputType: 'number',
      nelsonRef: 'Ch. 4.5 / 6.5 — Projectile Motion Optimization',
      promptText: 'A ball is launched upward with height h(t) in metres after t seconds. Find its maximum height (in m):',
      equationLatex: `h(t) = -5t^2 + ${b}t + ${c}`,
      graphData: { a: -5, b, c },
      expectedValue: hMax,
      exactExpectedLatex: hMaxTex,
      hints: [
        'Find the vertex time first using t = −b / (2a).',
        `At t = ${tMaxTex} s, substitute back into h(t) = −5t² + ${b}t + ${c}.`,
      ],
      solutionSteps: [
        `t_{\\text{max}} = -\\frac{${b}}{2(-5)} = ${tMaxTex}\\text{ s}`,
        `h_{\\text{max}} = -5\\left(${tMaxTex}\\right)^2 + ${b}\\left(${tMaxTex}\\right) + ${c} = ${hMaxTex}\\text{ m}`,
      ],
    };
  }

  if (mode === 'fencing') {
    if (level <= 2) {
      const wOpt = randInt(5, 16);
      const P = 4 * wOpt;
      const maxArea = wOpt * wOpt;
      return {
        skill: 'quad_apps',
        level,
        inputType: 'number',
        nelsonRef: 'Ch. 4.5 — Optimizing Rectangular Area',
        promptText: `A farmer has ${P} m of fencing for a rectangular pen (all 4 sides). Find the maximum area (in m²):`,
        equationLatex: `\\text{Perimeter: } 2l + 2w = ${P}\\text{ m} \\quad \\Longrightarrow \\quad \\text{Maximize } A = lw`,
        graphData: { a: -1, b: P / 2, c: 0 },
        expectedValue: maxArea,
        exactExpectedLatex: String(maxArea),
        hints: [
          `Write l = ${P / 2} − w so Area A(w) = w(${P / 2} − w) = −w² + ${P / 2}w.`,
          `Average the zeros 0 and ${P / 2} to get optimal width w = ${wOpt} m, then find A(${wOpt}).`,
        ],
        solutionSteps: [
          `l + w = ${P / 2} \\implies A(w) = w(${P / 2} - w) = -w^2 + ${P / 2}w`,
          `w_{\\text{opt}} = \\frac{0 + ${P / 2}}{2} = ${wOpt}\\text{ m}, \\quad l = ${wOpt}\\text{ m}`,
          `A_{\\text{max}} = (${wOpt})(${wOpt}) = ${maxArea}\\text{ m}^2`,
        ],
      };
    }

    const P = level === 3 ? pick([24, 32, 40, 48, 60, 80]) : pick([30, 42, 50, 70, 90]);
    const maxArea = (P * P) / 8;
    const wOptTex = formatFractionLatex(P, 4);
    const lOptTex = formatFractionLatex(P, 2);
    const maxAreaTex = formatFractionLatex(P * P, 8);
    return {
      skill: 'quad_apps',
      level,
      inputType: 'number',
      nelsonRef: 'Ch. 4.5 — 3-Sided Enclosure Optimization',
      promptText: `A farmer encloses a 3-sided rectangular pen along a barn wall with ${P} m of fencing. Find the maximum area (in m²):`,
      equationLatex: `\\text{Along wall: } l + 2w = ${P}\\text{ m} \\quad \\Longrightarrow \\quad \\text{Maximize } A = lw`,
      graphData: { a: -2, b: P, c: 0 },
      expectedValue: maxArea,
      exactExpectedLatex: maxAreaTex,
      hints: [
        `Express l = ${P} − 2w so A(w) = w(${P} − 2w) = −2w² + ${P}w.`,
        `Find the vertex w = −${P} / (2·(−2)) = ${wOptTex} m, then compute A(${wOptTex}).`,
      ],
      solutionSteps: [
        `l = ${P} - 2w \\implies A(w) = w(${P} - 2w) = -2w^2 + ${P}w`,
        `w_{\\text{opt}} = -\\frac{${P}}{2(-2)} = ${wOptTex}\\text{ m}, \\quad l = ${lOptTex}\\text{ m}`,
        `A_{\\text{max}} = \\left(${lOptTex}\\right)\\left(${wOptTex}\\right) = ${maxAreaTex}\\text{ m}^2`,
      ],
    };
  }

  // Revenue optimization (Levels 3 & 4)
  const m = pick([4, 5, 8, 10]);
  const p0 = pick([10, 12, 15, 20]);
  const dx = randInt(3, 9);
  const zerosDiff = 2 * dx + (level === 4 ? pick([0, 1]) : 0);
  const n0 = m * (p0 + zerosDiff);
  const xOpt = zerosDiff / 2;
  const maxRev = (p0 + xOpt) * (n0 - m * xOpt);
  const xOptTex = formatFractionLatex(zerosDiff, 2);
  const maxRevTex = formatFractionLatex((2 * p0 + zerosDiff) * (2 * n0 - m * zerosDiff), 4);

  return {
    skill: 'quad_apps',
    level,
    inputType: 'number',
    nelsonRef: 'Ch. 4.5 — Ticket / Revenue Optimization',
    promptText: `Tickets start at $${p0} with ${n0} buyers. Each $1 price increase reduces sales by ${m} tickets. Find the MAXIMUM revenue ($):`,
    equationLatex: `R(x) = (${p0} + x)(${n0} - ${m}x)`,
    graphData: { a: -m, b: n0 - m * p0, c: p0 * n0 },
    expectedValue: maxRev,
    exactExpectedLatex: maxRevTex,
    hints: [
      'R(x) is already in factored form! Set each bracket equal to 0 to find the two zeros.',
      `Average the zeros −${p0} and ${n0 / m} to get x = ${xOptTex}, then substitute into R(x).`,
    ],
    solutionSteps: [
      `\\text{Zeros: } x = -${p0} \\text{ and } x = \\frac{${n0}}{${m}} = ${n0 / m}`,
      `x_{\\text{opt}} = \\frac{-${p0} + ${n0 / m}}{2} = ${xOptTex}`,
      `R_{\\text{max}} = \\left(${p0} + ${xOptTex}\\right)\\left(${n0} - ${m}\\cdot ${xOptTex}\\right) = ${maxRevTex}`,
    ],
  };
}

function generateCemcEnrichment(level) {
  const mode =
    level <= 2
      ? pick(['vieta_sum_sq', 'parallel_system_k', 'trig_identity_triple'])
      : pick([
          'vieta_sum_sq',
          'discriminant_tangent',
          'parallel_system_k',
          'equidistant_axis',
          'trig_identity_triple',
        ]);

  if (mode === 'vieta_sum_sq') {
    const b = randNonZero(-9, 9);
    let c = -randInt(1, 10);
    for (let tries = 0; tries < 10; tries++) {
      const cand = -randInt(1, 10);
      const disc = b * b - 4 * cand;
      if (disc > 0 && !Number.isInteger(Math.sqrt(disc))) {
        c = cand;
        break;
      }
    }
    const sumRoots = -b;
    const prodRoots = c;
    const ans = b * b - 2 * c;
    return {
      skill: 'cemc_enrichment',
      level,
      inputType: 'number',
      nelsonRef: 'Waterloo CEMC Courseware — Symmetric Root Sums (Vieta’s Formulas)',
      promptText:
        'Given that r and s are the real roots of this quadratic, find the exact value of r² + s² without solving for r and s:',
      equationLatex: `${formatQuadraticLatex(1, b, c)} = 0`,
      graphData: { a: 1, b, c },
      expectedValue: ans,
      exactExpectedLatex: String(ans),
      hints: [
        'Recall (r + s)² = r² + 2rs + s², so r² + s² = (r + s)² − 2rs.',
        `For x² + bx + c = 0, sum of roots r + s = −b = ${sumRoots} and product rs = c = ${prodRoots}.`,
      ],
      solutionSteps: [
        `r + s = -(${b}) = ${sumRoots}, \\quad rs = ${prodRoots}`,
        `r^2 + s^2 = (r + s)^2 - 2rs = (${sumRoots})^2 - 2(${prodRoots}) = ${b * b} - (${2 * c}) = ${ans}`,
      ],
    };
  }

  if (mode === 'discriminant_tangent') {
    const a = pick([1, 2, 3, 4]);
    let b = randNonZero(-11, 11);
    if (level <= 2 && (b * b) % (4 * a) !== 0) b = 2 * a * randNonZero(-2, 2);
    const kVal = (b * b) / (4 * a);
    const kTex = formatFractionLatex(b * b, 4 * a);
    return {
      skill: 'cemc_enrichment',
      level,
      inputType: 'number',
      nelsonRef: 'Waterloo CEMC Courseware — Discriminant Parameter k',
      promptText:
        'Find the exact value of k such that this quadratic equation has exactly ONE real root:',
      equationLatex: `${formatQuadraticLatex(a, b, 0)} + k = 0`,
      graphData: { a, b, c: kVal },
      expectedValue: kVal,
      exactExpectedLatex: kTex,
      hints: [
        'A quadratic equation has exactly one real root when its discriminant Δ = b² − 4ac = 0.',
        `Set (${b})² − 4(${a})(k) = 0 and solve for k.`,
      ],
      solutionSteps: [
        `\\Delta = b^2 - 4ac = 0 \\implies (${b})^2 - 4(${a})k = 0`,
        `${b * b} = ${4 * a}k \\implies k = ${kTex}`,
      ],
    };
  }

  if (mode === 'parallel_system_k') {
    const a1 = level <= 2 ? 2 : pick([2, 3, 4]);
    let b1 = randNonZero(-6, 6);
    while (gcd(a1, b1) !== 1) b1 = randNonZero(-6, 6);
    const a2 = level <= 2 ? a1 * pick([2, 3]) : pick([-5, -3, 3, 5, 7].filter((v) => v % a1 !== 0));
    const c1 = randNonZero(-9, 9);
    let c2 = Math.round((c1 * a2) / a1) + pick([-4, -2, 3, 5]);
    if (a1 * c2 === a2 * c1) c2 += 1;

    const kVal = (a2 * b1) / a1;
    const kTex = formatFractionLatex(a2 * b1, a1);
    const formatAxBy = (A, B) => {
      const xStr = A === 1 ? 'x' : A === -1 ? '-x' : `${A}x`;
      const absB = Math.abs(B);
      const yStr = absB === 1 ? 'y' : `${absB}y`;
      return `${xStr} ${B >= 0 ? '+' : '-'} ${yStr}`;
    };
    const eq1 = `${formatAxBy(a1, b1)} = ${c1}`;
    const eq2 = `${a2 === 1 ? 'x' : a2 === -1 ? '-x' : `${a2}x`} + ky = ${c2}`;

    return {
      skill: 'cemc_enrichment',
      level,
      inputType: 'number',
      nelsonRef: 'Waterloo CEMC Courseware — Parallel Linear Systems (No Solution)',
      promptText: 'Find the exact value of k for which this linear system has NO solution:',
      equationLatex: `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`,
      expectedValue: kVal,
      exactExpectedLatex: kTex,
      hints: [
        'For two distinct lines to have no solution, their slopes must be equal (coefficients of x and y proportional).',
        `Match the ratio a₁ / a₂ = b₁ / k, so ${a1} / (${a2}) = ${b1} / k.`,
      ],
      solutionSteps: [
        `\\text{Parallel condition: } \\frac{${a1}}{${a2}} = \\frac{${b1}}{k} \\neq \\frac{${c1}}{${c2}}`,
        `${a1}k = (${a2})(${b1}) = ${a2 * b1} \\implies k = ${kTex}`,
      ],
    };
  }

  if (mode === 'equidistant_axis') {
    const x1 = randInt(-6, 2);
    const x2 = x1 + pick([2, 3, 4, 5, 6]);
    const y1 = randNonZero(-5, 5);
    const y2 = randNonZero(-5, 5);
    const num = x2 * x2 + y2 * y2 - (x1 * x1 + y1 * y1);
    const den = 2 * (x2 - x1);
    const kVal = num / den;
    const kTex = formatFractionLatex(num, den);

    return {
      skill: 'cemc_enrichment',
      level,
      inputType: 'number',
      nelsonRef: 'Waterloo CEMC Courseware — Analytic Geometry Equidistant Locus',
      promptText: 'Find the exact coordinate k so point P(k, 0) is equidistant from A and B (PA = PB):',
      equationLatex: `P(k, 0), \\quad A(${x1}, ${y1}), \\quad B(${x2}, ${y2})`,
      expectedValue: kVal,
      exactExpectedLatex: kTex,
      hints: [
        'Set the squared distances equal so square roots vanish: PA² = PB².',
        `Expand (k − (${x1}))² + (${y1})² = (k − (${x2}))² + (${y2})²; the k² terms cancel!`,
      ],
      solutionSteps: [
        `(k - (${x1}))^2 + (${y1})^2 = (k - (${x2}))^2 + (${y2})^2`,
        `k^2 ${-2 * x1 >= 0 ? '+' : '-'} ${Math.abs(2 * x1)}k + ${x1 * x1 + y1 * y1} = k^2 ${-2 * x2 >= 0 ? '+' : '-'} ${Math.abs(2 * x2)}k + ${x2 * x2 + y2 * y2}`,
        `${den}k = ${num} \\implies k = ${kTex}`,
      ],
    };
  }

  // Exact trig ratio without a calculator using Pythagorean triple
  const [p, b, q] = pick([
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
    [9, 40, 41],
  ]);
  const askTan = Math.random() < 0.5;
  if (askTan) {
    const sinTex = formatFractionLatex(p, q);
    const tanTex = formatFractionLatex(p, b);
    return {
      skill: 'cemc_enrichment',
      level,
      inputType: 'number',
      nelsonRef: 'Waterloo CEMC Courseware — Exact Trig Ratios Without a Calculator',
      promptText:
        'For acute angle θ (0° < θ < 90°), find the exact value of tan θ as a simplified fraction:',
      equationLatex: `\\sin\\theta = ${sinTex}`,
      expectedValue: p / b,
      exactExpectedLatex: tanTex,
      hints: [
        `Draw a right triangle with Opposite = ${p} and Hypotenuse = ${q}.`,
        `Find Adjacent = √(${q}² − ${p}²) = ${b}, then write tan θ = Opposite / Adjacent.`,
      ],
      solutionSteps: [
        `\\text{By Pythagoras: Adj} = \\sqrt{${q}^2 - ${p}^2} = \\sqrt{${b * b}} = ${b}`,
        `\\tan\\theta = \\frac{\\text{Opp}}{\\text{Adj}} = ${tanTex}`,
      ],
    };
  }

  const cosTex = formatFractionLatex(b, q);
  const sinTex = formatFractionLatex(p, q);
  return {
    skill: 'cemc_enrichment',
    level,
    inputType: 'number',
    nelsonRef: 'Waterloo CEMC Courseware — Exact Trig Ratios Without a Calculator',
    promptText:
      'For acute angle θ (0° < θ < 90°), find the exact value of sin θ as a simplified fraction:',
    equationLatex: `\\cos\\theta = ${cosTex}`,
    expectedValue: p / q,
    exactExpectedLatex: sinTex,
    hints: [
      `Draw a right triangle with Adjacent = ${b} and Hypotenuse = ${q}.`,
      `Find Opposite = √(${q}² − ${b}²) = ${p}, then write sin θ = Opposite / Hypotenuse.`,
    ],
    solutionSteps: [
      `\\text{By Pythagoras: Opp} = \\sqrt{${q}^2 - ${b}^2} = \\sqrt{${p * p}} = ${p}`,
      `\\sin\\theta = \\frac{\\text{Opp}}{\\text{Hyp}} = ${sinTex}`,
    ],
  };
}

let skillCounter = 0;

function generateSkillProblem(skill, level = 1, options = {}) {
  const lvl = Math.min(4, Math.max(1, Number(level) || 1));
  let prob;
  if (skill === 'completing_square') prob = generateCompletingSquare(lvl);
  else if (skill === 'factoring') prob = generateFactoring(lvl, options.technique || 'mixed');
  else if (skill === 'expansion') prob = generateExpansion(lvl);
  else if (skill === 'key_features') prob = generateKeyFeatures(lvl);
  else if (skill === 'find_equation') prob = generateFindEquation(lvl);
  else if (skill === 'finite_differences') prob = generateFiniteDifferences(lvl);
  else if (skill === 'linear_quadratic') prob = generateLinearQuadratic(lvl);
  else if (skill === 'quad_apps') prob = generateQuadAppProblem(lvl);
  else if (skill === 'cemc_enrichment') prob = generateCemcEnrichment(lvl);
  else throw new Error(`Unknown skill: ${skill}`);

  skillCounter += 1;
  prob.id = `sk_${Date.now()}_${skillCounter}`;
  return prob;
}

function checkSkillAnswer(skill, inputRaw, problem) {
  if (skill === 'linear_quadratic') {
    const chosen = Number(inputRaw);
    if (![0, 1, 2].includes(chosen)) {
      return { correct: false, parseError: true, message: 'Select 0, 1, or 2 points of intersection.' };
    }
    const ok = chosen === problem.expectedCount;
    return {
      correct: ok,
      message: ok
        ? `Correct! The system has ${problem.expectedCount} point${problem.expectedCount === 1 ? '' : 's'} of intersection.`
        : `Not quite — check the discriminant of the combined equation.`,
    };
  }

  if (skill === 'finite_differences' && problem.inputType === 'choice') {
    if (!inputRaw) {
      return { correct: false, parseError: true, message: 'Select Linear, Quadratic, or Neither.' };
    }
    const ok = inputRaw === problem.expectedChoice;
    return {
      correct: ok,
      message: ok
        ? 'Correct classification from finite differences!'
        : 'Not quite — compute consecutive 1st and 2nd differences carefully.',
    };
  }

  const raw = String(inputRaw || '').trim();
  if (!raw) {
    return { correct: false, parseError: true, message: 'Please enter an expression or value.' };
  }

  if (
    skill === 'key_features' ||
    skill === 'quad_apps' ||
    skill === 'cemc_enrichment' ||
    (skill === 'finite_differences' && problem.inputType === 'number')
  ) {
    let cleaned = raw.replace(/\u2212/g, '-').trim();
    if (skill === 'key_features' && problem.subType === 'y_int') {
      const ptMatch = cleaned.match(/^\(\s*0\s*,\s*([^)]+)\)$/);
      if (ptMatch) cleaned = ptMatch[1].trim();
      cleaned = cleaned.replace(/^y\s*=\s*/i, '');
    } else if (skill === 'key_features') {
      cleaned = cleaned.replace(/^x\s*=\s*/i, '');
    } else if (skill === 'quad_apps') {
      cleaned = cleaned
        .replace(/^(?:[hARy]\s*=\s*)/i, '')
        .replace(/[$]|(?:\bm\^?2\b|\bsq\.?\s*m\b|\bmet(?:er|re)s?\b|\bm\b|\bsec\b)/gi, '')
        .trim();
    } else if (skill === 'cemc_enrichment') {
      cleaned = cleaned
        .replace(/^(?:k|r\^2\s*\+\s*s\^2|\\?(?:sin|cos|tan)\s*(?:\\theta|theta)?)\s*=\s*/i, '')
        .trim();
    } else {
      cleaned = cleaned.replace(/^a\s*=\s*/i, '');
    }
    try {
      const val = evaluateMathExpression(cleaned);
      const ok = Math.abs(val - problem.expectedValue) < 1e-5;
      return {
        correct: ok,
        message: ok ? 'Correct!' : 'Not quite. Double-check the formula and signs.',
      };
    } catch {
      return { correct: false, parseError: true, message: 'Could not read that number/fraction.' };
    }
  }

  // Algebraic expression checks (completing_square, factoring, expansion, find_equation)
  const { d = 0, a, b, c } = problem.expectedCoeffs;
  const expectedFn = (x) => d * x * x * x + a * x * x + b * x + c;

  let norm;
  try {
    norm = normalizeAlgebraLatex(raw);
    const equiv = isAlgebraicallyEquivalent(raw, expectedFn);
    if (!equiv) {
      return {
        correct: false,
        message: 'Your expression is not algebraically equivalent to the original expression.',
      };
    }
  } catch (err) {
    return {
      correct: false,
      parseError: true,
      message: `Could not parse expression (${err.message}).`,
    };
  }

  if (skill === 'find_equation') {
    return { correct: true, message: 'Correct quadratic equation!' };
  }

  if (skill === 'completing_square') {
    if (!isVertexFormStructure(norm)) {
      return {
        correct: false,
        message: 'Equivalent value, but not yet in vertex form a(x − h)² + k! Make sure you write a squared binomial (x ± h)².',
      };
    }
    return { correct: true, message: 'Exact vertex form! Nice completing the square.' };
  }

  if (skill === 'factoring') {
    if (!norm.includes('(') || hasTopLevelAddSub(norm)) {
      return {
        correct: false,
        message: 'Equivalent value, but not in factored form! Express it as a product of factors without ungrouped + or − terms.',
      };
    }
    return { correct: true, message: 'Correctly factored!' };
  }

  if (skill === 'expansion') {
    const withoutNumericFracs = norm
      .replace(/\(\(-?\d+(?:\.\d+)?\)\/\(-?\d+(?:\.\d+)?\)\)/g, '')
      .replace(/\(\s*-?\d+(?:\.\d+)?\s*\/\s*-?\d+(?:\.\d+)?\s*\)/g, '');
    if (withoutNumericFracs.includes('(') || withoutNumericFracs.includes(')')) {
      return {
        correct: false,
        message: 'Equivalent value, but still has brackets! Expand and combine all like terms into ax² + bx + c.',
      };
    }
    return { correct: true, message: 'Correctly expanded to standard form!' };
  }

  return { correct: false, message: 'Unsupported skill.' };
}
return { SKILL_META, FACTOR_TECHNIQUES, normalizeAlgebraLatex, evalExpressionAtX, generateSkillProblem, checkSkillAnswer };

},

"./transformations.js": function(__require) {
// Quadratic Transformations, Mapping Rules, and Table of Values for MPM2D (Nelson Ch. 4.3 / 4.4)

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNum(n) {
  if (Math.abs(n) < 1e-9) return '0';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function formatSignedOffset(n) {
  if (Math.abs(n) < 1e-9) return '';
  return n > 0 ? ` + ${formatNum(n)}` : ` - ${formatNum(Math.abs(n))}`;
}

function formatVertexEquationLatex(a, h, k) {
  const aStr =
    Math.abs(a - 1) < 1e-9
      ? ''
      : Math.abs(a + 1) < 1e-9
      ? '-'
      : formatNum(a);
  const inner =
    Math.abs(h) < 1e-9
      ? 'x^2'
      : h > 0
      ? `(x - ${formatNum(h)})^2`
      : `(x + ${formatNum(Math.abs(h))})^2`;
  const kStr = formatSignedOffset(k);
  return `y = ${aStr}${inner}${kStr}`;
}

function computeTransformation(source, target) {
  const a1 = Number(source.a) || 1;
  const h1 = Number(source.h) || 0;
  const k1 = Number(source.k) || 0;
  const a2 = Number(target.a) || 1;
  const h2 = Number(target.h) || 0;
  const k2 = Number(target.k) || 0;

  const isParentSource =
    Math.abs(a1 - 1) < 1e-9 && Math.abs(h1) < 1e-9 && Math.abs(k1) < 1e-9;

  const dx = h2 - h1;
  const vScale = a2 / a1;
  const dyOffset = k2 - vScale * k1;

  // Format x' = x + dx
  const xPart = Math.abs(dx) < 1e-9 ? 'x' : `x${formatSignedOffset(dx)}`;

  // Format y' = vScale * y + dyOffset
  const scaleStr =
    Math.abs(vScale - 1) < 1e-9
      ? 'y'
      : Math.abs(vScale + 1) < 1e-9
      ? '-y'
      : `${formatNum(vScale)}y`;
  const yPart = `${scaleStr}${formatSignedOffset(dyOffset)}`;

  const mappingRuleLatex = `(x, y) \\longrightarrow (${xPart}, \\; ${yPart})`;

  let vertexRelativeLatex = null;
  if (!isParentSource) {
    const yShift = Math.abs(k1) < 1e-9 ? 'y' : `(y${formatSignedOffset(-k1)})`;
    const scaleRel =
      Math.abs(vScale - 1) < 1e-9
        ? yShift
        : Math.abs(vScale + 1) < 1e-9
        ? `-${yShift}`
        : `${formatNum(vScale)}${yShift}`;
    vertexRelativeLatex = `(x, y) \\longrightarrow (${xPart}, \\; ${scaleRel}${formatSignedOffset(k2)})`;
  }

  // Nelson MPM2D verbal descriptions
  const descriptions = [];
  if (vScale < 0) {
    descriptions.push('Reflection in the x-axis (vertical flip)');
  }
  const absScale = Math.abs(vScale);
  if (absScale > 1 + 1e-9) {
    descriptions.push(`Vertical stretch by a factor of ${formatNum(absScale)}`);
  } else if (absScale < 1 - 1e-9) {
    descriptions.push(`Vertical compression by a factor of ${formatNum(absScale)}`);
  }
  if (Math.abs(dx) > 1e-9) {
    descriptions.push(
      dx > 0
        ? `Horizontal translation ${formatNum(dx)} unit${Math.abs(dx) === 1 ? '' : 's'} right`
        : `Horizontal translation ${formatNum(Math.abs(dx))} unit${Math.abs(dx) === 1 ? '' : 's'} left`
    );
  }
  if (Math.abs(dyOffset) > 1e-9 && isParentSource) {
    descriptions.push(
      dyOffset > 0
        ? `Vertical translation ${formatNum(dyOffset)} unit${Math.abs(dyOffset) === 1 ? '' : 's'} up`
        : `Vertical translation ${formatNum(Math.abs(dyOffset))} unit${Math.abs(dyOffset) === 1 ? '' : 's'} down`
    );
  } else if (!isParentSource && Math.abs(k2 - k1) > 1e-9) {
    const vk = k2 - k1;
    descriptions.push(
      `Vertex shifts vertically from k₁ = ${formatNum(k1)} to k₂ = ${formatNum(k2)} (${vk > 0 ? '+' : ''}${formatNum(vk)})`
    );
  }
  if (descriptions.length === 0) {
    descriptions.push('No change (identical parabola)');
  }

  // 5 Key Points centered on source vertex
  const tableRows = [-2, -1, 0, 1, 2].map((offset) => {
    const x = h1 + offset;
    const y = a1 * offset * offset + k1;
    const xPrime = x + dx;
    const yPrime = vScale * y + dyOffset;
    return {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      xPrime: Number(xPrime.toFixed(4)),
      yPrime: Number(yPrime.toFixed(4)),
      isVertex: offset === 0,
    };
  });

  // 3-Step Guided Walkthrough
  const step1 = isParentSource
    ? `Identify parameters from ${formatVertexEquationLatex(a2, h2, k2)}: a = ${formatNum(a2)}, h = ${formatNum(h2)}, k = ${formatNum(k2)}.`
    : `Compare source (a₁ = ${formatNum(a1)}, h₁ = ${formatNum(h1)}, k₁ = ${formatNum(k1)}) to target (a₂ = ${formatNum(a2)}, h₂ = ${formatNum(h2)}, k₂ = ${formatNum(k2)}): scale factor a₂/a₁ = ${formatNum(vScale)} and horizontal shift Δx = ${formatNum(dx)}.`;

  const step2 = isParentSource
    ? `Write the mapping rule (x, y) → (x + h, a·y + k): (${xPart}, ${yPart}).`
    : `Write the mapping rule by shifting x by Δx = ${formatNum(dx)} and scaling/shifting y relative to k₁: (x, y) → (${xPart}, ${formatNum(vScale)}(y${formatSignedOffset(-k1)})${formatSignedOffset(k2)}) = (${xPart}, ${yPart}).`;

  const vRow = tableRows[2];
  const step3 = `Apply the mapping rule to the 5 key points around the source vertex (${formatNum(vRow.x)}, ${formatNum(vRow.y)}) → new vertex (${formatNum(vRow.xPrime)}, ${formatNum(vRow.yPrime)}).`;

  return {
    source: { a: a1, h: h1, k: k1 },
    target: { a: a2, h: h2, k: k2 },
    isParentSource,
    dx,
    vScale,
    dyOffset,
    sourceLatex: formatVertexEquationLatex(a1, h1, k1),
    targetLatex: formatVertexEquationLatex(a2, h2, k2),
    mappingRuleLatex,
    vertexRelativeLatex,
    descriptions,
    tableRows,
    steps: [step1, step2, step3],
  };
}

function generateTransformationProblem(tier = 'basic') {
  if (tier === 'basic') {
    const a = pick([-3, -2, -1, -0.5, 0.5, 2, 3]);
    let h = randInt(-5, 5);
    let k = randInt(-6, 6);
    if (h === 0 && k === 0) h = 2;
    return {
      tier: 'basic',
      source: { a: 1, h: 0, k: 0 },
      target: { a, h, k },
    };
  }

  // Challenging / Enrichment: non-parent source parabola -> target parabola
  const a1 = pick([-2, -1, 1, 2]);
  const mult = pick([-2, -1, -0.5, 0.5, 2]);
  const a2 = a1 * mult;
  const h1 = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
  const k1 = pick([-5, -3, -2, -1, 1, 2, 3, 5]);

  let h2 = randInt(-5, 5);
  let k2 = randInt(-6, 6);
  if (h2 === h1 && k2 === k1 && Math.abs(a2 - a1) < 1e-9) {
    h2 = h1 + 2;
    k2 = k1 - 3;
  }

  return {
    tier: 'challenging',
    source: { a: a1, h: h1, k: k1 },
    target: { a: a2, h: h2, k: k2 },
  };
}
return { formatVertexEquationLatex, computeTransformation, generateTransformationProblem };

},

"./linear-engine.js": function(__require) {
// MPM2D Linear Systems Engine (Nelson Principles of Mathematics 10, Ch. 1)
// Graphing Drill (y = mx + b, rise/run, initial value), Substitution, Elimination,
// Number of Solutions (unique, perpendicular, parallel, coincident), and Applications.

const { gcd, formatFractionLatex, evaluateMathExpression } = __require("./math-engine.js");
const LINEAR_SKILL_META = {
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

function formatSlopeInterceptLatex(rise, run, b) {
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

function formatStandardLinearLatex(A, B, C) {
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

function generateLinearProblem(skill = 'graph_drill', level = 1) {
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

function checkPlottedLine(points, line) {
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

function parseOrderedPair(raw) {
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

function checkLinearAnswer(skill, input, problem) {
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
return { LINEAR_SKILL_META, formatSlopeInterceptLatex, formatStandardLinearLatex, generateLinearProblem, checkPlottedLine, parseOrderedPair, checkLinearAnswer };

},

"./geometry-engine.js": function(__require) {
// MPM2D Analytic Geometry Engine (Nelson Principles of Mathematics 10, Ch. 2)
// Covers: Midpoint Formula, Distance Formula, 4 Special Lines, 4 Special Centres,
// and Proving Geometric Properties (with GeoGebra commands).

const { gcd, simplifyRadical, formatFractionLatex, evaluateMathExpression, } = __require("./math-engine.js");
const { parseOrderedPair } = __require("./linear-engine.js");
const GEO_SKILL_META = {
  midpoint: { id: 'midpoint', name: 'Midpoint Formula', short: 'Midpoint' },
  distance: { id: 'distance', name: 'Distance Formula', short: 'Distance' },
  circle_origin: { id: 'circle_origin', name: 'Equation of a Circle', short: 'Circle x²+y²=r²' },
  special_lines: { id: 'special_lines', name: '4 Special Lines', short: 'Special Lines' },
  special_centres: { id: 'special_centres', name: '4 Special Centres', short: 'Special Centres' },
  prove_property: { id: 'prove_property', name: 'Prove Properties', short: 'Prove Props' },
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

function formatHalfNum(num, den = 2) {
  if (num % den === 0) return String(num / den);
  return formatFractionLatex(num, den);
}

// ---------- 1. Midpoint Formula ----------

function generateMidpoint(level) {
  let x1 = randInt(-7, 7);
  let y1 = randInt(-7, 7);
  let x2, y2;

  if (level <= 2) {
    // Integer midpoint (same parity)
    x2 = x1 + 2 * randNonZero(-4, 4);
    y2 = y1 + 2 * randNonZero(-4, 4);
  } else if (level === 3) {
    // Fractional midpoint (at least one opposite parity)
    x2 = x1 + (2 * randInt(-3, 3) + 1);
    y2 = y1 + randNonZero(-5, 5);
  } else {
    // Level 4: Reverse midpoint — given A and midpoint M, find endpoint B
    const mx = randInt(-5, 5);
    const my = randInt(-5, 5);
    x2 = 2 * mx - x1;
    y2 = 2 * my - y1;
    const ggb = [
      `A=(${x1},${y1})`,
      `M=(${mx},${my})`,
      `B=(${x2},${y2})`,
      `Segment(A,B)`,
    ].join('\n');

    return {
      skill: 'midpoint',
      level,
      inputType: 'math',
      nelsonRef: 'Ch. 2.1 — Reverse Midpoint (Finding an Endpoint)',
      promptText: `M(${mx}, ${my}) is the midpoint of segment AB. If endpoint A is (${x1}, ${y1}), find endpoint B(x, y):`,
      equationLatex: `A(${x1}, ${y1}), \\quad M(${mx}, ${my}) \\implies B(x, y) = ?`,
      expectedPoi: { x: x2, y: y2 },
      exactExpectedLatex: `(${x2}, ${y2})`,
      geogebraCommands: ggb,
      hints: [
        `Set up the midpoint equations: (${x1} + x) / 2 = ${mx} and (${y1} + y) / 2 = ${my}.`,
        `Multiply each midpoint coordinate by 2, then subtract A's coordinates.`,
      ],
      solutionSteps: [
        `\\frac{${x1} + x}{2} = ${mx} \\implies ${x1} + x = ${2 * mx} \\implies x = ${x2}`,
        `\\frac{${y1} + y}{2} = ${my} \\implies ${y1} + y = ${2 * my} \\implies y = ${y2}`,
        `B = (${x2}, ${y2})`,
      ],
    };
  }

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const mxTex = formatHalfNum(x1 + x2, 2);
  const myTex = formatHalfNum(y1 + y2, 2);
  const ggb = [
    `A=(${x1},${y1})`,
    `B=(${x2},${y2})`,
    `Segment(A,B)`,
    `M=Midpoint(A,B)`,
  ].join('\n');

  return {
    skill: 'midpoint',
    level,
    inputType: 'math',
    nelsonRef: 'Ch. 2.1 — Midpoint of a Line Segment',
    promptText: 'Find the midpoint M(x, y) of line segment AB:',
    equationLatex: `A(${x1}, ${y1}), \\quad B(${x2}, ${y2})`,
    expectedPoi: { x: mx, y: my },
    exactExpectedLatex: `(${mxTex}, ${myTex})`,
    geogebraCommands: ggb,
    hints: [
      'Use M = ((x₁ + x₂) / 2, (y₁ + y₂) / 2).',
      `Average the x-coordinates (${x1} + ${x2}) / 2 and the y-coordinates (${y1} + ${y2}) / 2.`,
    ],
    solutionSteps: [
      `M = \\left(\\frac{${x1} + (${x2})}{2}, \\; \\frac{${y1} + (${y2})}{2}\\right)`,
      `M = \\left(${mxTex}, \\; ${myTex}\\right)`,
    ],
  };
}

// ---------- 2. Distance Formula ----------

function generateDistance(level) {
  const x1 = randInt(-6, 6);
  const y1 = randInt(-6, 6);
  let dx, dy;

  if (level <= 2) {
    const [a, b] = pick([
      [3, 4],
      [4, 3],
      [6, 8],
      [5, 12],
      [8, 15],
    ]);
    dx = a * pick([1, -1]);
    dy = b * pick([1, -1]);
  } else {
    dx = randNonZero(-6, 6);
    dy = randNonZero(-6, 6);
    while (Number.isInteger(Math.sqrt(dx * dx + dy * dy))) {
      dy = randNonZero(-6, 6);
    }
  }

  const x2 = x1 + dx;
  const y2 = y1 + dy;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);
  const { coeff, radicand } = simplifyRadical(distSq);
  const exactTex =
    radicand === 1
      ? String(coeff)
      : coeff === 1
      ? `\\sqrt{${radicand}}`
      : `${coeff}\\sqrt{${radicand}}`;

  const ggb = [`A=(${x1},${y1})`, `B=(${x2},${y2})`, `d=Distance(A,B)`].join('\n');

  return {
    skill: 'distance',
    level,
    inputType: 'number',
    nelsonRef: 'Ch. 2.2 — Length of a Line Segment (Distance Formula)',
    promptText: 'Find the exact length of line segment AB (e.g. 5 or 2√5):',
    equationLatex: `A(${x1}, ${y1}), \\quad B(${x2}, ${y2})`,
    expectedValue: dist,
    exactExpectedLatex: exactTex,
    geogebraCommands: ggb,
    hints: [
      'Use d = √((x₂ − x₁)² + (y₂ − y₁)²).',
      `Δx = ${dx} and Δy = ${dy}, so d = √((${dx})² + (${dy})²) = √${distSq}.`,
    ],
    solutionSteps: [
      `d = \\sqrt{(${x2} - (${x1}))^2 + (${y2} - (${y1}))^2}`,
      `d = \\sqrt{(${dx})^2 + (${dy})^2} = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${distSq}}`,
      `d = ${exactTex}`,
    ],
  };
}

// ---------- 3. Four Special Lines ----------

const SPECIAL_LINE_OPTIONS = [
  { id: 'median', label: 'Median' },
  { id: 'altitude', label: 'Altitude' },
  { id: 'right_bisector', label: 'Right Bisector' },
  { id: 'angle_bisector', label: 'Angle Bisector' },
];

function generateSpecialLines(level) {
  if (level <= 2) {
    const prompts = [
      {
        id: 'median',
        q: 'Which special line connects a vertex of a triangle to the midpoint of the opposite side?',
        eq: '\\text{Vertex } A \\longrightarrow \\text{Midpoint } M_{BC}',
        hint1: 'It splits the opposite side into two equal halves, starting from a vertex.',
        hint2: 'Think of "median" as middle — it goes from a vertex to the middle of the opposite side.',
        step: '\\text{A Median joins a vertex to the midpoint of the opposite side (divides the triangle into two equal areas).}',
      },
      {
        id: 'altitude',
        q: 'Which special line is drawn from a vertex perpendicular (90°) to the opposite side?',
        eq: '\\text{Vertex } A \\perp \\text{Side } BC',
        hint1: 'This line represents the height of the triangle from that vertex.',
        hint2: 'It uses the negative-reciprocal slope of the opposite side and passes through the vertex.',
        step: '\\text{An Altitude passes through a vertex and is perpendicular (}\\perp\\text{) to the opposite side.}',
      },
      {
        id: 'right_bisector',
        q: 'Which special line is perpendicular (90°) to a segment AND passes through its midpoint (not necessarily through the opposite vertex)?',
        eq: '\\ell \\perp AB \\text{ through } M_{AB}',
        hint1: 'Every point on this line is equidistant from both endpoints A and B.',
        hint2: 'It is a perpendicular bisector — also called a right bisector in Nelson MPM2D.',
        step: '\\text{A Right Bisector passes through the midpoint of a segment and is perpendicular to it.}',
      },
      {
        id: 'angle_bisector',
        q: 'Which special line divides an interior angle of a triangle into two congruent (equal) angles?',
        eq: '\\angle BAP = \\angle PAC',
        hint1: 'Every point on this ray is equidistant from the two sides forming the angle.',
        hint2: 'It splits the vertex angle in half.',
        step: '\\text{An Angle Bisector cuts an interior angle into two equal angles.}',
      },
    ];
    const item = pick(prompts);
    return {
      skill: 'special_lines',
      level,
      inputType: 'choice',
      choices: SPECIAL_LINE_OPTIONS,
      nelsonRef: 'Ch. 2.4 — Properties of Triangles (4 Special Lines)',
      promptText: item.q,
      equationLatex: item.eq,
      expectedChoice: item.id,
      exactExpectedLatex: item.label || item.id,
      geogebraCommands: 'A=(0,4)\nB=(-3,0)\nC=(5,0)\nPolygon(A,B,C)',
      hints: [item.hint1, item.hint2],
      solutionSteps: [item.step],
    };
  }

  // Level 3-4: Calculate slope of an Altitude or Right Bisector
  const isAltitude = Math.random() < 0.5;
  const x1 = randInt(-4, 4);
  const y1 = randInt(-4, 4);
  let dx = randNonZero(-4, 4);
  let dy = randNonZero(-4, 4);
  while (gcd(dx, dy) !== 1) dy = randNonZero(-4, 4);

  const x2 = x1 + dx;
  const y2 = y1 + dy;
  // Side slope = dy / dx -> perpendicular slope = -dx / dy
  const perpSlope = -dx / dy;
  const sideTex = formatFractionLatex(dy, dx);
  const perpTex = formatFractionLatex(-dx, dy);

  const lineName = isAltitude ? 'Altitude from A to BC' : 'Right Bisector of AB';
  const eq = isAltitude
    ? `B(${x1}, ${y1}), \\; C(${x2}, ${y2}) \\implies m_{\\text{altitude}} = ?`
    : `A(${x1}, ${y1}), \\; B(${x2}, ${y2}) \\implies m_{\\text{right bisector}} = ?`;

  return {
    skill: 'special_lines',
    level,
    inputType: 'number',
    nelsonRef: 'Ch. 2.4 — Slope of an Altitude / Right Bisector',
    promptText: `Find the slope of the ${lineName} (enter an integer or fraction like -3/2):`,
    equationLatex: eq,
    expectedValue: perpSlope,
    exactExpectedLatex: perpTex,
    geogebraCommands: `P=(${x1},${y1})\nQ=(${x2},${y2})\nSegment(P,Q)\nPerpendicularBisector(P,Q)`,
    hints: [
      `First compute the slope of the segment: m = (y₂ − y₁) / (x₂ − x₁) = ${dy}/${dx}.`,
      `Since the ${isAltitude ? 'altitude' : 'right bisector'} is perpendicular, take the negative reciprocal: −1 / m.`,
    ],
    solutionSteps: [
      `m_{\\text{segment}} = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = ${sideTex}`,
      `\\text{Negative reciprocal slope: } m_{\\perp} = ${perpTex}`,
    ],
  };
}

// ---------- 4. Four Special Centres ----------

const SPECIAL_CENTRE_OPTIONS = [
  { id: 'centroid', label: 'Centroid' },
  { id: 'circumcentre', label: 'Circumcentre' },
  { id: 'orthocentre', label: 'Orthocentre' },
  { id: 'incentre', label: 'Incentre' },
];

function generateSpecialCentres(level) {
  if (level <= 2) {
    const prompts = [
      {
        id: 'centroid',
        q: 'Which triangle centre is the intersection of the three MEDIANS (and is the triangle’s centre of mass)?',
        eq: '\\text{Medians intersect at } G',
        hint1: 'Remember: Medians meet at the balancing point (2:1 ratio along each median).',
        hint2: 'G = ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3) gives its coordinates.',
        step: '\\text{The Centroid is the intersection of the 3 medians.}',
      },
      {
        id: 'circumcentre',
        q: 'Which triangle centre is the intersection of the three RIGHT BISECTORS (equidistant from all 3 vertices)?',
        eq: '\\text{Right Bisectors intersect at } O',
        hint1: 'It is the centre of the circumscribed circle passing through A, B, and C.',
        hint2: 'Right bisectors meet at the Circumcentre (can lie outside an obtuse triangle).',
        step: '\\text{The Circumcentre is the intersection of the 3 right bisectors and is equidistant from vertices A, B, and C.}',
      },
      {
        id: 'orthocentre',
        q: 'Which triangle centre is the intersection of the three ALTITUDES?',
        eq: '\\text{Altitudes intersect at } H',
        hint1: 'Each line goes from a vertex perpendicular to the opposite side.',
        hint2: '"Ortho-" means right-angle (perpendicular) — Orthocentre.',
        step: '\\text{The Orthocentre is the intersection of the 3 altitudes.}',
      },
      {
        id: 'incentre',
        q: 'Which triangle centre is the intersection of the three ANGLE BISECTORS (equidistant from all 3 sides)?',
        eq: '\\text{Angle Bisectors intersect at } I',
        hint1: 'It is the centre of the inscribed circle tangent to all three sides.',
        hint2: 'Angle bisectors meet at the Incentre, which is always inside the triangle.',
        step: '\\text{The Incentre is the intersection of the 3 angle bisectors.}',
      },
    ];
    const item = pick(prompts);
    return {
      skill: 'special_centres',
      level,
      inputType: 'choice',
      choices: SPECIAL_CENTRE_OPTIONS,
      nelsonRef: 'Ch. 2.4 / Extension — Four Triangle Centres',
      promptText: item.q,
      equationLatex: item.eq,
      expectedChoice: item.id,
      exactExpectedLatex: item.id,
      geogebraCommands: 'A=(0,5)\nB=(-4,0)\nC=(4,0)\nPolygon(A,B,C)\nTriangleCenter(A,B,C,2)',
      hints: [item.hint1, item.hint2],
      solutionSteps: [item.step],
    };
  }

  // Level 3-4: Compute Centroid G = ((x1+x2+x3)/3, (y1+y2+y3)/3)
  const x1 = randInt(-5, 5);
  const y1 = randInt(-5, 5);
  const x2 = randInt(-5, 5);
  const y2 = randInt(-5, 5);
  let x3 = randInt(-5, 5);
  let y3 = randInt(-5, 5);

  if (level === 3) {
    // Ensure clean integer centroid
    while ((x1 + x2 + x3) % 3 !== 0) x3++;
    while ((y1 + y2 + y3) % 3 !== 0) y3++;
  }
  // Prevent collinearity
  if ((x2 - x1) * (y3 - y1) === (y2 - y1) * (x3 - x1)) {
    y3 += 3;
  }

  const gx = (x1 + x2 + x3) / 3;
  const gy = (y1 + y2 + y3) / 3;
  const gxTex = formatFractionLatex(x1 + x2 + x3, 3);
  const gyTex = formatFractionLatex(y1 + y2 + y3, 3);

  const ggb = [
    `A=(${x1},${y1})`,
    `B=(${x2},${y2})`,
    `C=(${x3},${y3})`,
    `Polygon(A,B,C)`,
    `G=(A+B+C)/3`,
  ].join('\n');

  return {
    skill: 'special_centres',
    level,
    inputType: 'math',
    nelsonRef: 'Ch. 2.4 — Centroid Coordinates',
    promptText: 'Find the Centroid G(x, y) (intersection of medians) of △ABC:',
    equationLatex: `A(${x1}, ${y1}), \\; B(${x2}, ${y2}), \\; C(${x3}, ${y3})`,
    expectedPoi: { x: gx, y: gy },
    exactExpectedLatex: `(${gxTex}, ${gyTex})`,
    geogebraCommands: ggb,
    hints: [
      'The centroid is the average of all three vertices: G = ((x₁ + x₂ + x₃)/3, (y₁ + y₂ + y₃)/3).',
      `Compute (${x1} + ${x2} + ${x3}) / 3 and (${y1} + ${y2} + ${y3}) / 3.`,
    ],
    solutionSteps: [
      `G = \\left(\\frac{${x1} + (${x2}) + (${x3})}{3}, \\; \\frac{${y1} + (${y2}) + (${y3})}{3}\\right)`,
      `G = (${gxTex}, \\; ${gyTex})`,
    ],
  };
}

// ---------- 5. Prove Geometric Properties ----------

function generateProveProperty(level) {
  const x0 = randInt(-3, 3);
  const y0 = randInt(-3, 3);
  const family =
    level === 1
      ? pick(['triangle', 'circle'])
      : level === 2
      ? pick(['triangle', 'quad'])
      : pick(['triangle', 'quad', 'circle']);

  if (family === 'circle') {
    const r = pick([5, 10, 13]);
    const triples =
      r === 5
        ? [3, 4]
        : r === 10
        ? [6, 8]
        : [5, 12];
    const outcome = pick(['inside', 'on', 'outside']);
    let px = triples[0] * pick([1, -1]);
    let py = triples[1] * pick([1, -1]);
    if (outcome === 'inside') px = px > 0 ? px - 1 : px + 1;
    else if (outcome === 'outside') py = py > 0 ? py + 1 : py - 1;

    const dSq = px * px + py * py;
    const rSq = r * r;
    const comp = outcome === 'on' ? '=' : outcome === 'inside' ? '<' : '>';

    return {
      skill: 'prove_property',
      level,
      inputType: 'choice',
      choices: [
        { id: 'inside', label: 'Inside the Circle' },
        { id: 'on', label: 'On the Circle' },
        { id: 'outside', label: 'Outside the Circle' },
      ],
      nelsonRef: 'Ch. 2.3 / 2.6 — Circle Equation & Distance Proof',
      promptText: `Use the Distance Formula from O(0, 0) to prove whether P(${px}, ${py}) lies inside, on, or outside the circle x² + y² = ${rSq}:`,
      equationLatex: `x^2 + y^2 = ${rSq}, \\quad P(${px}, ${py})`,
      expectedChoice: outcome,
      exactExpectedLatex: outcome,
      geogebraCommands: `x^2+y^2=${rSq}\nP=(${px},${py})\nSegment((0,0),P)`,
      hints: [
        `Compute OP² = x² + y² = (${px})² + (${py})² and compare it to r² = ${rSq}.`,
        `OP² < r² → Inside; OP² = r² → On; OP² > r² → Outside.`,
      ],
      solutionSteps: [
        `d_{OP}^2 = (${px})^2 + (${py})^2 = ${px * px} + ${py * py} = ${dSq}`,
        `\\text{Compare with } r^2 = ${rSq}: \\; ${dSq} ${comp} ${rSq}`,
        `\\text{Therefore } P(${px}, ${py}) \\text{ is ${outcome === 'on' ? 'on the circle' : `${outcome} the circle`}.}`,
      ],
    };
  }

  if (family === 'triangle') {
    const kind = pick(['right_scalene', 'isosceles', 'right_isosceles']);
    const choices = [
      { id: 'right_scalene', label: 'Right-Angled Scalene' },
      { id: 'isosceles', label: 'Isosceles (Not Right)' },
      { id: 'right_isosceles', label: 'Right-Angled Isosceles' },
    ];

    let A, B, C, steps, hints;
    if (kind === 'right_scalene') {
      const u = pick([1, 2]);
      const v = pick([2, 3]);
      A = [x0, y0];
      B = [x0 + u, y0 + v];
      C = [x0 - 2 * v, y0 + 2 * u]; // AB ⊥ AC and |AC| = 2|AB|
      const ab2 = u * u + v * v;
      const ac2 = 4 * ab2;
      const bc2 = ab2 + ac2;
      steps = [
        `AB^2 = ${ab2}, \\; AC^2 = ${ac2}, \\; BC^2 = ${bc2}`,
        `AB^2 + AC^2 = ${ab2} + ${ac2} = ${bc2} = BC^2 \\text{ (or } m_{AB}\\cdot m_{AC} = -1\\text{)}`,
        `\\text{All sides have different lengths and } \\angle A = 90^\\circ \\implies \\text{Right-Angled Scalene.}`,
      ];
      hints = [
        'Calculate all three side lengths squared (AB², AC², BC²) using the Distance Formula.',
        'Check Pythagoras (a² + b² = c²) or perpendicular slopes (m₁·m₂ = -1), and compare side lengths.',
      ];
    } else if (kind === 'isosceles') {
      // Base BC horizontal or vertical, apex height h != b so not right and not equilateral
      const b = 3;
      const h = 5;
      A = [x0, y0 + h];
      B = [x0 - b, y0];
      C = [x0 + b, y0];
      steps = [
        `AB = \\sqrt{3^2 + 5^2} = \\sqrt{34}, \\; AC = \\sqrt{3^2 + 5^2} = \\sqrt{34}, \\; BC = 6`,
        `AB = AC \\neq BC \\text{ and } 34 + 34 = 68 \\neq 36`,
        `\\text{Two equal sides, not right-angled} \\implies \\text{Isosceles (Not Right).}`,
      ];
      hints = [
        'Compute AB, AC, and BC with the Distance Formula.',
        'Two sides are equal (√34), while AB² + AC² ≠ BC².',
      ];
    } else {
      const u = pick([2, 3]);
      const v = pick([1, 2]);
      A = [x0, y0];
      B = [x0 + u, y0 + v];
      C = [x0 - v, y0 + u];
      const ab2 = u * u + v * v;
      steps = [
        `AB^2 = ${ab2}, \\; AC^2 = ${ab2}, \\; BC^2 = ${2 * ab2}`,
        `AB = AC \\text{ (Isosceles) and } AB^2 + AC^2 = BC^2 \\; (\\angle A = 90^\\circ)`,
        `\\text{Therefore } \\triangle ABC \\text{ is Right-Angled Isosceles.}`,
      ];
      hints = [
        'Compute AB², AC², and BC² using the Distance Formula.',
        'Check both whether two sides are equal AND whether a² + b² = c².',
      ];
    }

    const ggb = [
      `A=(${A[0]},${A[1]})`,
      `B=(${B[0]},${B[1]})`,
      `C=(${C[0]},${C[1]})`,
      `Polygon(A,B,C)`,
    ].join('\n');

    return {
      skill: 'prove_property',
      level,
      inputType: 'choice',
      choices,
      nelsonRef: 'Ch. 2.5 — Verifying Geometric Properties (Triangles)',
      promptText: 'Use Distance & Slope formulas to prove the exact classification of △ABC:',
      equationLatex: `A(${A[0]}, ${A[1]}), \\; B(${B[0]}, ${B[1]}), \\; C(${C[0]}, ${C[1]})`,
      expectedChoice: kind,
      exactExpectedLatex: kind,
      geogebraCommands: ggb,
      hints,
      solutionSteps: steps,
    };
  }

  // Quadrilateral classification
  const kind = pick(['square', 'rectangle', 'rhombus', 'parallelogram']);
  const choices = [
    { id: 'square', label: 'Square' },
    { id: 'rectangle', label: 'Rectangle (Non-Square)' },
    { id: 'rhombus', label: 'Rhombus (Non-Square)' },
    { id: 'parallelogram', label: 'Parallelogram (Neither)' },
  ];

  let A, B, C, D, steps, hints;
  if (kind === 'square') {
    const u = pick([2, 3]);
    const v = pick([1, 2]);
    A = [x0, y0];
    B = [x0 + u, y0 + v];
    C = [B[0] - v, B[1] + u];
    D = [x0 - v, y0 + u];
    const s2 = u * u + v * v;
    steps = [
      `AB = BC = CD = DA = \\sqrt{${s2}} \\text{ (all 4 sides equal)}`,
      `m_{AB} = \\frac{${v}}{${u}}, \\; m_{BC} = \\frac{${u}}{${-v}} \\implies m_{AB}\\cdot m_{BC} = -1 \\text{ (} 90^\\circ \\text{ corners)}`,
      `\\text{Equal sides + right angles} \\implies \\text{Square.}`,
    ];
    hints = [
      'Check the 4 side lengths with the Distance Formula and adjacent slopes.',
      'All 4 sides are equal AND adjacent slopes are negative reciprocals.',
    ];
  } else if (kind === 'rectangle') {
    const u = pick([1, 2]);
    const v = pick([2, 3]);
    A = [x0, y0];
    B = [x0 + u, y0 + v];
    C = [B[0] - 2 * v, B[1] + 2 * u];
    D = [x0 - 2 * v, y0 + 2 * u];
    const s1 = u * u + v * v;
    steps = [
      `AB = CD = \\sqrt{${s1}}, \\; BC = DA = \\sqrt{${4 * s1}} \\text{ (opposite sides equal, adjacent unequal)}`,
      `m_{AB}\\cdot m_{BC} = -1 \\text{ (} 90^\\circ \\text{ corners)}`,
      `\\text{Therefore } ABCD \\text{ is a Rectangle (Non-Square).}`,
    ];
    hints = [
      'Compare side lengths (opposite vs. adjacent) and adjacent slopes.',
      'Adjacent sides are perpendicular (m₁·m₂ = -1), but have different lengths.',
    ];
  } else if (kind === 'rhombus') {
    // Vectors (4, 3) and (5, 0) -> both length 5, not perpendicular!
    A = [x0, y0];
    B = [x0 + 4, y0 + 3];
    C = [x0 + 9, y0 + 3];
    D = [x0 + 5, y0];
    steps = [
      `AB = \\sqrt{4^2 + 3^2} = 5, \\; BC = 5, \\; CD = 5, \\; DA = 5 \\text{ (all 4 sides equal)}`,
      `m_{AB} = \\frac{3}{4}, \\; m_{AD} = 0 \\implies \\text{adjacent sides are NOT perpendicular}`,
      `\\text{Therefore } ABCD \\text{ is a Rhombus (Non-Square).}`,
    ];
    hints = [
      'Compute all 4 side lengths using the Distance Formula.',
      'All 4 sides equal 5, so check adjacent slopes to see if angles are 90° or not.',
    ];
  } else {
    // Parallelogram: vectors (5, 0) and (2, 3) -> lengths 5 and sqrt(13), not perpendicular
    A = [x0, y0];
    B = [x0 + 5, y0];
    C = [x0 + 7, y0 + 3];
    D = [x0 + 2, y0 + 3];
    steps = [
      `AB = CD = 5 \\text{ (both slope } 0), \\; BC = DA = \\sqrt{13} \\text{ (both slope } \\frac{3}{2})`,
      `\\text{Adjacent sides have unequal lengths and are NOT perpendicular}`,
      `\\text{Therefore } ABCD \\text{ is a Parallelogram.}`,
    ];
    hints = [
      'Check side lengths and slopes of all four sides AB, BC, CD, DA.',
      'Opposite sides are parallel and equal, but adjacent sides are neither equal nor perpendicular.',
    ];
  }

  const ggb = [
    `A=(${A[0]},${A[1]})`,
    `B=(${B[0]},${B[1]})`,
    `C=(${C[0]},${C[1]})`,
    `D=(${D[0]},${D[1]})`,
    `Polygon(A,B,C,D)`,
  ].join('\n');

  return {
    skill: 'prove_property',
    level,
    inputType: 'choice',
    choices,
    nelsonRef: 'Ch. 2.5 / 2.7 — Proving Quadrilateral Properties',
    promptText: 'Use Distance & Slope formulas to prove the exact classification of quadrilateral ABCD:',
    equationLatex: `A(${A[0]}, ${A[1]}), \\; B(${B[0]}, ${B[1]}), \\; C(${C[0]}, ${C[1]}), \\; D(${D[0]}, ${D[1]})`,
    expectedChoice: kind,
    exactExpectedLatex: kind,
    geogebraCommands: ggb,
    hints,
    solutionSteps: steps,
  };
}

function generateCircleProblem(level) {
  if (level === 1) {
    const r = randInt(3, 12);
    const rSq = r * r;
    return {
      skill: 'circle_origin',
      level,
      inputType: 'number',
      nelsonRef: 'Ch. 2.3 — Equation of a Circle x² + y² = r²',
      promptText: 'Determine the radius r of the circle centred at the origin (0, 0):',
      equationLatex: `x^2 + y^2 = ${rSq}`,
      expectedValue: r,
      exactExpectedLatex: String(r),
      geogebraCommands: [`x^2 + y^2 = ${rSq}`, 'A=(0,0)', `B=(${r},0)`, 'Segment(A,B)'].join('\n'),
      hints: [
        'Compare the equation with x² + y² = r² (circle centred at the origin).',
        `Since r² = ${rSq} and radius r > 0, take r = √${rSq}.`,
      ],
      solutionSteps: [
        `x^2 + y^2 = r^2 \\implies r^2 = ${rSq}`,
        `r = \\sqrt{${rSq}} = ${r} \\; (r > 0)`,
      ],
    };
  }

  if (level === 2) {
    const [a0, b0, r] = pick([
      [3, 4, 5],
      [5, 12, 13],
      [6, 8, 10],
      [8, 15, 17],
      [9, 12, 15],
    ]);
    const [u, v] = Math.random() < 0.5 ? [a0, b0] : [b0, a0];
    const px = pick([1, -1]) * u;
    const py = pick([1, -1]) * v;
    const rSq = r * r;
    return {
      skill: 'circle_origin',
      level,
      inputType: 'number',
      nelsonRef: 'Ch. 2.3 — Radius of a Circle Through a Point',
      promptText: 'A circle centred at O(0, 0) passes through point P. Find its exact radius r:',
      equationLatex: `\\text{Centre } O(0, 0), \\quad P(${px}, ${py})`,
      expectedValue: r,
      exactExpectedLatex: String(r),
      geogebraCommands: ['O=(0,0)', `P=(${px},${py})`, 'Circle(O,P)'].join('\n'),
      hints: [
        'Substitute P(x, y) into the circle equation r² = x² + y².',
        `Compute (${px})² + (${py})² = ${px * px} + ${py * py} = ${rSq}, then take √${rSq}.`,
      ],
      solutionSteps: [
        `r^2 = x^2 + y^2 = (${px})^2 + (${py})^2 = ${px * px} + ${py * py} = ${rSq}`,
        `r = \\sqrt{${rSq}} = ${r} \\quad (\\text{Equation: } x^2 + y^2 = ${rSq})`,
      ],
    };
  }

  // Levels 3 & 4: Classify whether point P lies Inside, On, or Outside x^2 + y^2 = r^2
  const relation = pick(['inside', 'on', 'outside']);
  const [a0, b0, rBase] = pick(
    level === 4
      ? [
          [3, 4, 5],
          [5, 12, 13],
        ]
      : [
          [3, 4, 5],
          [5, 12, 13],
          [6, 8, 10],
        ]
  );
  const [baseX, baseY] = Math.random() < 0.5 ? [a0, b0] : [b0, a0];
  let numX = pick([1, -1]) * baseX;
  let numY = pick([1, -1]) * baseY;
  if (relation === 'inside') {
    numX = pick([1, -1]) * (baseX - 1);
  } else if (relation === 'outside') {
    numX = pick([1, -1]) * (baseX + 1);
  }

  const den = level === 4 ? 2 : 1;
  const rSqNum = rBase * rBase;
  const lhsNum = numX * numX + numY * numY;
  const lhsTex = den === 1 ? String(lhsNum) : formatFractionLatex(lhsNum, 4);
  const rhsTex = den === 1 ? String(rSqNum) : formatFractionLatex(rSqNum, 4);
  const pxTex = den === 1 ? String(numX) : formatFractionLatex(numX, 2);
  const pyTex = den === 1 ? String(numY) : formatFractionLatex(numY, 2);
  const eqLatex = `x^2 + y^2 = ${rhsTex}, \\quad P\\!\\left(${pxTex}, \\; ${pyTex}\\right)`;
  const cmpSym = relation === 'inside' ? '<' : relation === 'outside' ? '>' : '=';
  const cmpLabel = relation === 'inside' ? 'Inside' : relation === 'outside' ? 'Outside' : 'On';
  const ggbRadSq = den === 1 ? rSqNum : rSqNum / 4;

  return {
    skill: 'circle_origin',
    level,
    inputType: 'choice',
    choices: [
      { id: 'inside', label: 'Inside the circle (x² + y² < r²)' },
      { id: 'on', label: 'On the circle (x² + y² = r²)' },
      { id: 'outside', label: 'Outside the circle (x² + y² > r²)' },
    ],
    nelsonRef: 'Ch. 2.3 — Point Position Relative to x² + y² = r²',
    promptText: 'Determine whether point P lies inside, on, or outside the circle:',
    equationLatex: eqLatex,
    expectedChoice: relation,
    exactExpectedLatex: relation,
    geogebraCommands: [
      `x^2 + y^2 = ${ggbRadSq}`,
      `P=(${numX / den},${numY / den})`,
    ].join('\n'),
    hints: [
      'Evaluate x² + y² at point P and compare it with r².',
      `If x² + y² < r² -> Inside; equal -> On; > r² -> Outside.`,
    ],
    solutionSteps: [
      `\\text{Substitute } P:\\; \\left(${pxTex}\\right)^2 + \\left(${pyTex}\\right)^2 = ${lhsTex}`,
      `\\text{Compare with } r^2 = ${rhsTex}: \\; ${lhsTex} ${cmpSym} ${rhsTex} \\implies \\text{Point P is ${cmpLabel} the circle.}`,
    ],
  };
}

let geoCounter = 0;

function generateGeometryProblem(skill = 'midpoint', level = 1) {
  const lvl = Math.min(4, Math.max(1, Number(level) || 1));
  let prob;
  if (skill === 'midpoint') prob = generateMidpoint(lvl);
  else if (skill === 'distance') prob = generateDistance(lvl);
  else if (skill === 'circle_origin') prob = generateCircleProblem(lvl);
  else if (skill === 'special_lines') prob = generateSpecialLines(lvl);
  else if (skill === 'special_centres') prob = generateSpecialCentres(lvl);
  else if (skill === 'prove_property') prob = generateProveProperty(lvl);
  else throw new Error(`Unknown geometry skill: ${skill}`);

  geoCounter += 1;
  prob.id = `geo_${Date.now()}_${geoCounter}`;
  return prob;
}

function checkGeometryAnswer(skill, input, problem) {
  if (problem.inputType === 'choice') {
    if (!input) {
      return { correct: false, parseError: true, message: 'Select an option.' };
    }
    const ok = input === problem.expectedChoice;
    return {
      correct: ok,
      message: ok
        ? 'Correct! Proof/property verified.'
        : 'Not quite — review the geometric definition, slopes, and distances.',
    };
  }

  if (problem.inputType === 'math') {
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
        ? 'Exact coordinates!'
        : 'Not quite. Double-check your coordinate averaging and signs.',
    };
  }

  // inputType === 'number' (Distance or Slope)
  const raw = String(input || '').trim().replace(/\u2212/g, '-').replace(/\u221a/g, '\\sqrt');
  if (!raw) {
    return { correct: false, parseError: true, message: 'Enter an exact number, fraction, or radical.' };
  }
  try {
    const cleaned = raw.replace(/^[mdr]\s*=\s*/i, '');
    const val = evaluateMathExpression(cleaned);
    const diff = Math.abs(val - problem.expectedValue);
    if (diff < 1e-5) {
      return { correct: true, message: 'Exact match!' };
    }
    if (diff < 0.02) {
      return {
        correct: true,
        isApprox: true,
        message: 'Correct decimal approximation! (Exact radical/fraction form is preferred in MPM2D.)',
      };
    }
    return { correct: false, message: 'Not quite right. Check your Distance/Slope formula calculation.' };
  } catch {
    return { correct: false, parseError: true, message: 'Could not read that value. Try e.g. 5, -3/2, or 2√5.' };
  }
}
return { GEO_SKILL_META, generateGeometryProblem, checkGeometryAnswer };

},

"./trig-engine.js": function(__require) {
// MPM2D Trigonometry Engine (Nelson Principles of Mathematics 10, Ch. 7 & 8)
// Covers: Sine, Cosine, Tangent, Primary Mix, Right-Triangle Applications,
// Sine Law, Cosine Law, Acute-Triangle Mix, and Acute-Triangle Applications.

const { evaluateMathExpression } = __require("./math-engine.js");
const TRIG_SKILL_META = {
  similar_triangles: { id: 'similar_triangles', name: 'Similar Triangles (AA / SAS~ / SSS~)', short: 'Similar △' },
  sine: { id: 'sine', name: 'Sine Ratio', short: 'Sine' },
  cosine: { id: 'cosine', name: 'Cosine Ratio', short: 'Cosine' },
  tangent: { id: 'tangent', name: 'Tangent Ratio', short: 'Tangent' },
  sohcahtoa_mix: { id: 'sohcahtoa_mix', name: 'Primary Ratios Mix', short: 'SOH-CAH-TOA Mix' },
  right_app: { id: 'right_app', name: 'Right-Tri Applications', short: 'Right Apps' },
  sine_law: { id: 'sine_law', name: 'Sine Law', short: 'Sine Law' },
  cosine_law: { id: 'cosine_law', name: 'Cosine Law', short: 'Cosine Law' },
  acute_mix: { id: 'acute_mix', name: 'Sine & Cosine Law Mix', short: 'Sine/Cos Mix' },
  acute_app: { id: 'acute_app', name: 'Acute-Tri Applications', short: 'Acute Apps' },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function formatMeasure(level, min, max) {
  const base = randInt(min, max);
  if (level >= 3) {
    return Number((base + pick([0.2, 0.4, 0.5, 0.6, 0.8])).toFixed(1));
  }
  return base;
}

// ---------- Primary Trig Ratios (Ch. 7) ----------

function generatePrimaryTrig(ratio, level, skillId) {
  const theta = randInt(24, 65);
  const unit = pick(['cm', 'm']);
  const findAngle = level >= 2 && Math.random() < 0.4;

  if (findAngle) {
    let opp, adj, hyp;
    if (ratio === 'sine') {
      hyp = formatMeasure(level, 12, 26);
      opp = round1(hyp * Math.sin(degToRad(theta)));
      if (opp >= hyp) opp = round1(hyp - 1.5);
      const ans = radToDeg(Math.asin(opp / hyp));
      return {
        skill: skillId,
        level,
        nelsonRef: 'Ch. 7.4 — Finding an Angle Using Sine (sin⁻¹)',
        promptText: `Find the unknown angle θ to the nearest tenth of a degree:`,
        equationLatex: `\\text{Opposite} = ${opp}\\text{ ${unit}}, \\quad \\text{Hypotenuse} = ${hyp}\\text{ ${unit}}`,
        expectedValue: ans,
        unit: '°',
        diagram: {
          type: 'right',
          angleLabel: 'θ',
          oppLabel: `${opp} ${unit}`,
          adjLabel: '',
          hypLabel: `${hyp} ${unit}`,
          target: 'angle',
        },
        hints: [
          'You are given the Opposite side and the Hypotenuse. Which ratio uses Opp and Hyp?',
          `Use sin(θ) = ${opp} / ${hyp}, then apply inverse sine: θ = sin⁻¹(${opp} / ${hyp}).`,
        ],
        solutionSteps: [
          `\\sin\\theta = \\frac{\\text{Opp}}{\\text{Hyp}} = \\frac{${opp}}{${hyp}}`,
          `\\theta = \\sin^{-1}\\left(\\frac{${opp}}{${hyp}}\\right) \\approx ${ans.toFixed(1)}^\\circ`,
        ],
      };
    }

    if (ratio === 'cosine') {
      hyp = formatMeasure(level, 12, 26);
      adj = round1(hyp * Math.cos(degToRad(theta)));
      if (adj >= hyp) adj = round1(hyp - 1.5);
      const ans = radToDeg(Math.acos(adj / hyp));
      return {
        skill: skillId,
        level,
        nelsonRef: 'Ch. 7.4 — Finding an Angle Using Cosine (cos⁻¹)',
        promptText: `Find the unknown angle θ to the nearest tenth of a degree:`,
        equationLatex: `\\text{Adjacent} = ${adj}\\text{ ${unit}}, \\quad \\text{Hypotenuse} = ${hyp}\\text{ ${unit}}`,
        expectedValue: ans,
        unit: '°',
        diagram: {
          type: 'right',
          angleLabel: 'θ',
          oppLabel: '',
          adjLabel: `${adj} ${unit}`,
          hypLabel: `${hyp} ${unit}`,
          target: 'angle',
        },
        hints: [
          'You are given the Adjacent side and the Hypotenuse. Which ratio uses Adj and Hyp?',
          `Use cos(θ) = ${adj} / ${hyp}, then apply θ = cos⁻¹(${adj} / ${hyp}).`,
        ],
        solutionSteps: [
          `\\cos\\theta = \\frac{\\text{Adj}}{\\text{Hyp}} = \\frac{${adj}}{${hyp}}`,
          `\\theta = \\cos^{-1}\\left(\\frac{${adj}}{${hyp}}\\right) \\approx ${ans.toFixed(1)}^\\circ`,
        ],
      };
    }

    // tangent angle
    adj = formatMeasure(level, 8, 22);
    opp = formatMeasure(level, 6, 20);
    const ans = radToDeg(Math.atan(opp / adj));
    return {
      skill: skillId,
      level,
      nelsonRef: 'Ch. 7.1 — Finding an Angle Using Tangent (tan⁻¹)',
      promptText: `Find the unknown angle θ to the nearest tenth of a degree:`,
      equationLatex: `\\text{Opposite} = ${opp}\\text{ ${unit}}, \\quad \\text{Adjacent} = ${adj}\\text{ ${unit}}`,
      expectedValue: ans,
      unit: '°',
      diagram: {
        type: 'right',
        angleLabel: 'θ',
        oppLabel: `${opp} ${unit}`,
        adjLabel: `${adj} ${unit}`,
        hypLabel: '',
        target: 'angle',
      },
      hints: [
        'You are given Opposite and Adjacent (no Hypotenuse). Which ratio uses Opp and Adj?',
        `Use tan(θ) = ${opp} / ${adj}, then apply θ = tan⁻¹(${opp} / ${adj}).`,
      ],
      solutionSteps: [
        `\\tan\\theta = \\frac{\\text{Opp}}{\\text{Adj}} = \\frac{${opp}}{${adj}}`,
        `\\theta = \\tan^{-1}\\left(\\frac{${opp}}{${adj}}\\right) \\approx ${ans.toFixed(1)}^\\circ`,
      ],
    };
  }

  // Finding a side
  const denomUnknown = level >= 2 && Math.random() < 0.45;
  if (ratio === 'sine') {
    if (!denomUnknown) {
      const hyp = formatMeasure(level, 10, 28);
      const ans = hyp * Math.sin(degToRad(theta));
      return {
        skill: skillId,
        level,
        nelsonRef: 'Ch. 7.4 — Sine Ratio (Finding Opposite)',
        promptText: `Solve for side x (round to 1 decimal place):`,
        equationLatex: `\\theta = ${theta}^\\circ, \\quad \\text{Hypotenuse} = ${hyp}\\text{ ${unit}}, \\quad \\text{Opposite} = x`,
        expectedValue: ans,
        unit,
        diagram: {
          type: 'right',
          angleLabel: `${theta}°`,
          oppLabel: 'x',
          adjLabel: '',
          hypLabel: `${hyp} ${unit}`,
          target: 'opp',
        },
        hints: [
          'Opposite and Hypotenuse → SOH: sin(θ) = Opp / Hyp.',
          `Set up sin(${theta}°) = x / ${hyp} and multiply both sides by ${hyp}.`,
        ],
        solutionSteps: [
          `\\sin(${theta}^\\circ) = \\frac{x}{${hyp}}`,
          `x = ${hyp} \\sin(${theta}^\\circ) \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
        ],
      };
    } else {
      const opp = formatMeasure(level, 8, 20);
      const ans = opp / Math.sin(degToRad(theta));
      return {
        skill: skillId,
        level,
        nelsonRef: 'Ch. 7.4 — Sine Ratio (Finding Hypotenuse)',
        promptText: `Solve for the hypotenuse x (round to 1 decimal place):`,
        equationLatex: `\\theta = ${theta}^\\circ, \\quad \\text{Opposite} = ${opp}\\text{ ${unit}}, \\quad \\text{Hypotenuse} = x`,
        expectedValue: ans,
        unit,
        diagram: {
          type: 'right',
          angleLabel: `${theta}°`,
          oppLabel: `${opp} ${unit}`,
          adjLabel: '',
          hypLabel: 'x',
          target: 'hyp',
        },
        hints: [
          'Opposite and Hypotenuse → SOH: sin(θ) = Opp / Hyp.',
          `Since x is in the denominator: sin(${theta}°) = ${opp} / x → x = ${opp} / sin(${theta}°).`,
        ],
        solutionSteps: [
          `\\sin(${theta}^\\circ) = \\frac{${opp}}{x}`,
          `x = \\frac{${opp}}{\\sin(${theta}^\\circ)} \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
        ],
      };
    }
  }

  if (ratio === 'cosine') {
    if (!denomUnknown) {
      const hyp = formatMeasure(level, 10, 28);
      const ans = hyp * Math.cos(degToRad(theta));
      return {
        skill: skillId,
        level,
        nelsonRef: 'Ch. 7.4 — Cosine Ratio (Finding Adjacent)',
        promptText: `Solve for side x (round to 1 decimal place):`,
        equationLatex: `\\theta = ${theta}^\\circ, \\quad \\text{Hypotenuse} = ${hyp}\\text{ ${unit}}, \\quad \\text{Adjacent} = x`,
        expectedValue: ans,
        unit,
        diagram: {
          type: 'right',
          angleLabel: `${theta}°`,
          oppLabel: '',
          adjLabel: 'x',
          hypLabel: `${hyp} ${unit}`,
          target: 'adj',
        },
        hints: [
          'Adjacent and Hypotenuse → CAH: cos(θ) = Adj / Hyp.',
          `Set up cos(${theta}°) = x / ${hyp} and solve x = ${hyp} · cos(${theta}°).`,
        ],
        solutionSteps: [
          `\\cos(${theta}^\\circ) = \\frac{x}{${hyp}}`,
          `x = ${hyp} \\cos(${theta}^\\circ) \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
        ],
      };
    } else {
      const adj = formatMeasure(level, 8, 20);
      const ans = adj / Math.cos(degToRad(theta));
      return {
        skill: skillId,
        level,
        nelsonRef: 'Ch. 7.4 — Cosine Ratio (Finding Hypotenuse)',
        promptText: `Solve for the hypotenuse x (round to 1 decimal place):`,
        equationLatex: `\\theta = ${theta}^\\circ, \\quad \\text{Adjacent} = ${adj}\\text{ ${unit}}, \\quad \\text{Hypotenuse} = x`,
        expectedValue: ans,
        unit,
        diagram: {
          type: 'right',
          angleLabel: `${theta}°`,
          oppLabel: '',
          adjLabel: `${adj} ${unit}`,
          hypLabel: 'x',
          target: 'hyp',
        },
        hints: [
          'Adjacent and Hypotenuse → CAH: cos(θ) = Adj / Hyp.',
          `x is in the denominator, so x = ${adj} / cos(${theta}°).`,
        ],
        solutionSteps: [
          `\\cos(${theta}^\\circ) = \\frac{${adj}}{x}`,
          `x = \\frac{${adj}}{\\cos(${theta}^\\circ)} \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
        ],
      };
    }
  }

  // Tangent side
  if (!denomUnknown) {
    const adj = formatMeasure(level, 8, 24);
    const ans = adj * Math.tan(degToRad(theta));
    return {
      skill: skillId,
      level,
      nelsonRef: 'Ch. 7.1 — Tangent Ratio (Finding Opposite)',
      promptText: `Solve for side x (round to 1 decimal place):`,
      equationLatex: `\\theta = ${theta}^\\circ, \\quad \\text{Adjacent} = ${adj}\\text{ ${unit}}, \\quad \\text{Opposite} = x`,
      expectedValue: ans,
      unit,
      diagram: {
        type: 'right',
        angleLabel: `${theta}°`,
        oppLabel: 'x',
        adjLabel: `${adj} ${unit}`,
        hypLabel: '',
        target: 'opp',
      },
      hints: [
        'Opposite and Adjacent → TOA: tan(θ) = Opp / Adj.',
        `Set up tan(${theta}°) = x / ${adj} and multiply by ${adj}.`,
      ],
      solutionSteps: [
        `\\tan(${theta}^\\circ) = \\frac{x}{${adj}}`,
        `x = ${adj} \\tan(${theta}^\\circ) \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
      ],
    };
  } else {
    const opp = formatMeasure(level, 8, 22);
    const ans = opp / Math.tan(degToRad(theta));
    return {
      skill: skillId,
      level,
      nelsonRef: 'Ch. 7.1 — Tangent Ratio (Finding Adjacent)',
      promptText: `Solve for side x (round to 1 decimal place):`,
      equationLatex: `\\theta = ${theta}^\\circ, \\quad \\text{Opposite} = ${opp}\\text{ ${unit}}, \\quad \\text{Adjacent} = x`,
      expectedValue: ans,
      unit,
      diagram: {
        type: 'right',
        angleLabel: `${theta}°`,
        oppLabel: `${opp} ${unit}`,
        adjLabel: 'x',
        hypLabel: '',
        target: 'adj',
      },
      hints: [
        'Opposite and Adjacent → TOA: tan(θ) = Opp / Adj.',
        `Since x is in the denominator, x = ${opp} / tan(${theta}°).`,
      ],
      solutionSteps: [
        `\\tan(${theta}^\\circ) = \\frac{${opp}}{x}`,
        `x = \\frac{${opp}}{\\tan(${theta}^\\circ)} \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
      ],
    };
  }
}

function generateRightApp(level) {
  const variant = pick(['tree', 'ladder', 'ramp']);
  if (variant === 'tree') {
    const dist = formatMeasure(level, 12, 35);
    const elev = randInt(25, 62);
    const ans = dist * Math.tan(degToRad(elev));
    return {
      skill: 'right_app',
      level,
      nelsonRef: 'Ch. 7.5 — Angle of Elevation Application',
      promptText: `A surveyor stands ${dist} m from the base of a flagpole and measures an angle of elevation of ${elev}° to the top. Find the height of the flagpole (nearest tenth of a metre):`,
      equationLatex: `\\text{Horizontal distance} = ${dist}\\text{ m}, \\quad \\text{Angle of elevation} = ${elev}^\\circ`,
      expectedValue: ans,
      unit: 'm',
      diagram: {
        type: 'right',
        angleLabel: `${elev}°`,
        oppLabel: 'h (height)',
        adjLabel: `${dist} m`,
        hypLabel: '',
        target: 'opp',
      },
      hints: [
        'Height is Opposite the elevation angle and the ground distance is Adjacent → use tan.',
        `tan(${elev}°) = h / ${dist}.`,
      ],
      solutionSteps: [
        `\\tan(${elev}^\\circ) = \\frac{h}{${dist}}`,
        `h = ${dist} \\tan(${elev}^\\circ) \\approx ${ans.toFixed(1)}\\text{ m}`,
      ],
    };
  }

  if (variant === 'ladder') {
    const len = formatMeasure(level, 6, 12);
    const angle = randInt(60, 78);
    const ans = len * Math.sin(degToRad(angle));
    return {
      skill: 'right_app',
      level,
      nelsonRef: 'Ch. 7.5 — Ladder & Wall Application',
      promptText: `A ${len} m ladder leans against a vertical wall making an angle of ${angle}° with the ground. How high up the wall does the ladder reach (nearest tenth)?`,
      equationLatex: `\\text{Ladder (Hyp)} = ${len}\\text{ m}, \\quad \\theta = ${angle}^\\circ`,
      expectedValue: ans,
      unit: 'm',
      diagram: {
        type: 'right',
        angleLabel: `${angle}°`,
        oppLabel: 'h (wall)',
        adjLabel: '',
        hypLabel: `${len} m`,
        target: 'opp',
      },
      hints: [
        'The ladder is the Hypotenuse and the wall height is Opposite the ground angle → use sin.',
        `sin(${angle}°) = h / ${len}.`,
      ],
      solutionSteps: [
        `\\sin(${angle}^\\circ) = \\frac{h}{${len}}`,
        `h = ${len} \\sin(${angle}^\\circ) \\approx ${ans.toFixed(1)}\\text{ m}`,
      ],
    };
  }

  // Ramp angle of elevation
  const rise = formatMeasure(level, 1, 3);
  const run = formatMeasure(level, 8, 18);
  const ans = radToDeg(Math.atan(rise / run));
  return {
    skill: 'right_app',
    level,
    nelsonRef: 'Ch. 7.5 — Ramp Grade Angle Application',
    promptText: `An accessibility ramp rises ${rise} m vertically over a horizontal run of ${run} m. Find the angle of inclination θ (nearest tenth of a degree):`,
    equationLatex: `\\text{Rise (Opp)} = ${rise}\\text{ m}, \\quad \\text{Run (Adj)} = ${run}\\text{ m}`,
    expectedValue: ans,
    unit: '°',
    diagram: {
      type: 'right',
      angleLabel: 'θ',
      oppLabel: `${rise} m`,
      adjLabel: `${run} m`,
      hypLabel: '',
      target: 'angle',
    },
    hints: [
      'Rise is Opposite and Run is Adjacent → use tan(θ) = Rise / Run.',
      `θ = tan⁻¹(${rise} / ${run}).`,
    ],
    solutionSteps: [
      `\\tan\\theta = \\frac{${rise}}{${run}}`,
      `\\theta = \\tan^{-1}\\left(\\frac{${rise}}{${run}}\\right) \\approx ${ans.toFixed(1)}^\\circ`,
    ],
  };
}

// ---------- Acute Triangle Trigonometry: Sine Law & Cosine Law (Ch. 8) ----------

function generateSineLaw(level, skillId = 'sine_law') {
  const unit = pick(['cm', 'm']);
  const A = randInt(36, 74);
  const B = randInt(36, 74); // A + B <= 148 so C >= 32 (strictly acute/valid)
  const C = 180 - A - B;
  const b = formatMeasure(level, 10, 24);
  const findAngle = level >= 2 && Math.random() < 0.4;

  if (!findAngle) {
    const ans = (b * Math.sin(degToRad(A))) / Math.sin(degToRad(B));
    return {
      skill: skillId,
      level,
      nelsonRef: 'Ch. 8.2 — The Sine Law (Finding a Side)',
      promptText: `In △ABC, ∠A = ${A}°, ∠B = ${B}°, and b = ${b} ${unit}. Find side a (round to 1 decimal place):`,
      equationLatex: `\\angle A = ${A}^\\circ, \\; \\angle B = ${B}^\\circ, \\; b = ${b}\\text{ ${unit}}`,
      expectedValue: ans,
      unit,
      diagram: {
        type: 'acute',
        A: `${A}°`,
        B: `${B}°`,
        C: `${C}°`,
        a: 'a = ?',
        b: `${b} ${unit}`,
        c: 'c',
        highlightLaw: 'sine',
      },
      hints: [
        'You know a side-angle opposite pair (B and b) and want side a opposite ∠A → use the Sine Law.',
        `Set up a / sin(${A}°) = ${b} / sin(${B}°).`,
      ],
      solutionSteps: [
        `\\frac{a}{\\sin A} = \\frac{b}{\\sin B} \\implies \\frac{a}{\\sin(${A}^\\circ)} = \\frac{${b}}{\\sin(${B}^\\circ)}`,
        `a = \\frac{${b} \\sin(${A}^\\circ)}{\\sin(${B}^\\circ)} \\approx ${ans.toFixed(1)}\\text{ ${unit}}`,
      ],
    };
  }

  // Find acute angle A given a, b, B
  const aRaw = (b * Math.sin(degToRad(A))) / Math.sin(degToRad(B));
  const a = round1(aRaw);
  const ratio = Math.min(0.9999, (a * Math.sin(degToRad(B))) / b);
  const ans = radToDeg(Math.asin(ratio));

  return {
    skill: skillId,
    level,
    nelsonRef: 'Ch. 8.2 — The Sine Law (Finding an Acute Angle)',
    promptText: `In acute △ABC, ∠B = ${B}°, a = ${a} ${unit}, and b = ${b} ${unit}. Find acute ∠A (nearest tenth of a degree):`,
    equationLatex: `\\angle B = ${B}^\\circ, \\; a = ${a}\\text{ ${unit}}, \\; b = ${b}\\text{ ${unit}}`,
    expectedValue: ans,
    unit: '°',
    diagram: {
      type: 'acute',
      A: 'A = ?',
      B: `${B}°`,
      C: 'C',
      a: `${a} ${unit}`,
      b: `${b} ${unit}`,
      c: 'c',
      highlightLaw: 'sine',
    },
    hints: [
      'You know opposite pair (B, b) and side a → use sin A / a = sin B / b.',
      `Compute sin A = (${a} · sin(${B}°)) / ${b}, then take sin⁻¹.`,
    ],
    solutionSteps: [
      `\\frac{\\sin A}{${a}} = \\frac{\\sin(${B}^\\circ)}{${b}} \\implies \\sin A = \\frac{${a}\\sin(${B}^\\circ)}{${b}}`,
      `A = \\sin^{-1}(${ratio.toFixed(4)}) \\approx ${ans.toFixed(1)}^\\circ`,
    ],
  };
}

function generateCosineLaw(level, skillId = 'cosine_law') {
  const unit = pick(['cm', 'm']);
  const findAngle = level >= 2 && Math.random() < 0.45;

  if (!findAngle) {
    // SAS: given a, b, C -> find c
    const a = formatMeasure(level, 9, 20);
    let b = formatMeasure(level, 10, 22);
    if (b === a) b += 2;
    const C = randInt(34, 112);
    const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(degToRad(C)));

    return {
      skill: skillId,
      level,
      nelsonRef: 'Ch. 8.4 — The Cosine Law (SAS: Finding a Side)',
      promptText: `In △ABC, a = ${a} ${unit}, b = ${b} ${unit}, and included ∠C = ${C}°. Find side c (round to 1 decimal place):`,
      equationLatex: `a = ${a}\\text{ ${unit}}, \\; b = ${b}\\text{ ${unit}}, \\; \\angle C = ${C}^\\circ`,
      expectedValue: c,
      unit,
      diagram: {
        type: 'acute',
        A: 'A',
        B: 'B',
        C: `${C}°`,
        a: `${a} ${unit}`,
        b: `${b} ${unit}`,
        c: 'c = ?',
        highlightLaw: 'cosine',
      },
      hints: [
        'You have two sides and the contained (included) angle (SAS), with no complete opposite pair → use the Cosine Law.',
        `c² = ${a}² + ${b}² − 2(${a})(${b})cos(${C}°). Remember to take the square root!`,
      ],
      solutionSteps: [
        `c^2 = a^2 + b^2 - 2ab\\cos C = ${a}^2 + ${b}^2 - 2(${a})(${b})\\cos(${C}^\\circ)`,
        `c^2 \\approx ${(c * c).toFixed(2)} \\implies c \\approx ${c.toFixed(1)}\\text{ ${unit}}`,
      ],
    };
  }

  // SSS: given a, b, c -> find angle C
  const a = randInt(9, 18);
  const b = randInt(10, 20);
  const minC = Math.abs(a - b) + 3;
  const maxC = a + b - 3;
  const c = randInt(minC, maxC);
  const cosC = (a * a + b * b - c * c) / (2 * a * b);
  const ans = radToDeg(Math.acos(cosC));

  return {
    skill: skillId,
    level,
    nelsonRef: 'Ch. 8.4 — The Cosine Law (SSS: Finding an Angle)',
    promptText: `In △ABC, a = ${a} ${unit}, b = ${b} ${unit}, and c = ${c} ${unit}. Find ∠C (nearest tenth of a degree):`,
    equationLatex: `a = ${a}\\text{ ${unit}}, \\; b = ${b}\\text{ ${unit}}, \\; c = ${c}\\text{ ${unit}}`,
    expectedValue: ans,
    unit: '°',
    diagram: {
      type: 'acute',
      A: 'A',
      B: 'B',
      C: 'C = ?',
      a: `${a} ${unit}`,
      b: `${b} ${unit}`,
      c: `${c} ${unit}`,
      highlightLaw: 'cosine',
    },
    hints: [
      'You know all three sides (SSS) and no angles → use the rearranged Cosine Law.',
      `cos C = (a² + b² − c²) / (2ab) = (${a}² + ${b}² − ${c}²) / (2·${a}·${b}).`,
    ],
    solutionSteps: [
      `\\cos C = \\frac{a^2 + b^2 - c^2}{2ab} = \\frac{${a}^2 + ${b}^2 - ${c}^2}{2(${a})(${b})} = ${cosC.toFixed(4)}`,
      `C = \\cos^{-1}(${cosC.toFixed(4)}) \\approx ${ans.toFixed(1)}^\\circ`,
    ],
  };
}

function generateAcuteApp(level) {
  const variant = pick(['boats', 'pond', 'truss']);
  if (variant === 'boats') {
    const d1 = formatMeasure(level, 12, 26);
    const d2 = formatMeasure(level, 14, 28);
    const angle = randInt(48, 108);
    const ans = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * Math.cos(degToRad(angle)));
    return {
      skill: 'acute_app',
      level,
      nelsonRef: 'Ch. 8.5 — Navigation Cosine Law Application',
      promptText: `Two kayaks leave a dock at the same time along paths separated by ${angle}°. Kayak 1 travels ${d1} km and Kayak 2 travels ${d2} km. How far apart are they (nearest tenth of a km)?`,
      equationLatex: `d_1 = ${d1}\\text{ km}, \\; d_2 = ${d2}\\text{ km}, \\; \\angle C = ${angle}^\\circ`,
      expectedValue: ans,
      unit: 'km',
      diagram: {
        type: 'acute',
        A: 'Kayak 1',
        B: 'Kayak 2',
        C: `${angle}°`,
        a: `${d2} km`,
        b: `${d1} km`,
        c: 'x = ?',
        highlightLaw: 'cosine',
      },
      hints: [
        'Sketch a triangle from the dock with two known sides and the angle between them (SAS).',
        `Apply Cosine Law: x² = ${d1}² + ${d2}² − 2(${d1})(${d2})cos(${angle}°).`,
      ],
      solutionSteps: [
        `x^2 = ${d1}^2 + ${d2}^2 - 2(${d1})(${d2})\\cos(${angle}^\\circ)`,
        `x \\approx ${ans.toFixed(1)}\\text{ km}`,
      ],
    };
  }

  if (variant === 'pond') {
    const A = randInt(42, 68);
    const B = randInt(45, 72);
    const C = 180 - A - B;
    const base = formatMeasure(level, 30, 65);
    // Find side a opposite A, knowing C and base c
    const ans = (base * Math.sin(degToRad(A))) / Math.sin(degToRad(C));
    return {
      skill: 'acute_app',
      level,
      nelsonRef: 'Ch. 8.5 — Surveying Sine Law Application',
      promptText: `To measure the distance BC across a pond, a surveyor stands at A and sights B and C. If AB = ${base} m, ∠A = ${A}°, and ∠B = ${B}°, find distance BC (nearest tenth of a metre):`,
      equationLatex: `AB = ${base}\\text{ m}, \\; \\angle A = ${A}^\\circ, \\; \\angle B = ${B}^\\circ`,
      expectedValue: ans,
      unit: 'm',
      diagram: {
        type: 'acute',
        A: `${A}°`,
        B: `${B}°`,
        C: `${C}°`,
        a: 'BC = ?',
        b: 'AC',
        c: `${base} m`,
        highlightLaw: 'sine',
      },
      hints: [
        `First find the third angle ∠C = 180° − ${A}° − ${B}° = ${C}° (opposite the known side AB = ${base} m).`,
        `Apply Sine Law: BC / sin(${A}°) = ${base} / sin(${C}°).`,
      ],
      solutionSteps: [
        `\\angle C = 180^\\circ - ${A}^\\circ - ${B}^\\circ = ${C}^\\circ`,
        `\\frac{BC}{\\sin(${A}^\\circ)} = \\frac{${base}}{\\sin(${C}^\\circ)} \\implies BC \\approx ${ans.toFixed(1)}\\text{ m}`,
      ],
    };
  }

  // Roof truss SSS angle
  const a = randInt(8, 14);
  const b = randInt(8, 14);
  const c = randInt(Math.abs(a - b) + 3, Math.min(20, a + b - 2));
  const cosC = (a * a + b * b - c * c) / (2 * a * b);
  const ans = radToDeg(Math.acos(cosC));
  return {
    skill: 'acute_app',
    level,
    nelsonRef: 'Ch. 8.5 — Roof Truss Cosine Law Application',
    promptText: `A triangular roof truss has rafters of lengths ${a} m and ${b} m, and a horizontal span of ${c} m. Find the peak angle θ opposite the ${c} m span (nearest tenth of a degree):`,
    equationLatex: `a = ${a}\\text{ m}, \\; b = ${b}\\text{ m}, \\; c = ${c}\\text{ m}`,
    expectedValue: ans,
    unit: '°',
    diagram: {
      type: 'acute',
      A: 'A',
      B: 'B',
      C: 'θ = ?',
      a: `${a} m`,
      b: `${b} m`,
      c: `${c} m`,
      highlightLaw: 'cosine',
    },
    hints: [
      'All three side lengths are known (SSS) → use the Cosine Law.',
      `cos θ = (${a}² + ${b}² − ${c}²) / (2·${a}·${b}).`,
    ],
    solutionSteps: [
      `\\cos\\theta = \\frac{${a}^2 + ${b}^2 - ${c}^2}{2(${a})(${b})} = ${cosC.toFixed(4)}`,
      `\\theta = \\cos^{-1}(${cosC.toFixed(4)}) \\approx ${ans.toFixed(1)}^\\circ`,
    ],
  };
}

// ---------- Similar Triangles (AA/AAA~, SAS~, SSS~) (Ch. 7.1–7.2) ----------

const SIMILAR_CHOICES = [
  { id: 'aa', label: 'Similar by AA / AAA~ (Equal Angles)' },
  { id: 'sas', label: 'Similar by SAS~ (2 Proportional Sides & Included Angle)' },
  { id: 'sss', label: 'Similar by SSS~ (3 Sides Proportional)' },
  { id: 'not_similar', label: 'Not Similar' },
];

function generateSimilarTriangles(level) {
  const kind = pick(['aa', 'sas', 'sss', 'not_similar']);
  const k = level <= 2 ? pick([2, 3]) : pick([1.5, 2.5, 3]);

  if (kind === 'aa') {
    const A = randInt(35, 68);
    const B = randInt(42, 75);
    const C = 180 - A - B;
    const hideThird = level >= 3;
    const eq = hideThird
      ? `\\triangle ABC: \\angle A=${A}^\\circ, \\angle B=${B}^\\circ \\quad | \\quad \\triangle DEF: \\angle D=${A}^\\circ, \\angle F=${C}^\\circ`
      : `\\triangle ABC: \\angle A=${A}^\\circ, \\angle B=${B}^\\circ \\quad | \\quad \\triangle DEF: \\angle D=${A}^\\circ, \\angle E=${B}^\\circ`;

    return {
      skill: 'similar_triangles',
      level,
      inputType: 'choice',
      choices: SIMILAR_CHOICES,
      expectedChoice: 'aa',
      exactExpectedLatex: 'aa',
      nelsonRef: 'Ch. 7.2 — Proving Similar Triangles (AA / AAA~)',
      promptText: 'Determine whether △ABC and △DEF are similar, and select the valid similarity theorem:',
      equationLatex: eq,
      diagram: {
        type: 'similar',
        t1: { A: `${A}°`, B: `${B}°`, C: hideThird ? '?' : `${C}°`, ab: '', bc: '', ca: '' },
        t2: { D: `${A}°`, E: hideThird ? '?' : `${B}°`, F: hideThird ? `${C}°` : '', de: '', ef: '', fd: '' },
      },
      hints: [
        'Compare the interior angles of △ABC and △DEF.',
        hideThird
          ? `Use ∠A + ∠B + ∠C = 180° to find ∠C = 180° − ${A}° − ${B}° = ${C}°, matching ∠F!`
          : `Two pairs of corresponding angles are equal, so the third pair is also equal (AAA~).`,
      ],
      solutionSteps: [
        `\\angle A = \\angle D = ${A}^\\circ`,
        hideThird
          ? `\\angle C = 180^\\circ - ${A}^\\circ - ${B}^\\circ = ${C}^\\circ = \\angle F \\text{ (so } \\angle B = \\angle E = ${B}^\\circ\\text{)}`
          : `\\angle B = \\angle E = ${B}^\\circ \\implies \\angle C = \\angle F = ${C}^\\circ`,
        `\\therefore \\triangle ABC \\sim \\triangle DEF \\text{ by AA / AAA}\\sim.`,
      ],
    };
  }

  if (kind === 'sas') {
    const ab = randInt(4, 9);
    const bc = randInt(5, 11);
    const B = randInt(40, 80);
    const de = Number((ab * k).toFixed(1));
    const ef = Number((bc * k).toFixed(1));

    return {
      skill: 'similar_triangles',
      level,
      inputType: 'choice',
      choices: SIMILAR_CHOICES,
      expectedChoice: 'sas',
      exactExpectedLatex: 'sas',
      nelsonRef: 'Ch. 7.2 — Proving Similar Triangles (SAS~)',
      promptText: 'Determine whether △ABC and △DEF are similar, and select the valid similarity theorem:',
      equationLatex: `AB=${ab}, \\; BC=${bc}, \\; \\angle B=${B}^\\circ \\quad | \\quad DE=${de}, \\; EF=${ef}, \\; \\angle E=${B}^\\circ`,
      diagram: {
        type: 'similar',
        t1: { A: '', B: `${B}°`, C: '', ab: String(ab), bc: String(bc), ca: '' },
        t2: { D: '', E: `${B}°`, F: '', de: String(de), ef: String(ef), fd: '' },
      },
      hints: [
        'Check whether the given angle is BETWEEN (included by) the two given sides.',
        `Check the side ratios: DE / AB = ${de}/${ab} and EF / BC = ${ef}/${bc}.`,
      ],
      solutionSteps: [
        `\\frac{DE}{AB} = \\frac{${de}}{${ab}} = ${k}, \\quad \\frac{EF}{BC} = \\frac{${ef}}{${bc}} = ${k}`,
        `\\angle B = \\angle E = ${B}^\\circ \\text{ (equal included angle between proportional sides)}`,
        `\\therefore \\triangle ABC \\sim \\triangle DEF \\text{ by SAS}\\sim.`,
      ],
    };
  }

  if (kind === 'sss') {
    const ab = randInt(4, 7);
    const bc = randInt(5, 9);
    const ca = randInt(Math.abs(ab - bc) + 2, ab + bc - 2);
    const de = Number((ab * k).toFixed(1));
    const ef = Number((bc * k).toFixed(1));
    const fd = Number((ca * k).toFixed(1));

    return {
      skill: 'similar_triangles',
      level,
      inputType: 'choice',
      choices: SIMILAR_CHOICES,
      expectedChoice: 'sss',
      exactExpectedLatex: 'sss',
      nelsonRef: 'Ch. 7.2 — Proving Similar Triangles (3 Sides Proportional / SSS~)',
      promptText: 'Determine whether △ABC and △DEF are similar, and select the valid similarity theorem:',
      equationLatex: `\\triangle ABC: (${ab}, ${bc}, ${ca}) \\quad | \\quad \\triangle DEF: (${de}, ${ef}, ${fd})`,
      diagram: {
        type: 'similar',
        t1: { A: '', B: '', C: '', ab: String(ab), bc: String(bc), ca: String(ca) },
        t2: { D: '', E: '', F: '', de: String(de), ef: String(ef), fd: String(fd) },
      },
      hints: [
        'Order each triangle’s sides from shortest to longest and divide corresponding pairs.',
        `Compute DE/AB, EF/BC, and FD/CA to see if all 3 ratios equal ${k}.`,
      ],
      solutionSteps: [
        `\\frac{DE}{AB} = \\frac{${de}}{${ab}} = ${k}, \\; \\frac{EF}{BC} = \\frac{${ef}}{${bc}} = ${k}, \\; \\frac{FD}{CA} = \\frac{${fd}}{${ca}} = ${k}`,
        `\\text{All three pairs of corresponding sides are proportional (scale factor } ${k}\\text{).}`,
        `\\therefore \\triangle ABC \\sim \\triangle DEF \\text{ by SSS}\\sim.`,
      ],
    };
  }

  // Not similar: either mismatched ratios or mismatched angles
  const useAngles = Math.random() < 0.45;
  if (useAngles) {
    const A = randInt(40, 65);
    const B = randInt(45, 70);
    const C = 180 - A - B;
    const E = B + pick([8, 12, -9]);
    const F = 180 - A - E;
    return {
      skill: 'similar_triangles',
      level,
      inputType: 'choice',
      choices: SIMILAR_CHOICES,
      expectedChoice: 'not_similar',
      exactExpectedLatex: 'not_similar',
      nelsonRef: 'Ch. 7.2 — Testing Similarity Conditions',
      promptText: 'Determine whether △ABC and △DEF are similar, and select the valid similarity theorem:',
      equationLatex: `\\triangle ABC: \\angle A=${A}^\\circ, \\angle B=${B}^\\circ \\quad | \\quad \\triangle DEF: \\angle D=${A}^\\circ, \\angle E=${E}^\\circ`,
      diagram: {
        type: 'similar',
        t1: { A: `${A}°`, B: `${B}°`, C: `${C}°`, ab: '', bc: '', ca: '' },
        t2: { D: `${A}°`, E: `${E}°`, F: `${F}°`, de: '', ef: '', fd: '' },
      },
      hints: [
        'Compare all three angles of △ABC with the three angles of △DEF.',
        `In △ABC the angles are (${A}°, ${B}°, ${C}°), while in △DEF they are (${A}°, ${E}°, ${F}°).`,
      ],
      solutionSteps: [
        `\\triangle ABC \\text{ angles: } ${A}^\\circ, ${B}^\\circ, ${C}^\\circ; \\quad \\triangle DEF \\text{ angles: } ${A}^\\circ, ${E}^\\circ, ${F}^\\circ`,
        `\\text{Corresponding angles are not equal} \\implies \\text{Not Similar.}`,
      ],
    };
  }

  const ab = randInt(4, 7);
  const bc = randInt(5, 9);
  const ca = randInt(Math.abs(ab - bc) + 2, ab + bc - 2);
  const de = Number((ab * k).toFixed(1));
  const ef = Number((bc * k).toFixed(1));
  const fd = Number((ca * k + pick([2, 3])).toFixed(1));

  return {
    skill: 'similar_triangles',
    level,
    inputType: 'choice',
    choices: SIMILAR_CHOICES,
    expectedChoice: 'not_similar',
    exactExpectedLatex: 'not_similar',
    nelsonRef: 'Ch. 7.2 — Testing Side Proportionality',
    promptText: 'Determine whether △ABC and △DEF are similar, and select the valid similarity theorem:',
    equationLatex: `\\triangle ABC: (${ab}, ${bc}, ${ca}) \\quad | \\quad \\triangle DEF: (${de}, ${ef}, ${fd})`,
    diagram: {
      type: 'similar',
      t1: { A: '', B: '', C: '', ab: String(ab), bc: String(bc), ca: String(ca) },
      t2: { D: '', E: '', F: '', de: String(de), ef: String(ef), fd: String(fd) },
    },
    hints: [
      'Divide each side of △DEF by its corresponding side in △ABC.',
      `Notice DE/AB = ${k} and EF/BC = ${k}, so check whether FD/CA equals ${k} too!`,
    ],
    solutionSteps: [
      `\\frac{DE}{AB} = ${k}, \\; \\frac{EF}{BC} = ${k}, \\; \\text{but } \\frac{FD}{CA} = \\frac{${fd}}{${ca}} \\neq ${k}`,
      `\\text{Not all 3 corresponding sides share the same ratio} \\implies \\text{Not Similar.}`,
    ],
  };
}

let trigCounter = 0;

function generateTrigProblem(skill = 'sine', level = 1) {
  const lvl = Math.min(4, Math.max(1, Number(level) || 1));
  let prob;
  if (skill === 'similar_triangles') {
    prob = generateSimilarTriangles(lvl);
  } else if (skill === 'sine' || skill === 'cosine' || skill === 'tangent') {
    prob = generatePrimaryTrig(skill, lvl, skill);
  } else if (skill === 'sohcahtoa_mix') {
    prob = generatePrimaryTrig(pick(['sine', 'cosine', 'tangent']), lvl, 'sohcahtoa_mix');
  } else if (skill === 'right_app') {
    prob = generateRightApp(lvl);
  } else if (skill === 'sine_law') {
    prob = generateSineLaw(lvl, 'sine_law');
  } else if (skill === 'cosine_law') {
    prob = generateCosineLaw(lvl, 'cosine_law');
  } else if (skill === 'acute_mix') {
    prob = Math.random() < 0.5 ? generateSineLaw(lvl, 'acute_mix') : generateCosineLaw(lvl, 'acute_mix');
  } else if (skill === 'acute_app') {
    prob = generateAcuteApp(lvl);
  } else {
    throw new Error(`Unknown trig skill: ${skill}`);
  }

  trigCounter += 1;
  prob.id = `trig_${Date.now()}_${trigCounter}`;
  return prob;
}

function checkTrigAnswer(inputRaw, problem) {
  if (problem.inputType === 'choice') {
    if (!inputRaw) {
      return { correct: false, parseError: true, message: 'Select one of the similarity options.' };
    }
    const ok = inputRaw === problem.expectedChoice;
    return {
      correct: ok,
      message: ok
        ? 'Correct similarity conclusion!'
        : 'Not quite — check all corresponding angles or compute all side ratios.',
    };
  }

  let s = String(inputRaw || '').trim();
  if (!s) {
    return { correct: false, parseError: true, message: 'Please enter a numeric answer.' };
  }

  s = s
    .replace(/\u2212/g, '-')
    .replace(/°|\bdegrees?\b|\bdeg\b|\bcm\b|\bkm\b|\bm\b/gi, '')
    .replace(/^[a-zA-Zθ]+\s*=\s*/, '')
    .trim();

  try {
    const val = evaluateMathExpression(s);
    const diff = Math.abs(val - problem.expectedValue);
    // Allow 0.55 tolerance for nearest-degree or 1 d.p. trig rounding
    const tol = problem.unit === '°' ? 0.55 : 0.16;
    if (diff <= tol) {
      return {
        correct: true,
        message: `Correct! Exact ≈ ${problem.expectedValue.toFixed(1)} ${problem.unit}.`,
      };
    }
    return {
      correct: false,
      message: `Not quite (expected ≈ ${problem.expectedValue.toFixed(1)} ${problem.unit} — make sure your calculator is in DEGREE mode!).`,
    };
  } catch {
    return { correct: false, parseError: true, message: 'Could not read that number. Enter e.g. 14.3' };
  }
}
return { TRIG_SKILL_META, generateTrigProblem, checkTrigAnswer };

},

"./mental-engine.js": function(__require) {
// Proportional Reasoning Drill & Algebra Problem Strings (Mental Math for Students & Teachers)

const { gcd, formatFractionLatex, evaluateMathExpression } = __require("./math-engine.js");
const { evalExpressionAtX } = __require("./skills-engine.js");
const PROP_TYPES = {
  mixed: { id: 'mixed', name: 'Mixed Proportions' },
  ratios: { id: 'ratios', name: 'Equivalent Ratios' },
  unit_rate: { id: 'unit_rate', name: 'Unit Rates & Scaling' },
  percent: { id: 'percent', name: 'Mental Percents' },
  algebraic_prop: { id: 'algebraic_prop', name: 'Algebraic Proportions' },
};

const STRING_THEMES = {
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

function generateProportionProblem(type = 'mixed', level = 1) {
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

function checkProportionAnswer(inputRaw, problem) {
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

function generateProblemString(theme = 'distributive') {
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

const BTC_TASKS = [
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

const BTC_OBSERVATION_ITEMS = [
  '1. Thinking Task: Lesson opens with an authentic/thin-sliced thinking task rather than worked examples.',
  '2. Visibly Random Groups: Students placed into visibly random groups of 3 (cards/randomizer) at the start.',
  '3. VNPS (Vertical Non-Permanent Surfaces): Groups work standing at erasable whiteboards with 1 marker per group.',
  '4. Defronted Room: Teacher moves freely among boards; no fixed front lecturing focal point.',
  '5. Verbal Launch & No Premature Answers: Teacher gives task verbally/projected cleanly and walks away without hints for 3–5 min.',
  '6. Thin-Slicing & Flow: Keep-thinking extensions pushed verbally to fast groups to stay in Flow.',
  '7. Knowledge Mobility: Teacher encourages groups to peek at/borrow ideas from neighbouring boards.',
  '8. Consolidate from the Bottom + CYU: Synthesis builds from student boards lowest-to-highest, followed by Check Your Understanding.',
];

function generateRandomGroups(countOrNames, groupSize = 3) {
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

function checkStringStep(inputRaw, step) {
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
return { PROP_TYPES, STRING_THEMES, generateProportionProblem, checkProportionAnswer, generateProblemString, BTC_TASKS, BTC_OBSERVATION_ITEMS, generateRandomGroups, checkStringStep };

},

"./simulations.js": function(__require) {
// Interactive MPM2D Simulations:
// 1. Trig Ratio Invariance Lab (drag side scale or angle theta)
// 2. Analytic Geometry Explorer (drag A & B for rise, run, midpoint, distance, slope & perp bisector)

function computeTrigSimMetrics(angleDeg = 35, scale = 1.0) {
  const clampedAngle = Math.min(75, Math.max(15, Number.isFinite(Number(angleDeg)) ? Number(angleDeg) : 35));
  const clampedScale = Math.min(2.4, Math.max(0.6, Number.isFinite(Number(scale)) ? Number(scale) : 1.0));
  const baseHyp = 10;
  const hyp = baseHyp * clampedScale;
  const rad = (clampedAngle * Math.PI) / 180;
  const opp = hyp * Math.sin(rad);
  const adj = hyp * Math.cos(rad);
  const sinVal = opp / hyp;
  const cosVal = adj / hyp;
  const tanVal = opp / adj;
  return {
    angleDeg: clampedAngle,
    compAngleDeg: 90 - clampedAngle,
    scale: clampedScale,
    opp,
    adj,
    hyp,
    sinVal,
    cosVal,
    tanVal,
    pythIdentity: sinVal * sinVal + cosVal * cosVal,
  };
}

function computeGeoSimMetrics(ax = -3, ay = -2, bx = 5, by = 4) {
  const x1 = Number.isFinite(Number(ax)) ? Number(ax) : 0;
  const y1 = Number.isFinite(Number(ay)) ? Number(ay) : 0;
  const x2 = Number.isFinite(Number(bx)) ? Number(bx) : 0;
  const y2 = Number.isFinite(Number(by)) ? Number(by) : 0;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const distSq = dx * dx + dy * dy;
  const dist = Math.hypot(dx, dy);
  const rawSlope = Math.abs(dx) < 1e-12 ? null : dy / dx;
  const rawPerpSlope = Math.abs(dy) < 1e-12 ? null : -dx / dy;
  const slope = rawSlope === null || Math.abs(rawSlope) < 1e-12 ? (rawSlope === null ? null : 0) : rawSlope;
  const perpSlope =
    rawPerpSlope === null || Math.abs(rawPerpSlope) < 1e-12 ? (rawPerpSlope === null ? null : 0) : rawPerpSlope;

  return {
    ax: x1,
    ay: y1,
    bx: x2,
    by: y2,
    dx,
    dy,
    mx,
    my,
    dist,
    distSq,
    slope,
    perpSlope,
  };
}

function getSimPalette(theme) {
  const isDark = theme === 'dark';
  return {
    isDark,
    bg: isDark ? '#121826' : '#f8fafc',
    grid: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(100, 116, 139, 0.16)',
    axis: isDark ? '#94a3b8' : '#475569',
    text: isDark ? '#e2e8f0' : '#0f172a',
    muted: isDark ? '#94a3b8' : '#64748b',
    pillBg: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.9)',
    triFill: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(37, 99, 235, 0.11)',
    triStroke: isDark ? '#38bdf8' : '#2563eb',
    ghostStroke: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.42)',
    angleColor: isDark ? '#fbbf24' : '#d97706',
    scaleHandle: isDark ? '#34d399' : '#059669',
    oppColor: isDark ? '#f472b6' : '#db2777',
    adjColor: isDark ? '#60a5fa' : '#2563eb',
    perpColor: isDark ? '#a78bfa' : '#7c3aed',
    handleA: isDark ? '#f87171' : '#dc2626',
    handleB: isDark ? '#34d399' : '#059669',
  };
}

function drawBadgeText(ctx, text, x, y, bgColor, textColor) {
  ctx.save();
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  const padX = 6;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 20;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 5);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

function drawTrigSimulation(canvas, state = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { angleDeg = 35, scale = 1.0, theme = 'light' } = state;
  const m = computeTrigSimMetrics(angleDeg, scale);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = canvas.clientWidth || canvas.width || 680;
  const cssH = canvas.clientHeight || canvas.height || 400;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  const pal = getSimPalette(theme);
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const originA = { x: Math.max(76, cssW * 0.14), y: cssH - 58 };
  const pxPerUnit = Math.max(6, Math.min((cssW - originA.x - 56) / 23.5, (originA.y - 42) / 23.5));

  // Grid spaced every 2 units
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  const stepPx = pxPerUnit * 2;
  for (let gx = originA.x % stepPx; gx < cssW; gx += stepPx) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, cssH);
    ctx.stroke();
  }
  for (let gy = originA.y % stepPx; gy < cssH; gy += stepPx) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(cssW, gy);
    ctx.stroke();
  }

  // Ghost k = 1.0 reference triangle for AA~ similarity comparison
  const refM = computeTrigSimMetrics(m.angleDeg, 1.0);
  const refC = { x: originA.x + refM.adj * pxPerUnit, y: originA.y };
  const refB = { x: refC.x, y: refC.y - refM.opp * pxPerUnit };
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = pal.ghostStroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(originA.x, originA.y);
  ctx.lineTo(refC.x, refC.y);
  ctx.lineTo(refB.x, refB.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Active scaled triangle A-C-B
  const C = { x: originA.x + m.adj * pxPerUnit, y: originA.y };
  const B = { x: C.x, y: C.y - m.opp * pxPerUnit };

  ctx.fillStyle = pal.triFill;
  ctx.beginPath();
  ctx.moveTo(originA.x, originA.y);
  ctx.lineTo(C.x, C.y);
  ctx.lineTo(B.x, B.y);
  ctx.closePath();
  ctx.fill();

  // Right angle box at C
  const sq = Math.min(14, Math.max(8, Math.min(C.x - originA.x, originA.y - B.y) * 0.16));
  ctx.strokeStyle = pal.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(C.x - sq, C.y);
  ctx.lineTo(C.x - sq, C.y - sq);
  ctx.lineTo(C.x, C.y - sq);
  ctx.stroke();

  // Triangle edges with distinct color cues (Adj / Opp / Hyp)
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = pal.adjColor;
  ctx.beginPath();
  ctx.moveTo(originA.x, originA.y);
  ctx.lineTo(C.x, C.y);
  ctx.stroke();

  ctx.strokeStyle = pal.oppColor;
  ctx.beginPath();
  ctx.moveTo(C.x, C.y);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();

  ctx.strokeStyle = pal.triStroke;
  ctx.beginPath();
  ctx.moveTo(originA.x, originA.y);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();

  // Angle arc at A
  const rad = (m.angleDeg * Math.PI) / 180;
  const arcR = Math.max(26, Math.min(48, m.hyp * pxPerUnit * 0.28));
  ctx.fillStyle = pal.isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(217, 119, 6, 0.15)';
  ctx.beginPath();
  ctx.moveTo(originA.x, originA.y);
  ctx.arc(originA.x, originA.y, arcR, -rad, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = pal.angleColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(originA.x, originA.y, arcR, -rad, 0);
  ctx.stroke();

  // Angle handle along hypotenuse ray
  const angleHandleR = Math.max(54, Math.min(110, m.hyp * pxPerUnit * 0.52));
  const angleHandle = {
    x: originA.x + angleHandleR * Math.cos(rad),
    y: originA.y - angleHandleR * Math.sin(rad),
  };

  // Vertex & side labels
  drawBadgeText(ctx, `θ = ${m.angleDeg.toFixed(0)}°`, originA.x + (arcR + 28) * Math.cos(rad * 0.48), originA.y - (arcR + 18) * Math.sin(rad * 0.48), pal.pillBg, pal.angleColor);
  drawBadgeText(ctx, `Adj = ${m.adj.toFixed(2)}`, (originA.x + C.x) / 2, C.y + 20, pal.pillBg, pal.adjColor);
  drawBadgeText(ctx, `Opp = ${m.opp.toFixed(2)}`, C.x + 48, (C.y + B.y) / 2, pal.pillBg, pal.oppColor);

  const hypMidX = (originA.x + B.x) / 2 - 28;
  const hypMidY = (originA.y + B.y) / 2 - 14;
  drawBadgeText(ctx, `Hyp = ${m.hyp.toFixed(2)} (k=${m.scale.toFixed(2)})`, hypMidX, hypMidY, pal.pillBg, pal.triStroke);

  // Vertex labels A, B, C
  ctx.fillStyle = pal.text;
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('A', originA.x - 16, originA.y + 12);
  ctx.fillText('C (90°)', C.x - 14, C.y + 38);

  // Draggable handles: Resize Handle at B, Side Resize at C, Angle Handle on ray AB
  // 1) Base vertex C (drag horizontally to resize side at same angle)
  ctx.fillStyle = pal.scaleHandle;
  ctx.beginPath();
  ctx.arc(C.x, C.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2) Vertex B (drag to scale triangle while preserving angle)
  ctx.fillStyle = pal.scaleHandle;
  ctx.beginPath();
  ctx.arc(B.x, B.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  drawBadgeText(ctx, 'Drag B or C: Scale Sides', B.x + 2, B.y - 20, pal.pillBg, pal.scaleHandle);

  // 3) Angle handle (drag around A to change θ)
  ctx.fillStyle = pal.angleColor;
  ctx.beginPath();
  ctx.arc(angleHandle.x, angleHandle.y, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  drawBadgeText(ctx, 'Drag θ', angleHandle.x - 24, angleHandle.y - 18, pal.pillBg, pal.angleColor);

  // Top-left dashed legend
  drawBadgeText(ctx, 'Dashed = Reference Triangle (k = 1.0)', 135, 20, pal.pillBg, pal.muted);

  ctx.restore();
  return {
    resizeHandle: B,
    sideHandle: C,
    angleHandle,
    originA,
    pxPerUnit,
  };
}

function drawGeoSimulation(canvas, state = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const {
    ax = -3,
    ay = -2,
    bx = 5,
    by = 4,
    showPerpBisector = true,
    theme = 'light',
  } = state;
  const m = computeGeoSimMetrics(ax, ay, bx, by);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = canvas.clientWidth || canvas.width || 680;
  const cssH = canvas.clientHeight || canvas.height || 400;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  const pal = getSimPalette(theme);
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const pad = 32;
  const unit = Math.max(12, Math.min((cssW - pad * 2) / 16, (cssH - pad * 2) / 12));
  const origin = { x: cssW / 2, y: cssH / 2 };

  const toPx = (wx, wy) => ({
    x: origin.x + wx * unit,
    y: origin.y - wy * unit,
  });

  const toWorld = (px, py) => {
    const rawX = (px - origin.x) / unit;
    const rawY = (origin.y - py) / unit;
    const snapX = Math.max(-7.5, Math.min(7.5, Math.round(rawX * 2) / 2));
    const snapY = Math.max(-5.5, Math.min(5.5, Math.round(rawY * 2) / 2));
    return { x: snapX, y: snapY };
  };

  // Gridlines
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  for (let gx = -8; gx <= 8; gx++) {
    const p = toPx(gx, 0);
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, cssH);
    ctx.stroke();
  }
  for (let gy = -6; gy <= 6; gy++) {
    const p = toPx(0, gy);
    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(cssW, p.y);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = pal.axis;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(cssW, origin.y);
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, cssH);
  ctx.stroke();

  ctx.fillStyle = pal.muted;
  ctx.font = '500 11px system-ui, -apple-system, sans-serif';
  for (let gx = -6; gx <= 6; gx += 2) {
    if (gx === 0) continue;
    const p = toPx(gx, 0);
    ctx.fillText(String(gx), p.x - 5, origin.y + 14);
  }
  for (let gy = -4; gy <= 4; gy += 2) {
    if (gy === 0) continue;
    const p = toPx(0, gy);
    ctx.fillText(String(gy), origin.x + 6, p.y + 4);
  }

  const pA = toPx(m.ax, m.ay);
  const pB = toPx(m.bx, m.by);
  const pCorner = toPx(m.bx, m.ay);
  const pM = toPx(m.mx, m.my);

  // Dashed Rise & Run legs
  if (m.dist > 0.05) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = pal.adjColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pCorner.x, pCorner.y);
    ctx.stroke();

    ctx.strokeStyle = pal.oppColor;
    ctx.beginPath();
    ctx.moveTo(pCorner.x, pCorner.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
    ctx.restore();

    if (Math.abs(m.dx) > 0.4) {
      drawBadgeText(ctx, `Δx = ${m.dx}`, (pA.x + pCorner.x) / 2, pA.y + (m.dy >= 0 ? 16 : -16), pal.pillBg, pal.adjColor);
    }
    if (Math.abs(m.dy) > 0.4) {
      drawBadgeText(ctx, `Δy = ${m.dy}`, pB.x + (m.dx >= 0 ? 34 : -34), (pCorner.y + pB.y) / 2, pal.pillBg, pal.oppColor);
    }
  }

  // Perpendicular bisector through M
  if (showPerpBisector && m.dist > 0.1) {
    const ux = -m.dy / m.dist;
    const uy = m.dx / m.dist;
    const ext = 25;
    const q1 = toPx(m.mx - ux * ext, m.my - uy * ext);
    const q2 = toPx(m.mx + ux * ext, m.my + uy * ext);
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = pal.perpColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(q1.x, q1.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.stroke();
    ctx.restore();

    // Right angle marker at M between AB and perp bisector
    const tx = m.dx / m.dist;
    const ty = -m.dy / m.dist; // canvas Y flips world Y
    const vx = ux;
    const vy = -uy;
    const rSz = 9;
    ctx.strokeStyle = pal.perpColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pM.x + tx * rSz, pM.y + ty * rSz);
    ctx.lineTo(pM.x + (tx + vx) * rSz, pM.y + (ty + vy) * rSz);
    ctx.lineTo(pM.x + vx * rSz, pM.y + vy * rSz);
    ctx.stroke();
  }

  // Main segment AB
  ctx.strokeStyle = pal.triStroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pA.x, pA.y);
  ctx.lineTo(pB.x, pB.y);
  ctx.stroke();

  // Midpoint M
  ctx.fillStyle = pal.angleColor;
  ctx.beginPath();
  ctx.arc(pM.x, pM.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  drawBadgeText(ctx, `M(${m.mx}, ${m.my})`, pM.x, pM.y - 18, pal.pillBg, pal.angleColor);

  // Draggable endpoints A & B
  ctx.fillStyle = pal.handleA;
  ctx.beginPath();
  ctx.arc(pA.x, pA.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  drawBadgeText(ctx, `A(${m.ax}, ${m.ay})`, pA.x, pA.y - 19, pal.pillBg, pal.handleA);

  ctx.fillStyle = pal.handleB;
  ctx.beginPath();
  ctx.arc(pB.x, pB.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  drawBadgeText(ctx, `B(${m.bx}, ${m.by})`, pB.x, pB.y - 19, pal.pillBg, pal.handleB);

  drawBadgeText(ctx, 'Drag A or B on grid (0.5 snap)', 125, 18, pal.pillBg, pal.muted);

  ctx.restore();
  return {
    handleA: pA,
    handleB: pB,
    origin,
    unit,
    toWorld,
  };
}
return { computeTrigSimMetrics, computeGeoSimMetrics, drawTrigSimulation, drawGeoSimulation };

},

"./adaptive.js": function(__require) {
// Adaptive difficulty engine for MPM2D Quadratic Solver
// Levels: 1 (Basic) -> 2 (Core) -> 3 (Challenging) -> 4 (Enrichment)

const { LEVEL_META } = __require("./math-engine.js");
function createDefaultAdaptiveState(initialLevel = 1) {
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
function recordAdaptiveAttempt(state, isCorrect, assisted = false) {
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
return { createDefaultAdaptiveState, recordAdaptiveAttempt };

},

"./storage.js": function(__require) {
// Persistent student progress tracking in localStorage + CSV export

const { FORMS } = __require("./math-engine.js");
const { createDefaultAdaptiveState } = __require("./adaptive.js");
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

function createInitialProgress() {
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

function loadProgress() {
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

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / privacy mode storage errors gracefully
  }
}

function resetProgressStorage() {
  const fresh = createInitialProgress();
  saveProgress(fresh);
  return fresh;
}

function recordAttemptInProgress(progress, entry) {
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

function generateProgressCsv(progress) {
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
return { createInitialProgress, loadProgress, saveProgress, resetProgressStorage, recordAttemptInProgress, generateProgressCsv };

},

"./app.js": function(__require) {
// Main UI Controller for MPM2D Quadratic Studio (Nelson Principles of Mathematics 10)

const { FORMS, FORM_META, LEVEL_META, formatQuadraticLatex, generateProblem, checkAnswer, } = __require("./math-engine.js");
const { SKILL_META, generateSkillProblem, checkSkillAnswer, } = __require("./skills-engine.js");
const { computeQuadraticFeatures, formatInequalitySolutionLatex, drawQuadraticGraph, drawTransformationGraph, canvasEventToGrid, drawLinearSystemGraph, drawTrigDiagram, } = __require("./grapher.js");
const { computeTransformation, generateTransformationProblem, } = __require("./transformations.js");
const { LINEAR_SKILL_META, generateLinearProblem, checkLinearAnswer, } = __require("./linear-engine.js");
const { GEO_SKILL_META, generateGeometryProblem, checkGeometryAnswer, } = __require("./geometry-engine.js");
const { TRIG_SKILL_META, generateTrigProblem, checkTrigAnswer, } = __require("./trig-engine.js");
const { PROP_TYPES, generateProportionProblem, checkProportionAnswer, generateProblemString, checkStringStep, BTC_TASKS, BTC_OBSERVATION_ITEMS, generateRandomGroups, } = __require("./mental-engine.js");
const { computeTrigSimMetrics, computeGeoSimMetrics, drawTrigSimulation, drawGeoSimulation, } = __require("./simulations.js");
const { recordAdaptiveAttempt } = __require("./adaptive.js");
const { loadProgress, saveProgress, resetProgressStorage, recordAttemptInProgress, generateProgressCsv, } = __require("./storage.js");
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

}
};
const __cache = {};
function __require(id) {
  if (!__cache[id]) {
    __cache[id] = __factories[id](__require);
  }
  return __cache[id];
}
__require("./app.js");
})();
