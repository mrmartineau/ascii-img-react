// Core ASCII rendering utilities
export { CHARACTERS, NORMALIZED_CHARACTERS, normalizeCharacterVectors, type CharacterData } from './characters';
export { sampleCell, sampleGrid, sampleExternalCircles, rgbToLightness, type GridConfig, DEFAULT_GRID_CONFIG } from './sampling';
export { findBestCharacter, CachedCharacterLookup, cachedLookup } from './lookup';
export { applyGlobalContrast, applyDirectionalContrast, applyFullContrast } from './contrast';
export {
  createRipple,
  createRainDrop,
  calculateWaveValue,
  applyRippleToVector,
  pruneExpiredRipples,
  hasActiveRipples,
  DEFAULT_RIPPLE_CONFIG,
  DEFAULT_RAIN_CONFIG,
  type Ripple,
  type RippleConfig,
  type RippleState,
  type RainConfig,
} from './ripple';
export { renderAsciiFrame, type RenderOptions } from './render';
export { type AsciiBaseProps, type AsciiData } from './types';
