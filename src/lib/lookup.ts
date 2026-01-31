/**
 * Character Lookup
 * 
 * Find the best matching ASCII character for a given sampling vector
 * using Euclidean distance in 6D space.
 */

import { NORMALIZED_CHARACTERS, type CharacterData } from './characters';

/**
 * Calculate squared Euclidean distance between two vectors
 * (Skip sqrt for performance since we only need relative comparison)
 */
function squaredDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * Find the best matching character for a sampling vector
 * Uses brute-force nearest neighbor search
 */
export function findBestCharacter(
  samplingVector: number[],
  characters: CharacterData[] = NORMALIZED_CHARACTERS
): string {
  let bestChar = ' ';
  let bestDistance = Infinity;
  
  for (const { char, vector } of characters) {
    const dist = squaredDistance(samplingVector, vector);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestChar = char;
    }
  }
  
  return bestChar;
}

/**
 * Quantize a 6D vector to a cache key (30 bits total, 5 bits per component)
 */
const BITS = 5;
const RANGE = 2 ** BITS;

function generateCacheKey(vector: number[]): number {
  let key = 0;
  for (let i = 0; i < vector.length; i++) {
    const quantized = Math.min(RANGE - 1, Math.floor(Math.max(0, vector[i]) * RANGE));
    key = (key << BITS) | quantized;
  }
  return key;
}

/**
 * Cached character lookup for improved performance
 */
export class CachedCharacterLookup {
  private cache = new Map<number, string>();
  private characters: CharacterData[];
  
  constructor(characters: CharacterData[] = NORMALIZED_CHARACTERS) {
    this.characters = characters;
  }
  
  findBest(samplingVector: number[]): string {
    const key = generateCacheKey(samplingVector);
    
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = findBestCharacter(samplingVector, this.characters);
    this.cache.set(key, result);
    return result;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// Default cached lookup instance
export const cachedLookup = new CachedCharacterLookup();
