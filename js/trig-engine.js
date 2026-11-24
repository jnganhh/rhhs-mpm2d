// MPM2D Trigonometry Engine (Nelson Principles of Mathematics 10, Ch. 7 & 8)
// Covers: Sine, Cosine, Tangent, Primary Mix, Right-Triangle Applications,
// Sine Law, Cosine Law, Acute-Triangle Mix, and Acute-Triangle Applications.

import { formatFractionLatex, evaluateMathExpression } from './math-engine.js';

export const TRIG_SKILL_META = {
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

function generateSimilarityTheoremChoice(level) {
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

function generateSimilarTriangles(level) {
  // Level 1 (Low Floor): 50% visual theorem identification (AA/SAS~/SSS~), 50% simple integer scale factor missing side
  if (level === 1) {
    if (Math.random() < 0.5) {
      return generateSimilarityTheoremChoice(level);
    }
    const ab = randInt(3, 8);
    const bc = randInt(4, 10);
    const k = pick([2, 3, 4]);
    const de = ab * k;
    const ef = bc * k;

    return {
      skill: 'similar_triangles',
      level,
      inputType: 'number',
      unit: 'cm',
      nelsonRef: 'Ch. 7.1 — Similar Triangles Scale Factor (Low Floor)',
      promptText: 'Given △ABC ~ △DEF, find the missing side length EF (in cm):',
      equationLatex: `\\triangle ABC \\sim \\triangle DEF, \\quad AB = ${ab}\\text{ cm}, \\; BC = ${bc}\\text{ cm}, \\; DE = ${de}\\text{ cm}, \\; EF = x`,
      expectedValue: ef,
      exactExpectedLatex: String(ef),
      diagram: {
        type: 'similar',
        t1: { A: '', B: '', C: '', ab: `${ab}`, bc: `${bc}`, ca: '' },
        t2: { D: '', E: '', F: '', de: `${de}`, ef: 'x', fd: '' },
      },
      hints: [
        'Find the scale factor k by dividing corresponding sides DE ÷ AB.',
        `Multiply BC = ${bc} cm by k = ${de} ÷ ${ab} = ${k}.`,
      ],
      solutionSteps: [
        `\\text{Scale factor } k = \\frac{DE}{AB} = \\frac{${de}}{${ab}} = ${k}`,
        `x = EF = k \\cdot BC = ${k}(${bc}) = ${ef}\\text{ cm}`,
      ],
    };
  }

  // Level 2 (Core): 50% decimal/fractional scale factor proportion, 50% indirect measurement (shadows)
  if (level === 2) {
    if (Math.random() < 0.5) {
      const k = pick([1.5, 2.5, 3.5]);
      const ab = pick([4, 6, 8, 10]);
      const bc = randInt(4, 12);
      const de = Number((ab * k).toFixed(1));
      const ef = Number((bc * k).toFixed(2));
      const efTex = Number.isInteger(ef) ? String(ef) : formatFractionLatex(Math.round(ef * 2), 2);

      return {
        skill: 'similar_triangles',
        level,
        inputType: 'number',
        unit: 'cm',
        nelsonRef: 'Ch. 7.2 — Proportions with Non-Integer Scale Factors',
        promptText: 'Given △ABC ~ △DEF, use equal ratios to solve for side EF = x (in cm):',
        equationLatex: `\\triangle ABC \\sim \\triangle DEF, \\quad AB = ${ab}, \\; BC = ${bc}, \\; DE = ${de}, \\; EF = x`,
        expectedValue: ef,
        exactExpectedLatex: efTex,
        diagram: {
          type: 'similar',
          t1: { A: '', B: '', C: '', ab: String(ab), bc: String(bc), ca: '' },
          t2: { D: '', E: '', F: '', de: String(de), ef: 'x', fd: '' },
        },
        hints: [
          `Set up a proportion comparing corresponding sides: AB / DE = BC / EF.`,
          `Solve ${ab} / ${de} = ${bc} / x (or scale factor k = ${k}).`,
        ],
        solutionSteps: [
          `\\frac{${de}}{${ab}} = \\frac{x}{${bc}} \\implies k = ${k}`,
          `x = ${k} \\times ${bc} = ${ef}\\text{ cm}`,
        ],
      };
    }

    const h1 = pick([1.5, 1.6, 1.8, 2.0]);
    const s1 = pick([2, 2.5, 3, 4]);
    const k = randInt(3, 7);
    const s2 = s1 * k;
    const h2 = Number((h1 * k).toFixed(2));
    return {
      skill: 'similar_triangles',
      level,
      inputType: 'number',
      unit: 'm',
      nelsonRef: 'Ch. 7.2 — Indirect Measurement (Shadows)',
      promptText: `At the same time of day (equal sun angles), a ${h1} m pole casts a ${s1} m shadow while a tree casts a ${s2} m shadow. Find the tree's height x (in m):`,
      equationLatex: `\\frac{x}{${h1}\\text{ m}} = \\frac{${s2}\\text{ m}}{${s1}\\text{ m}}`,
      expectedValue: h2,
      exactExpectedLatex: String(h2),
      diagram: {
        type: 'similar',
        t1: { A: '', B: '90°', C: 'Sun ∠', ab: `${h1}m`, bc: `${s1}m`, ca: '' },
        t2: { D: '', E: '90°', F: 'Sun ∠', de: 'x', ef: `${s2}m`, fd: '' },
      },
      hints: [
        'Both vertical objects make 90° with the ground and match the sun angle, so the triangles are similar by AA~.',
        `Scale factor from pole shadow (${s1} m) to tree shadow (${s2} m) is ${k}. Multiply ${h1} by ${k}.`,
      ],
      solutionSteps: [
        `\\text{Similar by AA}\\sim: \\; \\frac{x}{${h1}} = \\frac{${s2}}{${s1}} = ${k}`,
        `x = ${h1} \\times ${k} = ${h2}\\text{ m}`,
      ],
    };
  }

  // Level 3 (Challenging): 50% nested parallel-line triangle (trap: add segments for full side!), 50% algebraic side lengths
  if (level === 3) {
    if (Math.random() < 0.5) {
      const k = pick([2, 3, 4]);
      const p = randInt(2, 6);
      const ext = p * (k - 1);
      const deFull = p + ext;
      const bcSmall = randInt(3, 8);
      const efLarge = bcSmall * k;

      return {
        skill: 'similar_triangles',
        level,
        inputType: 'number',
        unit: 'cm',
        nelsonRef: 'Ch. 7.2 — Nested Parallel Triangles (DE = AB + Extension)',
        promptText: `Smaller △ABC is nested inside larger △DEF (∠A = ∠D and parallel bases BC ∥ EF), where side DE extends past B by ${ext} cm. Find base BC = x (in cm):`,
        equationLatex: `AB = ${p}, \\; \\text{Extension } B\\!\\to\\!E = ${ext}, \\; EF = ${efLarge}, \\; BC = x`,
        expectedValue: bcSmall,
        exactExpectedLatex: String(bcSmall),
        diagram: {
          type: 'similar',
          t1: { A: 'θ', B: '', C: '', ab: String(p), bc: 'x', ca: '' },
          t2: { D: 'θ', E: '', F: '', de: `${p}+${ext}`, ef: String(efLarge), fd: '' },
        },
        hints: [
          `Watch the common trap! The full side of the large triangle is DE = AB + extension = ${p} + ${ext} = ${deFull}, NOT ${ext}.`,
          `Use AB / DE = BC / EF: solve ${p} / ${deFull} = x / ${efLarge}.`,
        ],
        solutionSteps: [
          `DE = ${p} + ${ext} = ${deFull}\\text{ cm} \\quad \\text{(scale factor } k = \\frac{${deFull}}{${p}} = ${k}\\text{)}`,
          `\\frac{x}{${efLarge}} = \\frac{${p}}{${deFull}} \\implies x = \\frac{${efLarge}}{${k}} = ${bcSmall}\\text{ cm}`,
        ],
      };
    }

    const k = pick([2, 3]);
    const m = k === 2 ? 1 : 2;
    const xSol = randInt(3, 9);
    const ab = randInt(3, 7);
    const de = ab * k;
    const c1 = randInt(1, 5);
    const c2 = (k - m) * xSol + k * c1;
    const efExpr = m === 1 ? `x + ${c2}` : `${m}x + ${c2}`;

    return {
      skill: 'similar_triangles',
      level,
      inputType: 'number',
      unit: '',
      nelsonRef: 'Ch. 7.2 — Solving Algebraic Sides in Similar Triangles',
      promptText: 'Given △ABC ~ △DEF with algebraic side lengths, solve for x:',
      equationLatex: `AB = ${ab}, \\; DE = ${de}, \\; BC = x + ${c1}, \\; EF = ${efExpr}`,
      expectedValue: xSol,
      exactExpectedLatex: String(xSol),
      diagram: {
        type: 'similar',
        t1: { A: '', B: '', C: '', ab: String(ab), bc: `x+${c1}`, ca: '' },
        t2: { D: '', E: '', F: '', de: String(de), ef: efExpr, fd: '' },
      },
      hints: [
        `First find the scale factor from DE / AB = ${de} / ${ab} = ${k}.`,
        `Set EF = ${k} · BC: write ${efExpr} = ${k}(x + ${c1}) and solve the linear equation for x.`,
      ],
      solutionSteps: [
        `\\frac{DE}{AB} = \\frac{${de}}{${ab}} = ${k} \\implies EF = ${k} \\cdot BC`,
        `${efExpr} = ${k}(x + ${c1}) = ${k}x + ${k * c1}`,
        `x = ${xSol}`,
      ],
    };
  }

  // Level 4 (High Ceiling): 50% Area Scaling (A₂ / A₁ = k²), 50% Altitude to Hypotenuse Geometric Mean (h² = p·q)
  if (Math.random() < 0.5) {
    const useFracScale = Math.random() < 0.4;
    const a = useFracScale ? 4 : randInt(3, 6);
    const d = useFracScale ? 6 : a * pick([2, 3, 4]);
    const k = d / a;
    const area1 = useFracScale ? pick([8, 12, 16, 20]) : randInt(6, 18);
    const area2 = Math.round(area1 * k * k);
    const kTex = Number.isInteger(k) ? String(k) : '\\frac{3}{2}';

    return {
      skill: 'similar_triangles',
      level,
      inputType: 'number',
      unit: 'cm²',
      nelsonRef: 'Contest Enrichment — Area Scaling of Similar Triangles (k²)',
      promptText: `Given △ABC ~ △DEF with corresponding sides AB = ${a} cm, DE = ${d} cm, and Area(△ABC) = ${area1} cm², find Area(△DEF) in cm²:`,
      equationLatex: `\\triangle ABC \\sim \\triangle DEF, \\quad \\frac{DE}{AB} = \\frac{${d}}{${a}}, \\quad \\text{Area}(\\triangle ABC) = ${area1}\\text{ cm}^2`,
      expectedValue: area2,
      exactExpectedLatex: String(area2),
      diagram: {
        type: 'similar',
        t1: { A: '', B: '', C: '', ab: `${a}cm`, bc: `Area=${area1}`, ca: '' },
        t2: { D: '', E: '', F: '', de: `${d}cm`, ef: 'Area=?', fd: '' },
      },
      hints: [
        'Remember: when lengths scale by factor k, BOTH base and height scale by k, so Area scales by k²!',
        `Compute k = ${d} / ${a} = ${k}, then multiply Area(△ABC) = ${area1} by k² = ${Number.isInteger(k * k) ? k * k : '9/4'}.`,
      ],
      solutionSteps: [
        `\\text{Length scale factor } k = \\frac{${d}}{${a}} = ${kTex}`,
        `\\text{Area scale factor} = k^2 = \\left(${kTex}\\right)^2 = ${Number.isInteger(k * k) ? k * k : '\\frac{9}{4}'}`,
        `\\text{Area}(\\triangle DEF) = ${area1} \\times k^2 = ${area2}\\text{ cm}^2`,
      ],
    };
  }

  // Right Triangle Altitude Geometric Mean: h² = p * q
  const [p, q, h] = pick([
    [4, 9, 6],
    [2, 8, 4],
    [3, 12, 6],
    [4, 16, 8],
    [9, 16, 12],
    [2, 18, 6],
    [5, 20, 10],
    [8, 18, 12],
  ]);

  return {
    skill: 'similar_triangles',
    level,
    inputType: 'number',
    unit: 'cm',
    nelsonRef: 'Contest Enrichment — Right Triangle Altitude Geometric Mean (h² = pq)',
    promptText:
      'An altitude drawn to the hypotenuse splits a right triangle into two similar right triangles △ABC ~ △DEF with shared segments AB = ' +
      p +
      ' cm, BC = h, DE = h, EF = ' +
      q +
      ' cm. Find the exact altitude h (in cm):',
    equationLatex: `\\triangle ABC \\sim \\triangle DEF \\implies \\frac{AB}{DE} = \\frac{BC}{EF} \\implies \\frac{${p}}{h} = \\frac{h}{${q}}`,
    expectedValue: h,
    exactExpectedLatex: String(h),
    diagram: {
      type: 'similar',
      t1: { A: 'θ', B: '90°', C: '', ab: `${p}cm`, bc: 'h', ca: '' },
      t2: { D: 'θ', E: '90°', F: '', de: 'h', ef: `${q}cm`, fd: '' },
    },
    hints: [
      'Cross-multiply the proportion from the two similar right triangles: p / h = h / q.',
      `Solve h² = ${p} × ${q} = ${p * q}, then take √${p * q}.`,
    ],
    solutionSteps: [
      `\\frac{${p}}{h} = \\frac{h}{${q}} \\implies h^2 = (${p})(${q}) = ${p * q}`,
      `h = \\sqrt{${p * q}} = ${h}\\text{ cm}`,
    ],
  };
}

let trigCounter = 0;

export function generateTrigProblem(skill = 'sine', level = 1) {
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

export function checkTrigAnswer(inputRaw, problem) {
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
    .replace(/°|\bdegrees?\b|\bdeg\b|cm²|cm\^2|m²|m\^2|\bcm\b|\bkm\b|\bm\b/gi, '')
    .replace(/^[a-zA-Zθ]+\s*=\s*/, '')
    .trim();

  try {
    const val = evaluateMathExpression(s);
    const diff = Math.abs(val - problem.expectedValue);
    // Allow 0.55 tolerance for nearest-degree or 1 d.p. trig rounding
    const tol = problem.unit === '°' ? 0.55 : 0.16;
    const unitSuffix = problem.unit ? ` ${problem.unit}` : '';
    if (diff <= tol) {
      return {
        correct: true,
        message: `Correct! Exact ≈ ${problem.expectedValue.toFixed(1)}${unitSuffix}.`,
      };
    }
    return {
      correct: false,
      message: `Not quite (expected ≈ ${problem.expectedValue.toFixed(1)}${unitSuffix} — make sure your calculator is in DEGREE mode!).`,
    };
  } catch {
    return { correct: false, parseError: true, message: 'Could not read that number. Enter e.g. 14.3' };
  }
}
