/**
 * @createosaur/illustrated-rig — pure deterministic pose math for the IR0
 * authored-illustration rig experiment (D-020). No DOM, no React, no Pixi,
 * no I/O: the browser renderer under apps/web consumes these numbers; this
 * package never touches a canvas.
 */

export * from './types';
export {
  IDENTITY,
  applyMat,
  clamp,
  compose,
  multiply,
  ramp,
  rotateAboutDeg,
  scaleAbout,
  smoothstep01,
  translate,
} from './affine';
export {
  manifestLayer,
  validateRigManifest,
  validateTrexR0Manifest,
  type ManifestValidation,
  type RigManifest,
  type RigManifestLayer,
} from './manifest';
export { LAYER_BOUNDS, MESH_SPECS, PIVOTS, RIG_STAGE, meshIndices, restMeshPositions, type PivotId } from './rig-def';
export {
  DEFAULT_PATTERN_COLOR,
  DEFAULT_RIG_PARAMS,
  MOTION_RANGES,
  PATTERN_TYPES,
  PRESET_NAMES,
  RIG_PRESETS,
  clampRigParams,
  type PresetName,
} from './params';
export { idleMotion, idlePhases, type IdlePhases } from './idle';
export { effectiveMotion, evaluateRigPose, posedPivots } from './pose';
export { MASKED_PATTERN_TYPES, hexColorToInt, isMaskedPattern, patternPixel, type MaskedPatternType } from './pattern';
export { TREX_R0_ASSET_SHA256, TREX_R0_PACK_PATH, runtimeAssetPaths } from './integrity';
