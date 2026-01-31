// Core ASCII rendering utilities
export { CHARACTERS, NORMALIZED_CHARACTERS, normalizeCharacterVectors, type CharacterData } from './characters';
export { sampleCell, sampleGrid, sampleExternalCircles, rgbToLightness, type GridConfig, DEFAULT_GRID_CONFIG } from './sampling';
export { findBestCharacter, CachedCharacterLookup, cachedLookup } from './lookup';
export { applyGlobalContrast, applyDirectionalContrast, applyFullContrast } from './contrast';
export { 
  createRipple, 
  calculateWaveValue, 
  applyRippleToVector, 
  pruneExpiredRipples, 
  hasActiveRipples,
  DEFAULT_RIPPLE_CONFIG,
  type Ripple, 
  type RippleConfig, 
  type RippleState 
} from './ripple';
