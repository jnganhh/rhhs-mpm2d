// Interactive Canvas Grapher & Quadratic Inequality Solver for MPM2D

import { gcd, simplifyRadical, formatFractionLatex } from './math-engine.js';

export function computeQuadraticFeatures(a, b, c) {
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

export function computeLineIntersections(a, b, c, m, kLine) {
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

export function formatInequalitySolutionLatex(a, b, c, op = '=') {
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

export function drawQuadraticGraph(canvas, opts = {}) {
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

export function drawTransformationGraph(canvas, opts = {}) {
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

export function canvasEventToGrid(canvas, clientX, clientY, range = 8) {
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

export function drawLinearSystemGraph(canvas, opts = {}) {
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

export function drawTrigDiagram(canvas, diagram, opts = {}) {
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
