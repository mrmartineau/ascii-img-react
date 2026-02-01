import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { sampleCell, sampleExternalCircles, type GridConfig, DEFAULT_GRID_CONFIG } from '../lib/sampling';
import { cachedLookup } from '../lib/lookup';
import { applyFullContrast } from '../lib/contrast';
import { createRipple, createRainDrop, applyRippleToVector, pruneExpiredRipples, hasActiveRipples, type Ripple, type RippleConfig, type RainConfig, DEFAULT_RAIN_CONFIG } from '../lib/ripple';

export interface AsciiImageProps {
  /** Image source URL */
  src: string;
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

interface AsciiData {
  chars: string[][];
  cols: number;
  rows: number;
}

/**
 * A React component that converts an image to ASCII art
 */
export function AsciiImage({
  src,
  width,
  height,
  cellWidth = DEFAULT_GRID_CONFIG.cellWidth,
  cellHeight = DEFAULT_GRID_CONFIG.cellHeight,
  contrast = 1.5,
  directionalContrast = 2,
  enableDirectionalContrast = true,
  fontSize = 10,
  lineHeight = 0.8,
  enableRipple = true,
  rippleConfig,
  rippleCount = 1,
  enableRain = false,
  rainConfig,
  className,
  style,
  onClick,
  color,
  backgroundColor,
}: AsciiImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedAsciiData, setAnimatedAsciiData] = useState<AsciiData | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLPreElement>(null);

  const gridConfig: GridConfig = useMemo(() => ({
    cellWidth,
    cellHeight,
    samplesPerCircle: 9,
    circleRadius: 0.25,
  }), [cellWidth, cellHeight]);

  // Load image and extract pixel data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Calculate target dimensions
      let targetWidth: number;
      let targetHeight: number;

      if (width && height) {
        targetWidth = width * cellWidth;
        targetHeight = height * cellHeight;
      } else if (width) {
        targetWidth = width * cellWidth;
        targetHeight = (img.height / img.width) * targetWidth;
      } else if (height) {
        targetHeight = height * cellHeight;
        targetWidth = (img.width / img.height) * targetHeight;
      } else {
        // Default: use image dimensions but scale down if too large
        const maxWidth = 800;
        const maxHeight = 600;
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        targetWidth = img.width * scale;
        targetHeight = img.height * scale;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const data = ctx.getImageData(0, 0, targetWidth, targetHeight);
      setImageData(data);
    };

    img.onerror = () => {
      console.error('Failed to load image:', src);
    };

    img.src = src;
  }, [src, width, height, cellWidth, cellHeight]);

  // Render ASCII from image data
  const renderAscii = useCallback((
    data: ImageData,
    currentRipples: Ripple[],
    currentTime: number
  ): AsciiData => {
    const cols = Math.floor(data.width / gridConfig.cellWidth);
    const rows = Math.floor(data.height / gridConfig.cellHeight);

    const chars: string[][] = [];

    for (let row = 0; row < rows; row++) {
      const rowChars: string[] = [];

      for (let col = 0; col < cols; col++) {
        // Sample internal vector
        let vector = sampleCell(data, col, row, gridConfig);

        // Sample external vector for directional contrast
        const externalVector = enableDirectionalContrast
          ? sampleExternalCircles(data, col, row, gridConfig)
          : null;

        // Apply contrast enhancement
        vector = applyFullContrast(
          vector,
          externalVector,
          contrast,
          enableDirectionalContrast ? directionalContrast : 1
        );

        // Apply ripple effect
        if (currentRipples.length > 0) {
          const cellCenterX = (col + 0.5) * gridConfig.cellWidth;
          const cellCenterY = (row + 0.5) * gridConfig.cellHeight;
          vector = applyRippleToVector(vector, cellCenterX, cellCenterY, currentRipples, currentTime);
        }

        // Find best matching character
        const char = cachedLookup.findBest(vector);
        rowChars.push(char);
      }

      chars.push(rowChars);
    }

    return { chars, cols, rows };
  }, [gridConfig, contrast, directionalContrast, enableDirectionalContrast]);

  // Compute static ASCII data from image (no ripples)
  const staticAsciiData = useMemo(() => {
    if (!imageData) return null;
    // Time param unused when ripples array is empty
    return renderAscii(imageData, [], 0);
  }, [imageData, renderAscii]);

  // Use animated data during ripples, otherwise use static data
  const asciiData = ripples.length > 0 ? animatedAsciiData : staticAsciiData;

  // Animation loop for ripples
  useEffect(() => {
    if (!imageData || ripples.length === 0) {
      return;
    }

    const animate = () => {
      const now = performance.now();
      const activeRipples = pruneExpiredRipples(ripples, now);

      if (activeRipples.length !== ripples.length) {
        setRipples(activeRipples);
      }

      if (hasActiveRipples(activeRipples, now)) {
        const data = renderAscii(imageData, activeRipples, now);
        setAnimatedAsciiData(data);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Clear animated data, will fall back to static
        setAnimatedAsciiData(null);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageData, ripples, renderAscii]);

  // Rain animation - spawn ripples at random intervals
  useEffect(() => {
    if (!enableRain || !imageData) {
      return;
    }

    const config: RainConfig = { ...DEFAULT_RAIN_CONFIG, ...rainConfig };
    const intervalMs = 1000 / config.intensity;

    const spawnDrop = () => {
      const drop = createRainDrop(
        imageData.width,
        imageData.height,
        rainConfig,
        rippleConfig
      );
      setRipples(prev => [...prev, drop]);
    };

    // Spawn first drop immediately
    spawnDrop();

    const interval = setInterval(spawnDrop, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [enableRain, imageData, rainConfig, rippleConfig]);

  // Handle click for ripple effect
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (enableRipple && containerRef.current && imageData) {
      const rect = containerRef.current.getBoundingClientRect();

      // Calculate click position relative to the ASCII grid
      // We need to map from display coordinates to image coordinates
      const displayWidth = containerRef.current.offsetWidth;
      const displayHeight = containerRef.current.offsetHeight;

      const clickX = ((event.clientX - rect.left) / displayWidth) * imageData.width;
      const clickY = ((event.clientY - rect.top) / displayHeight) * imageData.height;

      // Create the specified number of ripples with time offsets for cascading effect
      const newRipples: Ripple[] = [];
      const timeOffset = 200; // ms between each ripple wave

      for (let i = 0; i < rippleCount; i++) {
        const ripple = createRipple(clickX, clickY, rippleConfig);
        // Offset the start time for subsequent ripples to create cascading waves
        ripple.startTime = ripple.startTime + i * timeOffset;
        newRipples.push(ripple);
      }

      // Add new ripples to existing ones (allows overlapping from multiple clicks)
      setRipples(prev => [...prev, ...newRipples]);
    }

    onClick?.(event);
  }, [enableRipple, imageData, rippleConfig, rippleCount, onClick]);

  // Build the ASCII string
  const asciiString = asciiData
    ? asciiData.chars.map(row => row.join('')).join('\n')
    : 'Loading...';

  const cssVars = {
    // '--ascii-font-family': 'monospace',
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
    cursor: enableRipple ? 'pointer' : undefined,
    color: 'var(--ascii-color)',
    backgroundColor: 'var(--ascii-background)',
    overflow: 'hidden',
    ...cssVars,
    ...style,
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <pre
        ref={containerRef}
        className={className}
        style={containerStyles}
        onClick={handleClick}
      >
        {asciiString}
      </pre>
    </>
  );
}

export default AsciiImage;
