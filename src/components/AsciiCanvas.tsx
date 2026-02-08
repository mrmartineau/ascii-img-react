import { useEffect, useRef, useState, useCallback } from 'react';
import { cachedLookup } from '../lib/lookup';
import {
  createRipple,
  createRainDrop,
  applyRippleToVector,
  pruneExpiredRipples,
  hasActiveRipples,
  type Ripple,
  type RippleConfig,
  type RainConfig,
  DEFAULT_RAIN_CONFIG,
} from '../lib/ripple';

export interface AsciiCanvasProps {
  /** Width of the ASCII grid in characters */
  width: number;
  /** Height of the ASCII grid in characters */
  height: number;
  /** Cell width in pixels for coordinate mapping (default: 6) */
  cellWidth?: number;
  /** Cell height in pixels for coordinate mapping (default: 12) */
  cellHeight?: number;
  /** Base 6D vector for undisturbed cells (default: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]) */
  baseVector?: number[];
  /** Font size for ASCII characters (default: 10) */
  fontSize?: number;
  /** Line height multiplier (default: 0.8) */
  lineHeight?: number;
  /** Enable ripple animation on click (default: true) */
  enableRipple?: boolean;
  /** Ripple configuration for click ripples */
  rippleConfig?: Partial<RippleConfig>;
  /** Number of ripples to create per click (default: 1) */
  rippleCount?: number;
  /** Enable rain animation mode (default: false) */
  enableRain?: boolean;
  /** Rain animation configuration */
  rainConfig?: Partial<RainConfig>;
  /** Enable ripples that follow mouse movement (default: true) */
  enableMouseRipple?: boolean;
  /** Ripple configuration for mouse-tracking ripples */
  mouseRippleConfig?: Partial<RippleConfig>;
  /** Minimum ms between mouse ripple spawns (default: 60) */
  mouseThrottleMs?: number;
  /** Maximum number of active ripples to prevent performance issues (default: 80) */
  maxRipples?: number;
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

const DEFAULT_BASE_VECTOR = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

const DEFAULT_MOUSE_RIPPLE_CONFIG: Partial<RippleConfig> = {
  speed: 120,
  amplitude: 0.25,
  decay: 3,
  wavelength: 25,
  duration: 1000,
};

/**
 * A React component that renders an animated ASCII canvas without an image source.
 * Supports click ripples, rain effects, and mouse-tracking ripples.
 */
export function AsciiCanvas({
  width,
  height,
  cellWidth = 6,
  cellHeight = 12,
  baseVector = DEFAULT_BASE_VECTOR,
  fontSize = 10,
  lineHeight = 0.8,
  enableRipple = true,
  rippleConfig,
  rippleCount = 1,
  enableRain = false,
  rainConfig,
  enableMouseRipple = true,
  mouseRippleConfig,
  mouseThrottleMs = 60,
  maxRipples = 80,
  className,
  style,
  onClick,
  color,
  backgroundColor,
}: AsciiCanvasProps) {
  const containerRef = useRef<HTMLPreElement>(null);
  const [asciiString, setAsciiString] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastMouseRippleTimeRef = useRef(0);

  // Pixel dimensions of the virtual grid
  const gridPixelWidth = width * cellWidth;
  const gridPixelHeight = height * cellHeight;

  // Render the ASCII grid from baseVector + ripples
  const renderGrid = useCallback(
    (currentRipples: Ripple[], currentTime: number): string => {
      const rows: string[] = [];

      for (let row = 0; row < height; row++) {
        let rowStr = '';
        for (let col = 0; col < width; col++) {
          let vector = baseVector;

          if (currentRipples.length > 0) {
            const cellCenterX = (col + 0.5) * cellWidth;
            const cellCenterY = (row + 0.5) * cellHeight;
            vector = applyRippleToVector(
              vector,
              cellCenterX,
              cellCenterY,
              currentRipples,
              currentTime,
            );
          }

          rowStr += cachedLookup.findBest(vector);
        }
        rows.push(rowStr);
      }

      return rows.join('\n');
    },
    [width, height, cellWidth, cellHeight, baseVector],
  );

  // Compute the static (no ripple) string
  const staticString = renderGrid([], 0);

  // Animation loop
  useEffect(() => {
    if (ripples.length === 0) {
      return;
    }

    const animate = () => {
      const now = performance.now();
      const activeRipples = pruneExpiredRipples(ripples, now);

      if (activeRipples.length !== ripples.length) {
        setRipples(activeRipples);
      }

      if (hasActiveRipples(activeRipples, now)) {
        setAsciiString(renderGrid(activeRipples, now));
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAsciiString('');
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ripples, renderGrid]);

  // Rain effect
  useEffect(() => {
    if (!enableRain) {
      return;
    }

    const config: RainConfig = { ...DEFAULT_RAIN_CONFIG, ...rainConfig };
    const intervalMs = 1000 / config.intensity;

    const spawnDrop = () => {
      const drop = createRainDrop(
        gridPixelWidth,
        gridPixelHeight,
        rainConfig,
        rippleConfig,
      );
      setRipples((prev) => {
        if (prev.length >= maxRipples) return prev;
        return [...prev, drop];
      });
    };

    spawnDrop();
    const interval = setInterval(spawnDrop, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [enableRain, rainConfig, rippleConfig, gridPixelWidth, gridPixelHeight, maxRipples]);

  // Map a mouse event to virtual grid pixel coordinates
  const toGridCoords = useCallback(
    (event: React.MouseEvent): { x: number; y: number } | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const displayWidth = el.offsetWidth;
      const displayHeight = el.offsetHeight;
      return {
        x: ((event.clientX - rect.left) / displayWidth) * gridPixelWidth,
        y: ((event.clientY - rect.top) / displayHeight) * gridPixelHeight,
      };
    },
    [gridPixelWidth, gridPixelHeight],
  );

  // Click handler
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (enableRipple) {
        const pos = toGridCoords(event);
        if (pos) {
          const newRipples: Ripple[] = [];
          const timeOffset = 200;
          for (let i = 0; i < rippleCount; i++) {
            const ripple = createRipple(pos.x, pos.y, rippleConfig);
            ripple.startTime = ripple.startTime + i * timeOffset;
            newRipples.push(ripple);
          }
          setRipples((prev) => [...prev, ...newRipples]);
        }
      }
      onClick?.(event);
    },
    [enableRipple, rippleConfig, rippleCount, onClick, toGridCoords],
  );

  // Mouse move handler for mouse-tracking ripples
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!enableMouseRipple) return;

      const now = performance.now();
      if (now - lastMouseRippleTimeRef.current < mouseThrottleMs) return;
      lastMouseRippleTimeRef.current = now;

      const pos = toGridCoords(event);
      if (!pos) return;

      const mergedConfig = { ...DEFAULT_MOUSE_RIPPLE_CONFIG, ...mouseRippleConfig };
      const ripple = createRipple(pos.x, pos.y, mergedConfig);

      setRipples((prev) => {
        if (prev.length >= maxRipples) return prev;
        return [...prev, ripple];
      });
    },
    [enableMouseRipple, mouseThrottleMs, mouseRippleConfig, maxRipples, toGridCoords],
  );

  const displayString = ripples.length > 0 && asciiString ? asciiString : staticString;

  const cssVars = {
    '--ascii-font-size': `${fontSize}px`,
    '--ascii-line-height': lineHeight,
    '--ascii-color': color ?? 'inherit',
    '--ascii-background': backgroundColor ?? 'transparent',
  } as React.CSSProperties;

  const containerStyles: React.CSSProperties = {
    fontFamily: 'var(--ascii-font-family, monospace)',
    fontSize: 'var(--ascii-font-size)',
    lineHeight: 'var(--ascii-line-height)',
    whiteSpace: 'pre',
    letterSpacing: '0',
    cursor: enableRipple || enableMouseRipple ? 'pointer' : undefined,
    color: 'var(--ascii-color)',
    backgroundColor: 'var(--ascii-background)',
    overflow: 'hidden',
    ...cssVars,
    ...style,
  };

  return (
    <pre
      ref={containerRef}
      className={className}
      style={containerStyles}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      {displayString}
    </pre>
  );
}

export default AsciiCanvas;
