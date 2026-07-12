/**
 * Geometry primitives ported from the validated Morph Lab prototype
 * (docs/rebuild/prototype/morphlab.html). Every function is pure math on
 * number arrays — no DOM, no state.
 */

export type Pt = readonly [number, number];

export const round1 = (x: number): number => Math.round(x * 10) / 10;

export const fmt = (x: number, y: number): string => `${round1(x)} ${round1(y)}`;

/** Point on a quadratic bezier. */
export function quad(p0: Pt, c: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
  ];
}

/**
 * Unit normals along a polyline. The first sample prefers "up" (−y in SVG);
 * every subsequent normal keeps sign-continuity with its predecessor. The
 * continuity rule is what keeps near-vertical limb strokes from twisting —
 * an always-flip-up rule breaks exactly there (prototype bug, fixed).
 */
export function normals(pts: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    let nx = dy / len;
    let ny = -dx / len;
    if (i === 0) {
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
    } else {
      const p = out[i - 1]!;
      if (nx * p[0] + ny * p[1] < 0) {
        nx = -nx;
        ny = -ny;
      }
    }
    out.push([nx, ny]);
  }
  return out;
}

/**
 * Closed outline path of a variable-width stroke along a polyline:
 * top edge in order, bottom edge reversed.
 */
export function ribbonPath(pts: readonly Pt[], widths: readonly number[]): string {
  const nm = normals(pts);
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const w = widths[i]! / 2;
    const p = pts[i]!;
    const n = nm[i]!;
    top.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    bot.push([p[0] - n[0] * w, p[1] - n[1] * w]);
  }
  let d = `M${fmt(top[0]![0], top[0]![1])}`;
  for (let i = 1; i < top.length; i++) d += `L${fmt(top[i]![0], top[i]![1])}`;
  for (let i = bot.length - 1; i >= 0; i--) d += `L${fmt(bot[i]![0], bot[i]![1])}`;
  return d + 'Z';
}

/** Piecewise-linear width profile over t ∈ [0,1] from (t, width) keypoints. */
export function widthAt(keys: readonly (readonly [number, number])[], t: number): number {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t1, w1] = keys[i + 1]!;
    if (t <= t1) {
      const [t0, w0] = keys[i]!;
      return w0 + (w1 - w0) * ((t - t0) / Math.max(1e-6, t1 - t0));
    }
  }
  return keys[keys.length - 1]![1];
}

/** Catmull-Rom sampling through control points, m samples per segment. */
export function catmull(pts: readonly Pt[], m: number): Pt[] {
  const out: Pt[] = [pts[0]!];
  for (let j = 0; j < pts.length - 1; j++) {
    const p0 = pts[Math.max(0, j - 1)]!;
    const p1 = pts[j]!;
    const p2 = pts[j + 1]!;
    const p3 = pts[Math.min(pts.length - 1, j + 2)]!;
    for (let i = 1; i <= m; i++) {
      const t = i / m;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

/** Variable-width limb as a smooth ribbon through control points. */
export function limbPath(ctrl: readonly Pt[], widths: readonly number[]): string {
  const pts = catmull(ctrl, 8);
  const ws = pts.map((_, i) => {
    const f = (i / (pts.length - 1)) * (widths.length - 1);
    const j = Math.floor(f);
    const w0 = widths[j]!;
    const w1 = widths[Math.min(j + 1, widths.length - 1)]!;
    return w0 + (w1 - w0) * (f - j);
  });
  return ribbonPath(pts, ws);
}

export function trianglePath(a: Pt, b: Pt, c: Pt): string {
  return `M${fmt(a[0], a[1])}L${fmt(b[0], b[1])}L${fmt(c[0], c[1])}Z`;
}

/** Open polyline path — interior contour lines are drawn with these. */
export function linePath(pts: readonly Pt[]): string {
  let d = `M${fmt(pts[0]![0], pts[0]![1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${fmt(pts[i]![0], pts[i]![1])}`;
  return d;
}

/**
 * Circular arc from angle a0 to a1 (radians, y-down screen space) around c —
 * joint and muscle arcs. Angles are always compile-time constants so the
 * cos/sin calls stay as deterministic as the rest of the pipeline.
 */
export function arcPath(c: Pt, r: number, a0: number, a1: number): string {
  const p0: Pt = [c[0] + Math.cos(a0) * r, c[1] + Math.sin(a0) * r];
  const p1: Pt = [c[0] + Math.cos(a1) * r, c[1] + Math.sin(a1) * r];
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${fmt(p0[0], p0[1])}A${round1(r)} ${round1(r)} 0 ${large} ${a1 > a0 ? 1 : 0} ${fmt(p1[0], p1[1])}`;
}

/** Point at arc-length fraction a ∈ [0,1] along a polyline. */
export function alongPolyline(pts: readonly Pt[], a: number): Pt {
  let total = 0;
  const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
    seg.push(d);
    total += d;
  }
  let want = Math.min(1, Math.max(0, a)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i]! || i === seg.length - 1) {
      const f = seg[i]! > 0 ? want / seg[i]! : 0;
      const p0 = pts[i]!;
      const p1 = pts[i + 1]!;
      return [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f];
    }
    want -= seg[i]!;
  }
  return pts[pts.length - 1]!;
}

/**
 * Rounded petal/feather: two quadratic edges from base to tip, bulging ±w
 * around the midline. Reads as a soft feather rather than a quill spike.
 */
export function petalPath(base: Pt, tip: Pt, w: number): string {
  const mx = (base[0] + tip[0]) / 2;
  const my = (base[1] + tip[1]) / 2;
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const L = Math.hypot(dx, dy) || 1;
  const px = dy / L;
  const py = -dx / L;
  return (
    `M${fmt(base[0] - px * w, base[1] - py * w)}` +
    `Q${fmt(mx - px * w * 1.5, my - py * w * 1.5)} ${fmt(tip[0], tip[1])}` +
    `Q${fmt(mx + px * w * 1.5, my + py * w * 1.5)} ${fmt(base[0] + px * w, base[1] + py * w)}Z`
  );
}
