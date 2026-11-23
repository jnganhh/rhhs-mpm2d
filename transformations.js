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

export function formatVertexEquationLatex(a, h, k) {
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

export function computeTransformation(source, target) {
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

export function generateTransformationProblem(tier = 'basic') {
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
