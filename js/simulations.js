// Interactive MPM2D Simulations:
// 1. Trig Ratio Invariance Lab (drag side scale or angle theta)
// 2. Analytic Geometry Explorer (drag A & B for rise, run, midpoint, distance, slope & perp bisector)

export function computeTrigSimMetrics(angleDeg = 35, scale = 1.0) {
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

export function computeGeoSimMetrics(ax = -3, ay = -2, bx = 5, by = 4) {
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

export function drawTrigSimulation(canvas, state = {}) {
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

export function drawGeoSimulation(canvas, state = {}) {
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
