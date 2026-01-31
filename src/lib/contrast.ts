/**
 * Contrast Enhancement for ASCII Rendering
 * 
 * Implements global and directional contrast enhancement to make
 * edges between different colored regions appear sharper.
 */

/**
 * Mapping from internal sampling circle index to affecting external circle indices
 * Used for directional contrast enhancement
 */
const AFFECTING_EXTERNAL_INDICES = [
  [0, 1, 2, 8],     // top-left affected by: above-TL, above-TR, left-ML, above-center
  [0, 1, 3, 8],     // top-right affected by: above-TL, above-TR, right-MR, above-center
  [2, 4, 0, 6],     // middle-left affected by: left-ML, left-BL, above-TL, below-BL
  [3, 5, 1, 7],     // middle-right affected by: right-MR, right-BR, above-TR, below-BR
  [4, 6, 9, 2],     // bottom-left affected by: left-BL, below-BL, below-center, left-ML
  [5, 7, 9, 3],     // bottom-right affected by: right-BR, below-BR, below-center, right-MR
];

/**
 * Apply global contrast enhancement to a sampling vector
 * 
 * Normalizes the vector to 0-1 range, applies exponent, then denormalizes.
 * This makes differences between light and dark regions more pronounced.
 */
export function applyGlobalContrast(
  vector: number[],
  exponent: number
): number[] {
  if (exponent <= 1) {
    return [...vector];
  }
  
  const maxValue = Math.max(...vector);
  if (maxValue <= 0) {
    return [...vector];
  }
  
  return vector.map(value => {
    const normalized = value / maxValue;
    const enhanced = Math.pow(normalized, exponent);
    return enhanced * maxValue;
  });
}

/**
 * Apply directional contrast enhancement using external sampling
 * 
 * Uses external sampling values to enhance contrast in specific directions,
 * making edges sharper by "spreading" the contrast enhancement.
 */
export function applyDirectionalContrast(
  internalVector: number[],
  externalVector: number[],
  exponent: number
): number[] {
  if (exponent <= 1) {
    return [...internalVector];
  }
  
  return internalVector.map((value, i) => {
    // Find max value from affecting external circles
    let maxValue = value;
    for (const extIdx of AFFECTING_EXTERNAL_INDICES[i]) {
      if (externalVector[extIdx] > maxValue) {
        maxValue = externalVector[extIdx];
      }
    }
    
    if (maxValue <= 0) {
      return value;
    }
    
    // Apply contrast enhancement
    const normalized = value / maxValue;
    const enhanced = Math.pow(normalized, exponent);
    return enhanced * maxValue;
  });
}

/**
 * Apply both global and directional contrast enhancement
 */
export function applyFullContrast(
  internalVector: number[],
  externalVector: number[] | null,
  globalExponent: number,
  directionalExponent: number
): number[] {
  let result = [...internalVector];
  
  // Apply directional first (if we have external samples)
  if (externalVector && directionalExponent > 1) {
    result = applyDirectionalContrast(result, externalVector, directionalExponent);
  }
  
  // Then apply global contrast
  if (globalExponent > 1) {
    result = applyGlobalContrast(result, globalExponent);
  }
  
  return result;
}
