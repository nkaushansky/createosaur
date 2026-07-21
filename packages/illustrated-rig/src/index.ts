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
export {
  ALLOSAURUS_RIG_DEF,
  RIG_STAGE,
  SPECIES_RIG_DEFS,
  TREX_RIG_DEF,
  meshIndices,
  restMeshPositions,
  type PivotId,
  type RigDeformDef,
  type SpeciesId,
  type SpeciesRigDef,
} from './species-defs';
export {
  DEFAULT_PATTERN_COLOR,
  DEFAULT_RIG_PARAMS,
  MOTION_RANGES,
  PATTERN_TYPES,
  PRESET_NAMES,
  clampRigParams,
  rigPresets,
  type PresetName,
} from './params';
export { idleMotion, idlePhases, type IdlePhases } from './idle';
export { effectiveMotion, evaluateRigPose, posedPivots } from './pose';
export { MASKED_PATTERN_TYPES, hexColorToInt, isMaskedPattern, patternPixel, type MaskedPatternType } from './pattern';
export {
  ALLOSAURUS_R0_ASSET_SHA256,
  ALLOSAURUS_R0_PACK_PATH,
  TREX_R0_ASSET_SHA256,
  TREX_R0_PACK_PATH,
  runtimeAssetPaths,
} from './integrity';
