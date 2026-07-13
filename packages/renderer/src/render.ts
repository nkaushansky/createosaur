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
  type Archetype,
  type FeatureKind,
  type MorphVector,
  type PartSlot,
  type SpeciesId,
} from '@createosaur/species-data';
import { mix, shade } from './color';
import {
  alongPolyline,
  arcPath,
  catmull,
  fmt,
  limbPath,
  linePath,
  normals,
  petalPath,
  quad,
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
 * Look (M1c style-bible pass, STYLE-BIBLE.md, D-019): value does the talking.
 * Five-value structure in paint order — flipped pigment countershade (dark
 * dorsal → cream belly, spine-relative), one wrap-light radial, a core-shadow
 * band above the belly, ambient-occlusion pools at limb roots/jaw/tail — all
 * gradients and geometry, never SVG filters (the slider re-renders per tick).
 * The old hard black outline is retired for a thin self-toned edge plus a
 * clipped rim-shadow stroke; interior linework whispers at ≤0.2 opacity.
 * All seeded variation draws from genome.seed via mulberry32 with per-layer
 * salts. Structural invariants: element/branch structure may depend only on
 * genome weights (never on seed-jittered values) so sibling seeds stay
 * shape-identical, and every number in the output is round1/round2-stable.
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
   * striations, toe creases, secondary feather rows) so hot loops on weak
   * hardware can re-render every slider tick; silhouette, the value system
   * and features are unchanged, so the creature never reads as a different
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
// teeth stay in the #e6dcc0 family (STYLE-BIBLE §4) — never pure white
const TOOTH = '#ece2c4';
const EYE_WHITE = '#fdfaef';
const EYE_PUPIL = '#1c1a14';
const MOUTH = '#5a3138';

// Line system (STYLE-BIBLE §3): the silhouette edge is thin and self-toned —
// its weight comes from the rim-shadow band, not stroke width. Features sit
// at 0.8–1.6; interior contour work whispers at ≤1.2 width / ≤0.2 opacity.
const W_SIL = 1.2;
const W_FEAT = 1.4;
const W_FAR = 1;
const W_LINE = 1;
const RIM_W = 10;
const RIM_O = 0.24;

/** Integument class, derived from the skin slot — drives the texture layer. */
type Integument = 'scales' | 'osteoderms' | 'sauropod' | 'feathers';

/**
 * Hind-leg curvature per archetype (STYLE-BIBLE §5): 1 = full digitigrade
 * S-curve, 0 = graviportal column. The S-profile is theropod/ornithopod
 * only; sauropods and the armored/ceratopsian group stand on columns.
 * Blended by stance-slot weights so hybrids get legally intermediate legs.
 */
const POSTURE: Record<Archetype, number> = {
  theropod: 1,
  ornithopod: 0.55,
  ceratopsian: 0.14,
  armored: 0.12,
  sauropod: 0.04,
  marine: 0.35,
  flyer: 0.45,
};

// Age multipliers mirrored from the genome blend (heads grow young) — used
// only for structural counts that must not see the seeded ±3% jitter.
const AGE_HEAD: Record<BlendResult['age'], number> = { hatchling: 1.45, juvenile: 1.2, adult: 1 };
const AGE_SPAN: Record<BlendResult['age'], number> = { hatchling: 0.78, juvenile: 0.9, adult: 1 };

const round2 = (x: number): number => Math.round(x * 100) / 100;

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

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
  /** polyline hugging the spine at a signed fraction of the half-width */
  const contour = (a: number, b: number, frac: number, K: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i <= K; i++) {
      const s = at(a + ((b - a) * i) / K);
      out.push([s.p[0] + s.n[0] * (s.w / 2) * frac, s.p[1] + s.n[1] * (s.w / 2) * frac]);
    }
    return out;
  };
  /**
   * Closed strip between two signed half-width fractions over a spine range —
   * the machinery behind every spine-relative value band (countershade, core
   * shadow). fOut/fIn are fractions of the local half-width along `edge`.
   */
  const edgeStrip = (
    a: number,
    b: number,
    edge: 1 | -1,
    fOut: number,
    fIn: number | ((t: number) => number)
  ): string => {
    const K = 26;
    const outer: Pt[] = [];
    const inner: Pt[] = [];
    for (let i = 0; i <= K; i++) {
      const t = a + ((b - a) * i) / K;
      const s = at(t);
      const half = s.w / 2;
      const fi = typeof fIn === 'number' ? fIn : fIn(t);
      outer.push([s.p[0] + s.n[0] * half * fOut * edge, s.p[1] + s.n[1] * half * fOut * edge]);
      inner.push([s.p[0] + s.n[0] * half * fi * edge, s.p[1] + s.n[1] * half * fi * edge]);
    }
    let d = `M${fmt(outer[0]![0], outer[0]![1])}`;
    for (let i = 1; i <= K; i++) d += `L${fmt(outer[i]![0], outer[i]![1])}`;
    for (let i = K; i >= 0; i--) d += `L${fmt(inner[i]![0], inner[i]![1])}`;
    return d + 'Z';
  };

  // --- authored skull stitched into the tube (anatomy pass) --------------------
  // The tube ends at tNeck; from there the silhouette is buildHead's skull.
  // Same params, same blend continuity — only the drawing got a jaw.
  // tNeck is arc-length aware: a fixed t-offset spans ~40px of a sauropod's
  // neck and stretches the skull into a sock.
  let spineLen = 0;
  for (let i = 1; i < N; i++) {
    spineLen += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  }
  const headArc = Math.hypot(pts[N - 1]![0] - at(tHead).p[0], pts[N - 1]![1] - at(tHead).p[1]);
  const tNeck = tHead - Math.min(0.06, Math.max(0.02, (0.4 * headArc) / spineLen));
  const iNeck = Math.min(N - 2, Math.max(1, Math.floor(tNeck * (N - 1))));
  const neckTop: Pt = [
    pts[iNeck]![0] + nm[iNeck]![0] * (ws[iNeck]! / 2),
    pts[iNeck]![1] + nm[iNeck]![1] * (ws[iNeck]! / 2),
  ];
  const neckBot: Pt = [
    pts[iNeck]![0] - nm[iNeck]![0] * (ws[iNeck]! / 2),
    pts[iNeck]![1] - nm[iNeck]![1] * (ws[iNeck]! / 2),
  ];
  const headOrigin = at(tHead);
  let hu: Pt = [pts[N - 1]![0] - headOrigin.p[0], pts[N - 1]![1] - headOrigin.p[1]];
  const headLen = Math.hypot(hu[0], hu[1]) || 1;
  hu = [hu[0] / headLen, hu[1] / headLen];
  const hv: Pt = [-hu[1], hu[0]]; // up, tilting with the head's pitch
  const beak = Math.min(1, Math.max(0, (11 - Math.max(p.snoutTip, 6)) / 6));
  const head = buildHead(
    headOrigin.p,
    hu,
    hv,
    headLen,
    p.headSize,
    neckTop,
    neckBot,
    f.teeth?.intensity ?? 0,
    beak
  );
  const bodyD = (() => {
    let d = '';
    for (let i = 0; i <= iNeck; i++) {
      const q: Pt = [pts[i]![0] + nm[i]![0] * (ws[i]! / 2), pts[i]![1] + nm[i]![1] * (ws[i]! / 2)];
      d += `${i === 0 ? 'M' : 'L'}${fmt(q[0], q[1])}`;
    }
    for (let i = 1; i < head.topPts.length; i++) d += `L${fmt(head.topPts[i]![0], head.topPts[i]![1])}`;
    if (head.gape > 0.04) {
      for (let i = 1; i < head.lipPts.length; i++) d += `L${fmt(head.lipPts[i]![0], head.lipPts[i]![1])}`;
    }
    for (let i = 1; i < head.jawPts.length; i++) d += `L${fmt(head.jawPts[i]![0], head.jawPts[i]![1])}`;
    for (let i = iNeck; i >= 0; i--) {
      const q: Pt = [pts[i]![0] - nm[i]![0] * (ws[i]! / 2), pts[i]![1] - nm[i]![1] * (ws[i]! / 2)];
      d += `L${fmt(q[0], q[1])}`;
    }
    return d + 'Z';
  })();

  // --- posture + structural params (weights only — never seed-jittered) --------
  // Structure (element counts, branch choices) may depend on these; sizes may
  // use the jittered morph freely. Mixing the two breaks the sibling test.
  const stanceW = slotWeights(genome, 'stance');
  const headSlotW = slotWeights(genome, 'head');
  let curveHind = 0;
  let armoredHead = 0;
  let H0 = 0;
  let span0 = 0;
  for (const d of genome.dna) {
    const def = resolve(d.species);
    curveHind += (stanceW[d.species] ?? 0) * POSTURE[def.archetype];
    if (def.archetype === 'armored') armoredHead += headSlotW[d.species] ?? 0;
    H0 += (headSlotW[d.species] ?? 0) * def.morph.headSize;
    span0 +=
      (slotWeights(genome, 'back')[d.species] ?? 0) * def.morph.bodyLen +
      (slotWeights(genome, 'tail')[d.species] ?? 0) * def.morph.tailLen +
      (headSlotW[d.species] ?? 0) * def.morph.neckLen;
  }
  H0 *= AGE_HEAD[blend.age];

  // --- body box (userSpace gradients) -----------------------------------------
  // The countershade ramp and wrap light live in user space spanning the body
  // silhouette, so limbs can sample the exact same ramp at the attachment row
  // — that is the §5 gradient-continuity rule (no lightness seam).
  let bxMin = Infinity;
  let bxMax = -Infinity;
  let byMin = Infinity;
  let byMax = -Infinity;
  for (let i = 0; i <= iNeck; i++) {
    const half = ws[i]! / 2;
    bxMin = Math.min(bxMin, pts[i]![0] - half);
    bxMax = Math.max(bxMax, pts[i]![0] + half);
    byMin = Math.min(byMin, pts[i]![1] - half);
    byMax = Math.max(byMax, pts[i]![1] + half);
  }
  for (const q of [...head.topPts, ...head.lipPts, ...head.jawPts]) {
    bxMin = Math.min(bxMin, q[0]);
    bxMax = Math.max(bxMax, q[0]);
    byMin = Math.min(byMin, q[1]);
    byMax = Math.max(byMax, q[1]);
  }
  const bellyY = byMax;

  // Display scale is needed *before* the face draws: STYLE-BIBLE §4 floors are
  // post-scale (final viewBox units), so geometry sizes divide by s. Vignettes
  // reuse the same s — crop geometry must stay byte-identical to a full render.
  const anchorX = HIPX - p.bodyLen * 0.35;
  const s =
    round1(Math.min(blend.displayScale, fitScale(pts, ws, f, head.crownY, bxMin, bxMax, anchorX)) * 100) / 100;

  // --- palette ---------------------------------------------------------------
  const prim = genome.cosmetics.hide;
  const sec = genome.cosmetics.markings;
  // self-toned line system: edge = fill darkened 25–30% (§3), never black
  const edge = shade(prim, -0.27);
  const farEdge = shade(prim, -0.2);
  const lineInk = shade(prim, -0.5);
  const dark = shade(prim, -0.55);
  // ventral cream: hide hue-shifted toward #e8e2c8 and lightened ~19% (§3.1)
  const cream = shade(mix(prim, '#e8e2c8', 0.45), 0.19);
  const boneFeature =
    f.browHorns !== undefined ||
    f.noseHorn !== undefined ||
    f.tailSpikes !== undefined ||
    f.domeSkull !== undefined;

  // --- defs: clip + silhouette + gradients ------------------------------------
  // Gradient stops are fixed-precision hex (shade()) at literal offsets, so
  // they serialize deterministically. The body/limb ramp is userSpaceOnUse
  // (continuity rule above); feature gradients stay objectBoundingBox.
  const vGrad = (id: string, top: string, midC: string, bot: string): string =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/><stop offset="0.55" stop-color="${midC}"/>` +
    `<stop offset="1" stop-color="${bot}"/></linearGradient>`;
  // Limb ramps continue the body ramp exactly at the belly row (ΔL* ≤ 4
  // across the seam, §5), then fall back toward hide within a short run so
  // the shank never carries the belly cream all the way to the ground — a
  // cream shank against the darker far limb is the "pasted-on" pane.
  const legGrad = (id: string, mul: number): string => {
    const fBelly = Math.min(0.86, Math.max(0.3, (bellyY - byMin) / (GROUND - byMin)));
    return (
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${round1(byMin)}" x2="0" y2="${GROUND}">` +
      `<stop offset="0" stop-color="${shade(prim, -0.14 - mul)}"/>` +
      `<stop offset="${round2(fBelly * 0.52)}" stop-color="${mul > 0 ? shade(prim, -mul) : prim}"/>` +
      `<stop offset="${round2(fBelly)}" stop-color="${mul > 0 ? shade(cream, -mul) : cream}"/>` +
      `<stop offset="${round2(Math.min(0.97, fBelly + 0.13))}" stop-color="${shade(prim, -0.02 - mul)}"/>` +
      `<stop offset="1" stop-color="${shade(prim, -0.11 - mul)}"/></linearGradient>`
    );
  };
  let defs = `<clipPath id="${clipId}"><path d="${bodyD}"/></clipPath>`;
  defs += `<path id="${gid('sil')}" d="${bodyD}"/>`;
  // flipped countershade (§3.1, owner redline: half strength): dorsal darkened
  // ~10–14%, mid-flank = hide, ventral cream. Far limbs 12–18% darker (§5).
  defs +=
    `<linearGradient id="${gid('gb')}" gradientUnits="userSpaceOnUse" x1="0" y1="${round1(byMin)}" x2="0" y2="${round1(bellyY)}">` +
    `<stop offset="0" stop-color="${shade(prim, -0.14)}"/>` +
    `<stop offset="0.52" stop-color="${prim}"/>` +
    `<stop offset="1" stop-color="${cream}"/></linearGradient>`;
  defs += legGrad(gid('gl'), 0);
  defs += legGrad(gid('gf'), 0.16);
  // wrap light (§3.2): one radial, centered upper-forequarter of the body box
  {
    const wcx = bxMin + (bxMax - bxMin) * 0.4;
    const wcy = byMin + (bellyY - byMin) * 0.26;
    const wr = Math.max(bxMax - bxMin, bellyY - byMin) * 0.62;
    defs +=
      `<radialGradient id="${gid('wl')}" gradientUnits="userSpaceOnUse" cx="${round1(wcx)}" cy="${round1(wcy)}" r="${round1(wr)}">` +
      `<stop offset="0" stop-color="${shade(prim, 0.75)}" stop-opacity="0.3"/>` +
      `<stop offset="0.55" stop-color="${shade(prim, 0.75)}" stop-opacity="0.1"/>` +
      `<stop offset="1" stop-color="${shade(prim, 0.75)}" stop-opacity="0"/></radialGradient>`;
  }
  // ambient-occlusion pool (§3.4) — one def, several ellipses
  defs +=
    `<radialGradient id="${gid('ao')}"><stop offset="0" stop-color="${dark}" stop-opacity="1"/>` +
    `<stop offset="0.6" stop-color="${dark}" stop-opacity="0.5"/>` +
    `<stop offset="1" stop-color="${dark}" stop-opacity="0"/></radialGradient>`;
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

  // Shared limb geometry — feet need it for ground shadows before legs draw.
  const hindFootLen = Math.min(52, Math.max(16, p.hLegThick * (0.95 + 0.3 * (1 - curveHind))));
  const armY = shoulder[1] + 2;
  const armFootY = Math.min(armY + 6 + p.fLegLen, GROUND - 8);
  const foreGrounded = armFootY > GROUND - 30;
  const foreFootLen = p.fLegThick * 0.9 + 7;
  const curveFore = curveHind * 0.6;

  // --- ground + soft contact shadow -------------------------------------------
  if (drawGround) {
    svg += `<line x1="60" y1="${GROUND}" x2="780" y2="${GROUND}" stroke="${PAPER_LINE}" stroke-width="2"/>`;
    for (const gx of [120, 300, 520, 700]) {
      svg += `<path d="M${gx} ${GROUND}l5 -9 M${gx + 7} ${GROUND}l4 -6" stroke="${PAPER_LINE}" stroke-width="1.5" fill="none"/>`;
    }
    const extent = tailTip[0] - snout[0];
    svg += `<ellipse cx="${round1((tailTip[0] + snout[0]) / 2)}" cy="${GROUND + 8}" rx="${round1(extent * 0.46)}" ry="10" fill="${url('sh')}" opacity="0.7"/>`;
    // per-foot contact shadows (§5): small pools where soles meet the line
    const foot = (cx: number, rx: number, o: number): string =>
      `<ellipse cx="${round1(cx)}" cy="${GROUND + 4}" rx="${round1(rx)}" ry="5" fill="${url('sh')}" opacity="${o}"/>`;
    svg += foot(hip[0] - 4 + 26, hindFootLen * 0.85, 0.7);
    svg += foot(hip[0] - 4, hindFootLen * 0.95, 1);
    if (foreGrounded) {
      svg += foot(shoulder[0] - 5 + 26, foreFootLen * 0.8, 0.7);
      svg += foot(shoulder[0] - 5, foreFootLen * 0.9, 1);
    }
  }

  // --- far legs (behind the body) ---------------------------------------------
  const FAR_DX = 26;
  const FAR_DY = -6;
  svg += hindLeg(hip, p, FAR_DX, FAR_DY, url('gf'), farEdge, W_FAR, shade(prim, -0.42), null, curveHind, hindFootLen, lux);
  svg += frontLeg(shoulder, p, FAR_DX, FAR_DY, url('gf'), farEdge, W_FAR, shade(prim, -0.42), lux, null, curveFore, foreFootLen);

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
      bumps += `<circle cx="${round1(bx)}" cy="${round1(by)}" r="${round1(br)}" fill="${sec}" stroke="${shade(sec, -0.35)}" stroke-width="1"/>`;
    }
    let spokes = '';
    for (let k = 0; k < 5; k++) {
      const th = ((-64 + k * 32) * Math.PI) / 180;
      spokes += `<path d="M${fmt(cx + Math.sin(th) * R * 0.2, cy - Math.cos(th) * R * 0.28)}L${fmt(
        cx + Math.sin(th) * R * 0.64,
        cy - Math.cos(th) * R * 0.86
      )}" stroke="${shade(sec, -0.32)}" stroke-width="1.3" opacity="0.4"/>`;
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
      const sp = at(tt);
      const base: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2 - 3), sp.p[1] + sp.n[1] * (sp.w / 2 - 3)];
      const h = (26 + 24 * Math.sin((Math.PI * i) / (count - 1))) * f.plates.intensity;
      const a = sp.tn;
      const n = sp.n;
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
        ` fill="${url('sc')}" stroke="${shade(sec, -0.38)}" stroke-width="1.5" stroke-linejoin="round"/>`;
      if (lux) {
        svg += `<path d="M${fmt(base[0] + n[0] * 3, base[1] + n[1] * 3)}Q${fmt(
          base[0] - a[0] * 2 + n[0] * h * 0.5,
          base[1] - a[1] * 2 + n[1] * h * 0.5
        )} ${fmt(base[0] + n[0] * h * 0.82, base[1] + n[1] * h * 0.82)}" fill="none" stroke="${shade(sec, -0.42)}" stroke-width="1.2" opacity="0.45"/>`;
      }
    }
  }
  if (f.tailSpikes) {
    for (const tt of [0.035, 0.085]) {
      const sp = at(tt);
      const L = 46 * f.tailSpikes.intensity;
      let dir: Pt = [sp.n[0] - sp.tn[0] * 0.55, sp.n[1] - sp.tn[1] * 0.55];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      dir = [dir[0] / dl, dir[1] / dl];
      const base: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2 - 6), sp.p[1] + sp.n[1] * (sp.w / 2 - 6)];
      svg += `<path d="M${fmt(base[0] - sp.tn[0] * 7, base[1] - sp.tn[1] * 7)}Q${fmt(
        base[0] + dir[0] * L * 0.55 - sp.tn[0] * 6,
        base[1] + dir[1] * L * 0.55 - sp.tn[1] * 6
      )} ${fmt(base[0] + dir[0] * L, base[1] + dir[1] * L)}Q${fmt(
        base[0] + dir[0] * L * 0.5 + sp.tn[0] * 5,
        base[1] + dir[1] * L * 0.5 + sp.tn[1] * 5
      )} ${fmt(base[0] + sp.tn[0] * 7, base[1] + sp.tn[1] * 7)}Z" fill="${url('bn')}" stroke="${BONE_INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    }
  }
  // horns seat on the authored skull top: base sunk slightly under the crown
  // line so keratin grows out of bone, not off a surface sticker
  const drawHorn = (a: number, L: number, lean: number, rings: number): string => {
    const seat = head.headTop(a);
    const b: Pt = [seat[0] - hv[0] * 3, seat[1] - hv[1] * 3];
    const tip: Pt = [b[0] + hv[0] * L + hu[0] * L * lean, b[1] + hv[1] * L + hu[1] * L * lean];
    let out = `<path d="M${fmt(b[0] - hu[0] * 7, b[1] - hu[1] * 7)}Q${fmt(
      b[0] + hv[0] * L * 0.5 - hu[0] * 6,
      b[1] + hv[1] * L * 0.5 - hu[1] * 6
    )} ${fmt(tip[0], tip[1])}Q${fmt(
      b[0] + hv[0] * L * 0.5 + hu[0] * 4,
      b[1] + hv[1] * L * 0.5 + hu[1] * 4
    )} ${fmt(b[0] + hu[0] * 7, b[1] + hu[1] * 7)}Z" fill="${url('bn')}" stroke="${BONE_INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    if (lux) {
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
        )}" fill="none" stroke="${BONE_INK}" stroke-width="1" opacity="0.45"/>`;
      }
    }
    return out;
  };
  if (f.browHorns) {
    svg += drawHorn(0.34, 62 * f.browHorns.intensity, 0.34, 2);
    svg += drawHorn(0.2, 48 * f.browHorns.intensity, 0.28, 2);
  }
  if (f.noseHorn) {
    svg += drawHorn(0.74, 22 * f.noseHorn.intensity, 0.15, 1);
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
      const sp = at(st(i));
      const h = peak * heightAt(i / (S - 1));
      hs.push(h);
      bases.push([sp.p[0] + sp.n[0] * (sp.w / 2 - 4), sp.p[1] + sp.n[1] * (sp.w / 2 - 4)]);
      tips.push([bases[i]![0] + sp.n[0] * h, bases[i]![1] + sp.n[1] * h]);
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
      const sp = at(st(i));
      const end: Pt = [bases[i]![0] + sp.n[0] * (hs[i]! - 4), bases[i]![1] + sp.n[1] * (hs[i]! - 4)];
      const mx = (bases[i]![0] + end[0]) / 2 - sp.tn[0] * 5;
      const my = (bases[i]![1] + end[1]) / 2 - sp.tn[1] * 5;
      svg += `<path d="M${fmt(bases[i]![0], bases[i]![1])}Q${fmt(mx, my)} ${fmt(end[0], end[1])}" fill="none" stroke="${rayInk}" stroke-width="1.6" opacity="0.55" stroke-linecap="round"/>`;
    }
    if (lux) {
      for (let i = 0; i < S - 1; i++) {
        const tm = (st(i) + st(i + 1)) / 2;
        const sp = at(tm);
        const h = Math.min(hs[i]!, hs[i + 1]!) * 0.6 + peak * 0.08;
        const b: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2 - 4), sp.p[1] + sp.n[1] * (sp.w / 2 - 4)];
        svg += `<path d="M${fmt(b[0], b[1])}L${fmt(b[0] + sp.n[0] * h, b[1] + sp.n[1] * h)}" stroke="${rayInk}" stroke-width="1" opacity="0.3"/>`;
      }
    }
  }

  // Parasaurolophus crest: a long tube swept up and back off the skull.
  // Drawn as a round-capped stroke (a capsule) so it reads as a solid tube,
  // not a flat blade — ink underlay, then fill, then a highlight run.
  if (f.crest) {
    const L = 108 * f.crest.intensity;
    const tube = Math.max(13, p.headSize * 0.34);
    const seat = head.headTop(0.24);
    const base: Pt = [seat[0] - hv[0] * 5, seat[1] - hv[1] * 5];
    const back: Pt = [-hu[0], -hu[1]]; // toward the neck/tail
    const up: Pt = hv;
    const ctrl: Pt = [base[0] + up[0] * L * 0.72, base[1] + up[1] * L * 0.72];
    const tip: Pt = [
      base[0] + back[0] * L * 0.95 + up[0] * L * 0.62,
      base[1] + back[1] * L * 0.95 + up[1] * L * 0.62,
    ];
    const spine = `M${fmt(base[0], base[1])}Q${fmt(ctrl[0], ctrl[1])} ${fmt(tip[0], tip[1])}`;
    const tint = shade(prim, 0.14);
    svg +=
      `<path d="${spine}" fill="none" stroke="${edge}" stroke-width="${round1(tube + 2.6)}" stroke-linecap="round"/>` +
      `<path d="${spine}" fill="none" stroke="${tint}" stroke-width="${round1(tube)}" stroke-linecap="round"/>` +
      `<path d="${spine}" fill="none" stroke="${shade(prim, 0.34)}" stroke-width="${round1(
        tube * 0.26
      )}" stroke-linecap="round" opacity="0.6"/>`;
    if (lux) {
      // two growth bands across the tube near the skull
      for (const u of [0.16, 0.3]) {
        const cx = base[0] + (ctrl[0] - base[0]) * u * 2 * (1 - u) + (tip[0] - base[0]) * u * u;
        const cy = base[1] + (ctrl[1] - base[1]) * u * 2 * (1 - u) + (tip[1] - base[1]) * u * u;
        svg += `<circle cx="${round1(cx)}" cy="${round1(cy)}" r="${round1(tube * 0.42)}" fill="none" stroke="${shade(prim, -0.28)}" stroke-width="1" opacity="0.4"/>`;
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
    const edgeF = shade(prim, -0.48);
    // A coat band is a nearly-smooth fringe (soft undulation, tapered ends)
    // with feather separation drawn as interior strokes — deep edge notches
    // read as sawtooth spikes the moment the band gets short on a hybrid.
    const coat = (t0: number, t1: number, K: number, L: number, lie: number, jitAmp: number, paint: string): string => {
      const bases: Pt[] = [];
      const tips: Pt[] = [];
      for (let i = 0; i <= K; i++) {
        const tt = t0 + ((t1 - t0) * i) / K;
        const sp = at(tt);
        const taper = i === 0 || i === K ? 0.45 : i === 1 || i === K - 1 ? 0.8 : 1;
        const li = L * taper * (1 - jitAmp + fr() * jitAmp * 2);
        const b: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2 - 3), sp.p[1] + sp.n[1] * (sp.w / 2 - 3)];
        bases.push(b);
        tips.push([b[0] + sp.n[0] * li - sp.tn[0] * li * lie, b[1] + sp.n[1] * li - sp.tn[1] * li * lie]);
      }
      let d = `M${fmt(bases[K]![0], bases[K]![1])}L${fmt(tips[K]![0], tips[K]![1])}`;
      for (let i = K - 1; i >= 0; i--) {
        const sp = at(t0 + ((t1 - t0) * (i + 0.5)) / K);
        const mx = (tips[i + 1]![0] + tips[i]![0]) / 2 - sp.n[0] * L * 0.1;
        const my = (tips[i + 1]![1] + tips[i]![1]) / 2 - sp.n[1] * L * 0.1;
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
          const sp = at(t0 + ((t1 - t0) * i) / K);
          const ex = b[0] + (tp[0] - b[0]) * 0.3;
          const ey = b[1] + (tp[1] - b[1]) * 0.3;
          sep += `M${fmt(tp[0], tp[1])}Q${fmt(
            (tp[0] + ex) / 2 + sp.tn[0] * L * 0.1,
            (tp[1] + ey) / 2 + sp.tn[1] * L * 0.1
          )} ${fmt(ex, ey)}`;
        }
        path += `<path d="${sep}" fill="none" stroke="${shade(prim, -0.45)}" stroke-width="1" opacity="0.5"/>`;
      }
      return path;
    };
    svg += coat(0.1, 0.9, 13, len, 0.55, 0.14, `fill="${shade(prim, -0.1)}" stroke="${edgeF}" stroke-width="1.1" stroke-linejoin="round"`);
    // nape tuft in the marking accent — display feathers behind the skull
    {
      let tuft = '';
      for (let k = 0; k < 3; k++) {
        const sp = at(0.83 + k * 0.032);
        const jit = 0.85 + fr() * 0.3;
        const li = len * (0.85 + k * 0.12) * jit;
        const b: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2 - 3), sp.p[1] + sp.n[1] * (sp.w / 2 - 3)];
        const tip: Pt = [b[0] + sp.n[0] * li - sp.tn[0] * li * 0.5, b[1] + sp.n[1] * li - sp.tn[1] * li * 0.5];
        tuft += `<path d="${petalPath(b, tip, 4)}"/>`;
      }
      svg += `<g fill="${shade(sec, -0.08)}" stroke="${shade(sec, -0.4)}" stroke-width="1" opacity="0.95">${tuft}</g>`;
    }
    // tail fan: marking-toned display plumes rotate tailward near the tip,
    // broad, clustered and overlapping so they read as a fan, not spikes
    let fan = '';
    for (let k = 0; k < 5; k++) {
      const tt = 0.008 + k * 0.012;
      const sp = at(tt);
      // first plume nearly extends the tail line so the bare tip never pokes
      // through the fan; later plumes rotate up toward the dorsal coat
      const mixK = 0.85 - k * 0.14;
      let dir: Pt = [sp.n[0] * (1 - mixK) - sp.tn[0] * mixK, sp.n[1] * (1 - mixK) - sp.tn[1] * mixK];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      dir = [dir[0] / dl, dir[1] / dl];
      const jit = 0.85 + fr() * 0.3;
      const plume = len * (1.5 + k * 0.14) * jit;
      const base: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2 - 3), sp.p[1] + sp.n[1] * (sp.w / 2 - 3)];
      const tip: Pt = [base[0] + dir[0] * plume, base[1] + dir[1] * plume];
      fan += `<path d="${petalPath(base, tip, 6)}"/>`;
    }
    svg += `<g fill="${shade(sec, -0.08)}" stroke="${shade(sec, -0.4)}" stroke-width="1" opacity="0.95">${fan}</g>`;
  }

  // --- body silhouette: thin self-toned edge (§3 line system) -------------------
  svg += `<use href="#${gid('sil')}" fill="${url('gb')}" stroke="${edge}" stroke-width="${W_SIL}" stroke-linejoin="round"/>`;

  // --- value system (§3): spine-relative countershade correction, core shadow,
  // AO pools. The userSpace ramp is page-vertical, so a rearing sauropod neck
  // needs these bands (reused M1b machinery) to keep pigment spine-relative.
  // Bands stack in low-opacity pairs — soft ramps from geometry, no filters.
  // --- markings (§3.5): pattern genes, then dorsal dapple, then texture ---------
  svg += patternLayer(genome, clipId, sec, prim, sfx, byMin, bellyY);
  svg += dappleLayer(genome, clipId, sec, at, tNeck, span0 * AGE_SPAN[blend.age]);

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
        const sp = at(t);
        const c: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2) * lat * 0.8, sp.p[1] + sp.n[1] * (sp.w / 2) * lat * 0.8];
        marks += `<path d="M${fmt(c[0] - sp.tn[0] * r, c[1] - sp.tn[1] * r)}Q${fmt(
          c[0] - sp.n[0] * r * 0.9,
          c[1] - sp.n[1] * r * 0.9
        )} ${fmt(c[0] + sp.tn[0] * r, c[1] + sp.tn[1] * r)}"/>`;
      }
      detail += `<g fill="none" stroke="${lineInk}" stroke-width="1.1" opacity="0.18">${marks}</g>`;
    } else if (integument === 'osteoderms') {
      // armored hide: two staggered courses of oval scutes along the back
      let scutes = '';
      for (const [row, stag] of [
        [0.56, 0],
        [0.22, 0.03],
      ] as const) {
        for (let i = 0; i < 7; i++) {
          const t = 0.3 + stag + (i * 0.4) / 6;
          const sp = at(t);
          const c: Pt = [sp.p[0] + sp.n[0] * (sp.w / 2) * row, sp.p[1] + sp.n[1] * (sp.w / 2) * row];
          const r = 4.2 + (sp.w / 2) * 0.045 + tr() * 1.2;
          scutes += `<ellipse cx="${round1(c[0])}" cy="${round1(c[1])}" rx="${round1(r)}" ry="${round1(r * 0.72)}"/>`;
        }
      }
      detail += `<g fill="none" stroke="${lineInk}" stroke-width="1.1" opacity="0.18">${scutes}</g>`;
    }
    // contour/muscle linework off the spine samples: neck run, throat, back,
    // belly crease, twin tail lines, and joint arcs at hip and shoulder —
    // value does the talking now, so these whisper (§3: ≤1.2 width, ≤0.2)
    const lines: Array<[Pt[], number, number]> = [
      [contour(0.72, 0.9, 0.3, 9), W_LINE, 0.18],
      [contour(0.72, 0.86, -0.34, 8), 1, 0.15],
      [contour(0.38, 0.6, 0.34, 8), W_LINE, 0.17],
      [contour(0.4, 0.64, -0.46, 8), 1.1, 0.15],
      [contour(0.05, 0.26, 0.3, 8), 1, 0.17],
      [contour(0.07, 0.24, -0.3, 8), 1, 0.14],
    ];
    let strokes = '';
    for (const [ptsL, w, o] of lines) {
      strokes += `<path d="${linePath(ptsL)}" stroke-width="${w}" opacity="${o}"/>`;
    }
    detail += `<g fill="none" stroke="${lineInk}" stroke-linecap="round">${strokes}</g>`;
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
      detail += `<path d="${d}" fill="none" stroke="${lineInk}" stroke-width="1.1" opacity="0.18"/>`;
    }
    svg += `<g clip-path="url(#${clipId})">${detail}</g>`;
  }

  // --- rim-shadow band (§3): the silhouette's weight — an inner edge darkening
  // built as a clipped stroke of the silhouette path, not a blur filter
  svg += `<use href="#${gid('sil')}" fill="none" stroke="${dark}" stroke-width="${RIM_W}" opacity="${RIM_O}" clip-path="url(#${clipId})"/>`;

  // --- face (§4): ratio table off H = authored skull height, post-scale floors,
  // simplified tier fading in over final head height 22→26
  {
    const H = head.H;
    const hp = (a: number, b: number): Pt => [
      head.C[0] + hu[0] * a * head.L + hv[0] * b * H,
      head.C[1] + hu[1] * a * head.L + hv[1] * b * H,
    ];
    const carn = f.teeth?.intensity ?? 0;
    // tier: 1 = full face detail. Fades out for small final heads and for
    // armored-archetype heads, which keep simplified styling at any size (§4).
    const tier = round2(
      smoothstep(22, 26, H * s) * (1 - smoothstep(0.35, 0.7, armoredHead))
    );
    // post-scale floors (final viewBox units ÷ s → geometry units)
    const eyeScale = blend.age === 'hatchling' ? 1.6 : blend.age === 'juvenile' ? 1.25 : 1;
    const er = Math.max((0.09 - 0.02 * carn) * H * eyeScale, 3.2 / s);
    const mouthW = round1(Math.max(1.5, 1.1 / s) * 10) / 10;
    const nostrilR = Math.max(0.032 * H, 0.95 / s);
    const browW = round1(Math.max(1.55, 1.2 / s) * 10) / 10;

    // eye seat: 0.25–0.35 of snout length behind the brow-boss front, 0.55–0.65
    // of H above the local jawline (both mid-range; snout = boss front → nose)
    const eyeA = BOSS_FRONT_A - 0.3 * (NOSE_A - BOSS_FRONT_A);
    let jawB = -0.5;
    let bestDa = Infinity;
    for (const q of head.jawPts) {
      const a = ((q[0] - head.C[0]) * hu[0] + (q[1] - head.C[1]) * hu[1]) / head.L;
      const da = Math.abs(a - eyeA);
      if (da < bestDa) {
        bestDa = da;
        jawB = ((q[0] - head.C[0]) * hv[0] + (q[1] - head.C[1]) * hv[1]) / H;
      }
    }
    const E = hp(eyeA, Math.min(0.34, Math.max(0.02, jawB + 0.6)));

    // mouth: closed lip = interior crease; open gape = wedge filled as mouth
    if (head.gapeD) {
      svg += `<path d="${head.gapeD}" fill="${MOUTH}"/>`;
    } else {
      svg += `<path d="${linePath(head.lipPts.slice(1))}" fill="none" stroke="${lineInk}" stroke-width="${mouthW}" opacity="0.72" stroke-linecap="round"/>`;
    }
    // one short mouth-corner crease — a skin fold, never an upturned grin
    {
      const mc = head.mouthCorner;
      const cr = Math.max(2.2, er * 0.45);
      svg += `<path d="M${fmt(mc[0] + hu[0] * 0.6, mc[1] + hu[1] * 0.6)}Q${fmt(
        mc[0] - hu[0] * cr * 0.5 - hv[0] * cr * 0.5,
        mc[1] - hu[1] * cr * 0.5 - hv[1] * cr * 0.5
      )} ${fmt(mc[0] - hu[0] * cr * 0.8 - hv[0] * cr * 1.1, mc[1] - hu[1] * cr * 0.8 - hv[1] * cr * 1.1)}" fill="none" stroke="${lineInk}" stroke-width="1.2" opacity="${round2(0.45 * Math.max(tier, 0.4))}"/>`;
    }
    // nostril at 0.82–0.88 of snout length: a crescent, never a dot
    {
      const nA = BOSS_FRONT_A + 0.85 * (NOSE_A - BOSS_FRONT_A);
      const c = hp(nA, 0.07 - 0.03 * beak);
      svg += `<path d="M${fmt(c[0] - hu[0] * nostrilR, c[1] - hu[1] * nostrilR)}Q${fmt(
        c[0] + hv[0] * nostrilR,
        c[1] + hv[1] * nostrilR
      )} ${fmt(c[0] + hu[0] * nostrilR, c[1] + hu[1] * nostrilR)}" fill="none" stroke="${lineInk}" stroke-width="1.3" opacity="0.72"/>`;
    }

    // teeth (§4): the upper lip overhangs — tips only, ≤50% of tooth length,
    // bone-toned, seeded ±15% spacing/length jitter, never an even picket row.
    // Count is a weights-only function (H0) so sibling seeds stay structural.
    if (head.gapeD && f.teeth && carn > 0.05) {
      const nUp = Math.min(5, Math.max(3, 3 + Math.floor((H0 - 34) / 14)));
      const nLo = nUp - 2;
      const tr2 = mulberry32((genome.seed ^ 0x7ee7) >>> 0);
      const tl = Math.min(7, Math.max(4, p.headSize * 0.11));
      let teeth = '';
      for (let i = 0; i < nUp; i++) {
        const u = 0.2 + ((i + 0.5 + (tr2() - 0.5) * 0.3) / nUp) * 0.72;
        const b = head.lip(u);
        const len = tl * 0.5 * (0.85 + tr2() * 0.3) * (i % 2 === 0 ? 1 : 0.82);
        const w = Math.max(1.2, 0.028 * H);
        teeth += `<path d="${trianglePath(
          [b[0] - hu[0] * w, b[1] - hu[1] * w],
          [b[0] - hv[0] * len, b[1] - hv[1] * len],
          [b[0] + hu[0] * w, b[1] + hu[1] * w]
        )}" fill="${TOOTH}" stroke="${BONE_INK}" stroke-width="0.6"/>`;
      }
      const lowerEdge = head.jawPts.slice(0, 7);
      for (let i = 0; i < nLo; i++) {
        const u = 0.3 + ((i + 0.5 + (tr2() - 0.5) * 0.3) / Math.max(1, nLo)) * 0.5;
        const b = alongPolyline(lowerEdge, u);
        const len = tl * 0.38 * (0.85 + tr2() * 0.3);
        const w = Math.max(1, 0.024 * H);
        teeth += `<path d="${trianglePath(
          [b[0] - hu[0] * w, b[1] - hu[1] * w],
          [b[0] + hv[0] * len, b[1] + hv[1] * len],
          [b[0] + hu[0] * w, b[1] + hu[1] * w]
        )}" fill="${TOOTH}" stroke="${BONE_INK}" stroke-width="0.6"/>`;
      }
      svg += `<g opacity="${round2(carn * tier)}">${teeth}</g>`;
    }

    // socket shadow seats the eye IN the skull — a seat, not a panda patch
    svg += `<ellipse cx="${round1(E[0] - hu[0] * er * 0.15)}" cy="${round1(E[1] - hu[1] * er * 0.15)}" rx="${round1(
      Math.min(er * 1.4, H * 0.3)
    )}" ry="${round1(Math.min(er * 1.05, H * 0.22))}" fill="${lineInk}" opacity="${round2(0.14 * tier)}"/>`;
    // sclera → iris (markings-tinted) → pupil → one catchlight in the
    // upper-nasal quadrant — the catchlight is the "alive" cue and stays
    // at every tier
    svg +=
      `<circle cx="${round1(E[0])}" cy="${round1(E[1])}" r="${round1(er)}" fill="${EYE_WHITE}" stroke="${lineInk}" stroke-width="1.2"/>` +
      `<circle cx="${round1(E[0] - er * 0.12)}" cy="${round1(E[1])}" r="${round1(er * 0.63)}" fill="${shade(sec, -0.08)}"/>` +
      `<circle cx="${round1(E[0] - er * 0.16)}" cy="${round1(E[1])}" r="${round1(er * 0.33)}" fill="${EYE_PUPIL}"/>` +
      `<circle cx="${round1(E[0] + hu[0] * er * 0.35 + hv[0] * er * 0.35)}" cy="${round1(
        E[1] + hu[1] * er * 0.35 + hv[1] * er * 0.35
      )}" r="${round1(Math.max(0.8, er * 0.25))}" fill="${EYE_WHITE}" opacity="0.9"/>`;
    // brow: one stroke, angled down-toward-snout for carnivores (8–15°),
    // near-level for herbivores (0–6°) — never an arch above the skull line
    {
      const th = 0.05 + 0.17 * carn;
      const cth = Math.cos(th);
      const sth = Math.sin(th);
      const bLen = er * 3.3;
      const b0: Pt = [E[0] - hu[0] * er * 1.45 + hv[0] * er * 1.9, E[1] - hu[1] * er * 1.45 + hv[1] * er * 1.9];
      const dir: Pt = [hu[0] * cth - hv[0] * sth, hu[1] * cth - hv[1] * sth];
      const b1: Pt = [b0[0] + dir[0] * bLen, b0[1] + dir[1] * bLen];
      const bc: Pt = [b0[0] + dir[0] * bLen * 0.5 + hv[0] * er * 0.35, b0[1] + dir[1] * bLen * 0.5 + hv[1] * er * 0.35];
      svg += `<path d="M${fmt(b0[0], b0[1])}Q${fmt(bc[0], bc[1])} ${fmt(b1[0], b1[1])}" fill="none" stroke="${lineInk}" stroke-width="${browW}" stroke-linecap="round" opacity="${round2(0.8 * tier)}"/>`;
    }
  }

  // --- near legs (in front of the body, thighs merging into it) -------------------
  svg += hindLeg(hip, p, 0, 0, url('gl'), edge, W_SIL, lineInk, `url(#${clipId})`, curveHind, hindFootLen, lux);
  svg += frontLeg(shoulder, p, 0, 0, url('gl'), edge, W_SIL, lineInk, lux, `url(#${clipId})`, curveFore, foreFootLen);

  // --- value system (§3), drawn OVER the near-leg root overpaint --------------------
  // The spine-relative bands land after the near legs so body wall and thigh
  // receive identical countershade/core-shadow — the §5 continuity rule holds
  // by construction and the thigh never reads as an erased patch. (Paint-order
  // detail inside the §3 stack; the visual order of the five values is kept.)
  {
    const pool = (cx: number, cy: number, rx: number, ry: number, o: number): string =>
      `<ellipse cx="${round1(cx)}" cy="${round1(cy)}" rx="${round1(rx)}" ry="${round1(ry)}" fill="${url('ao')}" opacity="${o}"/>`;
    let v = '';
    // dorsal dark reinforcement along the ridge — shallow steps, and the
    // deepest margin undulates gently so the pigment edge reads organic,
    // never a ruled two-tone line
    v += `<path d="${edgeStrip(0.05, tNeck, 1, 1.04, (t) => 0.5 + 0.05 * Math.sin(t * 7))}" fill="${shade(prim, -0.5)}" opacity="0.04"/>`;
    v += `<path d="${edgeStrip(0.05, tNeck, 1, 1.04, (t) => 0.7 + 0.04 * Math.sin(t * 7 + 1.3))}" fill="${shade(prim, -0.5)}" opacity="0.05"/>`;
    v += `<path d="${edgeStrip(0.05, tNeck, 1, 1.04, 0.87)}" fill="${shade(prim, -0.5)}" opacity="0.06"/>`;
    // ventral cream, spine-relative (throat to tail underside)
    v += `<path d="${edgeStrip(0.04, 0.72, -1, 1.04, 0.62)}" fill="${cream}" opacity="0.3"/>`;
    v += `<path d="${edgeStrip(0.04, 0.72, -1, 1.04, 0.8)}" fill="${cream}" opacity="0.18"/>`;
    // core shadow (§3.3): the turn of the form — a soft dark band hugging the
    // belly line just above the cream, never a stripe
    v += `<path d="${edgeStrip(0.05, 0.7, -1, 0.72, 0.4)}" fill="${dark}" opacity="0.06"/>`;
    v += `<path d="${edgeStrip(0.05, 0.7, -1, 0.64, 0.44)}" fill="${dark}" opacity="0.06"/>`;
    v += `<path d="${edgeStrip(0.05, 0.7, -1, 0.56, 0.48)}" fill="${dark}" opacity="0.06"/>`;
    // AO pools (§3.4): limb roots, throat, tail-meets-hips. Root pools hug
    // the local belly line and span past the thigh, darkening body wall and
    // emerging limb together — the seam-killer where a leg crosses the edge
    const throat = alongPolyline(head.jawPts, 0.62);
    const hipHalf = at(0.3).w / 2;
    const chestHalf = at(0.625).w / 2;
    v += pool(hip[0] - 2, hip[1] + hipHalf * 0.78, p.hLegThick * 1.8, hipHalf * 0.62, 0.17);
    v += pool(hip[0] - 2 + FAR_DX, hip[1] + hipHalf * 0.6, p.hLegThick * 1.4, hipHalf * 0.5, 0.12);
    v += pool(shoulder[0] + 6, shoulder[1] + chestHalf * 0.74, p.fLegThick * 1.7 + 12, chestHalf * 0.6, 0.15);
    v += pool(shoulder[0] + 6 + FAR_DX, shoulder[1] + chestHalf * 0.56, p.fLegThick * 1.4 + 9, chestHalf * 0.48, 0.11);
    v += pool(throat[0], throat[1], p.headSize * 0.62, p.headSize * 0.4, 0.13);
    v += pool(hip[0] + 34, hip[1] + p.bodyThick * 0.16, p.tailThick * 1.1, p.tailThick * 0.7, 0.13);
    // hip and shoulder joint arcs read on the thigh, not under it
    if (lux) {
      v +=
        `<g fill="none" stroke="${lineInk}" stroke-linecap="round">` +
        `<path d="${arcPath([hip[0] - 2, hip[1] + 12], p.hLegThick * 0.66, Math.PI * 1.06, Math.PI * 1.86)}" stroke-width="1.2" opacity="0.18"/>` +
        `<path d="${arcPath([shoulder[0] + 8, shoulder[1] + 16], p.fLegThick * 0.9 + 6, Math.PI * 1.12, Math.PI * 1.8)}" stroke-width="1.1" opacity="0.16"/>` +
        `</g>`;
    }
    svg += `<g clip-path="url(#${clipId})">${v}</g>`;
    // wrap light (§3.2): the body's own shape refilled with the radial. Last
    // of the value stack so the thigh overpaint sits under the same light.
    svg += `<use href="#${gid('sil')}" fill="${url('wl')}"/>`;
  }
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
    const R = 18 + 22 * f.domeSkull.intensity;
    // seat the chord deep under the crown's high point: the skull top curves
    // away behind the boss, and a shallow chord bridges the drop with a
    // visible sliver of sky under its rim
    const seat = head.headTop(0.34);
    const bx = seat[0] - hv[0] * 16;
    const by = seat[1] - hv[1] * 16;
    const rx = R * 0.82;
    const p0: Pt = [bx - hu[0] * rx, by - hu[1] * rx];
    const p1: Pt = [bx + hu[0] * rx, by + hu[1] * rx];
    // sweep 0 arcs the cap UP over the crown (sweep 1 bowls it over the face
    // — p0 sits tail-ward of p1, so the clockwise arc dips below the chord)
    svg +=
      `<path d="M${fmt(p0[0], p0[1])}A${round1(rx)} ${round1(R)} 0 0 0 ${fmt(p1[0], p1[1])}Z" ` +
      `fill="${url('dm')}" stroke="${edge}" stroke-width="${W_FEAT}" stroke-linejoin="round"/>`;
    if (lux) {
      // shallow pits — the battering surface is never smooth in a field guide
      for (const [ox, oy] of [
        [-0.42, 0.42],
        [0.05, 0.62],
        [0.42, 0.4],
      ] as const) {
        const kx = bx + hu[0] * rx * ox + hv[0] * R * oy;
        const ky = by + hu[1] * rx * ox + hv[1] * R * oy;
        svg += `<circle cx="${round1(kx)}" cy="${round1(ky)}" r="1.3" fill="${lineInk}" opacity="0.3"/>`;
      }
    }
    for (const off of [0.5, 0.82]) {
      const h = Math.sqrt(Math.max(0, 1 - off * off)) * R * 0.82;
      const kx = bx + hu[0] * rx * off + hv[0] * (h + 4);
      const ky = by + hu[1] * rx * off + hv[1] * (h + 4);
      svg += `<circle cx="${round1(kx)}" cy="${round1(ky)}" r="${round1(
        3 * f.domeSkull.intensity
      )}" fill="${url('bn')}" stroke="${BONE_INK}" stroke-width="1"/>`;
    }
  }

  // Ankylosaurus tail club: paired bony lobes at the very tip of the tail —
  // the visible seam between the two osteoderms is what sells the texture.
  if (f.tailClub) {
    const sp = at(0.015);
    const R = 15 + 16 * f.tailClub.intensity;
    const cx = sp.p[0] + sp.tn[0] * R * 0.4;
    const cy = sp.p[1] + sp.tn[1] * R * 0.4;
    const lobe = (dx: number, rxF: number, ryF: number): string =>
      `<ellipse cx="${round1(cx + sp.tn[0] * R * dx)}" cy="${round1(cy + sp.tn[1] * R * dx)}" rx="${round1(
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
        const px = cx + sp.tn[0] * R * dx + sp.n[0] * R * dy;
        const py = cy + sp.tn[1] * R * dx + sp.n[1] * R * dy;
        pits += `<path d="M${fmt(px - r, py)}Q${fmt(px, py + r * 0.9)} ${fmt(px + r, py)}"/>`;
      }
      svg += `<g fill="none" stroke="${BONE_INK}" stroke-width="1" opacity="0.45">${pits}</g>`;
    }
    svg += `<ellipse cx="${round1(cx - sp.tn[0] * R * 0.3 + sp.n[0] * R * 0.22)}" cy="${round1(
      cy - sp.tn[1] * R * 0.3 + sp.n[1] * R * 0.22
    )}" rx="${round1(R * 0.34)}" ry="${round1(R * 0.24)}" fill="${shade(BONE, 0.34)}" opacity="0.8"/>`;
  }

  // --- vignette crop: tight viewBox around one slot, raw geometry, no scaling ----
  if (opts.crop) {
    const box = cropBox(opts.crop, pts, ws, hip, shoulder, f, [
      ...head.topPts,
      ...head.lipPts,
      ...head.jawPts,
    ]);
    const label = `${escapeAttr(composeName(genome).name)} ${opts.crop}`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" role="img" aria-label="${label}">` +
      svg +
      `</svg>`
    );
  }

  // --- scale around the ground anchor, wrap in <svg> --------------------------------
  // Fit-to-frame clamp (computed above, pre-face, for the §4 floors): the
  // display scale may only *shrink* to keep a creature inside the viewBox —
  // it never grows past its genome size.
  const { name } = composeName(genome);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-label="${escapeAttr(name)}, a hybrid dinosaur">` +
    `<g transform="translate(${round1(anchorX)} ${GROUND}) scale(${s}) translate(${round1(-anchorX)} ${-GROUND})">${svg}</g>` +
    `</svg>`
  );
}

// head-frame anatomy anchors (§4): the brow boss ends and the snout begins at
// a=0.40; the nose point sits at a=1.06. "Snout length" in the ratio table is
// the distance between them.
const BOSS_FRONT_A = 0.4;
const NOSE_A = 1.06;

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
 * Largest display scale (about the ground anchor at anchorX) that keeps the
 * creature inside the viewBox. Vertical: the top edge (silhouette, skull
 * crown, features over their own anchor region — a sail must not borrow
 * headroom from a sauropod's head, or tall hybrids over-shrink and the size
 * slider goes dead, M1 review). Horizontal: snout and tail-tip features stay
 * in frame too — STYLE-BIBLE §2 judges every species at full-frame max size,
 * so "no clipped features" now includes the frame edges. Returns Infinity
 * when nothing overflows.
 */
function fitScale(
  pts: readonly Pt[],
  ws: readonly number[],
  feat: BlendResult['features'],
  crownY: number,
  bxMin: number,
  bxMax: number,
  anchorX: number
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
  let ymin = Math.min(topOver(0, 1), crownY);
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
  let s = ymin < GROUND ? (GROUND - PAD) / (GROUND - ymin) : Infinity;
  // tail-tip features overhang the silhouette bbox on the right
  const tailReach =
    (feat.tailClub ? 34 * feat.tailClub.intensity : 0) +
    (feat.feathers ? 30 * feat.feathers.intensity : 0) +
    (feat.tailSpikes ? 14 * feat.tailSpikes.intensity : 0);
  if (bxMin < anchorX) s = Math.min(s, (anchorX - PAD) / (anchorX - bxMin));
  const right = bxMax + tailReach;
  if (right > anchorX) s = Math.min(s, (VIEW.width - PAD - anchorX) / (right - anchorX));
  return s;
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
  feat: BlendResult['features'],
  headPts: readonly Pt[]
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
  // the head slot frames the authored skull, which outgrows the old tube
  if (slot === 'head') {
    for (const [x, y] of headPts) {
      minX = Math.min(minX, x - 4);
      maxX = Math.max(maxX, x + 4);
      minY = Math.min(minY, y - 4);
      maxY = Math.max(maxY, y + 4);
    }
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

// --- head construction ----------------------------------------------------------

interface HeadInfo {
  /** head frame: origin (spine at tHead), nose-ward unit u, up unit v, snout length, head height */
  C: Pt;
  u: Pt;
  v: Pt;
  L: number;
  H: number;
  /** authored skull top: neck join → occiput → brow boss → snout bridge → nose point */
  topPts: Pt[];
  /** upper-jaw lip line, nose → mouth corner (interior crease when the mouth is closed) */
  lipPts: Pt[];
  /** silhouette underside: (open) corner → lower jaw → chin → throat → neck join, or (closed) nose → chin → throat → neck join */
  jawPts: Pt[];
  /** open-mouth interior wedge path, '' when closed */
  gapeD: string;
  gape: number;
  /** arc-fraction samplers over the authored polylines */
  headTop: (a: number) => Pt;
  lip: (a: number) => Pt;
  mouthCorner: Pt;
  /** highest authored point (viewBox fitting) */
  crownY: number;
}

/**
 * Parametric skull. Cranium + brow boss + snout bridge on top; a short
 * upper-jaw lip line and a real lower jaw below. Carnivores (teeth gene
 * expressed) part the jaws by a narrow gape — STYLE-BIBLE §4: 10–16° between
 * jaws at full expression, mouth corner ≤ 0.35 of snout length back from the
 * nose (a deeper corner is the grin that reads as derp). Herbivores close
 * the mouth and sharpen toward a beak as snoutTip narrows. Everything is a
 * linear map of blended morph params in the head frame, so hybrid heads
 * morph as smoothly as the tube they replace.
 */
function buildHead(
  C: Pt,
  u: Pt,
  v: Pt,
  L: number,
  H: number,
  neckTop: Pt,
  neckBot: Pt,
  gape: number,
  beak: number
): HeadInfo {
  const lp = (a: number, b: number): Pt => [
    C[0] + u[0] * a * L + v[0] * b * H,
    C[1] + u[1] * a * L + v[1] * b * H,
  ];
  const chain = (start: Pt, segs: Array<readonly [Pt, Pt]>, m = 6): Pt[] => {
    const out: Pt[] = [start];
    let cur = start;
    for (const [ctrl, end] of segs) {
      for (let i = 1; i <= m; i++) out.push(quad(cur, ctrl, end, i / m));
      cur = end;
    }
    return out;
  };

  // skull top — the brow boss then a bridge dip is what carries the "real
  // animal" read; the beak factor drops the bridge and sharpens the nose.
  // The crown clears the neck-join height, else thick-necked species get a
  // notch where the tube hands over to the skull.
  const bJoin = ((neckTop[0] - C[0]) * v[0] + (neckTop[1] - C[1]) * v[1]) / H;
  const crownB = Math.max(0.63, bJoin + 0.05);
  const nose = lp(NOSE_A, -0.02 - 0.02 * beak);
  const topPts = chain(neckTop, [
    [lp(-0.02, crownB - 0.01), lp(0.14, crownB)],
    [lp(0.3, Math.max(0.68, crownB + 0.04)), lp(0.4, Math.max(0.55, crownB - 0.08))],
    [lp(0.5, 0.38), lp(0.64, 0.28 - 0.06 * beak)],
    [lp(0.82, 0.2 - 0.06 * beak), lp(0.94, 0.12 - 0.05 * beak)],
    [lp(NOSE_A, 0.06 - 0.04 * beak), nose],
  ]);
  // mouth corner ≤ 0.35 snout lengths back from the nose (§4) — the visible
  // oral margin stays forward; lips cover the rear of the jaw
  const mouthCorner = lp(NOSE_A - 0.33 * (NOSE_A - BOSS_FRONT_A), -0.15);
  const lipPts = chain(nose, [
    [lp(1.01, -0.11), lp(0.95, -0.13)],
    [lp(0.89, -0.145), mouthCorner],
  ]);

  // narrow carnivore gape: the lower jaw rotates down ~12° at full expression
  // (10–16° range) about the mouth corner; gd is that drop in H units at the
  // lower-lip tip
  const jawTipA = 1.02;
  const gd = Math.tan(0.24 * gape) * (jawTipA - (NOSE_A - 0.33 * (NOSE_A - BOSS_FRONT_A))) * (L / H);
  let jawPts: Pt[];
  let gapeD = '';
  if (gape > 0.04) {
    const lowerTip = lp(jawTipA, -0.155 - gd);
    jawPts = chain(mouthCorner, [
      [lp(0.95, -0.15 - gd * 0.5), lowerTip],
      [lp(1.06, -0.24 - gd * 0.8), lp(0.9, -0.36 - gd * 0.4)],
      [lp(0.48, -0.53), lp(0.1, -0.55)],
      [lp(-0.04, -0.54), neckBot],
    ]);
    // mouth interior behind the teeth
    const gi = chain(mouthCorner, [[lp(0.95, -0.15 - gd * 0.55), lp(1.0, -0.15 - gd * 0.9)]]);
    let d = `M${fmt(mouthCorner[0], mouthCorner[1])}`;
    for (const q of lipPts.slice(0, -1).reverse()) d += `L${fmt(q[0], q[1])}`; // corner → nose
    for (const q of gi.reverse()) d += `L${fmt(q[0], q[1])}`;
    gapeD = d + 'Z';
  } else {
    jawPts = chain(nose, [
      [lp(1.03, -0.13 - 0.04 * beak), lp(0.94, -0.22)],
      [lp(0.7, -0.4), lp(0.42, -0.48)],
      [lp(0.06, -0.56), lp(-0.02, -0.54)],
      [lp(-0.06, -0.53), neckBot],
    ]);
  }

  let crownY = Infinity;
  for (const q of topPts) crownY = Math.min(crownY, q[1]);
  return {
    C,
    u,
    v,
    L,
    H,
    topPts,
    lipPts,
    jawPts,
    gapeD,
    gape,
    headTop: (a) => alongPolyline(topPts, a),
    lip: (a) => alongPolyline(lipPts, a),
    mouthCorner,
    crownY,
  };
}

// --- limbs -------------------------------------------------------------------------

/** catmull-sampled centerline + interpolated widths + normals for a limb */
function limbSamples(ctrl: readonly Pt[], widths: readonly number[]) {
  const pts = catmull(ctrl, 8);
  const ws = pts.map((_, i) => {
    const f = (i / (pts.length - 1)) * (widths.length - 1);
    const j = Math.floor(f);
    const w0 = widths[j]!;
    const w1 = widths[Math.min(j + 1, widths.length - 1)]!;
    return w0 + (w1 - w0) * (f - j);
  });
  return { pts, ws, nm: normals(pts) };
}

/**
 * Leg and foot as ONE continuous silhouette path (STYLE-BIBLE §5): the ribbon
 * runs down the leg, the front edge flows over the toes, the sole lies flat
 * on the ground (≥60% of foot length in contact), and the heel closes back up
 * the rear edge — no appended ellipse, no ankle cap-line. Toe splits scallop
 * the front edge by `c` (posture curvature): deep clawed splits for
 * digitigrade legs, a smooth pad for graviportal columns. Returns the path
 * plus claw/nail wedges and (lux) toe creases.
 */
function legWithFoot(
  ctrl: readonly Pt[],
  widths: readonly number[],
  groundY: number,
  footLen: number,
  c: number,
  ink: string,
  lux: boolean
): { d: string; extras: (fill: string) => string } {
  const { pts, ws, nm } = limbSamples(ctrl, widths);
  const last = pts.length - 1;
  const fx = pts[last]![0];
  // front (nose-ward) edge then toes then sole then heel then rear edge
  let d = '';
  for (let i = 0; i <= last; i++) {
    const w = ws[i]! / 2;
    d += `${i === 0 ? 'M' : 'L'}${fmt(pts[i]![0] + nm[i]![0] * w, pts[i]![1] + nm[i]![1] * w)}`;
  }
  const wA = ws[last]! / 2;
  const frontX = fx - wA;
  const backX = fx + wA;
  const toeX = fx - footLen * 0.72;
  const heelX = Math.max(backX + 2, fx + footLen * 0.3);
  const notch = 0.8 + 5.4 * c;
  const t1: Pt = [fx - footLen * 0.38, groundY - 2.8 - notch * 0.55]; // far toe tip
  const t2: Pt = [toeX, groundY - 1.6]; // near toe tip, frontmost
  // over the metatarsus front down to the far toe
  d += `Q${fmt(frontX - footLen * 0.06, groundY - 5.5 - notch * 0.4)} ${fmt(t1[0] + 2.6, t1[1] - 1.2)}`;
  d += `Q${fmt(t1[0] - 1.2, t1[1] - 0.8)} ${fmt(t1[0] - 1.6, t1[1] + 1)}`;
  // notch between the toes — the split that makes them read as separate
  d += `Q${fmt((t1[0] + t2[0]) / 2, t1[1] - 0.6 + notch)} ${fmt(t2[0] + 2.2, t2[1] - 1)}`;
  d += `Q${fmt(t2[0] - 2.4, t2[1] - 0.6)} ${fmt(t2[0] - 1, groundY)}`;
  // flat sole in ground contact from near-toe to heel
  d += `L${fmt(heelX - 2.4, groundY)}`;
  d += `Q${fmt(heelX + 2.2, groundY - 1.6)} ${fmt(backX, pts[last]![1] + 1)}`;
  for (let i = last; i >= 0; i--) {
    const w = ws[i]! / 2;
    d += `L${fmt(pts[i]![0] - nm[i]![0] * w, pts[i]![1] - nm[i]![1] * w)}`;
  }
  d += 'Z';

  // claws morph continuously with posture: long narrow talons on digitigrade
  // feet, short broad hoof-nails on columns — same 3 elements either way
  const extras = (fill: string): string => {
    const nl = 2 + 4.6 * c;
    const nw = 3.1 - 1.1 * c;
    const nail = (bx: number, by: number, dx: number, dy: number, sc: number): string => {
      const L2 = Math.hypot(dx, dy) || 1;
      const ux = dx / L2;
      const uy = dy / L2;
      return `<path d="${trianglePath(
        [bx - uy * nw * sc, by + ux * nw * sc],
        [bx + ux * nl * sc, by + uy * nl * sc],
        [bx + uy * nw * sc, by - ux * nw * sc]
      )}" fill="${fill}"/>`;
    };
    let out = nail(t2[0] + 0.6, t2[1] + 0.4, -0.9, 0.44, 1);
    out += nail(t1[0] + 0.4, t1[1], -0.86, 0.5, 0.86);
    out += nail(fx - footLen * 0.08, groundY - 1.8, -0.8, 0.6, 0.7);
    if (lux) {
      // toe creases off the notch toward the sole
      out += `<path d="M${fmt((t1[0] + t2[0]) / 2 + 1, t1[1] + notch * 0.5)}L${fmt(
        (t1[0] + t2[0]) / 2 - 0.6,
        groundY - 0.8
      )}M${fmt(fx - footLen * 0.18, groundY - 3.4)}L${fmt(fx - footLen * 0.22, groundY - 0.8)}" stroke="${ink}" stroke-width="1" opacity="0.35" fill="none"/>`;
    }
    return out;
  };
  return { d, extras };
}

/**
 * Hind leg: jointed chain (thigh root high inside the body → knee → ankle →
 * metatarsus → unified foot). Posture follows the archetype blend `c`
 * (STYLE-BIBLE §5): c→1 is the digitigrade S (knee forward at 0.44 of leg
 * length, ankle high, metatarsus near-vertical), c→0 straightens every
 * offset into a graviportal column within 4° of vertical through the hip.
 * The thigh root is ≥ 0.5 × body depth at the hip; `bodyClip` (near legs)
 * overpaints the stroke inside the body silhouette so the thigh grows out
 * of the hip instead of ending in a visible root cap.
 */
function hindLeg(
  hip: Pt,
  p: MorphVector,
  dx: number,
  dy: number,
  fill: string,
  stroke: string,
  strokeW: number,
  ink: string,
  bodyClip: string | null,
  c: number,
  footLen: number,
  lux: boolean
): string {
  const legLen = GROUND - hip[1];
  const footH = 8 + 3 * c;
  const groundY = GROUND - 1 + dy * 0.5;
  const rootW = Math.max(p.hLegThick * 1.3, p.bodyThick * 0.485);
  const ctrl: Pt[] = [
    [hip[0] + 6 + 2 * c + dx, hip[1] - p.hLegThick * 0.1 + dy],
    [hip[0] - 14 * c + dx, hip[1] + legLen * 0.44 + dy],
    [hip[0] + 12 * c + dx, GROUND - (12 + 32 * c) + dy],
    [hip[0] - 2 + dx, GROUND - footH + dy * 0.5],
  ];
  const widths = [
    rootW,
    p.hLegThick * 0.66,
    p.hLegThick * (0.4 + 0.12 * (1 - c)),
    p.hLegThick * (0.44 + 0.14 * (1 - c)),
  ];
  const { d, extras } = legWithFoot(ctrl, widths, groundY, footLen, c, ink, lux);
  let out = `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>`;
  // the overpaint hides the leg's own stroke inside the body; the side-edge
  // whisper then draws the thigh as a contour, so the smooth muscle mass
  // reads as *in front of* the textured body wall, not an erased patch
  if (bodyClip) {
    out += `<g clip-path="${bodyClip}"><path d="${d}" fill="${fill}"/></g>`;
  }
  out += extras(ink);
  return out;
}

/**
 * Front leg. Grounded quadruped forelimbs get the same unified leg+foot
 * treatment as hind legs (column posture per archetype, hoof-nails);
 * theropod hanging arms keep the tucked two-claw hand.
 */
function frontLeg(
  shoulder: Pt,
  p: MorphVector,
  dx: number,
  dy: number,
  fill: string,
  stroke: string,
  strokeW: number,
  lineInk: string,
  lux: boolean,
  bodyClip: string | null,
  c: number,
  footLen: number
): string {
  const ax = shoulder[0] + 6 + dx;
  const ay = shoulder[1] + 2 + dy;
  const footY = Math.min(ay + 6 + p.fLegLen, GROUND - 8 + dy);
  if (footY > GROUND - 30 + dy) {
    // grounded quadruped column: three control points only — clustering an
    // elbow and wrist mid-leg makes the ribbon fold on long legs
    const footH = 7 + 2 * c;
    const groundY = GROUND - 1 + dy * 0.5;
    const ctrl: Pt[] = [
      [ax, ay],
      [ax + 2 + 3 * c, (ay + groundY) / 2 + 3],
      [ax - 4 - 6 * c, GROUND - footH + dy * 0.5],
    ];
    const widths = [p.fLegThick * 1.2, p.fLegThick * 0.7, p.fLegThick * 0.56];
    const { d, extras } = legWithFoot(ctrl, widths, groundY, footLen, c * 0.75, lineInk, lux);
    let out = `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>`;
    if (bodyClip) {
      out += `<g clip-path="${bodyClip}"><path d="${d}" fill="${fill}"/></g>`;
    }
    out += extras(lineInk);
    return out;
  }
  // hanging theropod arm: short ribbon, two curved claws (shipped look)
  const armCtrl: Pt[] = [
    [ax, ay],
    [ax + 2, (ay + footY) / 2 + 3],
    [ax - 9, footY],
  ];
  const armW = [p.fLegThick * 1.2, p.fLegThick * 0.66, p.fLegThick * 0.48];
  const path = limbPath(armCtrl, armW);
  let out = `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>`;
  if (bodyClip) out += `<g clip-path="${bodyClip}"><path d="${path}" fill="${fill}"/></g>`;
  const W: Pt = [ax - 10, footY];
  out += toe([W[0] + 2, W[1] - 2], [W[0] - 5, W[1] + 7], p.fLegThick * 0.34, 2.2, fill, stroke, lineInk);
  out += toe([W[0] + 4, W[1]], [W[0] + 1, W[1] + 8], p.fLegThick * 0.26, 1.8, fill, stroke, lineInk);
  return out;
}

/**
 * Tapered toe with a rounded tip and a dark claw — the hanging theropod
 * hand. The rounded cap is a Q pushed past the tip along the toe axis.
 */
function toe(b: Pt, t: Pt, w0: number, w1: number, fill: string, stroke: string, ink: string): string {
  const dx = t[0] - b[0];
  const dy = t[1] - b[1];
  const L = Math.hypot(dx, dy) || 1;
  const px = dy / L;
  const py = -dx / L;
  const ux = dx / L;
  const uy = dy / L;
  return (
    `<path d="M${fmt(b[0] - px * w0, b[1] - py * w0)}L${fmt(t[0] - px * w1, t[1] - py * w1)}` +
    `Q${fmt(t[0] + ux * w1 * 1.4, t[1] + uy * w1 * 1.4)} ${fmt(t[0] + px * w1, t[1] + py * w1)}` +
    `L${fmt(b[0] + px * w0, b[1] + py * w0)}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<path d="${trianglePath(
      [t[0] - px * 1.6, t[1] - py * 1.6],
      [t[0] + ux * 4.5, t[1] + uy * 4.5],
      [t[0] + px * 1.6, t[1] + py * 1.6]
    )}" fill="${ink}"/>`
  );
}

// --- markings -----------------------------------------------------------------------

/**
 * Pattern genes render between core shadow and texture, and must respect the
 * countershade (STYLE-BIBLE §7): every pattern fades toward the belly cream
 * instead of painting over it at full strength.
 */
function patternLayer(
  genome: Genome,
  clipId: string,
  sec: string,
  prim: string,
  sfx: string,
  topY: number,
  bellyY: number
): string {
  const pattern = genome.cosmetics.pattern;
  if (pattern === 'solid') return '';
  const clip = `clip-path="url(#${clipId})"`;

  if (pattern === 'stripes') {
    // one shared userSpace fade: full strength on the back, ~quarter at the belly
    const gradId = `ps-${sfx}`;
    let g =
      `<g ${clip}><defs><linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="0" y1="${round1(topY)}" x2="0" y2="${round1(bellyY)}">` +
      `<stop offset="0" stop-color="${sec}" stop-opacity="0.46"/>` +
      `<stop offset="0.6" stop-color="${sec}" stop-opacity="0.4"/>` +
      `<stop offset="1" stop-color="${sec}" stop-opacity="0.12"/></linearGradient></defs>`;
    for (let x = 250; x <= 730; x += 52) {
      g += `<rect x="${x - 9}" y="130" width="18" height="360" rx="9" fill="url(#${gradId})" transform="rotate(-7 ${x} 300)"/>`;
    }
    return g + '</g>';
  }

  if (pattern === 'spots' || pattern === 'rings') {
    // Placement is part of the creature's identity: seeded by the genome.
    // Marks fade individually as they near the belly cream.
    const rand = mulberry32((genome.seed ^ 0x5f0e) >>> 0);
    const marks: string[] = [];
    for (let i = 0; i < 18; i++) {
      const cx = round1(230 + rand() * 500);
      const cy = round1(205 + rand() * 215);
      const r = round1(7 + rand() * 9);
      const o = round2(0.5 * (1 - 0.75 * smoothstep(bellyY - 95, bellyY - 10, cy)));
      marks.push(
        pattern === 'spots'
          ? `<circle cx="${cx}" cy="${cy}" r="${r}" opacity="${o}"/>`
          : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${sec}" stroke-width="3" opacity="${o}"/>`
      );
    }
    return pattern === 'spots'
      ? `<g ${clip} fill="${sec}">${marks.join('')}</g>`
      : `<g ${clip}>${marks.join('')}</g>`;
  }

  // countershade: extra-pale underside fading upward — reinforces the base
  // ramp's cream, anchored to the actual belly line
  const pale = shade(mix(prim, '#e8e2c8', 0.5), 0.38);
  return (
    `<g ${clip}><defs><linearGradient id="cs-${sfx}" x1="0" y1="1" x2="0" y2="0">` +
    `<stop offset="0" stop-color="${pale}" stop-opacity="0.62"/>` +
    `<stop offset="0.55" stop-color="${pale}" stop-opacity="0.42"/>` +
    `<stop offset="1" stop-color="${pale}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="120" y="${round1(bellyY - 165)}" width="620" height="225" fill="url(#cs-${sfx})"/></g>`
  );
}

/**
 * Dorsal dapple (STYLE-BIBLE §7): seeded spots scattered along the dorsal
 * ridge, fading out by ~60 units below it. Dots are grouped into three
 * fixed-membership opacity buckets (membership by index, depth seeded inside
 * the bucket's band) so sibling seeds keep identical element structure, and
 * each bucket serializes as ONE path of circle arc-pairs — 3 elements total
 * against the Chromebook budget. Count scales with the *unjittered* blended
 * body span for the same reason.
 */
function dappleLayer(
  genome: Genome,
  clipId: string,
  sec: string,
  at: (t: number) => { p: Pt; n: Pt; w: number; tn: Pt },
  tNeck: number,
  span0: number
): string {
  const count = Math.min(60, Math.max(30, Math.round(span0 / 9)));
  const rand = mulberry32((genome.seed ^ 0xdaf1e) >>> 0);
  // bucket bands: near-ridge dots darkest, deep dots faintest → the fade
  const bands: (readonly [number, number, number])[] = [
    [2, 16, 0.3],
    [16, 34, 0.19],
    [34, 56, 0.1],
  ];
  const split = [Math.round(count * 0.42), Math.round(count * 0.33)];
  const dPaths = ['', '', ''];
  for (let i = 0; i < count; i++) {
    const bi = i < split[0]! ? 0 : i < split[0]! + split[1]! ? 1 : 2;
    const [d0, d1] = bands[bi]!;
    const t = 0.05 + rand() * (tNeck - 0.08);
    const depth = d0 + rand() * (d1 - d0);
    const r = round1(2 + rand() * 3);
    const sp = at(t);
    // clamp instead of skip: a dot sliding past a thin tail's centerline
    // stays drawn, so seeds can never change the arc count
    const off = Math.max(-sp.w * 0.15, sp.w / 2 - depth - r);
    const cx = sp.p[0] + sp.n[0] * off;
    const cy = sp.p[1] + sp.n[1] * off;
    dPaths[bi] += `M${fmt(cx - r, cy)}a${r} ${r} 0 1 0 ${round1(r * 2)} 0a${r} ${r} 0 1 0 ${round1(-r * 2)} 0`;
  }
  let g = `<g clip-path="url(#${clipId})" fill="${shade(sec, -0.06)}">`;
  for (let bi = 0; bi < 3; bi++) {
    g += `<path d="${dPaths[bi]}" opacity="${bands[bi]![2]}"/>`;
  }
  return g + '</g>';
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
