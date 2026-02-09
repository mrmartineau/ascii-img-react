/**
 * Shared Types for ASCII Rendering Components
 *
 * Common interfaces used by both AsciiImage and AsciiVideo components.
 */

import type { RippleConfig, RainConfig } from './ripple';

/**
 * Shared visual and interaction props for ASCII rendering components
 */
export interface AsciiBaseProps {
  /** Width of the ASCII output in characters */
  width?: number;
  /** Height of the ASCII output in characters */
  height?: number;
  /** Cell width in pixels for sampling (default: 6) */
  cellWidth?: number;
  /** Cell height in pixels for sampling (default: 12) */
  cellHeight?: number;
  /** Global contrast enhancement exponent (default: 1.5) */
  contrast?: number;
  /** Directional contrast enhancement exponent (default: 2) */
  directionalContrast?: number;
  /** Enable directional contrast enhancement (default: true) */
  enableDirectionalContrast?: boolean;
  /** Font size for ASCII characters (default: 10) */
  fontSize?: number;
  /** Line height multiplier (default: 0.8) */
  lineHeight?: number;
  /** Enable ripple animation on click (default: true) */
  enableRipple?: boolean;
  /** Ripple configuration */
  rippleConfig?: Partial<RippleConfig>;
  /** Number of ripples to create per click (default: 1) */
  rippleCount?: number;
  /** Enable rain animation mode (default: false) */
  enableRain?: boolean;
  /** Rain animation configuration */
  rainConfig?: Partial<RainConfig>;
  /** CSS class name for the container */
  className?: string;
  /** Custom styles for the container */
  style?: React.CSSProperties;
  /** Callback when clicked */
  onClick?: (event: React.MouseEvent) => void;
  /** Color of ASCII characters (default: inherit) */
  color?: string;
  /** Background color (default: transparent) */
  backgroundColor?: string;
}

/**
 * Internal representation of ASCII rendering output
 */
export interface AsciiData {
  chars: string[][];
  cols: number;
  rows: number;
}
