// MPM2D Quadratic Equations Engine (Nelson Principles of Mathematics 10)
// Procedural problem generation, LaTeX formatting, and recursive-descent equivalence checking.

export const FORMS = ['factored', 'vertex', 'standard'];

export const LEVEL_META = {
  1: { name: 'Basic', badge: 'Level 1', desc: 'Foundational integer roots & simple forms' },
  2: { name: 'Core', badge: 'Level 2', desc: 'Rational roots, decomposition & no-real-root cases' },
  3: { name: 'Challenging', badge: 'Level 3', desc: 'Fractions, non-zero RHS, exact radicals & Quadratic Formula' },
  4: { name: 'Enrichment', badge: 'Level 4', desc: 'Fractional & contest substitutions, parameters & rationals' },
};

export const FORM_META = {
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

export function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function reduceFraction(num, den) {
  if (den === 0) throw new Error('Division by zero');
  if (num === 0) return { num: 0, den: 1 };
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  const g = gcd(num, den);
  return { num: sign * Math.abs(num) / g, den: Math.abs(den) / g };
}

export function simplifyRadical(n) {
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

export function formatQuadraticLatex(a, b, c, varName = 'x') {
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

export function formatLinearFactor(p, q, varName = 'x') {
  // Represents (px - q) where root is q/p
  // Wait: let's pass explicit coefficients (px + c) to avoid sign confusion!
  return formatLinearSum(p, -q, varName);
}

export function formatLinearSum(p, c, varName = 'x') {
  // Formats (px + c)
  if (p === 1 && c === 0) return varName;
  if (p === -1 && c === 0) return `-${varName}`;
  const xPart = formatCoeffVar(p, varName, true);
  const cPart = formatConst(c, xPart === '');
  return `(${xPart}${cPart})`;
}

export function formatFractionLatex(num, den) {
  const { num: n, den: d } = reduceFraction(num, den);
  if (d === 1) return String(n);
  if (n < 0) return `-\\frac{${Math.abs(n)}}{${d}}`;
  return `\\frac{${n}}{${d}}`;
}

export function formatRationalCoeffVar(num, den, suffix, isLeading = false) {
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

export function formatRationalQuadraticLatex(aNum, aDen, bNum, bDen, cNum, cDen, varName = 'x') {
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

export function generateProblem(form = 'mixed', level = 1) {
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

export function evaluateMathExpression(expr) {
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

export function parseAnswerRoots(inputRaw) {
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

export function checkAnswer(inputRaw, isNoRealToggle, problem) {
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
