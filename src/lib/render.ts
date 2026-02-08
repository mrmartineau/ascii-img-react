/**
 * Shared ASCII Rendering Pipeline
 *
 * Extracts the core rendering logic used by both AsciiImage and AsciiVideo
 * components: sampling → contrast → ripple → character lookup.
 */

import { sampleCell, sampleExternalCircles, type GridConfig } from './sampling';
import { cachedLookup } from './lookup';
import { applyFullContrast } from './contrast';
import { applyRippleToVector, type Ripple } from './ripple';
import type { AsciiData } from './types';

export interface RenderOptions {
  contrast: number;
  directionalContrast: number;
  enableDirectionalContrast: boolean;
}

/**
 * Render a single frame of ASCII art from ImageData.
 *
 * This is the core pipeline shared by AsciiImage (static + ripple) and
 * AsciiVideo (continuous frame capture).
 */
export function renderAsciiFrame(
  data: ImageData,
  gridConfig: GridConfig,
  options: RenderOptions,
  ripples: Ripple[] = [],
  currentTime: number = 0,
): AsciiData {
  const cols = Math.floor(data.width / gridConfig.cellWidth);
  const rows = Math.floor(data.height / gridConfig.cellHeight);

  const chars: string[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowChars: string[] = [];

    for (let col = 0; col < cols; col++) {
      // Sample internal vector
      let vector = sampleCell(data, col, row, gridConfig);

      // Sample external vector for directional contrast
      const externalVector = options.enableDirectionalContrast
        ? sampleExternalCircles(data, col, row, gridConfig)
        : null;

      // Apply contrast enhancement
      vector = applyFullContrast(
        vector,
        externalVector,
        options.contrast,
        options.enableDirectionalContrast ? options.directionalContrast : 1,
      );

      // Apply ripple effect
      if (ripples.length > 0) {
        const cellCenterX = (col + 0.5) * gridConfig.cellWidth;
        const cellCenterY = (row + 0.5) * gridConfig.cellHeight;
        vector = applyRippleToVector(vector, cellCenterX, cellCenterY, ripples, currentTime);
      }

      // Find best matching character
      const char = cachedLookup.findBest(vector);
      rowChars.push(char);
    }

    chars.push(rowChars);
  }

  return { chars, cols, rows };
}
