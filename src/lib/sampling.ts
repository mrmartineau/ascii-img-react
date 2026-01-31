/**
 * Grid Sampling for ASCII Rendering
 * 
 * Extracts 6D sampling vectors from image data using a staggered
 * 2x3 sampling circle layout per grid cell.
 */

export interface GridConfig {
  /** Width of each grid cell in pixels */
  cellWidth: number;
  /** Height of each grid cell in pixels */
  cellHeight: number;
  /** Number of samples per sampling circle (higher = better quality, slower) */
  samplesPerCircle: number;
  /** Radius of each sampling circle as fraction of cell size */
  circleRadius: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellWidth: 6,
  cellHeight: 12,
  samplesPerCircle: 9,
  circleRadius: 0.25,
};

/**
 * 6 sampling circle positions within a cell (staggered grid)
 * Coordinates are fractions of cell width/height
 */
const CIRCLE_POSITIONS = [
  { x: 0.25, y: 0.17 },  // top-left (slightly lower)
  { x: 0.75, y: 0.25 },  // top-right (slightly higher)
  { x: 0.25, y: 0.50 },  // middle-left
  { x: 0.75, y: 0.50 },  // middle-right
  { x: 0.25, y: 0.75 },  // bottom-left (slightly higher)
  { x: 0.75, y: 0.83 },  // bottom-right (slightly lower)
];

/**
 * Convert RGB to relative luminance (lightness 0-1)
 */
export function rgbToLightness(r: number, g: number, b: number): number {
  // Relative luminance formula (ITU-R BT.709)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Sample a single point from image data
 */
export function samplePixel(
  imageData: ImageData,
  x: number,
  y: number
): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  
  if (ix < 0 || ix >= imageData.width || iy < 0 || iy >= imageData.height) {
    return 0;
  }
  
  const idx = (iy * imageData.width + ix) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];
  
  return rgbToLightness(r, g, b);
}

/**
 * Sample a circular region and return average lightness
 */
export function sampleCircle(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number,
  numSamples: number
): number {
  if (numSamples === 1) {
    return samplePixel(imageData, centerX, centerY);
  }
  
  let total = 0;
  let count = 0;
  
  // Sample in a grid pattern within the circle
  const gridSize = Math.ceil(Math.sqrt(numSamples));
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      // Offset from center (-1 to 1)
      const ox = (gx / (gridSize - 1)) * 2 - 1;
      const oy = (gy / (gridSize - 1)) * 2 - 1;
      
      // Check if within circle
      if (ox * ox + oy * oy <= 1) {
        const px = centerX + ox * radius;
        const py = centerY + oy * radius;
        total += samplePixel(imageData, px, py);
        count++;
      }
    }
  }
  
  return count > 0 ? total / count : 0;
}

/**
 * Generate 6D sampling vector for a single grid cell
 */
export function sampleCell(
  imageData: ImageData,
  cellX: number,
  cellY: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): number[] {
  const { cellWidth, cellHeight, samplesPerCircle, circleRadius } = config;
  
  // Absolute position of cell's top-left corner
  const baseX = cellX * cellWidth;
  const baseY = cellY * cellHeight;
  
  // Calculate radius in pixels
  const radiusX = circleRadius * cellWidth;
  const radiusY = circleRadius * cellHeight;
  const avgRadius = (radiusX + radiusY) / 2;
  
  // Sample each of the 6 circles
  const vector: number[] = [];
  for (const pos of CIRCLE_POSITIONS) {
    const cx = baseX + pos.x * cellWidth;
    const cy = baseY + pos.y * cellHeight;
    const lightness = sampleCircle(imageData, cx, cy, avgRadius, samplesPerCircle);
    vector.push(lightness);
  }
  
  return vector;
}

/**
 * Generate all sampling vectors for the entire grid
 */
export function sampleGrid(
  imageData: ImageData,
  config: GridConfig = DEFAULT_GRID_CONFIG
): { vectors: number[][]; cols: number; rows: number } {
  const cols = Math.floor(imageData.width / config.cellWidth);
  const rows = Math.floor(imageData.height / config.cellHeight);
  
  const vectors: number[][] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      vectors.push(sampleCell(imageData, col, row, config));
    }
  }
  
  return { vectors, cols, rows };
}

/**
 * External sampling circle positions for directional contrast enhancement
 * These extend outside the cell boundaries
 */
const EXTERNAL_CIRCLE_POSITIONS = [
  { x: 0.25, y: -0.17 },  // above top-left
  { x: 0.75, y: -0.08 },  // above top-right
  { x: -0.08, y: 0.33 },  // left of middle-left
  { x: 1.08, y: 0.33 },   // right of middle-right
  { x: -0.08, y: 0.67 },  // left of bottom-left
  { x: 1.08, y: 0.67 },   // right of bottom-right
  { x: 0.25, y: 0.92 },   // below bottom-left
  { x: 0.75, y: 1.08 },   // below bottom-right
  { x: 0.50, y: -0.12 },  // above center
  { x: 0.50, y: 1.00 },   // below center
];

/**
 * Sample external circles for directional contrast enhancement
 */
export function sampleExternalCircles(
  imageData: ImageData,
  cellX: number,
  cellY: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): number[] {
  const { cellWidth, cellHeight, samplesPerCircle, circleRadius } = config;
  
  const baseX = cellX * cellWidth;
  const baseY = cellY * cellHeight;
  
  const radiusX = circleRadius * cellWidth;
  const radiusY = circleRadius * cellHeight;
  const avgRadius = (radiusX + radiusY) / 2;
  
  const vector: number[] = [];
  for (const pos of EXTERNAL_CIRCLE_POSITIONS) {
    const cx = baseX + pos.x * cellWidth;
    const cy = baseY + pos.y * cellHeight;
    const lightness = sampleCircle(imageData, cx, cy, avgRadius, samplesPerCircle);
    vector.push(lightness);
  }
  
  return vector;
}
