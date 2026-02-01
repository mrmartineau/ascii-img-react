/**
 * Ripple Animation for ASCII Rendering
 * 
 * Creates water-like ripple effects that modify the sampling vectors,
 * causing different ASCII characters to be selected as waves pass through.
 */

export interface RippleConfig {
  /** Speed of ripple expansion (pixels per second) */
  speed: number;
  /** Initial amplitude of the ripple wave (0-1) */
  amplitude: number;
  /** How quickly the ripple fades out (higher = faster decay) */
  decay: number;
  /** Wavelength in pixels */
  wavelength: number;
  /** Duration of the ripple animation in milliseconds */
  duration: number;
}

export const DEFAULT_RIPPLE_CONFIG: RippleConfig = {
  speed: 150,
  amplitude: 0.4,
  decay: 2,
  wavelength: 40,
  duration: 2000,
};

export interface Ripple {
  /** X position of ripple origin in pixels */
  originX: number;
  /** Y position of ripple origin in pixels */
  originY: number;
  /** Start time of the ripple */
  startTime: number;
  /** Configuration for this ripple */
  config: RippleConfig;
}

export interface RippleState {
  ripples: Ripple[];
}

/**
 * Configuration for rain animation effect
 */
export interface RainConfig {
  /** Number of raindrops per second (default: 3) */
  intensity: number;
  /** Random variation in ripple parameters 0-1 (default: 0.3) */
  variation: number;
  /** Override ripple config for raindrops (optional) */
  dropRippleConfig?: Partial<RippleConfig>;
}

export const DEFAULT_RAIN_CONFIG: RainConfig = {
  intensity: 3,
  variation: 0.3,
};

/**
 * Create a new ripple at the given position
 */
export function createRipple(
  x: number,
  y: number,
  config: Partial<RippleConfig> = {}
): Ripple {
  return {
    originX: x,
    originY: y,
    startTime: performance.now(),
    config: { ...DEFAULT_RIPPLE_CONFIG, ...config },
  };
}

/**
 * Calculate the wave displacement value for a point at a given time
 * Creates a single ring/pulse that expands outward (not multiple sine waves)
 */
export function calculateWaveValue(
  x: number,
  y: number,
  ripple: Ripple,
  currentTime: number
): number {
  const { originX, originY, startTime, config } = ripple;
  const { speed, amplitude, wavelength, duration } = config;
  
  const elapsed = currentTime - startTime;
  
  // Check if ripple hasn't started yet (future start time)
  if (elapsed < 0) {
    return 0;
  }
  
  // Check if ripple has expired
  if (elapsed > duration) {
    return 0;
  }
  
  // Distance from ripple origin
  const dx = x - originX;
  const dy = y - originY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Current radius of the ripple front
  const rippleRadius = (elapsed / 1000) * speed;
  
  // Distance from the ripple front (positive = ahead, negative = behind)
  const distFromFront = distance - rippleRadius;
  
  // Use a Gaussian pulse for a single ring effect
  // wavelength controls the width of the ring
  const ringWidth = wavelength / 2;
  const gaussianPulse = Math.exp(-(distFromFront * distFromFront) / (2 * ringWidth * ringWidth));
  
  // Only show significant values (optimization)
  if (gaussianPulse < 0.01) {
    return 0;
  }
  
  // Time-based fade out
  const timeDecay = 1 - elapsed / duration;
  const timeDecayEased = timeDecay * timeDecay; // Ease out
  
  // Distance-based fade (ripple gets weaker as it expands)
  const distanceDecay = Math.exp(-rippleRadius / (speed * 3));
  
  return gaussianPulse * amplitude * timeDecayEased * distanceDecay;
}

/**
 * Apply ripple effects to a sampling vector
 */
export function applyRippleToVector(
  vector: number[],
  cellCenterX: number,
  cellCenterY: number,
  ripples: Ripple[],
  currentTime: number
): number[] {
  if (ripples.length === 0) {
    return vector;
  }
  
  // Sum wave values from all active ripples
  let totalWave = 0;
  for (const ripple of ripples) {
    totalWave += calculateWaveValue(cellCenterX, cellCenterY, ripple, currentTime);
  }
  
  // Clamp total wave effect
  totalWave = Math.max(-0.5, Math.min(0.5, totalWave));
  
  // Apply wave to vector (modulate lightness values)
  return vector.map(v => {
    const modified = v + totalWave;
    return Math.max(0, Math.min(1, modified));
  });
}

/**
 * Remove expired ripples from the list
 */
export function pruneExpiredRipples(ripples: Ripple[], currentTime: number): Ripple[] {
  return ripples.filter(ripple => {
    const elapsed = currentTime - ripple.startTime;
    return elapsed <= ripple.config.duration;
  });
}

/**
 * Check if there are any active ripples (including ones that haven't started yet)
 */
export function hasActiveRipples(ripples: Ripple[], currentTime: number): boolean {
  return ripples.some(ripple => {
    const elapsed = currentTime - ripple.startTime;
    // Active if not yet started (elapsed < 0) or still running (elapsed <= duration)
    return elapsed <= ripple.config.duration;
  });
}

/**
 * Apply random variation to a number
 */
function applyVariation(value: number, variation: number): number {
  const range = value * variation;
  return value + (Math.random() * 2 - 1) * range;
}

/**
 * Create a raindrop ripple at a random position within the image bounds
 * with optional random variation in ripple parameters for natural effect
 */
export function createRainDrop(
  imageWidth: number,
  imageHeight: number,
  rainConfig: Partial<RainConfig> = {},
  baseRippleConfig: Partial<RippleConfig> = {}
): Ripple {
  const config: RainConfig = { ...DEFAULT_RAIN_CONFIG, ...rainConfig };
  const mergedRippleConfig: RippleConfig = {
    ...DEFAULT_RIPPLE_CONFIG,
    ...baseRippleConfig,
    ...config.dropRippleConfig,
  };

  // Random position within image bounds
  const x = Math.random() * imageWidth;
  const y = Math.random() * imageHeight;

  // Apply variation to ripple parameters for natural effect
  const variation = config.variation;
  const variedConfig: RippleConfig = {
    speed: applyVariation(mergedRippleConfig.speed, variation),
    amplitude: Math.max(0.1, Math.min(1, applyVariation(mergedRippleConfig.amplitude, variation))),
    decay: applyVariation(mergedRippleConfig.decay, variation),
    wavelength: applyVariation(mergedRippleConfig.wavelength, variation),
    duration: applyVariation(mergedRippleConfig.duration, variation),
  };

  return {
    originX: x,
    originY: y,
    startTime: performance.now(),
    config: variedConfig,
  };
}
