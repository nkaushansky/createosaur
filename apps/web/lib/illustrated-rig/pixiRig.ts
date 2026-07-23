import {
  Application,
  Container,
  Graphics,
  Matrix,
  Mesh,
  MeshGeometry,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import {
  RIG_STAGE,
  hexColorToInt,
  isMaskedPattern,
  meshIndices,
  type IllustratedRigParams,
  type LayerPose,
  type MaskedPatternType,
  type MotionParams,
} from '@createosaur/illustrated-rig';
import type { LoadedRigAssets, LoadedRigLayer } from './rigAssets';

/**
 * The Pixi v8 scene for the illustrated rig. This module owns every browser/
 * GPU concern; all pose math comes ready-made from @createosaur/illustrated-rig
 * so a frame here is just "apply numbers, render". It is rig-kind agnostic: a
 * single-species cut and a hybrid mix (and any future rig kind) all plug in the
 * same way — an evaluate() that returns per-layer poses, and layers that carry
 * their own precomputed mesh rest (so no species def is needed here).
 *
 * Scene shape (back to front): approved-master underlay → hidden-overlap map
 * (a hole detector: it glows through any seam the rig opens) → the layer groups
 * in pack draw order → mesh/pivot debug overlay.
 *
 * Pattern overlays live INSIDE their layer's group (sprite for rigid layers,
 * a geometry-sharing second mesh for deformed ones), so masks always move
 * with their anatomical layer — never in screen space. Multiply blending
 * preserves the artwork's luminosity and texture; switching pattern type is
 * a texture swap, never a rebuild.
 */

export interface RigDebugFlags {
  masterUnderlay: boolean;
  overlapMap: boolean;
  meshPivots: boolean;
}

export interface RigInputs {
  params: IllustratedRigParams;
  debug: RigDebugFlags;
  /** When set, the clock is pinned to this value and the loop stops. */
  freezeTimeMs: number | null;
}

export interface RigMetrics {
  assetBytes: number;
  avgFrameMs: number;
  frameSamples: number;
}

/** The shape every rig-kind's evaluator returns — a pose over string layer ids. */
export interface RigPose {
  effective: MotionParams;
  layers: Record<string, LayerPose>;
}

export interface RigHandle {
  setInputs(inputs: RigInputs): void;
  /** Serialized current pose (transforms + vertices) for tests and debugging. */
  frameState(): string;
  /** Last evaluated motion values — lets the UI freeze exactly where idle was. */
  effectiveMotion(): { headAngle: number; jawAngle: number; breath: number; stride: number; tailSway: number };
  currentTimeMs(): number;
  /** Debug: toggle one anatomical layer (seam attribution during review). */
  setLayerVisible(id: string, visible: boolean): void;
  extractPng(): Promise<string>;
  metrics(): RigMetrics;
  destroy(): void;
}

interface LayerNode {
  id: string;
  group: Container;
  pattern: Sprite | Mesh;
  maskTextures: Record<MaskedPatternType, Texture>;
  layerGeometry?: MeshGeometry;
  patternGeometry?: MeshGeometry;
}

const CANVAS_W = RIG_STAGE.width;
const CANVAS_H = RIG_STAGE.height;

const MESH_DEBUG_COLORS = [0x1e88e5, 0x43a047, 0xfb8c00, 0x8e24aa, 0x00acc1, 0xd81b60];

function buildMeshLayer(layer: LoadedRigLayer, texture: Texture): {
  mesh: Mesh;
  layerGeometry: MeshGeometry;
  patternGeometry: MeshGeometry;
} {
  const rest = layer.mesh!.rest;
  const spec = layer.mesh!.spec;
  const b = layer.spec.bounds;

  const positions = new Float32Array(rest);
  const layerUvs = new Float32Array(rest.length);
  const patternUvs = new Float32Array(rest.length);
  for (let i = 0; i < rest.length; i += 2) {
    layerUvs[i] = rest[i]! / CANVAS_W;
    layerUvs[i + 1] = rest[i + 1]! / CANVAS_H;
    patternUvs[i] = (rest[i]! - b.x) / b.width;
    patternUvs[i + 1] = (rest[i + 1]! - b.y) / b.height;
  }
  const indices = new Uint32Array(meshIndices(spec));

  const layerGeometry = new MeshGeometry({ positions: new Float32Array(positions), uvs: layerUvs, indices });
  const patternGeometry = new MeshGeometry({
    positions: new Float32Array(positions),
    uvs: patternUvs,
    indices: new Uint32Array(indices),
  });
  const mesh = new Mesh({ geometry: layerGeometry, texture });
  return { mesh, layerGeometry, patternGeometry };
}

function writeMeshPositions(geometry: MeshGeometry, positions: number[]): void {
  const buffer = geometry.getBuffer('aPosition');
  const data = buffer.data as Float32Array;
  for (let i = 0; i < positions.length; i++) data[i] = positions[i]!;
  buffer.update();
}

export interface PixiRigOptions {
  /** Idle seed and stage identity for this rig. */
  seed: number;
  /** Accessible name for the canvas. */
  ariaLabel: string;
  /** Pivot ids to label in the debug overlay. */
  pivotNames: string[];
  initialInputs: RigInputs;
  /** Pose supplier — the single-species or hybrid evaluator plugs in here. */
  evaluate: (params: IllustratedRigParams, options: { seed: number; timeMs: number }) => RigPose;
  /** Debug-overlay pivot supplier matching `evaluate`. */
  resolvePivots: (pose: RigPose) => Record<string, { x: number; y: number }>;
}

export async function createPixiRig(
  host: HTMLElement,
  assets: LoadedRigAssets,
  options: PixiRigOptions
): Promise<RigHandle> {
  const { seed, evaluate } = options;
  const resolvePivots = options.resolvePivots;
  const app = new Application();
  await app.init({
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundAlpha: 0,
    antialias: true,
    preference: 'webgl',
    // The 1536-wide logical stage always displays smaller than itself (the
    // layout caps the stage around 840 CSS px), so a 1× backbuffer is already
    // supersampled on every screen. Scaling by devicePixelRatio quadruples
    // fill cost for no visible gain — and collapses under software GL.
    resolution: 1,
    autoDensity: true,
    autoStart: false,
    sharedTicker: false,
  });
  app.canvas.style.width = '100%';
  app.canvas.style.height = 'auto';
  app.canvas.style.display = 'block';
  app.canvas.setAttribute('role', 'img');
  app.canvas.setAttribute('aria-label', options.ariaLabel);
  host.appendChild(app.canvas);

  // --- static scene ---------------------------------------------------------
  const masterUnderlay = new Sprite(Texture.from(assets.master));
  masterUnderlay.alpha = 0.45;
  masterUnderlay.visible = false;
  app.stage.addChild(masterUnderlay);

  const overlapMap = new Sprite(Texture.from(assets.overlapMap));
  overlapMap.alpha = 0.9;
  overlapMap.visible = false;
  app.stage.addChild(overlapMap);

  const nodes: LayerNode[] = [];
  for (const layer of assets.layers) {
    const group = new Container();
    const texture = Texture.from(layer.bitmap);

    const maskTextures = {
      solid: Texture.from(layer.masks.solid.canvas),
      mottle: Texture.from(layer.masks.mottle.canvas),
      bands: Texture.from(layer.masks.bands.canvas),
    } satisfies Record<MaskedPatternType, Texture>;

    let pattern: Sprite | Mesh;
    let layerGeometry: MeshGeometry | undefined;
    let patternGeometry: MeshGeometry | undefined;

    if (layer.mesh) {
      // Geometry and pattern UVs live in the SOURCE pack's space — a donor
      // layer's positions land in base space via the evaluated pose alone.
      const built = buildMeshLayer(layer, texture);
      layerGeometry = built.layerGeometry;
      patternGeometry = built.patternGeometry;
      group.addChild(built.mesh);
      pattern = new Mesh({ geometry: patternGeometry, texture: maskTextures.solid });
    } else {
      group.addChild(new Sprite(texture));
      pattern = new Sprite(maskTextures.solid);
      pattern.position.set(layer.masks.solid.offsetX, layer.masks.solid.offsetY);
    }
    pattern.blendMode = 'multiply';
    pattern.visible = false;
    group.addChild(pattern);

    app.stage.addChild(group);
    nodes.push({ id: layer.id, group, pattern, maskTextures, layerGeometry, patternGeometry });
  }

  const debugLayer = new Container();
  const wireframe = new Graphics();
  debugLayer.addChild(wireframe);
  const pivotLabels = new Map<string, Text>();
  for (const name of options.pivotNames) {
    const label = new Text({
      text: name,
      style: { fontSize: 13, fill: 0xc2185b, fontFamily: 'ui-monospace, monospace' },
    });
    pivotLabels.set(name, label);
    debugLayer.addChild(label);
  }
  debugLayer.visible = false;
  app.stage.addChild(debugLayer);

  // --- frame application ----------------------------------------------------
  let inputs: RigInputs = options.initialInputs;
  let lastPose: RigPose | null = null;
  let lastTimeMs = 0;
  let destroyed = false;
  let rafId: number | null = null;
  const frameDurations: number[] = [];
  const clockStart = performance.now();

  const scratchMatrix = new Matrix();

  function drawDebug(pose: RigPose): void {
    wireframe.clear();
    // Mesh wireframes, one accent color per deformed layer (by draw order).
    let colorIndex = 0;
    for (const layerPose of Object.values(pose.layers)) {
      if (layerPose.kind !== 'mesh') continue;
      const color = MESH_DEBUG_COLORS[colorIndex % MESH_DEBUG_COLORS.length]!;
      colorIndex += 1;
      const { columns, rows } = layerPose.grid;
      const p = layerPose.positions;
      const stride = columns + 1;
      for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= columns; i++) {
          const v = 2 * (j * stride + i);
          if (i < columns) {
            wireframe.moveTo(p[v]!, p[v + 1]!).lineTo(p[v + 2]!, p[v + 3]!);
          }
          if (j < rows) {
            const w = 2 * ((j + 1) * stride + i);
            wireframe.moveTo(p[v]!, p[v + 1]!).lineTo(p[w]!, p[w + 1]!);
          }
        }
      }
      wireframe.stroke({ width: 1, color, alpha: 0.85 });
    }
    // Pivots at their posed positions.
    const pivots = resolvePivots(pose);
    for (const [name, point] of Object.entries(pivots)) {
      wireframe.moveTo(point.x - 7, point.y).lineTo(point.x + 7, point.y);
      wireframe.moveTo(point.x, point.y - 7).lineTo(point.x, point.y + 7);
      const label = pivotLabels.get(name);
      if (label) label.position.set(point.x + 9, point.y - 8);
    }
    wireframe.stroke({ width: 2, color: 0xc2185b, alpha: 0.9 });
  }

  function applyPose(pose: RigPose): void {
    for (const node of nodes) {
      const layerPose = pose.layers[node.id];
      if (!layerPose) continue;
      if (layerPose.kind === 'transform') {
        const [a, b, c, d, tx, ty] = layerPose.matrix;
        scratchMatrix.set(a, b, c, d, tx, ty);
        node.group.setFromMatrix(scratchMatrix);
      } else if (node.layerGeometry && node.patternGeometry) {
        writeMeshPositions(node.layerGeometry, layerPose.positions);
        writeMeshPositions(node.patternGeometry, layerPose.positions);
      }
    }
    if (debugLayer.visible) drawDebug(pose);
  }

  function applyPattern(params: IllustratedRigParams): void {
    const type = params.pattern;
    for (const node of nodes) {
      if (!isMaskedPattern(type)) {
        node.pattern.visible = false;
        continue;
      }
      node.pattern.visible = true;
      node.pattern.texture = node.maskTextures[type];
      node.pattern.tint = hexColorToInt(params.patternColor);
      node.pattern.alpha = params.patternIntensity;
    }
  }

  function renderFrame(): void {
    if (destroyed) return;
    const started = performance.now();
    const timeMs = inputs.freezeTimeMs ?? performance.now() - clockStart;
    lastTimeMs = timeMs;
    const pose = evaluate(inputs.params, { seed, timeMs });
    lastPose = pose;
    applyPose(pose);
    app.render();
    frameDurations.push(performance.now() - started);
    if (frameDurations.length > 240) frameDurations.shift();
  }

  function loopWanted(): boolean {
    return (
      inputs.freezeTimeMs === null && inputs.params.autoIdle && !inputs.params.reducedMotion
    );
  }

  function ensureLoop(): void {
    if (loopWanted() && rafId === null && !destroyed) {
      const step = (): void => {
        rafId = null;
        if (destroyed || !loopWanted()) return;
        renderFrame();
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }
  }

  const handle: RigHandle = {
    setInputs(next: RigInputs): void {
      inputs = next;
      masterUnderlay.visible = next.debug.masterUnderlay;
      overlapMap.visible = next.debug.overlapMap;
      debugLayer.visible = next.debug.meshPivots;
      applyPattern(next.params);
      renderFrame();
      ensureLoop();
    },
    frameState(): string {
      if (!lastPose) return '';
      const layers: Record<string, unknown> = {};
      for (const [id, layerPose] of Object.entries(lastPose.layers)) {
        layers[id] =
          layerPose.kind === 'transform'
            ? layerPose.matrix.map((v) => Number(v.toFixed(4)))
            : layerPose.positions.map((v) => Number(v.toFixed(4)));
      }
      return JSON.stringify({ timeMs: lastTimeMs, effective: lastPose.effective, layers });
    },
    effectiveMotion() {
      return lastPose
        ? { ...lastPose.effective }
        : { headAngle: 0, jawAngle: 0, breath: 0, stride: 0, tailSway: 0 };
    },
    currentTimeMs(): number {
      return lastTimeMs;
    },
    setLayerVisible(id: string, visible: boolean): void {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        node.group.visible = visible;
        app.render();
      }
    },
    async extractPng(): Promise<string> {
      // Explicit frame: without it, extract crops to the pose's content
      // bounds and the image origin drifts with the pose.
      return app.renderer.extract.base64({
        target: app.stage,
        frame: new Rectangle(0, 0, CANVAS_W, CANVAS_H),
      });
    },
    metrics(): RigMetrics {
      const avg =
        frameDurations.length === 0
          ? 0
          : frameDurations.reduce((sum, v) => sum + v, 0) / frameDurations.length;
      return { assetBytes: assets.totalBytes, avgFrameMs: avg, frameSamples: frameDurations.length };
    },
    destroy(): void {
      destroyed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      app.destroy(true, { children: true, texture: true });
    },
  };

  handle.setInputs(options.initialInputs);
  return handle;
}
