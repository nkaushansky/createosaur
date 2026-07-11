import {
  blendGenome,
  composeName,
  GENOME_VERSION,
  genomeHash,
  mulberry32,
  slotWeights,
  speciesByWeight,
  type BlendResult,
  type Genome,
  type SpeciesResolver,
} from '@createosaur/genome';
import {
  getSpecies,
  type FeatureKind,
  type MorphVector,
  type PartSlot,
  type SpeciesId,
} from '@createosaur/species-data';
import { shade } from './color';
import {
  arcPath,
  fmt,
  limbPath,
  linePath,
  normals,
  petalPath,
  quad,
  ribbonPath,
  round1,
  trianglePath,
  widthAt,
  type Pt,
} from './geometry';

/**
 * genome → SVG string. Pure and deterministic: the same genome renders to an
 * identical string in the browser, the share service, and the test runner.
 * Golden-genome snapshots enforce this — see tests/goldens.test.ts.
 *
 * Coordinate space (from the validated prototype): viewBox 820×540, ground
 * at y=470, hip anchored at x=505, creature faces left. All styling colors
 * are literal values — the output must be self-contained for OG images.
 *
 * Look (M1b fidelity pass, owner direction 2026-07-10): "Camp Cretaceous
 * cartoony-realistic-esque / detailed field-guide drawing, not photoreal."
 * Volume comes from vertical gradients plus a belly-shadow and dorsal-light
 * ribbon that follow the spine; detail from interior contour linework and
 * low-density integument texture. All seeded variation draws from
 * genome.seed via mulberry32 with per-layer salts.
 */
export interface RenderOptions {
  /** defs-id suffix to avoid collisions when several creatures share a page */
  idSuffix?: string;
  /** draw the ground line and contact shadow (default true) */
  ground?: boolean;
  /**
   * Vignette mode (GAME-DESIGN §4.2): crop the viewBox tight to one slot's
   * region for a picker thumbnail. The creature geometry is byte-identical to
   * a full render — only the framing changes — so purity/determinism hold and
   * "that species' version of that part" is literally the same renderer.
   * A crop implies no ground and no display-size scaling (the part fills the
   * frame regardless of the size slider).
   */
  crop?: PartSlot;
  /**
   * Detail tier. 'full' (default) is the whole field-guide treatment. 'fast'
   * skips the small-stroke layers (integument texture, contour linework,
   * striations, toe lines, secondary feather rows) so hot loops on weak
   * hardware can re-render every slider tick; silhouette, gradients and
   * features are unchanged, so the creature never reads as a different
   * animal. Vignettes default to 'full' — the skin slot exists to show
   * integument, which 'fast' would hide.
   */
  detail?: 'full' | 'fast';
  /**
   * Override how species ids resolve to definitions (dev species workbench
   * only). Lets an unsaved morph vector render through the real pipeline.
   * Defaults to the frozen database.
   */
  resolveSpecies?: SpeciesResolver;
}

export const VIEW = { width: 820, height: 540 } as const;
const GROUND = 470;
const HIPX = 505;

const BONE = '#e6dcc0';
const BONE_INK = '#8a7a52';
const PAPER_LINE = '#b9b4a0';
const TOOTH = '#f6f2e4';
const EYE_WHITE = '#fdfaef';
const EYE_PUPIL = '#1c1a14';

// Varied outline weights (fidelity pass): the silhouette is the boldest line
// on the page, features sit a step lighter, far limbs lighter still, and
// interior contour work is fine-nibbed. Uniform weight is what made the
// prototype read as clip-art.
const W_BODY = 3;
const W_FEAT = 2.2;
const W_NEAR = 2.4;
const W_FAR = 1.8;
const W_LINE = 1.5;

/** Integument class, derived from the skin slot — drives the texture layer. */
type Integument = 'scales' | 'osteoderms' | 'sauropod' | 'feathers';

export function renderCreature(genome: Genome, opts: RenderOptions = {}): string {
  const resolve: SpeciesResolver = opts.resolveSpecies ?? getSpecies;
  const blend = blendGenome(genome, opts.resolveSpecies);
  const p = blend.morph;
  const f = blend.features;
  const lux = opts.detail !== 'fast';
  const sfx = opts.idSuffix ?? genomeHash(genome);
  const clipId = `bod-${sfx}`;
  const gid = (k: string): string => `${k}-${sfx}`;
  const url = (k: string): string => `url(#${gid(k)})`;

  // --- spine ---------------------------------------------------------------
  const hip: Pt = [HIPX, p.hipY];
  const shoulder: Pt = [HIPX - p.bodyLen, p.hipY - p.shoulderRise];
  const headC: Pt = [shoulder[0] - p.neckLen * 0.95, shoulder[1] - p.neckUp];
  const snout: Pt = [headC[0] - p.snoutLen, headC[1] + 5];
  const neckCtrl: Pt = [
    2 * headC[0] - (shoulder[0] + snout[0]) / 2,
    2 * headC[1] - (shoulder[1] + snout[1]) / 2,
  ];
  const tailTip: Pt = [HIPX + p.tailLen, p.hipY + p.tailDrop];
  const tailCtrl: Pt = [HIPX + p.tailLen * 0.45, p.hipY + p.tailDrop * 0.22];
  const midCtrl: Pt = [(hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2 - p.archUp];

  const pts: Pt[] = [];
  for (let i = 0; i <= 29; i++) pts.push(quad(tailTip, tailCtrl, hip, i / 29));
  for (let i = 1; i <= 19; i++) pts.push(quad(hip, midCtrl, shoulder, i / 19));
  for (let i = 1; i <= 29; i++) pts.push(quad(shoulder, neckCtrl, snout, i / 29));
  const N = pts.length;

  const tHead = 0.625 + 0.375 * ((p.neckLen * 0.95) / (p.neckLen * 0.95 + p.snoutLen));
  const widthKeys: (readonly [number, number])[] = [
    [0, 5],
    [0.3, p.tailThick],
    [0.42, p.bodyThick * 0.97],
    [0.52, p.bodyThick],
    [0.625, p.chestThick],
    [0.71, p.neckThick],
    [tHead, p.headSize],
    [1, Math.max(p.snoutTip, 6)],
  ];
  const ws = pts.map((_, i) => widthAt(widthKeys, i / (N - 1)));
  const nm = normals(pts);

  /** spine sample at t: point, normal, width, nose-ward tangent */
  const at = (t: number) => {
    const i = Math.min(N - 1, Math.max(0, Math.round(t * (N - 1))));
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(N - 1, i + 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    return { p: pts[i]!, n: nm[i]!, w: ws[i]!, tn: [dx / L, dy / L] as Pt };
  };
  /** point on the silhouette edge at t: edge +1 = dorsal, −1 = ventral */
  const edgeOf = (t: number, edge: 1 | -1, inset = 0): Pt => {
    const s = at(t);
    const w = s.w / 2 - inset;
    return [s.p[0] + s.n[0] * w * edge, s.p[1] + s.n[1] * w * edge];
  };
  const botOf = (t: number, inset = 0): Pt => edgeOf(t, -1, inset);
  /** polyline hugging the spine at a signed fraction of the half-width */
  const contour = (a: number, b: number, frac: number, K: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i <= K; i++) {
      const s = at(a + ((b - a) * i) / K);
      out.push([s.p[0] + s.n[0] * (s.w / 2) * frac, s.p[1] + s.n[1] * (s.w / 2) * frac]);
    }
    return out;
  };

  // --- palette ---------------------------------------------------------------
  const prim = genome.cosmetics.hide;
  const sec = genome.cosmetics.markings;
  const ink = shade(prim, -0.55);
  const farInk = shade(prim, -0.42);
  const boneFeature =
    f.browHorns !== undefined ||
    f.noseHorn !== undefined ||
    f.tailSpikes !== undefined ||
    f.domeSkull !== undefined;

  // --- defs: clip + gradients ---------------------------------------------------
  // Gradient stops are fixed-precision hex (shade()) at literal offsets, so
  // they serialize deterministically. objectBoundingBox units mean the same
  // three defs shade body and limbs each within their own silhouette.
  const vGrad = (id: string, top: string, mid: string, bot: string): string =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/><stop offset="0.55" stop-color="${mid}"/>` +
    `<stop offset="1" stop-color="${bot}"/></linearGradient>`;
  const bodyD = ribbonPath(pts, ws);
  let defs = `<clipPath id="${clipId}"><path d="${bodyD}"/></clipPath>`;
  defs += vGrad(gid('gb'), shade(prim, 0.16), prim, shade(prim, -0.26));
  defs += vGrad(gid('gl'), shade(prim, -0.02), shade(prim, -0.14), shade(prim, -0.28));
  defs += vGrad(gid('gf'), shade(prim, -0.1), shade(prim, -0.2), shade(prim, -0.3));
  if (f.plates || f.frill) defs += vGrad(gid('sc'), shade(sec, 0.22), sec, shade(sec, -0.2));
  if (boneFeature) defs += vGrad(gid('bn'), shade(BONE, 0.35), BONE, shade(BONE, -0.16));
  if (f.sail) {
    const web = shade(sec, -0.12);
    defs += vGrad(gid('sl'), shade(web, 0.3), web, shade(web, -0.2));
  }
  if (f.domeSkull) {
    defs += vGrad(gid('dm'), shade(prim, 0.42), shade(prim, 0.28), shade(prim, 0.14));
  }
  if (f.tailClub) {
    // duller than horn keratin — a weathered osteoderm mace, not polished ivory
    defs += vGrad(gid('cb'), shade(BONE, -0.04), shade(BONE, -0.16), shade(BONE, -0.28));
  }
  const drawGround = opts.ground !== false && !opts.crop;
  if (drawGround) {
    defs +=
      `<radialGradient id="${gid('sh')}"><stop offset="0" stop-color="#23281e" stop-opacity="0.18"/>` +
      `<stop offset="0.7" stop-color="#23281e" stop-opacity="0.11"/>` +
      `<stop offset="1" stop-color="#23281e" stop-opacity="0"/></radialGradient>`;
  }
  let svg = `<defs>${defs}</defs>`;

  // --- ground + soft contact shadow -------------------------------------------
  if (drawGround) {
    svg += `<line x1="60" y1="${GROUND}" x2="780" y2="${GROUND}" stroke="${PAPER_LINE}" stroke-width="2"/>`;
    for (const gx of [120, 300, 520, 700]) {
      svg += `<path d="M${gx} ${GROUND}l5 -9 M${gx + 7} ${GROUND}l4 -6" stroke="${PAPER_LINE}" stroke-width="1.5" fill="none"/>`;
    }
    const extent = tailTip[0] - snout[0];
    svg += `<ellipse cx="${round1((tailTip[0] + snout[0]) / 2)}" cy="${GROUND + 8}" rx="${round1(extent * 0.46)}" ry="10" fill="${url('sh')}"/>`;
  }

  // --- far legs (behind the body) ---------------------------------------------
  const FAR_DX = 26;
  const FAR_DY = -6;
  svg += hindLeg(hip, p, FAR_DX, FAR_DY, url('gf'), farInk, W_FAR, ink, lux);
  svg += frontLeg(shoulder, p, FAR_DX, FAR_DY, url('gf'), farInk, W_FAR, ink, lux);

  // --- features drawn behind the silhouette so bases hide under it -------------
  if (f.frill) {
    const c = at(0.685);
    const R = 66 * f.frill.intensity;
    const cx = c.p[0] + c.n[0] * 8;
    const cy = c.p[1] + c.n[1] * 8;
    // scalloped rim: epoccipital bumps ring the shield's leading edge, then
    // rib spokes radiate from the boss — flat ellipse → sculpted shield
    let bumps = '';
    for (let k = 0; k < 8; k++) {
      const th = ((-98 + k * 28) * Math.PI) / 180;
      const bx = cx + Math.sin(th) * R * 0.74;
      const by = cy - Math.cos(th) * R;
      const br = (3 + 1.3 * Math.sin(k * 2.1)) * f.frill.intensity;
      bumps += `<circle cx="${round1(bx)}" cy="${round1(by)}" r="${round1(br)}" fill="${sec}" stroke="${shade(sec, -0.35)}" stroke-width="1.2"/>`;
    }
    let spokes = '';
    for (let k = 0; k < 5; k++) {
      const th = ((-64 + k * 32) * Math.PI) / 180;
      spokes += `<path d="M${fmt(cx + Math.sin(th) * R * 0.2, cy - Math.cos(th) * R * 0.28)}L${fmt(
        cx + Math.sin(th) * R * 0.64,
        cy - Math.cos(th) * R * 0.86
      )}" stroke="${shade(sec, -0.32)}" stroke-width="1.6" opacity="0.4"/>`;
    }
    svg +=
      `<g transform="rotate(-24 ${round1(cx)} ${round1(cy)})">` +
      `<ellipse cx="${round1(cx)}" cy="${round1(cy)}" rx="${round1(R * 0.74)}" ry="${round1(R)}" fill="${url('sc')}" stroke="${shade(sec, -0.35)}" stroke-width="${W_FEAT}"/>` +
      bumps +
      `<ellipse cx="${round1(cx)}" cy="${round1(cy)}" rx="${round1(R * 0.44)}" ry="${round1(R * 0.62)}" fill="${shade(sec, -0.13)}"/>` +
      spokes +
      `</g>`;
  }
  if (f.plates) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const tt = 0.3 + (i * 0.38) / (count - 1);
      const s = at(tt);
      const base: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 3), s.p[1] + s.n[1] * (s.w / 2 - 3)];
      const h = (26 + 24 * Math.sin((Math.PI * i) / (count - 1))) * f.plates.intensity;
      const a = s.tn;
      const n = s.n;
      // kite → leaf: quadratic edges bow outward, the crown arcs between the
      // two tip corners, and a center vein grounds it like a fin bone
      const bL: Pt = [base[0] - a[0] * 13, base[1] - a[1] * 13];
      const bR: Pt = [base[0] + a[0] * 13, base[1] + a[1] * 13];
      const tL: Pt = [base[0] - a[0] * 4.5 + n[0] * h, base[1] - a[1] * 4.5 + n[1] * h];
      const tR: Pt = [base[0] + a[0] * 5 + n[0] * h * 0.88, base[1] + a[1] * 5 + n[1] * h * 0.88];
      svg +=
        `<path d="M${fmt(bL[0], bL[1])}` +
        `Q${fmt(base[0] - a[0] * 12 + n[0] * h * 0.5, base[1] - a[1] * 12 + n[1] * h * 0.5)} ${fmt(tL[0], tL[1])}` +
        `Q${fmt(base[0] + n[0] * h * 1.07, base[1] + n[1] * h * 1.07)} ${fmt(tR[0], tR[1])}` +
        `Q${fmt(base[0] + a[0] * 12 + n[0] * h * 0.42, base[1] + a[1] * 12 + n[1] * h * 0.42)} ${fmt(bR[0], bR[1])}Z"` +
        ` fill="${url('sc')}" stroke="${shade(sec, -0.38)}" stroke-width="2" stroke-linejoin="round"/>`;
      if (lux) {
        svg += `<path d="M${fmt(base[0] + n[0] * 3, base[1] + n[1] * 3)}Q${fmt(
          base[0] - a[0] * 2 + n[0] * h * 0.5,
          base[1] - a[1] * 2 + n[1] * h * 0.5
        )} ${fmt(base[0] + n[0] * h * 0.82, base[1] + n[1] * h * 0.82)}" fill="none" stroke="${shade(sec, -0.42)}" stroke-width="1.3" opacity="0.45"/>`;
      }
    }
  }
  if (f.tailSpikes) {
    for (const tt of [0.035, 0.085]) {
      const s = at(tt);
      const L = 46 * f.tailSpikes.intensity;
      let dir: Pt = [s.n[0] - s.tn[0] * 0.55, s.n[1] - s.tn[1] * 0.55];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      dir = [dir[0] / dl, dir[1] / dl];
      const base: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 6), s.p[1] + s.n[1] * (s.w / 2 - 6)];
      svg += `<path d="M${fmt(base[0] - s.tn[0] * 7, base[1] - s.tn[1] * 7)}Q${fmt(
        base[0] + dir[0] * L * 0.55 - s.tn[0] * 6,
        base[1] + dir[1] * L * 0.55 - s.tn[1] * 6
      )} ${fmt(base[0] + dir[0] * L, base[1] + dir[1] * L)}Q${fmt(
        base[0] + dir[0] * L * 0.5 + s.tn[0] * 5,
        base[1] + dir[1] * L * 0.5 + s.tn[1] * 5
      )} ${fmt(base[0] + s.tn[0] * 7, base[1] + s.tn[1] * 7)}Z" fill="${url('bn')}" stroke="${BONE_INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
  }
  const drawHorn = (tt: number, L: number, lean: number, rings: number): string => {
    const s = at(tt);
    const b: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 2), s.p[1] + s.n[1] * (s.w / 2 - 2)];
    const tip: Pt = [b[0] + s.n[0] * L + s.tn[0] * L * lean, b[1] + s.n[1] * L + s.tn[1] * L * lean];
    let out = `<path d="M${fmt(b[0] - s.tn[0] * 7, b[1] - s.tn[1] * 7)}Q${fmt(
      b[0] + s.n[0] * L * 0.5 - s.tn[0] * 6,
      b[1] + s.n[1] * L * 0.5 - s.tn[1] * 6
    )} ${fmt(tip[0], tip[1])}Q${fmt(
      b[0] + s.n[0] * L * 0.5 + s.tn[0] * 4,
      b[1] + s.n[1] * L * 0.5 + s.tn[1] * 4
    )} ${fmt(b[0] + s.tn[0] * 7, b[1] + s.tn[1] * 7)}Z" fill="${url('bn')}" stroke="${BONE_INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    if (lux) {
      // keratin growth rings near the base
      const ax = tip[0] - b[0];
      const ay = tip[1] - b[1];
      const al = Math.hypot(ax, ay) || 1;
      for (let k = 0; k < rings; k++) {
        const u = 0.2 + k * 0.16;
        const cx = b[0] + (ax / al) * L * u;
        const cy = b[1] + (ay / al) * L * u;
        const hw = 6 * (1 - u) + 1.6;
        const px = ay / al;
        const py = -ax / al;
        out += `<path d="M${fmt(cx - px * hw, cy - py * hw)}Q${fmt(cx + (ax / al) * 2.4, cy + (ay / al) * 2.4)} ${fmt(
          cx + px * hw,
          cy + py * hw
        )}" fill="none" stroke="${BONE_INK}" stroke-width="1.1" opacity="0.5"/>`;
      }
    }
    return out;
  };
  if (f.browHorns) {
    svg += drawHorn(tHead - 0.006, 62 * f.browHorns.intensity, 0.34, 2);
    svg += drawHorn(tHead - 0.038, 48 * f.browHorns.intensity, 0.28, 2);
  }
  if (f.noseHorn) {
    svg += drawHorn(0.955, 22 * f.noseHorn.intensity, 0.15, 1);
  }

  // Spinosaurus sail: a stretched membrane over elongated neural spines.
  // The crown is a chain of quadratics that sag between the ray tips, so the
  // edge scallops organically instead of cutting a hard polygon. Drawn before
  // the silhouette so its base tucks under the body outline.
  if (f.sail) {
    const S = 7;
    const peak = 132 * f.sail.intensity;
    // front edge stops at t=0.64 — clear of the shoulder, so the head-slot
    // vignette (t ≥ 0.72 plus margin) never catches a wall of membrane
    const st = (i: number) => 0.3 + (i * 0.34) / (S - 1);
    // exponent < 1 broadens the crown: a raked "D", not a circus tent
    const heightAt = (u: number) => Math.sin(Math.PI * u) ** 0.55;
    const bases: Pt[] = [];
    const tips: Pt[] = [];
    const hs: number[] = [];
    for (let i = 0; i < S; i++) {
      const s = at(st(i));
      const h = peak * heightAt(i / (S - 1));
      hs.push(h);
      bases.push([s.p[0] + s.n[0] * (s.w / 2 - 4), s.p[1] + s.n[1] * (s.w / 2 - 4)]);
      tips.push([bases[i]![0] + s.n[0] * h, bases[i]![1] + s.n[1] * h]);
    }
    let d = `M${fmt(bases[0]![0], bases[0]![1])}`;
    // leading edge bows nose-ward, then the crown sags between rays
    {
      const m: Pt = [(bases[0]![0] + tips[1]![0]) / 2, (bases[0]![1] + tips[1]![1]) / 2];
      const tn = at(st(0)).tn;
      d += `Q${fmt(m[0] + tn[0] * 16, m[1] + tn[1] * 16)} ${fmt(tips[1]![0], tips[1]![1])}`;
    }
    for (let i = 1; i < S - 1; i++) {
      const mid = at((st(i) + st(i + 1)) / 2);
      const sag = Math.min(hs[i]!, hs[i + 1]!) * 0.1 + 3;
      const mx = (tips[i]![0] + tips[i + 1]![0]) / 2 - mid.n[0] * sag;
      const my = (tips[i]![1] + tips[i + 1]![1]) / 2 - mid.n[1] * sag;
      d += `Q${fmt(mx, my)} ${fmt(tips[i + 1]![0], tips[i + 1]![1])}`;
    }
    {
      const m: Pt = [(tips[S - 1]![0] + bases[S - 1]![0]) / 2, (tips[S - 1]![1] + bases[S - 1]![1]) / 2];
      const tn = at(st(S - 1)).tn;
      d += `Q${fmt(m[0] - tn[0] * 10, m[1] - tn[1] * 10)} ${fmt(bases[S - 1]![0], bases[S - 1]![1])}`;
    }
    for (let i = S - 1; i >= 0; i--) d += `L${fmt(bases[i]![0], bases[i]![1])}`;
    svg += `<path d="${d}Z" fill="${url('sl')}" stroke="${shade(sec, -0.4)}" stroke-width="${W_FEAT}" stroke-linejoin="round"/>`;
    // neural-spine rays curve gently tailward; finer half-rays fill between
    const rayInk = shade(sec, -0.46);
    for (let i = 1; i < S - 1; i++) {
      const s = at(st(i));
      const end: Pt = [bases[i]![0] + s.n[0] * (hs[i]! - 4), bases[i]![1] + s.n[1] * (hs[i]! - 4)];
      const mx = (bases[i]![0] + end[0]) / 2 - s.tn[0] * 5;
      const my = (bases[i]![1] + end[1]) / 2 - s.tn[1] * 5;
      svg += `<path d="M${fmt(bases[i]![0], bases[i]![1])}Q${fmt(mx, my)} ${fmt(end[0], end[1])}" fill="none" stroke="${rayInk}" stroke-width="2.4" opacity="0.6" stroke-linecap="round"/>`;
    }
    if (lux) {
      for (let i = 0; i < S - 1; i++) {
        const tm = (st(i) + st(i + 1)) / 2;
        const s = at(tm);
        const h = Math.min(hs[i]!, hs[i + 1]!) * 0.6 + peak * 0.08;
        const b: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 4), s.p[1] + s.n[1] * (s.w / 2 - 4)];
        svg += `<path d="M${fmt(b[0], b[1])}L${fmt(b[0] + s.n[0] * h, b[1] + s.n[1] * h)}" stroke="${rayInk}" stroke-width="1.1" opacity="0.32"/>`;
      }
    }
  }

  // Parasaurolophus crest: a long tube swept up and back off the skull.
  // Drawn as a round-capped stroke (a capsule) so it reads as a solid tube,
  // not a flat blade — ink underlay, then fill, then a highlight run.
  if (f.crest) {
    const s = at(Math.min(1, tHead - 0.02));
    const L = 108 * f.crest.intensity;
    const tube = Math.max(13, s.w * 0.34);
    const base: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 5), s.p[1] + s.n[1] * (s.w / 2 - 5)];
    const back: Pt = [-s.tn[0], -s.tn[1]]; // toward the neck/tail
    const up: Pt = s.n;
    const ctrl: Pt = [base[0] + up[0] * L * 0.72, base[1] + up[1] * L * 0.72];
    const tip: Pt = [
      base[0] + back[0] * L * 0.95 + up[0] * L * 0.62,
      base[1] + back[1] * L * 0.95 + up[1] * L * 0.62,
    ];
    const spine = `M${fmt(base[0], base[1])}Q${fmt(ctrl[0], ctrl[1])} ${fmt(tip[0], tip[1])}`;
    const tint = shade(prim, 0.14);
    svg +=
      `<path d="${spine}" fill="none" stroke="${ink}" stroke-width="${round1(tube + 5)}" stroke-linecap="round"/>` +
      `<path d="${spine}" fill="none" stroke="${tint}" stroke-width="${round1(tube)}" stroke-linecap="round"/>` +
      `<path d="${spine}" fill="none" stroke="${shade(prim, 0.34)}" stroke-width="${round1(
        tube * 0.26
      )}" stroke-linecap="round" opacity="0.6"/>`;
    if (lux) {
      // two growth bands across the tube near the skull
      for (const u of [0.16, 0.3]) {
        const cx = base[0] + (ctrl[0] - base[0]) * u * 2 * (1 - u) + (tip[0] - base[0]) * u * u;
        const cy = base[1] + (ctrl[1] - base[1]) * u * 2 * (1 - u) + (tip[1] - base[1]) * u * u;
        svg += `<circle cx="${round1(cx)}" cy="${round1(cy)}" r="${round1(tube * 0.42)}" fill="none" stroke="${shade(prim, -0.28)}" stroke-width="1.1" opacity="0.4"/>`;
      }
    }
  }

  // Feathered coat: continuous fringe bands whose outer edge scallops between
  // lain-back feather tips (hide-toned, so it reads as the animal's coat),
  // plus a marking-toned tail fan. Tips sweep along −tn — tailward — the way
  // plumage actually lies; quill spikes are what the art direction forbids.
  if (f.feathers) {
    const fr = mulberry32((genome.seed ^ 0x00fea) >>> 0);
    // coat length tracks body bulk so a hatchling isn't swallowed by plumage
    const sizeF = Math.min(1.15, Math.max(0.75, p.bodyThick / 88));
    const len = 26 * f.feathers.intensity * sizeF;
    const edge = shade(prim, -0.48);
    // A coat band is a nearly-smooth fringe (soft undulation, tapered ends)
    // with feather separation drawn as interior strokes — deep edge notches
    // read as sawtooth spikes the moment the band gets short on a hybrid.
    const coat = (t0: number, t1: number, K: number, L: number, lie: number, jitAmp: number, paint: string): string => {
      const bases: Pt[] = [];
      const tips: Pt[] = [];
      for (let i = 0; i <= K; i++) {
        const tt = t0 + ((t1 - t0) * i) / K;
        const s = at(tt);
        const taper = i === 0 || i === K ? 0.45 : i === 1 || i === K - 1 ? 0.8 : 1;
        const li = L * taper * (1 - jitAmp + fr() * jitAmp * 2);
        const b: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 3), s.p[1] + s.n[1] * (s.w / 2 - 3)];
        bases.push(b);
        tips.push([b[0] + s.n[0] * li - s.tn[0] * li * lie, b[1] + s.n[1] * li - s.tn[1] * li * lie]);
      }
      let d = `M${fmt(bases[K]![0], bases[K]![1])}L${fmt(tips[K]![0], tips[K]![1])}`;
      for (let i = K - 1; i >= 0; i--) {
        const s = at(t0 + ((t1 - t0) * (i + 0.5)) / K);
        const mx = (tips[i + 1]![0] + tips[i]![0]) / 2 - s.n[0] * L * 0.1;
        const my = (tips[i + 1]![1] + tips[i]![1]) / 2 - s.n[1] * L * 0.1;
        d += `Q${fmt(mx, my)} ${fmt(tips[i]![0], tips[i]![1])}`;
      }
      d += `L${fmt(bases[0]![0], bases[0]![1])}`;
      for (let i = 1; i <= K; i++) d += `L${fmt(bases[i]![0], bases[i]![1])}`;
      d += 'Z';
      let path = `<path d="${d}" ${paint}/>`;
      if (lux) {
        let sep = '';
        for (let i = 1; i < K; i++) {
          const b = bases[i]!;
          const tp = tips[i]!;
          const s = at(t0 + ((t1 - t0) * i) / K);
          const ex = b[0] + (tp[0] - b[0]) * 0.3;
          const ey = b[1] + (tp[1] - b[1]) * 0.3;
          sep += `M${fmt(tp[0], tp[1])}Q${fmt(
            (tp[0] + ex) / 2 + s.tn[0] * L * 0.1,
            (tp[1] + ey) / 2 + s.tn[1] * L * 0.1
          )} ${fmt(ex, ey)}`;
        }
        path += `<path d="${sep}" fill="none" stroke="${shade(prim, -0.45)}" stroke-width="1" opacity="0.5"/>`;
      }
      return path;
    };
    svg += coat(0.1, 0.9, 13, len, 0.55, 0.14, `fill="${shade(prim, -0.14)}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"`);
    // nape tuft in the marking accent — display feathers behind the skull
    {
      let tuft = '';
      for (let k = 0; k < 3; k++) {
        const s = at(0.83 + k * 0.032);
        const jit = 0.85 + fr() * 0.3;
        const li = len * (0.85 + k * 0.12) * jit;
        const b: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 3), s.p[1] + s.n[1] * (s.w / 2 - 3)];
        const tip: Pt = [b[0] + s.n[0] * li - s.tn[0] * li * 0.5, b[1] + s.n[1] * li - s.tn[1] * li * 0.5];
        tuft += `<path d="${petalPath(b, tip, 4)}"/>`;
      }
      svg += `<g fill="${shade(sec, -0.08)}" stroke="${shade(sec, -0.4)}" stroke-width="1" opacity="0.95">${tuft}</g>`;
    }
    // tail fan: marking-toned display plumes rotate tailward near the tip,
    // broad, clustered and overlapping so they read as a fan, not spikes
    let fan = '';
    for (let k = 0; k < 5; k++) {
      const tt = 0.008 + k * 0.012;
      const s = at(tt);
      // first plume nearly extends the tail line so the bare tip never pokes
      // through the fan; later plumes rotate up toward the dorsal coat
      const mixK = 0.85 - k * 0.14;
      let dir: Pt = [s.n[0] * (1 - mixK) - s.tn[0] * mixK, s.n[1] * (1 - mixK) - s.tn[1] * mixK];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      dir = [dir[0] / dl, dir[1] / dl];
      const jit = 0.85 + fr() * 0.3;
      const plume = len * (1.5 + k * 0.14) * jit;
      const base: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 3), s.p[1] + s.n[1] * (s.w / 2 - 3)];
      const tip: Pt = [base[0] + dir[0] * plume, base[1] + dir[1] * plume];
      fan += `<path d="${petalPath(base, tip, 6)}"/>`;
    }
    svg += `<g fill="${shade(sec, -0.08)}" stroke="${shade(sec, -0.4)}" stroke-width="1" opacity="0.95">${fan}</g>`;
  }

  // --- body silhouette ---------------------------------------------------------
  svg += `<path d="${bodyD}" fill="${url('gb')}" stroke="${ink}" stroke-width="${W_BODY}" stroke-linejoin="round"/>`;

  // --- volume: belly shadow + dorsal light, hugging the silhouette --------------
  // These follow the spine (not the page), so a rearing sauropod neck and a
  // level raptor tail both shade correctly at any morph position.
  {
    const band = (a: number, b: number, edge: 1 | -1, frac: number): string => {
      const K = 26;
      const outer: Pt[] = [];
      const inner: Pt[] = [];
      for (let i = 0; i <= K; i++) {
        const t = a + ((b - a) * i) / K;
        const s = at(t);
        const half = s.w / 2;
        outer.push([s.p[0] + s.n[0] * half * 1.04 * edge, s.p[1] + s.n[1] * half * 1.04 * edge]);
        inner.push([s.p[0] + s.n[0] * half * (1 - frac) * edge, s.p[1] + s.n[1] * half * (1 - frac) * edge]);
      }
      let d = `M${fmt(outer[0]![0], outer[0]![1])}`;
      for (let i = 1; i <= K; i++) d += `L${fmt(outer[i]![0], outer[i]![1])}`;
      for (let i = K; i >= 0; i--) d += `L${fmt(inner[i]![0], inner[i]![1])}`;
      return d + 'Z';
    };
    svg +=
      `<g clip-path="url(#${clipId})">` +
      `<path d="${band(0.04, 0.72, -1, 0.36)}" fill="${shade(prim, -0.4)}" opacity="0.2"/>` +
      `<path d="${band(0.3, 0.97, 1, 0.24)}" fill="${shade(prim, 0.5)}" opacity="0.26"/>` +
      `</g>`;
  }

  // --- pattern (clipped to the silhouette, placement seeded by the genome) ------
  svg += patternLayer(genome, clipId, sec, prim, sfx);

  // --- integument texture + interior contour linework (clipped) -----------------
  if (lux) {
    let detail = '';
    const integument = integumentOf(genome, f, resolve);
    const tr = mulberry32((genome.seed ^ 0x7ec5) >>> 0);
    if (integument === 'scales' || integument === 'sauropod') {
      // low-density scale hint: seeded crescents that bow belly-ward along
      // the local normal — field-guide shorthand, not noise
      const big = integument === 'sauropod';
      const count = big ? 14 : 22;
      const rBase = big ? 4 : 2.6;
      let marks = '';
      for (let i = 0; i < count; i++) {
        const t = 0.22 + tr() * 0.56;
        const lat = (tr() * 2 - 1) * 0.6;
        const r = rBase + tr() * (big ? 2.4 : 1.8);
        const s = at(t);
        const c: Pt = [s.p[0] + s.n[0] * (s.w / 2) * lat * 0.8, s.p[1] + s.n[1] * (s.w / 2) * lat * 0.8];
        marks += `<path d="M${fmt(c[0] - s.tn[0] * r, c[1] - s.tn[1] * r)}Q${fmt(
          c[0] - s.n[0] * r * 0.9,
          c[1] - s.n[1] * r * 0.9
        )} ${fmt(c[0] + s.tn[0] * r, c[1] + s.tn[1] * r)}"/>`;
      }
      detail += `<g fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.2">${marks}</g>`;
    } else if (integument === 'osteoderms') {
      // armored hide: two staggered courses of oval scutes along the back
      let scutes = '';
      for (const [row, stag] of [
        [0.56, 0],
        [0.22, 0.03],
      ] as const) {
        for (let i = 0; i < 7; i++) {
          const t = 0.3 + stag + (i * 0.4) / 6;
          const s = at(t);
          const c: Pt = [s.p[0] + s.n[0] * (s.w / 2) * row, s.p[1] + s.n[1] * (s.w / 2) * row];
          const r = 4.2 + (s.w / 2) * 0.045 + tr() * 1.2;
          scutes += `<ellipse cx="${round1(c[0])}" cy="${round1(c[1])}" rx="${round1(r)}" ry="${round1(r * 0.72)}"/>`;
        }
      }
      detail += `<g fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.2">${scutes}</g>`;
    }
    // contour/muscle linework off the spine samples: neck run, throat, back,
    // belly crease, twin tail lines, and joint arcs at hip and shoulder
    const lines: Array<[Pt[], number, number]> = [
      [contour(0.72, 0.9, 0.3, 9), W_LINE, 0.3],
      [contour(0.72, 0.86, -0.34, 8), 1.3, 0.26],
      [contour(0.38, 0.6, 0.34, 8), W_LINE, 0.28],
      [contour(0.4, 0.64, -0.46, 8), 1.4, 0.26],
      [contour(0.05, 0.26, 0.3, 8), 1.3, 0.28],
      [contour(0.07, 0.24, -0.3, 8), 1.3, 0.24],
    ];
    let strokes = '';
    for (const [ptsL, w, o] of lines) {
      strokes += `<path d="${linePath(ptsL)}" stroke-width="${w}" opacity="${o}"/>`;
    }
    strokes += `<path d="${arcPath([hip[0] - 2, hip[1] + 12], p.hLegThick * 0.66, Math.PI * 1.06, Math.PI * 1.86)}" stroke-width="1.6" opacity="0.3"/>`;
    strokes += `<path d="${arcPath([shoulder[0] + 8, shoulder[1] + 16], p.fLegThick * 0.9 + 6, Math.PI * 1.12, Math.PI * 1.8)}" stroke-width="1.4" opacity="0.26"/>`;
    detail += `<g fill="none" stroke="${ink}" stroke-linecap="round">${strokes}</g>`;
    if (f.feathers) {
      // where the coat lies over the body: one scalloped course
      const K = 11;
      let d = '';
      for (let i = 0; i < K; i++) {
        const t0 = 0.3 + (i * 0.56) / K;
        const t1 = 0.3 + ((i + 1) * 0.56) / K;
        const s0 = at(t0);
        const s1 = at(t1);
        const a: Pt = [s0.p[0] + s0.n[0] * (s0.w / 2) * 0.28, s0.p[1] + s0.n[1] * (s0.w / 2) * 0.28];
        const b: Pt = [s1.p[0] + s1.n[0] * (s1.w / 2) * 0.28, s1.p[1] + s1.n[1] * (s1.w / 2) * 0.28];
        const mid = at((t0 + t1) / 2);
        d += `${i === 0 ? `M${fmt(a[0], a[1])}` : ''}Q${fmt(
          (a[0] + b[0]) / 2 - mid.n[0] * 2.6,
          (a[1] + b[1]) / 2 - mid.n[1] * 2.6
        )} ${fmt(b[0], b[1])}`;
      }
      detail += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.3" opacity="0.25"/>`;
    }
    svg += `<g clip-path="url(#${clipId})">${detail}</g>`;
  }

  // --- mouth, nostril, teeth, eye + brow -----------------------------------------
  {
    let d = `M${fmt(...botOf(0.865, 3))}`;
    for (let tt = 0.885; tt <= 0.995; tt += 0.02) d += `L${fmt(...botOf(tt, 3))}`;
    svg += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="2" opacity="0.7"/>`;
    // mouth-corner crease lifts the cheek — the "smiling field sketch" cue
    {
      const c = at(0.862);
      const m = botOf(0.862, 3);
      svg += `<path d="M${fmt(m[0], m[1])}Q${fmt(m[0] + c.n[0] * 5 - c.tn[0] * 1, m[1] + c.n[1] * 5 - c.tn[1] * 1)} ${fmt(
        m[0] + c.n[0] * 9 - c.tn[0] * 5,
        m[1] + c.n[1] * 9 - c.tn[1] * 5
      )}" fill="none" stroke="${ink}" stroke-width="1.6" opacity="0.45"/>`;
    }
    // nostril: a small crescent high on the snout
    {
      const s = at(0.972);
      const c: Pt = [s.p[0] + s.n[0] * (s.w / 2) * 0.34, s.p[1] + s.n[1] * (s.w / 2) * 0.34];
      svg += `<path d="M${fmt(c[0] - s.tn[0] * 2.6, c[1] - s.tn[1] * 2.6)}Q${fmt(
        c[0] + s.n[0] * 2.6,
        c[1] + s.n[1] * 2.6
      )} ${fmt(c[0] + s.tn[0] * 2.6, c[1] + s.tn[1] * 2.6)}" fill="none" stroke="${ink}" stroke-width="1.6" opacity="0.75"/>`;
    }

    if (f.teeth && f.teeth.intensity > 0.05) {
      const tl = Math.min(7, Math.max(3.5, p.headSize * 0.16)) * f.teeth.intensity;
      let teeth = '';
      for (let i = 0; i < 5; i++) {
        const t0 = 0.885 + i * 0.021;
        const a = botOf(t0, 2.5);
        const b = botOf(t0 + 0.017, 2.5);
        const len = tl * (i % 2 === 0 ? 1 : 0.72);
        teeth += `<path d="${trianglePath(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + len], b)}" fill="${TOOTH}" stroke="${BONE_INK}" stroke-width="0.8"/>`;
      }
      svg += `<g opacity="${round1(f.teeth.intensity)}">${teeth}</g>`;
    }

    const e = at(Math.min(1, tHead + 0.018));
    const ex = e.p[0] + e.n[0] * e.w * 0.16;
    const ey = e.p[1] + e.n[1] * e.w * 0.16;
    const eyeScale = blend.age === 'hatchling' ? 1.6 : blend.age === 'juvenile' ? 1.25 : 1;
    const er = Math.min(7, Math.max(3.5, e.w * 0.11)) * eyeScale;
    // sclera → iris (markings-tinted) → pupil → catchlight: the deliberate
    // cartoon-life treatment; the catchlight is what makes it look awake
    svg +=
      `<circle cx="${round1(ex)}" cy="${round1(ey)}" r="${round1(er)}" fill="${EYE_WHITE}" stroke="${ink}" stroke-width="1.5"/>` +
      `<circle cx="${round1(ex - er * 0.12)}" cy="${round1(ey)}" r="${round1(er * 0.62)}" fill="${shade(sec, -0.08)}"/>` +
      `<circle cx="${round1(ex - er * 0.18)}" cy="${round1(ey)}" r="${round1(er * 0.34)}" fill="${EYE_PUPIL}"/>` +
      `<circle cx="${round1(ex - er * 0.34)}" cy="${round1(ey - er * 0.3)}" r="${round1(Math.max(0.8, er * 0.16))}" fill="${EYE_WHITE}" opacity="0.9"/>`;
    // brow: higher at the back, dipping toward the snout — focused, not fierce
    const b0: Pt = [ex - e.tn[0] * er * 1.5 + e.n[0] * er * 1.95, ey - e.tn[1] * er * 1.5 + e.n[1] * er * 1.95];
    const b1: Pt = [ex + e.tn[0] * er * 1.8 + e.n[0] * er * 1.25, ey + e.tn[1] * er * 1.8 + e.n[1] * er * 1.25];
    const bc: Pt = [ex + e.tn[0] * er * 0.1 + e.n[0] * er * 2.1, ey + e.tn[1] * er * 0.1 + e.n[1] * er * 2.1];
    svg += `<path d="M${fmt(b0[0], b0[1])}Q${fmt(bc[0], bc[1])} ${fmt(b1[0], b1[1])}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
  }

  // --- near legs (in front of the body) ------------------------------------------
  svg += hindLeg(hip, p, 0, 0, url('gl'), ink, W_NEAR, ink, lux);
  svg += `<path d="${trianglePath(
    [hip[0] - p.hLegThick * 0.42 - 10, GROUND - 8],
    [hip[0] - p.hLegThick * 0.42 - 22, GROUND - 2],
    [hip[0] - p.hLegThick * 0.42 - 6, GROUND - 1]
  )}" fill="${url('gl')}" stroke="${ink}" stroke-width="1.5"/>`;
  svg += frontLeg(shoulder, p, 0, 0, url('gl'), ink, W_NEAR, ink, lux);
  if (f.feathers) {
    // pennaceous arm fringe trailing off the near forelimb
    const fr = mulberry32((genome.seed ^ 0x0a51) >>> 0);
    const ax = shoulder[0] + 6;
    const ay = shoulder[1] + 8;
    const footY = Math.min(ay + p.fLegLen, GROUND - 8);
    const alen = 24 * f.feathers.intensity;
    let arm = '';
    for (let k = 0; k < 4; k++) {
      const u = 0.22 + k * 0.17;
      const bx = ax - 3 * u + p.fLegThick * 0.24;
      const by = ay + (footY - ay) * u * 0.55;
      const jit = 0.8 + fr() * 0.35;
      // trailing off the forearm, lying flat-back like a folded wing
      const tip: Pt = [bx + alen * (0.8 + k * 0.14) * jit, by + alen * (0.16 + k * 0.09)];
      arm += `<path d="${petalPath([bx, by], tip, 3.6)}"/>`;
    }
    svg += `<g fill="${shade(sec, -0.08)}" stroke="${shade(sec, -0.4)}" stroke-width="1" opacity="0.95">${arm}</g>`;
  }

  // Pachycephalosaur dome: a thickened, node-studded cranium over the skull,
  // drawn on top so the bony cap reads in front of the head silhouette.
  if (f.domeSkull) {
    const s = at(Math.min(1, tHead - 0.02));
    const R = 18 + 22 * f.domeSkull.intensity;
    // seat the chord well under the crown: the cap must grow out of the
    // skull, not hover over it — the head silhouette curves away under the
    // chord ends, so a shallow seat leaves visible sky beneath the rim
    const bx = s.p[0] + s.n[0] * (s.w / 2 - 11);
    const by = s.p[1] + s.n[1] * (s.w / 2 - 11);
    const rx = R * 1.02;
    const p0: Pt = [bx - s.tn[0] * rx, by - s.tn[1] * rx];
    const p1: Pt = [bx + s.tn[0] * rx, by + s.tn[1] * rx];
    // sweep 0 arcs the cap UP over the crown (sweep 1 bowls it over the face
    // — p0 sits tail-ward of p1, so the clockwise arc dips below the chord)
    svg +=
      `<path d="M${fmt(p0[0], p0[1])}A${round1(rx)} ${round1(R)} 0 0 0 ${fmt(p1[0], p1[1])}Z" ` +
      `fill="${url('dm')}" stroke="${ink}" stroke-width="${W_FEAT}" stroke-linejoin="round"/>`;
    if (lux) {
      // shallow pits — the battering surface is never smooth in a field guide
      for (const [ox, oy] of [
        [-0.42, 0.42],
        [0.05, 0.62],
        [0.42, 0.4],
      ] as const) {
        const kx = bx + s.tn[0] * rx * ox + s.n[0] * R * oy;
        const ky = by + s.tn[1] * rx * ox + s.n[1] * R * oy;
        svg += `<circle cx="${round1(kx)}" cy="${round1(ky)}" r="1.3" fill="${ink}" opacity="0.3"/>`;
      }
    }
    for (const off of [0.5, 0.82]) {
      const h = Math.sqrt(Math.max(0, 1 - off * off)) * R * 0.82;
      const kx = bx + s.tn[0] * rx * off + s.n[0] * (h + 4);
      const ky = by + s.tn[1] * rx * off + s.n[1] * (h + 4);
      svg += `<circle cx="${round1(kx)}" cy="${round1(ky)}" r="${round1(
        3 * f.domeSkull.intensity
      )}" fill="${url('bn')}" stroke="${BONE_INK}" stroke-width="1"/>`;
    }
  }

  // Ankylosaurus tail club: paired bony lobes at the very tip of the tail —
  // the visible seam between the two osteoderms is what sells the texture.
  if (f.tailClub) {
    const s = at(0.015);
    const R = 15 + 16 * f.tailClub.intensity;
    const cx = s.p[0] + s.tn[0] * R * 0.4;
    const cy = s.p[1] + s.tn[1] * R * 0.4;
    const lobe = (dx: number, rxF: number, ryF: number): string =>
      `<ellipse cx="${round1(cx + s.tn[0] * R * dx)}" cy="${round1(cy + s.tn[1] * R * dx)}" rx="${round1(
        R * rxF
      )}" ry="${round1(R * ryF)}" fill="${url('cb')}" stroke="${BONE_INK}" stroke-width="${W_FEAT}"/>`;
    svg += lobe(-0.34, 0.72, 0.64) + lobe(0.36, 0.62, 0.56);
    if (lux) {
      // pit marks across both lobes
      let pits = '';
      for (const [dx, dy, r] of [
        [-0.5, -0.18, 3],
        [0.06, 0.26, 2.5],
        [0.52, -0.14, 2.6],
      ] as const) {
        const px = cx + s.tn[0] * R * dx + s.n[0] * R * dy;
        const py = cy + s.tn[1] * R * dx + s.n[1] * R * dy;
        pits += `<path d="M${fmt(px - r, py)}Q${fmt(px, py + r * 0.9)} ${fmt(px + r, py)}"/>`;
      }
      svg += `<g fill="none" stroke="${BONE_INK}" stroke-width="1.1" opacity="0.45">${pits}</g>`;
    }
    svg += `<ellipse cx="${round1(cx - s.tn[0] * R * 0.3 + s.n[0] * R * 0.22)}" cy="${round1(
      cy - s.tn[1] * R * 0.3 + s.n[1] * R * 0.22
    )}" rx="${round1(R * 0.34)}" ry="${round1(R * 0.24)}" fill="${shade(BONE, 0.34)}" opacity="0.8"/>`;
  }

  // --- vignette crop: tight viewBox around one slot, raw geometry, no scaling ----
  if (opts.crop) {
    const box = cropBox(opts.crop, pts, ws, hip, shoulder, f);
    const label = `${escapeAttr(composeName(genome).name)} ${opts.crop}`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" role="img" aria-label="${label}">` +
      svg +
      `</svg>`
    );
  }

  // --- scale around the ground anchor, wrap in <svg> --------------------------------
  const anchorX = HIPX - p.bodyLen * 0.35;
  // Fit-to-frame clamp: the display scale may only *shrink* to keep a creature
  // inside the viewBox — it never grows past its genome size. This is what lets
  // a full-height sauropod's neck stay in frame at size 100 without capping the
  // species. It only engages when geometry would overflow.
  const s = round1(Math.min(blend.displayScale, fitScale(pts, ws, f, anchorX)) * 100) / 100;
  const { name } = composeName(genome);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-label="${escapeAttr(name)}, a hybrid dinosaur">` +
    `<g transform="translate(${round1(anchorX)} ${GROUND}) scale(${s}) translate(${round1(-anchorX)} ${-GROUND})">${svg}</g>` +
    `</svg>`
  );
}

/**
 * Integument class for the texture layer, decided by the skin slot: an
 * explicit feathers gene wins; otherwise the dominant skin-slot species'
 * archetype picks osteoderm courses (armored), broad sparse scales
 * (sauropod), or the default scale stipple. Resolves through the caller's
 * SpeciesResolver so the workbench can texture unsaved species.
 */
function integumentOf(
  genome: Genome,
  features: BlendResult['features'],
  resolve: SpeciesResolver
): Integument {
  if (features.feathers) return 'feathers';
  const dominant = speciesByWeight(slotWeights(genome, 'skin'))[0];
  if (dominant === undefined) return 'scales';
  const archetype = resolve(dominant).archetype;
  if (archetype === 'armored') return 'osteoderms';
  if (archetype === 'sauropod') return 'sauropod';
  return 'scales';
}

/**
 * Largest display scale (about the ground anchor at HIPX-relative anchorX) that
 * keeps the creature's top edge inside the viewBox. Only the *vertical* extent
 * is clamped: a too-tall creature (a full-height sauropod at max size) would
 * otherwise push its head off the top of the frame. Horizontal overhang at
 * extreme sizes is left as-is — it is the established M0 behaviour and clamping
 * it would move existing goldens. Returns Infinity when nothing overflows.
 */
function fitScale(
  pts: readonly Pt[],
  ws: readonly number[],
  feat: BlendResult['features'],
  _anchorX: number
): number {
  const PAD = 10;
  const N = pts.length;
  /** silhouette top edge over a spine-t range */
  const topOver = (a: number, b: number): number => {
    let y = Infinity;
    const i0 = Math.max(0, Math.floor(a * (N - 1)));
    const i1 = Math.min(N - 1, Math.ceil(b * (N - 1)));
    for (let i = i0; i <= i1; i++) y = Math.min(y, pts[i]![1] - (ws[i] ?? 0) / 2);
    return y;
  };
  // Features rise above their OWN anchor region, not the global apex — a
  // sail on the back must not borrow headroom from a sauropod's head, or
  // tall hybrids over-shrink and the size slider goes dead (M1 review).
  let ymin = topOver(0, 1);
  const rise = (k: FeatureKind, h: number, a: number, b: number) => {
    if (!feat[k]) return;
    ymin = Math.min(ymin, topOver(a, b) - h * feat[k]!.intensity);
  };
  rise('sail', 152, 0.28, 0.7);
  rise('plates', 54, 0.28, 0.7);
  rise('crest', 88, 0.7, 1);
  rise('browHorns', 64, 0.7, 1);
  rise('noseHorn', 24, 0.9, 1);
  rise('frill', 70, 0.6, 0.8);
  rise('domeSkull', 48, 0.7, 1);
  rise('feathers', 44, 0, 0.95); // coat petals + tail fan (fan lives near t=0)
  return ymin < GROUND ? (GROUND - PAD) / (GROUND - ymin) : Infinity;
}

/**
 * A 100%-one-species genome with canonical cosmetics — the basis for vignette
 * rendering so a picker thumbnail shows that species' authored part cleanly.
 */
function pureSpeciesGenome(species: SpeciesId, seed = 1): Genome {
  return {
    v: GENOME_VERSION,
    dna: [{ species, share: 100 }],
    parts: {},
    cosmetics: { hide: '#6b8f4e', markings: '#d9a441', pattern: 'solid' },
    size: 55,
    age: 'adult',
    seed,
  };
}

/**
 * Deterministic part vignette (ARCHITECTURE §rendering pipelines, GAME-DESIGN
 * §4.2): a small SVG of one species' version of one slot, for picker
 * thumbnails. Same renderer, same purity/determinism — only the framing
 * differs from a full creature render.
 */
export function renderPart(
  species: SpeciesId,
  slot: PartSlot,
  opts: { idSuffix?: string; seed?: number; detail?: 'full' | 'fast' } = {}
): string {
  return renderCreature(pureSpeciesGenome(species, opts.seed ?? 1), {
    crop: slot,
    idSuffix: opts.idSuffix ?? `part-${species}-${slot}`,
    detail: opts.detail,
  });
}

/**
 * Bounding viewBox for a slot's region, in raw geometry coordinates. Built
 * from the spine points the slot owns (± their stroke width) plus a
 * slot-specific margin. The top margin is *adaptive*: headroom is reserved
 * only for the tall features this species actually carries (crests and horns
 * above the head, sails and plates above the back, clubs and spikes at the
 * tail) so a featureless part crops tight instead of floating in empty sky.
 * Point ranges follow the spine construction: 0–29 tail, 30–48 body,
 * 49–77 neck→snout.
 */
function cropBox(
  slot: PartSlot,
  pts: readonly Pt[],
  ws: readonly number[],
  hip: Pt,
  shoulder: Pt,
  feat: BlendResult['features']
): string {
  const N = pts.length;
  const has = (k: FeatureKind) => feat[k] !== undefined;
  // coat petals reach ~30·1.2 ≈ 36px above the silhouette plus sweep; the
  // tail fan flares farther, so the tail slot reserves extra sky and reach
  const feather = has('feathers') ? 42 : 0;
  const headTop =
    22 + feather + Math.max(has('crest') ? 96 : 0, has('domeSkull') ? 46 : 0, has('browHorns') || has('noseHorn') ? 60 : 0, has('frill') ? 46 : 0);
  const backTop = 20 + feather + Math.max(has('sail') ? 150 : 0, has('plates') ? 58 : 0);
  const tailTop = 20 + (has('feathers') ? 58 : 0) + Math.max(has('tailClub') ? 34 : 0, has('tailSpikes') ? 44 : 0);
  const tailSide = has('tailClub') ? 30 : 18;
  const M: Record<PartSlot, { a: number; b: number; top: number; bottom: number; left: number; right: number }> = {
    tail: { a: 0, b: 0.34, top: tailTop, bottom: 26, left: tailSide, right: tailSide + (has('feathers') ? 40 : 0) },
    back: { a: 0.36, b: 0.66, top: backTop, bottom: 34, left: 28, right: 28 },
    head: { a: 0.72, b: 1, top: headTop, bottom: 30, left: 30, right: has('crest') ? 96 : 24 },
    stance: { a: 0.38, b: 0.66, top: 18 + feather, bottom: 28, left: 58, right: 38 },
    skin: { a: 0.42, b: 0.6, top: 18 + feather, bottom: 20, left: 16, right: 16 },
  };
  const m = M[slot];
  const i0 = Math.floor(m.a * (N - 1));
  const i1 = Math.ceil(m.b * (N - 1));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = i0; i <= i1; i++) {
    const w = (ws[i] ?? 0) / 2 + 6;
    const [x, y] = pts[i]!;
    minX = Math.min(minX, x - w);
    maxX = Math.max(maxX, x + w);
    minY = Math.min(minY, y - w);
    maxY = Math.max(maxY, y + w);
  }
  // the stance vignette must reach the feet on the ground line
  if (slot === 'stance') {
    minX = Math.min(minX, shoulder[0], hip[0]);
    maxX = Math.max(maxX, hip[0]);
    maxY = Math.max(maxY, GROUND + 12);
    minY = Math.min(minY, hip[1], shoulder[1]);
  }
  const x = round1(minX - m.left);
  const y = round1(minY - m.top);
  const w = round1(maxX - minX + m.left + m.right);
  const h = round1(maxY - minY + m.top + m.bottom);
  return `${x} ${y} ${w} ${h}`;
}

// --- limbs -------------------------------------------------------------------------

function hindLeg(
  hip: Pt,
  p: MorphVector,
  dx: number,
  dy: number,
  fill: string,
  stroke: string,
  strokeW: number,
  lineInk: string,
  lux: boolean
): string {
  const path = limbPath(
    [
      [hip[0] + 4 + dx, hip[1] + 2 + dy],
      [hip[0] - 14 + dx, hip[1] + (GROUND - hip[1]) * 0.5 + dy],
      [hip[0] + 16 + dx, GROUND - 42 + dy],
      [hip[0] - 2 + dx, GROUND - 10 + dy],
    ],
    [p.hLegThick, p.hLegThick * 0.61, p.hLegThick * 0.345, p.hLegThick * 0.46]
  );
  const fx = hip[0] - 4 + dx;
  const fy = GROUND - 6 + dy * 0.5;
  const frx = p.hLegThick * 0.42 + (dx === 0 ? 8 : 7);
  const fry = dx === 0 ? 7 : 6.5;
  let out =
    `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>` +
    `<ellipse cx="${round1(fx)}" cy="${round1(fy)}" rx="${round1(frx)}" ry="${fry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  if (lux) out += toeLines(fx, fy, frx, fry, lineInk);
  return out;
}

function frontLeg(
  shoulder: Pt,
  p: MorphVector,
  dx: number,
  dy: number,
  fill: string,
  stroke: string,
  strokeW: number,
  lineInk: string,
  lux: boolean
): string {
  const ax = shoulder[0] + 6 + dx;
  const ay = shoulder[1] + 8 + dy;
  const footY = Math.min(ay + p.fLegLen, GROUND - 8 + dy);
  const path = limbPath(
    [
      [ax, ay],
      [ax - 3, (ay + footY) / 2 + 4],
      [ax - 10, footY],
    ],
    [p.fLegThick, p.fLegThick * 0.68, p.fLegThick * 0.5]
  );
  let out = `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>`;
  if (footY > GROUND - 30 + dy) {
    const fx = ax - 12;
    const fy = GROUND - 5 + dy * 0.5;
    const frx = p.fLegThick * 0.45 + (dx === 0 ? 6 : 5);
    const fry = dx === 0 ? 6 : 5.5;
    out += `<ellipse cx="${round1(fx)}" cy="${round1(fy)}" rx="${round1(frx)}" ry="${fry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    if (lux) out += toeLines(fx, fy, frx, fry, lineInk);
  } else {
    out += `<path d="${trianglePath(
      [ax - 10, footY],
      [ax - 19, footY + 9],
      [ax - 5, footY + 7]
    )}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return out;
}

/** Two short toe creases on a foot ellipse — feet stop reading as pads. */
function toeLines(fx: number, fy: number, rx: number, ry: number, ink: string): string {
  let d = '';
  for (const off of [-0.3, 0.12]) {
    d += `M${fmt(fx + rx * off, fy - ry * 0.65)}L${fmt(fx + rx * off - 1.6, fy + ry * 0.3)}`;
  }
  return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.45"/>`;
}

// --- patterns -----------------------------------------------------------------------

function patternLayer(genome: Genome, clipId: string, sec: string, prim: string, sfx: string): string {
  const pattern = genome.cosmetics.pattern;
  if (pattern === 'solid') return '';
  const clip = `clip-path="url(#${clipId})"`;

  if (pattern === 'stripes') {
    let g = `<g ${clip} fill="${sec}" opacity="0.42">`;
    for (let x = 250; x <= 730; x += 52) {
      g += `<rect x="${x - 9}" y="130" width="18" height="360" rx="9" transform="rotate(-7 ${x} 300)"/>`;
    }
    return g + '</g>';
  }

  if (pattern === 'spots' || pattern === 'rings') {
    // Placement is part of the creature's identity: seeded by the genome.
    const rand = mulberry32((genome.seed ^ 0x5f0e) >>> 0);
    const marks: string[] = [];
    for (let i = 0; i < 18; i++) {
      const cx = round1(230 + rand() * 500);
      const cy = round1(205 + rand() * 215);
      const r = round1(7 + rand() * 9);
      marks.push(
        pattern === 'spots'
          ? `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
          : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${sec}" stroke-width="3"/>`
      );
    }
    return pattern === 'spots'
      ? `<g ${clip} fill="${sec}" opacity="0.45">${marks.join('')}</g>`
      : `<g ${clip} opacity="0.5">${marks.join('')}</g>`;
  }

  // countershade: pale underside fading upward — soft edge, not a band line
  const pale = shade(prim, 0.55);
  return (
    `<g ${clip}><defs><linearGradient id="cs-${sfx}" x1="0" y1="1" x2="0" y2="0">` +
    `<stop offset="0" stop-color="${pale}" stop-opacity="0.62"/>` +
    `<stop offset="0.55" stop-color="${pale}" stop-opacity="0.42"/>` +
    `<stop offset="1" stop-color="${pale}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="120" y="315" width="620" height="195" fill="url(#cs-${sfx})"/></g>`
  );
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
