// Additional MPM2D Skills Engine:
// Completing the Square (Self-Check), Factoring, Expansion,
// Key Features (Axis of Symmetry & y-Intercept), and Linear-Quadratic Systems.

import {
  gcd,
  formatQuadraticLatex,
  formatRationalQuadraticLatex,
  formatLinearSum,
  formatFractionLatex,
  evaluateMathExpression,
} from './math-engine.js';

export const SKILL_META = {
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

export const FACTOR_TECHNIQUES = {
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

export function normalizeAlgebraLatex(raw) {
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

export function evalExpressionAtX(rawLatex, xVal) {
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

export function generateSkillProblem(skill, level = 1, options = {}) {
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

export function checkSkillAnswer(skill, inputRaw, problem) {
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
