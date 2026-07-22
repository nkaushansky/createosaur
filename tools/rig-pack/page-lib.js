/**
 * rig-pack page-side library. Injected into Chromium by the CLI scripts and
 * run against the species master loaded into a canvas. Everything here is
 * deterministic: same master + same segmentation + same seed → identical
 * pack bytes (modulo PNG encoder, which is stable within a Chromium build).
 */
window.RigPack = (() => {
  const W = 1536;
  const H = 1024;

  function imageToData(img) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, W, H);
  }

  function newCanvas() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  }

  /** Background removal: flood fill near-paper colors from the borders. */
  function computeAlpha(src, bg) {
    const dist = new Uint16Array(W * H);
    const d = src.data;
    for (let i = 0; i < W * H; i++) {
      dist[i] =
        Math.abs(d[i * 4] - bg[0]) + Math.abs(d[i * 4 + 1] - bg[1]) + Math.abs(d[i * 4 + 2] - bg[2]);
    }
    const FLOOD_T = 48;
    const flooded = new Uint8Array(W * H);
    const stack = [];
    for (let x = 0; x < W; x++) {
      stack.push(x, (H - 1) * W + x);
    }
    for (let y = 0; y < H; y++) {
      stack.push(y * W, y * W + W - 1);
    }
    while (stack.length) {
      const i = stack.pop();
      if (flooded[i] || dist[i] >= FLOOD_T) continue;
      flooded[i] = 1;
      const x = i % W;
      if (x > 0) stack.push(i - 1);
      if (x < W - 1) stack.push(i + 1);
      if (i >= W) stack.push(i - W);
      if (i < W * (H - 1)) stack.push(i + W);
    }
    const alpha = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (!flooded[i]) {
        alpha[i] = 255;
      } else {
        // Soft rim: antialiased mixture pixels keep partial coverage.
        const a = Math.max(0, Math.min(1, (dist[i] - 12) / 36));
        alpha[i] = Math.round(a * 255);
      }
    }
    return alpha;
  }

  function pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /**
   * Ownership partition: for every pixel with any coverage, the first region
   * (in priority order) whose polygon set contains it; unclaimed pixels fall
   * to the designated remainder region.
   */
  function computeOwnership(alpha, segmentation) {
    const { priority, regions, remainder } = segmentation;
    const ids = segmentation.drawOrder;
    const idIndex = new Map(ids.map((id, i) => [id, i]));
    const owner = new Int8Array(W * H).fill(-1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (alpha[i] === 0) continue;
        let assigned = -1;
        for (const id of priority) {
          const polys = regions[id] ?? [];
          for (const poly of polys) {
            if (pointInPolygon(x + 0.5, y + 0.5, poly)) {
              assigned = idIndex.get(id);
              break;
            }
          }
          if (assigned >= 0) break;
        }
        owner[i] = assigned >= 0 ? assigned : idIndex.get(remainder);
      }
    }
    healRemainder(owner, alpha, segmentation, idIndex);
    return owner;
  }

  /**
   * Self-healing: remainder-owned pixels OUTSIDE the remainder's legitimate
   * bounds are polygon-gap leaks (a lip sliver, a strip between the hands).
   * Reassign each to its geodesically nearest properly-claimed region so
   * small authoring gaps never ship as floating fragments.
   */
  function healRemainder(owner, alpha, segmentation, idIndex) {
    const bounds = segmentation.remainderBounds;
    if (!bounds) return;
    const remainderIdx = idIndex.get(segmentation.remainder);
    const suspect = new Uint8Array(W * H);
    let suspectCount = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (owner[i] !== remainderIdx || alpha[i] === 0) continue;
        let insideAny = false;
        for (const poly of bounds) {
          if (pointInPolygon(x + 0.5, y + 0.5, poly)) {
            insideAny = true;
            break;
          }
        }
        if (!insideAny) {
          suspect[i] = 1;
          suspectCount++;
        }
      }
    }
    if (suspectCount === 0) return;
    // Multi-source BFS from every non-remainder pixel, propagating labels.
    const label = new Int8Array(W * H).fill(-1);
    let queue = [];
    for (let i = 0; i < W * H; i++) {
      if (alpha[i] > 0 && owner[i] >= 0 && owner[i] !== remainderIdx) {
        label[i] = owner[i];
        queue.push(i);
      }
    }
    while (queue.length) {
      const next = [];
      for (const i of queue) {
        const x = i % W;
        const neighbours = [];
        if (x > 0) neighbours.push(i - 1);
        if (x < W - 1) neighbours.push(i + 1);
        if (i >= W) neighbours.push(i - W);
        if (i < W * (H - 1)) neighbours.push(i + W);
        for (const n of neighbours) {
          if (label[n] === -1) {
            label[n] = label[i];
            next.push(n);
          }
        }
      }
      queue = next;
    }
    let healed = 0;
    for (let i = 0; i < W * H; i++) {
      if (suspect[i] && label[i] >= 0) {
        owner[i] = label[i];
        healed++;
      }
    }
    window.__healedPixels = healed;
  }

  /** Multi-source BFS distance (4-neighbour, good enough for dilation radii). */
  function bfsDistance(seedMask) {
    const INF = 0xffff;
    const distArr = new Uint16Array(W * H).fill(INF);
    let queue = [];
    for (let i = 0; i < W * H; i++) {
      if (seedMask[i]) {
        distArr[i] = 0;
        queue.push(i);
      }
    }
    while (queue.length) {
      const next = [];
      for (const i of queue) {
        const dNext = distArr[i] + 1;
        const x = i % W;
        const neighbours = [];
        if (x > 0) neighbours.push(i - 1);
        if (x < W - 1) neighbours.push(i + 1);
        if (i >= W) neighbours.push(i - W);
        if (i < W * (H - 1)) neighbours.push(i + W);
        for (const n of neighbours) {
          if (distArr[n] > dNext) {
            distArr[n] = dNext;
            next.push(n);
          }
        }
      }
      queue = next;
    }
    return distArr;
  }

  /**
   * Hidden overlap for layer L: pixels within `radius` of L's visible region,
   * owned by a layer ABOVE L in draw order, and safely interior to the
   * silhouette (so reassembled alpha stays exact).
   */
  function computeOverlap(owner, alpha, layerIdx, radius, interiorDist, ownDist, exclude, excludeOwners) {
    const overlap = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (exclude && exclude[i] === 1) continue;
      if (excludeOwners && excludeOwners.has(owner[i])) continue;
      if (owner[i] > layerIdx && ownDist[i] > 0 && ownDist[i] <= radius && interiorDist[i] >= 2) {
        overlap[i] = 1;
      }
    }
    return overlap;
  }

  // --- deterministic pattern fields --------------------------------------

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Value noise with bilinear interpolation over a seeded lattice. */
  function valueNoise(seed, cell) {
    const gw = Math.ceil(W / cell) + 2;
    const gh = Math.ceil(H / cell) + 2;
    const rand = mulberry32(seed);
    const lattice = new Float32Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) lattice[i] = rand();
    const s = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const gx = x / cell;
      const gy = y / cell;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = s(gx - x0);
      const fy = s(gy - y0);
      const v = (xx, yy) => lattice[yy * gw + xx];
      return (
        v(x0, y0) * (1 - fx) * (1 - fy) +
        v(x0 + 1, y0) * fx * (1 - fy) +
        v(x0, y0 + 1) * (1 - fx) * fy +
        v(x0 + 1, y0 + 1) * fx * fy
      );
    };
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (a, b, v) => {
    const t = clamp01((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  /** Stage-aligned pattern fields, shared by every layer (trex convention). */
  function patternFields(seed, groundY) {
    const n1 = valueNoise(seed + 1, 96);
    const n2 = valueNoise(seed + 2, 41);
    const n3 = valueNoise(seed + 3, 173);
    const bandWobble = valueNoise(seed + 4, 120);
    const solidAt = (x, y) => 1 - 0.3 * smooth(groundY - 240, groundY - 40, y);
    const mottleAt = (x, y) => {
      const n = 0.62 * n1(x, y) + 0.28 * n2(x, y) + 0.1 * n3(x, y);
      return clamp01((n - 0.42) / 0.34) * solidAt(x, y);
    };
    const bandsAt = (x, y) => {
      const axis = (x + (y - 400) * 0.22) / 74 + (bandWobble(x, y) - 0.5) * 2.6;
      const wave = 0.5 + 0.5 * Math.sin(axis * Math.PI);
      return smooth(0.42, 0.8, wave) * (0.55 + 0.45 * n3(x + 311, y)) * solidAt(x, y);
    };
    return { solidAt, mottleAt, bandsAt };
  }

  return {
    W,
    H,
    imageToData,
    newCanvas,
    computeAlpha,
    pointInPolygon,
    computeOwnership,
    bfsDistance,
    computeOverlap,
    patternFields,
  };
})();
