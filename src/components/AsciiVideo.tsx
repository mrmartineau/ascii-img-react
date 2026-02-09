import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { type GridConfig, DEFAULT_GRID_CONFIG } from '../lib/sampling';
import {
  createRipple,
  createRainDrop,
  pruneExpiredRipples,
  hasActiveRipples,
  type Ripple,
  type RainConfig,
  DEFAULT_RAIN_CONFIG,
} from '../lib/ripple';
import { renderAsciiFrame } from '../lib/render';
import type { AsciiBaseProps, AsciiData } from '../lib/types';

export interface AsciiVideoProps extends AsciiBaseProps {
  /** Video source URL */
  src: string;
  /** Autoplay the video (default: true). Browsers require muted for autoplay. */
  autoPlay?: boolean;
  /** Loop the video (default: true) */
  loop?: boolean;
  /** Mute the video (default: true). Required for autoplay in most browsers. */
  muted?: boolean;
  /** Target ASCII render frames per second (default: 15) */
  fps?: number;
  /** Callback when video starts playing */
  onPlay?: () => void;
  /** Callback when video is paused */
  onPause?: () => void;
  /** Callback when video playback ends */
  onEnded?: () => void;
  /** Callback on time update with current time and duration */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export interface AsciiVideoHandle {
  /** Start video playback */
  play(): void;
  /** Pause video playback */
  pause(): void;
  /** Seek to a specific time in seconds */
  seek(time: number): void;
  /** Get the underlying video element */
  getVideoElement(): HTMLVideoElement | null;
}

/**
 * A React component that converts video frames to ASCII art in real-time
 */
export const AsciiVideo = forwardRef<AsciiVideoHandle, AsciiVideoProps>(
  function AsciiVideo(
    {
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
      autoPlay = true,
      loop = true,
      muted = true,
      fps = 15,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLPreElement>(null);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);

    const [asciiData, setAsciiData] = useState<AsciiData | null>(null);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Canvas dimensions derived from width/height props and cell size
    const [canvasDims, setCanvasDims] = useState<{
      width: number;
      height: number;
    } | null>(null);

    const gridConfig: GridConfig = useMemo(
      () => ({
        cellWidth,
        cellHeight,
        samplesPerCircle: 9,
        circleRadius: 0.25,
      }),
      [cellWidth, cellHeight],
    );

    const renderOptions = useMemo(
      () => ({
        contrast,
        directionalContrast,
        enableDirectionalContrast,
      }),
      [contrast, directionalContrast, enableDirectionalContrast],
    );

    const frameInterval = 1000 / fps;

    // Expose imperative handle for playback control
    useImperativeHandle(
      ref,
      () => ({
        play() {
          videoRef.current?.play();
        },
        pause() {
          videoRef.current?.pause();
        },
        seek(time: number) {
          if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
        },
        getVideoElement() {
          return videoRef.current;
        },
      }),
      [],
    );

    // Calculate canvas dimensions once video metadata is loaded
    const handleLoadedMetadata = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;

      let targetWidth: number;
      let targetHeight: number;

      if (width && height) {
        targetWidth = width * cellWidth;
        targetHeight = height * cellHeight;
      } else if (width) {
        targetWidth = width * cellWidth;
        targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
      } else if (height) {
        targetHeight = height * cellHeight;
        targetWidth = (video.videoWidth / video.videoHeight) * targetHeight;
      } else {
        const maxWidth = 800;
        const maxHeight = 600;
        const scale = Math.min(
          1,
          maxWidth / video.videoWidth,
          maxHeight / video.videoHeight,
        );
        targetWidth = video.videoWidth * scale;
        targetHeight = video.videoHeight * scale;
      }

      setCanvasDims({ width: targetWidth, height: targetHeight });
      setIsReady(true);
    }, [width, height, cellWidth, cellHeight]);

    // Capture a single video frame to ImageData
    const captureFrame = useCallback((): ImageData | null => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !canvasDims) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = canvasDims.width;
      canvas.height = canvasDims.height;
      ctx.drawImage(video, 0, 0, canvasDims.width, canvasDims.height);
      return ctx.getImageData(0, 0, canvasDims.width, canvasDims.height);
    }, [canvasDims]);

    // Main animation loop: capture frames + apply ripples
    useEffect(() => {
      if (!isReady || !canvasDims) return;

      // We need to run the loop when video is playing OR ripples are active
      const shouldRun = isPlaying || ripples.length > 0;
      if (!shouldRun) return;

      const animate = (timestamp: number) => {
        const now = performance.now();

        // Determine if we should capture a new video frame (throttled to fps)
        const elapsed = timestamp - lastFrameTimeRef.current;
        const shouldCapture = isPlaying && elapsed >= frameInterval;

        let frameData: ImageData | null = null;

        if (shouldCapture) {
          lastFrameTimeRef.current = timestamp;
          frameData = captureFrame();
        }

        // If we captured a new frame, or have active ripples on the last frame
        if (frameData) {
          const activeRipples = pruneExpiredRipples(ripples, now);
          if (activeRipples.length !== ripples.length) {
            setRipples(activeRipples);
          }
          const data = renderAsciiFrame(
            frameData,
            gridConfig,
            renderOptions,
            activeRipples,
            now,
          );
          setAsciiData(data);
        } else if (ripples.length > 0) {
          // Video paused but ripples still active — re-render last frame with ripples
          const lastFrame = captureFrame();
          if (lastFrame) {
            const activeRipples = pruneExpiredRipples(ripples, now);
            if (activeRipples.length !== ripples.length) {
              setRipples(activeRipples);
            }
            if (hasActiveRipples(activeRipples, now)) {
              const data = renderAsciiFrame(
                lastFrame,
                gridConfig,
                renderOptions,
                activeRipples,
                now,
              );
              setAsciiData(data);
            }
          }
        }

        // Continue loop if video is playing or ripples are active
        if (isPlaying || hasActiveRipples(ripples, now)) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [
      isReady,
      isPlaying,
      canvasDims,
      ripples,
      gridConfig,
      renderOptions,
      frameInterval,
      captureFrame,
    ]);

    // Render initial frame when video is ready but not yet playing
    useEffect(() => {
      if (!isReady || isPlaying) return;

      // Small delay to ensure the video element has painted the first frame
      const timer = setTimeout(() => {
        const frameData = captureFrame();
        if (frameData) {
          const data = renderAsciiFrame(
            frameData,
            gridConfig,
            renderOptions,
          );
          setAsciiData(data);
        }
      }, 100);

      return () => clearTimeout(timer);
    }, [isReady, isPlaying, captureFrame, gridConfig, renderOptions]);

    // Rain animation
    useEffect(() => {
      if (!enableRain || !canvasDims) return;

      const config: RainConfig = { ...DEFAULT_RAIN_CONFIG, ...rainConfig };
      const intervalMs = 1000 / config.intensity;

      const spawnDrop = () => {
        const drop = createRainDrop(
          canvasDims.width,
          canvasDims.height,
          rainConfig,
          rippleConfig,
        );
        setRipples((prev) => [...prev, drop]);
      };

      spawnDrop();
      const interval = setInterval(spawnDrop, intervalMs);
      return () => clearInterval(interval);
    }, [enableRain, canvasDims, rainConfig, rippleConfig]);

    // Handle click for ripple effect
    const handleClick = useCallback(
      (event: React.MouseEvent) => {
        if (enableRipple && containerRef.current && canvasDims) {
          const rect = containerRef.current.getBoundingClientRect();
          const displayWidth = containerRef.current.offsetWidth;
          const displayHeight = containerRef.current.offsetHeight;

          const clickX =
            ((event.clientX - rect.left) / displayWidth) * canvasDims.width;
          const clickY =
            ((event.clientY - rect.top) / displayHeight) * canvasDims.height;

          const newRipples: Ripple[] = [];
          const timeOffset = 200;

          for (let i = 0; i < rippleCount; i++) {
            const ripple = createRipple(clickX, clickY, rippleConfig);
            ripple.startTime = ripple.startTime + i * timeOffset;
            newRipples.push(ripple);
          }

          setRipples((prev) => [...prev, ...newRipples]);
        }

        onClick?.(event);
      },
      [enableRipple, canvasDims, rippleConfig, rippleCount, onClick],
    );

    // Video event handlers
    const handlePlay = useCallback(() => {
      setIsPlaying(true);
      onPlay?.();
    }, [onPlay]);

    const handlePause = useCallback(() => {
      setIsPlaying(false);
      onPause?.();
    }, [onPause]);

    const handleEnded = useCallback(() => {
      setIsPlaying(false);
      onEnded?.();
    }, [onEnded]);

    const handleTimeUpdate = useCallback(() => {
      const video = videoRef.current;
      if (video && onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    }, [onTimeUpdate]);

    // Build the ASCII string
    const asciiString = asciiData
      ? asciiData.chars.map((row) => row.join('')).join('\n')
      : 'Loading...';

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
      cursor: enableRipple ? 'pointer' : undefined,
      color: 'var(--ascii-color)',
      backgroundColor: 'var(--ascii-background)',
      overflow: 'hidden',
      ...cssVars,
      ...style,
    };

    return (
      <>
        <video
          ref={videoRef}
          src={src}
          crossOrigin="anonymous"
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          style={{ display: 'none' }}
        />
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
  },
);

export default AsciiVideo;
