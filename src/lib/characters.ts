/**
 * ASCII Character Shape Vectors
 * 
 * Each character has a 6D shape vector representing its visual density
 * in 6 sampling regions (staggered 2x3 grid):
 * 
 *   [0]   [1]    (top row, left slightly lower)
 *   [2]   [3]    (middle row)
 *   [4]   [5]    (bottom row, left slightly higher)
 * 
 * Values are normalized 0-1 representing relative density.
 */

export interface CharacterData {
  char: string;
  vector: number[];
}

// Printable ASCII characters (32-126) with pre-computed shape vectors
// These are approximations based on typical monospace font rendering
export const CHARACTERS: CharacterData[] = [
  // Space and punctuation
  { char: ' ', vector: [0, 0, 0, 0, 0, 0] },
  { char: '.', vector: [0, 0, 0, 0, 0.3, 0] },
  { char: ',', vector: [0, 0, 0, 0, 0.3, 0.2] },
  { char: ':', vector: [0, 0, 0.3, 0, 0.3, 0] },
  { char: ';', vector: [0, 0, 0.3, 0, 0.4, 0.2] },
  { char: '!', vector: [0.4, 0, 0.3, 0, 0.3, 0] },
  { char: '?', vector: [0.5, 0.5, 0.2, 0.4, 0.3, 0] },
  { char: "'", vector: [0.3, 0, 0, 0, 0, 0] },
  { char: '"', vector: [0.3, 0.3, 0, 0, 0, 0] },
  { char: '`', vector: [0.3, 0, 0, 0, 0, 0] },
  { char: '-', vector: [0, 0, 0.5, 0.5, 0, 0] },
  { char: '_', vector: [0, 0, 0, 0, 0.6, 0.6] },
  { char: '=', vector: [0, 0, 0.5, 0.5, 0.5, 0.5] },
  { char: '+', vector: [0.2, 0.2, 0.5, 0.5, 0.2, 0.2] },
  { char: '*', vector: [0.4, 0.4, 0.5, 0.5, 0.2, 0.2] },
  { char: '/', vector: [0, 0.4, 0.3, 0.3, 0.4, 0] },
  { char: '\\', vector: [0.4, 0, 0.3, 0.3, 0, 0.4] },
  { char: '|', vector: [0.3, 0, 0.3, 0, 0.3, 0] },
  { char: '(', vector: [0.2, 0.4, 0.3, 0.3, 0.2, 0.4] },
  { char: ')', vector: [0.4, 0.2, 0.3, 0.3, 0.4, 0.2] },
  { char: '[', vector: [0.5, 0.4, 0.4, 0, 0.5, 0.4] },
  { char: ']', vector: [0.4, 0.5, 0, 0.4, 0.4, 0.5] },
  { char: '{', vector: [0.2, 0.4, 0.4, 0.2, 0.2, 0.4] },
  { char: '}', vector: [0.4, 0.2, 0.2, 0.4, 0.4, 0.2] },
  { char: '<', vector: [0, 0.3, 0.4, 0.2, 0, 0.3] },
  { char: '>', vector: [0.3, 0, 0.2, 0.4, 0.3, 0] },
  { char: '^', vector: [0.3, 0.3, 0.4, 0.4, 0, 0] },
  { char: '~', vector: [0.3, 0.4, 0.4, 0.3, 0, 0] },
  { char: '#', vector: [0.6, 0.6, 0.7, 0.7, 0.6, 0.6] },
  { char: '$', vector: [0.5, 0.6, 0.6, 0.5, 0.6, 0.5] },
  { char: '%', vector: [0.5, 0.3, 0.4, 0.4, 0.3, 0.5] },
  { char: '&', vector: [0.5, 0.4, 0.5, 0.5, 0.6, 0.5] },
  { char: '@', vector: [0.6, 0.7, 0.7, 0.6, 0.6, 0.7] },
  
  // Numbers
  { char: '0', vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { char: '1', vector: [0.3, 0.3, 0.2, 0.3, 0.3, 0.4] },
  { char: '2', vector: [0.5, 0.5, 0.3, 0.5, 0.5, 0.5] },
  { char: '3', vector: [0.5, 0.5, 0.3, 0.5, 0.5, 0.5] },
  { char: '4', vector: [0.4, 0.5, 0.5, 0.5, 0.2, 0.4] },
  { char: '5', vector: [0.5, 0.5, 0.5, 0.3, 0.5, 0.5] },
  { char: '6', vector: [0.4, 0.5, 0.5, 0.4, 0.5, 0.5] },
  { char: '7', vector: [0.5, 0.5, 0.2, 0.4, 0.2, 0.4] },
  { char: '8', vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { char: '9', vector: [0.5, 0.5, 0.4, 0.5, 0.5, 0.4] },
  
  // Uppercase letters
  { char: 'A', vector: [0.4, 0.4, 0.6, 0.6, 0.5, 0.5] },
  { char: 'B', vector: [0.6, 0.5, 0.6, 0.5, 0.6, 0.5] },
  { char: 'C', vector: [0.5, 0.5, 0.5, 0.2, 0.5, 0.5] },
  { char: 'D', vector: [0.6, 0.5, 0.5, 0.5, 0.6, 0.5] },
  { char: 'E', vector: [0.6, 0.5, 0.6, 0.3, 0.6, 0.5] },
  { char: 'F', vector: [0.6, 0.5, 0.6, 0.3, 0.5, 0.2] },
  { char: 'G', vector: [0.5, 0.5, 0.5, 0.4, 0.5, 0.5] },
  { char: 'H', vector: [0.5, 0.5, 0.6, 0.6, 0.5, 0.5] },
  { char: 'I', vector: [0.5, 0.5, 0.3, 0.3, 0.5, 0.5] },
  { char: 'J', vector: [0.3, 0.5, 0.2, 0.4, 0.5, 0.4] },
  { char: 'K', vector: [0.5, 0.5, 0.6, 0.4, 0.5, 0.5] },
  { char: 'L', vector: [0.5, 0.2, 0.5, 0.2, 0.6, 0.5] },
  { char: 'M', vector: [0.6, 0.6, 0.6, 0.6, 0.5, 0.5] },
  { char: 'N', vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { char: 'O', vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { char: 'P', vector: [0.6, 0.5, 0.6, 0.5, 0.5, 0.2] },
  { char: 'Q', vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.6] },
  { char: 'R', vector: [0.6, 0.5, 0.6, 0.5, 0.5, 0.5] },
  { char: 'S', vector: [0.5, 0.5, 0.5, 0.4, 0.4, 0.5] },
  { char: 'T', vector: [0.6, 0.6, 0.3, 0.3, 0.3, 0.3] },
  { char: 'U', vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { char: 'V', vector: [0.5, 0.5, 0.5, 0.5, 0.4, 0.4] },
  { char: 'W', vector: [0.5, 0.5, 0.6, 0.6, 0.6, 0.6] },
  { char: 'X', vector: [0.5, 0.5, 0.4, 0.4, 0.5, 0.5] },
  { char: 'Y', vector: [0.5, 0.5, 0.4, 0.4, 0.3, 0.3] },
  { char: 'Z', vector: [0.5, 0.5, 0.4, 0.4, 0.5, 0.5] },
  
  // Lowercase letters
  { char: 'a', vector: [0.2, 0.3, 0.4, 0.5, 0.5, 0.5] },
  { char: 'b', vector: [0.5, 0.2, 0.5, 0.4, 0.5, 0.4] },
  { char: 'c', vector: [0.2, 0.3, 0.4, 0.2, 0.4, 0.3] },
  { char: 'd', vector: [0.2, 0.5, 0.4, 0.5, 0.4, 0.5] },
  { char: 'e', vector: [0.2, 0.3, 0.5, 0.4, 0.4, 0.3] },
  { char: 'f', vector: [0.3, 0.4, 0.5, 0.3, 0.4, 0.2] },
  { char: 'g', vector: [0.2, 0.3, 0.4, 0.5, 0.4, 0.5] },
  { char: 'h', vector: [0.5, 0.2, 0.5, 0.4, 0.4, 0.4] },
  { char: 'i', vector: [0.3, 0, 0.3, 0, 0.3, 0.2] },
  { char: 'j', vector: [0, 0.3, 0, 0.3, 0.3, 0.3] },
  { char: 'k', vector: [0.5, 0.2, 0.5, 0.4, 0.4, 0.4] },
  { char: 'l', vector: [0.4, 0.2, 0.4, 0.2, 0.3, 0.3] },
  { char: 'm', vector: [0.2, 0.2, 0.6, 0.6, 0.5, 0.5] },
  { char: 'n', vector: [0.2, 0.2, 0.5, 0.4, 0.4, 0.4] },
  { char: 'o', vector: [0.2, 0.2, 0.4, 0.4, 0.4, 0.4] },
  { char: 'p', vector: [0.2, 0.2, 0.5, 0.4, 0.5, 0.2] },
  { char: 'q', vector: [0.2, 0.2, 0.4, 0.5, 0.2, 0.5] },
  { char: 'r', vector: [0.2, 0.2, 0.5, 0.3, 0.4, 0.2] },
  { char: 's', vector: [0.2, 0.3, 0.4, 0.3, 0.3, 0.4] },
  { char: 't', vector: [0.4, 0.3, 0.5, 0.3, 0.3, 0.4] },
  { char: 'u', vector: [0.2, 0.2, 0.4, 0.4, 0.4, 0.5] },
  { char: 'v', vector: [0.2, 0.2, 0.4, 0.4, 0.3, 0.3] },
  { char: 'w', vector: [0.2, 0.2, 0.5, 0.5, 0.5, 0.5] },
  { char: 'x', vector: [0.2, 0.2, 0.3, 0.3, 0.4, 0.4] },
  { char: 'y', vector: [0.2, 0.2, 0.4, 0.4, 0.3, 0.5] },
  { char: 'z', vector: [0.2, 0.3, 0.3, 0.4, 0.4, 0.3] },
];

/**
 * Normalize character vectors so components span 0-1 range
 */
export function normalizeCharacterVectors(characters: CharacterData[]): CharacterData[] {
  // Find max value for each component
  const maxValues = [0, 0, 0, 0, 0, 0];
  for (const { vector } of characters) {
    for (let i = 0; i < 6; i++) {
      if (vector[i] > maxValues[i]) {
        maxValues[i] = vector[i];
      }
    }
  }
  
  // Normalize each vector
  return characters.map(({ char, vector }) => ({
    char,
    vector: vector.map((v, i) => (maxValues[i] > 0 ? v / maxValues[i] : 0)),
  }));
}

// Pre-normalized characters for lookup
export const NORMALIZED_CHARACTERS = normalizeCharacterVectors(CHARACTERS);
