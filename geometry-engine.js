// MPM2D Analytic Geometry Engine (Nelson Principles of Mathematics 10, Ch. 2)
// Covers: Midpoint Formula, Distance Formula, 4 Special Lines, 4 Special Centres,
// and Proving Geometric Properties (with GeoGebra commands).

import {
  gcd,
  simplifyRadical,
  formatFractionLatex,
  evaluateMathExpression,
} from './math-engine.js';
import { parseOrderedPair } from './linear-engine.js';

export const GEO_SKILL_META = {
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

export function generateGeometryProblem(skill = 'midpoint', level = 1) {
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

export function checkGeometryAnswer(skill, input, problem) {
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
