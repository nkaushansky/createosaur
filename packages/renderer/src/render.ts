import {
  blendGenome,
  composeName,
  GENOME_VERSION,
  genomeHash,
  mulberry32,
  type BlendResult,
  type Genome,
  type SpeciesResolver,
} from '@createosaur/genome';
import type { FeatureKind, MorphVector, PartSlot, SpeciesId } from '@createosaur/species-data';
import { shade } from './color';
import {
  fmt,
  limbPath,
  normals,
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
const SHADOW = 'rgba(30,30,20,0.14)';
const TOOTH = '#f6f2e4';
const EYE_WHITE = '#fdfaef';
const EYE_PUPIL = '#1c1a14';

export function renderCreature(genome: Genome, opts: RenderOptions = {}): string {
  const blend = blendGenome(genome, opts.resolveSpecies);
  const p = blend.morph;
  const f = blend.features;
  const clipId = `bod-${opts.idSuffix ?? genomeHash(genome)}`;

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
  const botOf = (t: number, inset = 0): Pt => {
    const s = at(t);
    const w = s.w / 2 - inset;
    return [s.p[0] - s.n[0] * w, s.p[1] - s.n[1] * w];
  };

  // --- palette ---------------------------------------------------------------
  const prim = genome.cosmetics.hide;
  const sec = genome.cosmetics.markings;
  const ink = shade(prim, -0.55);
  const legC = shade(prim, -0.14);
  const farC = shade(prim, -0.38);
  const farInk = shade(prim, -0.5);

  let svg = '';

  // --- ground + shadow -------------------------------------------------------
  if (opts.ground !== false && !opts.crop) {
    svg += `<line x1="60" y1="${GROUND}" x2="780" y2="${GROUND}" stroke="${PAPER_LINE}" stroke-width="2"/>`;
    for (const gx of [120, 300, 520, 700]) {
      svg += `<path d="M${gx} ${GROUND}l5 -9 M${gx + 7} ${GROUND}l4 -6" stroke="${PAPER_LINE}" stroke-width="1.5" fill="none"/>`;
    }
    const extent = tailTip[0] - snout[0];
    svg += `<ellipse cx="${round1((tailTip[0] + snout[0]) / 2)}" cy="${GROUND + 8}" rx="${round1(extent * 0.42)}" ry="9" fill="${SHADOW}"/>`;
  }

  // --- far legs (behind the body) ---------------------------------------------
  const FAR_DX = 26;
  const FAR_DY = -6;
  svg += hindLeg(hip, p, FAR_DX, FAR_DY, farC, farInk);
  svg += frontLeg(shoulder, p, FAR_DX, FAR_DY, farC, farInk);

  // --- features drawn behind the silhouette so bases hide under it -------------
  if (f.frill) {
    const c = at(0.685);
    const R = 66 * f.frill.intensity;
    const cx = c.p[0] + c.n[0] * 8;
    const cy = c.p[1] + c.n[1] * 8;
    svg +=
      `<g transform="rotate(-24 ${round1(cx)} ${round1(cy)})">` +
      `<ellipse cx="${round1(cx)}" cy="${round1(cy)}" rx="${round1(R * 0.74)}" ry="${round1(R)}" fill="${sec}" stroke="${shade(sec, -0.35)}" stroke-width="2.5"/>` +
      `<ellipse cx="${round1(cx)}" cy="${round1(cy)}" rx="${round1(R * 0.44)}" ry="${round1(R * 0.62)}" fill="${shade(sec, -0.15)}"/></g>`;
  }
  if (f.plates) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const tt = 0.3 + (i * 0.38) / (count - 1);
      const s = at(tt);
      const base: Pt = [
        s.p[0] + s.n[0] * (s.w / 2 - 3),
        s.p[1] + s.n[1] * (s.w / 2 - 3),
      ];
      const h = (26 + 24 * Math.sin((Math.PI * i) / (count - 1))) * f.plates.intensity;
      const a = s.tn;
      svg += `<path d="M${fmt(base[0] - a[0] * 13, base[1] - a[1] * 13)}L${fmt(
        base[0] - a[0] * 5 + s.n[0] * h,
        base[1] - a[1] * 5 + s.n[1] * h
      )}L${fmt(base[0] + a[0] * 5 + s.n[0] * h * 0.9, base[1] + a[1] * 5 + s.n[1] * h * 0.9)}L${fmt(
        base[0] + a[0] * 13,
        base[1] + a[1] * 13
      )}Z" fill="${sec}" stroke="${shade(sec, -0.35)}" stroke-width="2"/>`;
    }
  }
  if (f.tailSpikes) {
    for (const tt of [0.035, 0.085]) {
      const s = at(tt);
      const L = 46 * f.tailSpikes.intensity;
      let dir: Pt = [s.n[0] - s.tn[0] * 0.55, s.n[1] - s.tn[1] * 0.55];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      dir = [dir[0] / dl, dir[1] / dl];
      const base: Pt = [
        s.p[0] + s.n[0] * (s.w / 2 - 6),
        s.p[1] + s.n[1] * (s.w / 2 - 6),
      ];
      svg += `<path d="${trianglePath(
        [base[0] - s.tn[0] * 7, base[1] - s.tn[1] * 7],
        [base[0] + dir[0] * L, base[1] + dir[1] * L],
        [base[0] + s.tn[0] * 7, base[1] + s.tn[1] * 7]
      )}" fill="${BONE}" stroke="${BONE_INK}" stroke-width="1.5"/>`;
    }
  }
  const drawHorn = (tt: number, L: number, lean: number): string => {
    const s = at(tt);
    const b: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 2), s.p[1] + s.n[1] * (s.w / 2 - 2)];
    const tip: Pt = [b[0] + s.n[0] * L + s.tn[0] * L * lean, b[1] + s.n[1] * L + s.tn[1] * L * lean];
    return `<path d="M${fmt(b[0] - s.tn[0] * 7, b[1] - s.tn[1] * 7)}Q${fmt(
      b[0] + s.n[0] * L * 0.5 - s.tn[0] * 6,
      b[1] + s.n[1] * L * 0.5 - s.tn[1] * 6
    )} ${fmt(tip[0], tip[1])}Q${fmt(
      b[0] + s.n[0] * L * 0.5 + s.tn[0] * 4,
      b[1] + s.n[1] * L * 0.5 + s.tn[1] * 4
    )} ${fmt(b[0] + s.tn[0] * 7, b[1] + s.tn[1] * 7)}Z" fill="${BONE}" stroke="${BONE_INK}" stroke-width="1.5"/>`;
  };
  if (f.browHorns) {
    svg += drawHorn(tHead - 0.006, 62 * f.browHorns.intensity, 0.34);
    svg += drawHorn(tHead - 0.038, 48 * f.browHorns.intensity, 0.28);
  }
  if (f.noseHorn) {
    svg += drawHorn(0.955, 22 * f.noseHorn.intensity, 0.15);
  }

  // Spinosaurus sail: a dorsal membrane over the back, tallest mid-torso.
  // Drawn before the silhouette so its base tucks under the body outline.
  if (f.sail) {
    const span = [0.32, 0.4, 0.48, 0.56, 0.63];
    const peak = 150 * f.sail.intensity;
    const heightAt = (u: number) => Math.sin(Math.PI * u) ** 0.85; // 0 at ends, 1 mid
    const bases = span.map((tt) => {
      const s = at(tt);
      return [s.p[0] + s.n[0] * (s.w / 2 - 4), s.p[1] + s.n[1] * (s.w / 2 - 4)] as Pt;
    });
    const tips = span.map((tt, i) => {
      const s = at(tt);
      const h = peak * heightAt(i / (span.length - 1));
      return [bases[i]![0] + s.n[0] * h, bases[i]![1] + s.n[1] * h] as Pt;
    });
    let d = `M${fmt(bases[0]![0], bases[0]![1])}`;
    for (let i = 0; i < tips.length; i++) d += `L${fmt(tips[i]![0], tips[i]![1])}`;
    for (let i = bases.length - 1; i >= 0; i--) d += `L${fmt(bases[i]![0], bases[i]![1])}`;
    const web = shade(sec, -0.12);
    svg += `<path d="${d}Z" fill="${web}" stroke="${shade(sec, -0.4)}" stroke-width="2.5" stroke-linejoin="round"/>`;
    // support struts — the elongated neural spines the sail stretched over
    for (let i = 0; i < span.length; i++) {
      svg += `<path d="M${fmt(bases[i]![0], bases[i]![1])}L${fmt(
        tips[i]![0],
        tips[i]![1]
      )}" stroke="${shade(sec, -0.32)}" stroke-width="2" opacity="0.55"/>`;
    }
  }

  // Parasaurolophus crest: a tube swept up and back off the skull.
  if (f.crest) {
    const s = at(Math.min(1, tHead + 0.01));
    const L = 96 * f.crest.intensity;
    const wte = Math.max(9, s.w * 0.24);
    // base on the crown, sweeping back (−tangent) and up (+normal)
    const base: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 3), s.p[1] + s.n[1] * (s.w / 2 - 3)];
    const back: Pt = [-s.tn[0], -s.tn[1]]; // toward the neck/tail
    const up: Pt = s.n;
    const tip: Pt = [
      base[0] + back[0] * L * 0.9 + up[0] * L * 0.7,
      base[1] + back[1] * L * 0.9 + up[1] * L * 0.7,
    ];
    const ctrlTop: Pt = [base[0] + up[0] * L * 0.55, base[1] + up[1] * L * 0.55];
    const ctrlBot: Pt = [base[0] + back[0] * L * 0.5, base[1] + back[1] * L * 0.5];
    const tint = shade(prim, 0.12);
    svg +=
      `<path d="M${fmt(base[0] + s.tn[0] * wte * 0.5, base[1] + s.tn[1] * wte * 0.5)}` +
      `Q${fmt(ctrlTop[0], ctrlTop[1])} ${fmt(tip[0] + s.tn[0] * wte * 0.5, tip[1] + s.tn[1] * wte * 0.5)}` +
      `L${fmt(tip[0] - s.tn[0] * wte * 0.5, tip[1] - s.tn[1] * wte * 0.5)}` +
      `Q${fmt(ctrlBot[0], ctrlBot[1])} ${fmt(base[0] - back[0] * wte, base[1] - back[1] * wte)}Z" ` +
      `fill="${tint}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M${fmt(base[0], base[1])}Q${fmt(
        (ctrlTop[0] + ctrlBot[0]) / 2,
        (ctrlTop[1] + ctrlBot[1]) / 2
      )} ${fmt(tip[0], tip[1])}" stroke="${shade(prim, -0.3)}" stroke-width="2" fill="none" opacity="0.5"/>`;
  }

  // Raptor feathers: a filament fringe along the dorsal line (neck→back→tail).
  if (f.feathers) {
    const fr = mulberry32((genome.seed ^ 0x00fea) >>> 0);
    const len = 26 * f.feathers.intensity;
    let quills = '';
    for (let tt = 0.12; tt <= 0.86; tt += 0.045) {
      const s = at(tt);
      const jit = 0.75 + fr() * 0.5;
      const base: Pt = [s.p[0] + s.n[0] * (s.w / 2 - 2), s.p[1] + s.n[1] * (s.w / 2 - 2)];
      // sweep tailward so the plumage lies back like real pennaceous feathers
      const tip: Pt = [
        base[0] + s.n[0] * len * jit + s.tn[0] * len * 0.45,
        base[1] + s.n[1] * len * jit + s.tn[1] * len * 0.45,
      ];
      const side: Pt = [s.tn[0] * 3.5, s.tn[1] * 3.5];
      quills += `<path d="${trianglePath(
        [base[0] - side[0], base[1] - side[1]],
        tip,
        [base[0] + side[0], base[1] + side[1]]
      )}"/>`;
    }
    svg += `<g fill="${shade(sec, -0.05)}" stroke="${shade(sec, -0.35)}" stroke-width="0.8" opacity="0.9">${quills}</g>`;
  }

  // --- body silhouette ---------------------------------------------------------
  const bodyD = ribbonPath(pts, ws);
  svg += `<defs><clipPath id="${clipId}"><path d="${bodyD}"/></clipPath></defs>`;
  svg += `<path d="${bodyD}" fill="${prim}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;

  // --- pattern (clipped to the silhouette, placement seeded by the genome) ------
  svg += patternLayer(genome, clipId, sec, prim);

  // --- mouth, teeth, eye ---------------------------------------------------------
  {
    let d = `M${fmt(...botOf(0.865, 3))}`;
    for (let tt = 0.885; tt <= 0.995; tt += 0.02) d += `L${fmt(...botOf(tt, 3))}`;
    svg += `<path d="${d}" fill="none" stroke="${ink}" stroke-width="2" opacity="0.7"/>`;

    if (f.teeth && f.teeth.intensity > 0.05) {
      const tl = Math.min(7, Math.max(3.5, p.headSize * 0.16)) * f.teeth.intensity;
      let teeth = '';
      for (let i = 0; i < 5; i++) {
        const t0 = 0.885 + i * 0.021;
        const a = botOf(t0, 2.5);
        const b = botOf(t0 + 0.017, 2.5);
        teeth += `<path d="${trianglePath(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + tl], b)}" fill="${TOOTH}" stroke="${BONE_INK}" stroke-width="0.8"/>`;
      }
      svg += `<g opacity="${round1(f.teeth.intensity)}">${teeth}</g>`;
    }

    const e = at(Math.min(1, tHead + 0.018));
    const ex = e.p[0] + e.n[0] * e.w * 0.16;
    const ey = e.p[1] + e.n[1] * e.w * 0.16;
    const eyeScale = blend.age === 'hatchling' ? 1.6 : blend.age === 'juvenile' ? 1.25 : 1;
    const er = Math.min(7, Math.max(3.5, e.w * 0.11)) * eyeScale;
    svg +=
      `<circle cx="${round1(ex)}" cy="${round1(ey)}" r="${round1(er)}" fill="${EYE_WHITE}" stroke="${ink}" stroke-width="1.5"/>` +
      `<circle cx="${round1(ex - er * 0.25)}" cy="${round1(ey)}" r="${round1(er * 0.45)}" fill="${EYE_PUPIL}"/>`;
  }

  // --- near legs (in front of the body) ------------------------------------------
  svg += hindLeg(hip, p, 0, 0, legC, ink);
  svg += `<path d="${trianglePath(
    [hip[0] - p.hLegThick * 0.42 - 10, GROUND - 8],
    [hip[0] - p.hLegThick * 0.42 - 22, GROUND - 2],
    [hip[0] - p.hLegThick * 0.42 - 6, GROUND - 1]
  )}" fill="${legC}" stroke="${ink}" stroke-width="1.5"/>`;
  svg += frontLeg(shoulder, p, 0, 0, legC, ink);

  // Pachycephalosaur dome: a thickened, node-studded cranium over the skull,
  // drawn on top so the bony cap reads in front of the head silhouette.
  if (f.domeSkull) {
    const s = at(Math.min(1, tHead - 0.01));
    const R = (16 + 20 * f.domeSkull.intensity);
    const cx = s.p[0] + s.n[0] * (s.w / 2 - R * 0.35);
    const cy = s.p[1] + s.n[1] * (s.w / 2 - R * 0.35);
    const dome = shade(prim, 0.28);
    svg +=
      `<path d="M${fmt(cx - s.tn[0] * R, cy - s.tn[1] * R)}` +
      `A${round1(R)} ${round1(R * 1.05)} 0 0 1 ${fmt(cx + s.tn[0] * R, cy + s.tn[1] * R)}Z" ` +
      `fill="${dome}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    // small bony nodes around the crown (Dracorex's ornamented skull)
    for (const off of [-0.72, -0.3, 0.3, 0.72]) {
      const nx = cx + s.tn[0] * R * off + s.n[0] * R * 0.7;
      const ny = cy + s.tn[1] * R * off + s.n[1] * R * 0.7;
      const nr = 3.4 * f.domeSkull.intensity;
      svg += `<circle cx="${round1(nx)}" cy="${round1(ny)}" r="${round1(nr)}" fill="${BONE}" stroke="${BONE_INK}" stroke-width="1"/>`;
    }
  }

  // Ankylosaurus tail club: a heavy bony knob at the very tip of the tail.
  if (f.tailClub) {
    const s = at(0.015);
    const R = 15 + 16 * f.tailClub.intensity;
    const cx = s.p[0] + s.tn[0] * R * 0.4; // nudged toward the tip
    const cy = s.p[1] + s.tn[1] * R * 0.4;
    svg +=
      `<ellipse cx="${round1(cx)}" cy="${round1(cy)}" rx="${round1(R)}" ry="${round1(R * 0.86)}" fill="${BONE}" stroke="${BONE_INK}" stroke-width="2.5"/>` +
      `<ellipse cx="${round1(cx - s.tn[0] * R * 0.35)}" cy="${round1(cy - s.tn[1] * R * 0.35)}" rx="${round1(R * 0.4)}" ry="${round1(R * 0.34)}" fill="${shade(BONE, 0.18)}"/>`;
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
  const s = round1(blend.displayScale * 100) / 100;
  const { name } = composeName(genome);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-label="${escapeAttr(name)}, a hybrid dinosaur">` +
    `<g transform="translate(${round1(anchorX)} ${GROUND}) scale(${s}) translate(${round1(-anchorX)} ${-GROUND})">${svg}</g>` +
    `</svg>`
  );
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
  opts: { idSuffix?: string; seed?: number } = {}
): string {
  return renderCreature(pureSpeciesGenome(species, opts.seed ?? 1), {
    crop: slot,
    idSuffix: opts.idSuffix ?? `part-${species}-${slot}`,
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
  const feather = has('feathers') ? 20 : 0;
  const headTop =
    22 + feather + Math.max(has('crest') ? 96 : 0, has('domeSkull') ? 46 : 0, has('browHorns') || has('noseHorn') ? 60 : 0, has('frill') ? 40 : 0);
  const backTop = 20 + feather + Math.max(has('sail') ? 150 : 0, has('plates') ? 58 : 0);
  const tailTop = 20 + feather + Math.max(has('tailClub') ? 34 : 0, has('tailSpikes') ? 44 : 0);
  const tailSide = has('tailClub') ? 30 : 18;
  const M: Record<PartSlot, { a: number; b: number; top: number; bottom: number; left: number; right: number }> = {
    tail: { a: 0, b: 0.34, top: tailTop, bottom: 26, left: tailSide, right: tailSide },
    back: { a: 0.36, b: 0.66, top: backTop, bottom: 34, left: 28, right: 28 },
    head: { a: 0.72, b: 1, top: headTop, bottom: 30, left: 30, right: 24 },
    stance: { a: 0.38, b: 0.66, top: 18, bottom: 28, left: 58, right: 38 },
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
  stroke: string
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
  const foot = `<ellipse cx="${round1(hip[0] - 4 + dx)}" cy="${round1(
    GROUND - 6 + dy * 0.5
  )}" rx="${round1(p.hLegThick * 0.42 + (dx === 0 ? 8 : 7))}" ry="${dx === 0 ? 7 : 6.5}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  return `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` + foot;
}

function frontLeg(
  shoulder: Pt,
  p: MorphVector,
  dx: number,
  dy: number,
  fill: string,
  stroke: string
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
  let out = `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  if (footY > GROUND - 30 + dy) {
    out += `<ellipse cx="${round1(ax - 12)}" cy="${round1(GROUND - 5 + dy * 0.5)}" rx="${round1(
      p.fLegThick * 0.45 + (dx === 0 ? 6 : 5)
    )}" ry="${dx === 0 ? 6 : 5.5}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  } else {
    out += `<path d="${trianglePath(
      [ax - 10, footY],
      [ax - 19, footY + 9],
      [ax - 5, footY + 7]
    )}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return out;
}

// --- patterns -----------------------------------------------------------------------

function patternLayer(genome: Genome, clipId: string, sec: string, prim: string): string {
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

  // countershade: pale underside band — classic animal shading
  return `<g ${clip}><rect x="120" y="330" width="620" height="180" fill="${shade(prim, 0.55)}" opacity="0.55"/></g>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
