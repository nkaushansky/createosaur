import type { Mat2D, Point } from './types';

/** Identity matrix. */
export const IDENTITY: Mat2D = [1, 0, 0, 1, 0, 0];

const DEG_TO_RAD = Math.PI / 180;

/** Collapse IEEE −0 to +0 so a zero-motion pose is bit-identical to rest. */
function z(v: number): number {
  return v === 0 ? 0 : v;
}

/** m1 ∘ m2 — apply m2 first, then m1 (CSS/Pixi nesting order: parent · child). */
export function multiply(m1: Mat2D, m2: Mat2D): Mat2D {
  const [a1, b1, c1, d1, tx1, ty1] = m1;
  const [a2, b2, c2, d2, tx2, ty2] = m2;
  return [
    z(a1 * a2 + c1 * b2),
    z(b1 * a2 + d1 * b2),
    z(a1 * c2 + c1 * d2),
    z(b1 * c2 + d1 * d2),
    z(a1 * tx2 + c1 * ty2 + tx1),
    z(b1 * tx2 + d1 * ty2 + ty1),
  ];
}

export function compose(...ms: Mat2D[]): Mat2D {
  return ms.reduce(multiply, IDENTITY);
}

export function translate(dx: number, dy: number): Mat2D {
  return [1, 0, 0, 1, z(dx), z(dy)];
}

/** Rotation about a pivot point, degrees, clockwise in y-down stage space. */
export function rotateAboutDeg(pivot: Point, deg: number): Mat2D {
  if (deg === 0) return IDENTITY;
  const r = deg * DEG_TO_RAD;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [
    cos,
    sin,
    -sin,
    cos,
    z(pivot.x - cos * pivot.x + sin * pivot.y),
    z(pivot.y - sin * pivot.x - cos * pivot.y),
  ];
}

export function scaleAbout(pivot: Point, sx: number, sy: number): Mat2D {
  return [sx, 0, 0, sy, z(pivot.x - sx * pivot.x), z(pivot.y - sy * pivot.y)];
}

export function applyMat(m: Mat2D, p: Point): Point {
  const [a, b, c, d, tx, ty] = m;
  return { x: a * p.x + c * p.y + tx, y: b * p.x + d * p.y + ty };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Hermite smoothstep of u clamped to [0, 1]. */
export function smoothstep01(u: number): number {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Smoothstep that rises from 0 at `from` to 1 at `to`; `from` may exceed `to`. */
export function ramp(from: number, to: number, v: number): number {
  return smoothstep01((v - from) / (to - from));
}
