import { useState, useEffect, useRef } from 'react'
import { Pane, FolderApi } from 'tweakpane'
import { AsciiImage } from './components/AsciiImage'
import { AsciiCanvas } from './components/AsciiCanvas'
import {
  addBinding,
  addStyleFolder,
  addRippleFolder,
  addRainFolder,
  type StyleParams,
  type RippleParams,
  type RainParams,
} from './tweakpane'
import './App.css'

// ── AsciiImage-specific params ──────────────────────────────────────────

type ImagePaneParams = StyleParams & RippleParams & RainParams & {
  width: number
  height: number
  lockAspectRatio: boolean
  cellWidth: number
  cellHeight: number
  contrast: number
  directionalContrast: number
  enableDirectionalContrast: boolean
  canvasWidth: number
  canvasHeight: number
}

// ── AsciiCanvas-specific params ─────────────────────────────────────────

type CanvasPaneParams = StyleParams & RippleParams & RainParams & {
  canvasWidth: number
  canvasHeight: number
  gridWidth: number
  gridHeight: number
  enableMouseRipple: boolean
  mouseRippleSpeed: number
  mouseRippleAmplitude: number
  mouseRippleDecay: number
  mouseRippleWavelength: number
  mouseRippleDuration: number
  mouseThrottleMs: number
}

// ── Syntax highlighting ─────────────────────────────────────────────────

function highlightCode(code: string): React.ReactNode[] {
  const patterns: [RegExp, string][] = [
    [/(\/\/.*$)/gm, 'comment'],
    [/(\{|\}|\(|\)|\[|\])/g, 'bracket'],
    [/\b(import|export|from|function|return|const|let|var|true|false)\b/g, 'keyword'],
    [/(<\/?[A-Z]\w*)/g, 'component'],
    [/(\w+)=/g, 'prop'],
    [/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, 'string'],
    [/\b(\d+\.?\d*)\b/g, 'number'],
  ]

  type Token = { text: string; className?: string; index: number }
  const tokens: Token[] = []

  const allMatches: { match: string; className: string; start: number; end: number }[] = []

  for (const [pattern, className] of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(code)) !== null) {
      const captureGroup = match[1] || match[0]
      const start = match.index + (match[0].indexOf(captureGroup))
      allMatches.push({
        match: captureGroup,
        className,
        start,
        end: start + captureGroup.length,
      })
    }
  }

  allMatches.sort((a, b) => a.start - b.start)
  const filtered: typeof allMatches = []
  let lastEnd = 0
  for (const m of allMatches) {
    if (m.start >= lastEnd) {
      filtered.push(m)
      lastEnd = m.end
    }
  }

  let pos = 0
  for (const m of filtered) {
    if (m.start > pos) {
      tokens.push({ text: code.slice(pos, m.start), index: pos })
    }
    tokens.push({ text: m.match, className: m.className, index: m.start })
    pos = m.end
  }
  if (pos < code.length) {
    tokens.push({ text: code.slice(pos), index: pos })
  }

  return tokens.map((t, i) =>
    t.className ? (
      <span key={i} className={`syntax-${t.className}`}>{t.text}</span>
    ) : (
      <span key={i}>{t.text}</span>
    )
  )
}

// ── Sample images ───────────────────────────────────────────────────────

const SAMPLE_IMAGES = [
  '/z.png',
  '/react-logo.png',
  '/kukai-art-ZlC0wis-JeY-unsplash.jpg',
  '/amanda-dalbjorn-UbJMy92p8wk-unsplash.jpg',
  '/deep-pMfqcyzTB9c-unsplash.jpg',
  '/alexander-krivitskiy-o7wiNx9x9OQ-unsplash.jpg',
  '/vite.svg',
]

// ── App ─────────────────────────────────────────────────────────────────

function App() {
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES[0])

  // ── AsciiImage state ──────────────────────────────────────────────────
  const [width, setWidth] = useState(80)
  const [height, setHeight] = useState(80)
  const [cellWidth, setCellWidth] = useState(6)
  const [cellHeight, setCellHeight] = useState(12)
  const [aspectRatio, setAspectRatio] = useState(1)
  const [lockAspectRatio, setLockAspectRatio] = useState(true)
  const [contrast, setContrast] = useState(1.5)
  const [directionalContrast, setDirectionalContrast] = useState(2)
  const [enableDirectionalContrast, setEnableDirectionalContrast] = useState(true)
  const [imgFontSize, setImgFontSize] = useState(15)
  const [imgLineHeight, setImgLineHeight] = useState(1.5)
  const [imgColor, setImgColor] = useState('#00a89e')
  const [imgBg, setImgBg] = useState('#000000')
  const [imgCanvasWidth, setImgCanvasWidth] = useState(800)
  const [imgCanvasHeight, setImgCanvasHeight] = useState(800)
  const [imgEnableRipple, setImgEnableRipple] = useState(true)
  const [imgRippleCount, setImgRippleCount] = useState(1)
  const [imgRippleSpeed, setImgRippleSpeed] = useState(150)
  const [imgRippleAmplitude, setImgRippleAmplitude] = useState(0.9)
  const [imgRippleDecay, setImgRippleDecay] = useState(2)
  const [imgRippleWavelength, setImgRippleWavelength] = useState(40)
  const [imgRippleDuration, setImgRippleDuration] = useState(2000)
  const [imgEnableRain, setImgEnableRain] = useState(false)
  const [imgRainIntensity, setImgRainIntensity] = useState(3)
  const [imgRainVariation, setImgRainVariation] = useState(0.3)

  // ── AsciiCanvas state ─────────────────────────────────────────────────
  const [cvGridWidth, setCvGridWidth] = useState(80)
  const [cvGridHeight, setCvGridHeight] = useState(30)
  const [cvCanvasWidth, setCvCanvasWidth] = useState(800)
  const [cvCanvasHeight, setCvCanvasHeight] = useState(320)
  const [cvFontSize, setCvFontSize] = useState(15)
  const [cvLineHeight, setCvLineHeight] = useState(1.5)
  const [cvColor, setCvColor] = useState('#00a89e')
  const [cvBg, setCvBg] = useState('#000000')
  const [cvEnableRipple, setCvEnableRipple] = useState(true)
  const [cvRippleCount, setCvRippleCount] = useState(1)
  const [cvRippleSpeed, setCvRippleSpeed] = useState(150)
  const [cvRippleAmplitude, setCvRippleAmplitude] = useState(0.9)
  const [cvRippleDecay, setCvRippleDecay] = useState(2)
  const [cvRippleWavelength, setCvRippleWavelength] = useState(40)
  const [cvRippleDuration, setCvRippleDuration] = useState(2000)
  const [cvEnableRain, setCvEnableRain] = useState(false)
  const [cvRainIntensity, setCvRainIntensity] = useState(3)
  const [cvRainVariation, setCvRainVariation] = useState(0.3)
  const [cvEnableMouseRipple, setCvEnableMouseRipple] = useState(true)
  const [cvMouseSpeed, setCvMouseSpeed] = useState(120)
  const [cvMouseAmplitude, setCvMouseAmplitude] = useState(0.25)
  const [cvMouseDecay, setCvMouseDecay] = useState(3)
  const [cvMouseWavelength, setCvMouseWavelength] = useState(25)
  const [cvMouseDuration, setCvMouseDuration] = useState(1000)
  const [cvMouseThrottle, setCvMouseThrottle] = useState(60)

  // ── Refs ───────────────────────────────────────────────────────────────
  const imgPaneContainerRef = useRef<HTMLDivElement>(null)
  const cvPaneContainerRef = useRef<HTMLDivElement>(null)
  const aspectRatioRef = useRef(aspectRatio)
  const lockAspectRatioRef = useRef(lockAspectRatio)

  // Load image and calculate aspect ratio
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const cellAspect = cellWidth / cellHeight
      const imageAspect = img.width / img.height
      const adjustedAspect = imageAspect / cellAspect
      setAspectRatio(adjustedAspect)

      const baseWidth = 80
      const newHeight = Math.max(10, Math.min(100, Math.round(baseWidth / adjustedAspect)))
      setWidth(baseWidth)
      setHeight(newHeight)

      const charWidth = imgFontSize * 0.6
      const charHeight = imgFontSize * imgLineHeight
      setImgCanvasWidth(Math.round(baseWidth * charWidth))
      setImgCanvasHeight(Math.round(newHeight * charHeight))
    }
    img.src = imageUrl
  }, [imageUrl, cellWidth, cellHeight, imgFontSize, imgLineHeight])

  useEffect(() => { aspectRatioRef.current = aspectRatio }, [aspectRatio])
  useEffect(() => { lockAspectRatioRef.current = lockAspectRatio }, [lockAspectRatio])

  // ── AsciiImage Tweakpane ──────────────────────────────────────────────
  useEffect(() => {
    if (!imgPaneContainerRef.current) return

    const params: ImagePaneParams = {
      width, height, lockAspectRatio, cellWidth, cellHeight,
      contrast, directionalContrast, enableDirectionalContrast,
      fontSize: imgFontSize, lineHeight: imgLineHeight,
      color: imgColor, backgroundColor: imgBg,
      canvasWidth: imgCanvasWidth, canvasHeight: imgCanvasHeight,
      enableRipple: imgEnableRipple, rippleCount: imgRippleCount,
      rippleSpeed: imgRippleSpeed, rippleAmplitude: imgRippleAmplitude,
      rippleDecay: imgRippleDecay, rippleWavelength: imgRippleWavelength,
      rippleDuration: imgRippleDuration,
      enableRain: imgEnableRain, rainIntensity: imgRainIntensity,
      rainVariation: imgRainVariation,
    }

    const pane = new Pane({
      container: imgPaneContainerRef.current,
      title: 'AsciiImage Settings',
      expanded: false,
    }) as FolderApi

    // Helper to update canvas dimensions based on grid size
    const updateCanvasDimensions = (w: number, h: number) => {
      const charWidth = params.fontSize * 0.6
      const charHeight = params.fontSize * params.lineHeight
      const newW = Math.round(w * charWidth)
      const newH = Math.round(h * charHeight)
      params.canvasWidth = newW
      params.canvasHeight = newH
      setImgCanvasWidth(newW)
      setImgCanvasHeight(newH)
    }

    // Grid folder
    const gridFolder = pane.addFolder({ title: 'Grid' })
    const widthBinding = gridFolder.addBinding(params, 'width', { min: 20, max: 200, step: 1 })
    const heightBinding = gridFolder.addBinding(params, 'height', { min: 10, max: 100, step: 1 })
    addBinding(gridFolder, params, 'lockAspectRatio', setLockAspectRatio)
    addBinding(gridFolder, params, 'cellWidth', setCellWidth, { min: 2, max: 20, step: 1 })
    addBinding(gridFolder, params, 'cellHeight', setCellHeight, { min: 4, max: 40, step: 1 })

    widthBinding.on('change', (ev: { value: number }) => {
      setWidth(ev.value)
      if (lockAspectRatioRef.current) {
        const newHeight = Math.max(10, Math.min(100, Math.round(ev.value / aspectRatioRef.current)))
        params.height = newHeight
        setHeight(newHeight)
        heightBinding.refresh()
        updateCanvasDimensions(ev.value, newHeight)
      } else {
        updateCanvasDimensions(ev.value, params.height)
      }
    })

    heightBinding.on('change', (ev: { value: number }) => {
      setHeight(ev.value)
      if (lockAspectRatioRef.current) {
        const newWidth = Math.max(20, Math.min(200, Math.round(ev.value * aspectRatioRef.current)))
        params.width = newWidth
        setWidth(newWidth)
        widthBinding.refresh()
        updateCanvasDimensions(newWidth, ev.value)
      } else {
        updateCanvasDimensions(params.width, ev.value)
      }
    })

    // Contrast folder
    const contrastFolder = pane.addFolder({ title: 'Contrast' })
    addBinding(contrastFolder, params, 'contrast', setContrast, { min: 1, max: 5, step: 0.1 })
    addBinding(contrastFolder, params, 'enableDirectionalContrast', setEnableDirectionalContrast)
    addBinding(contrastFolder, params, 'directionalContrast', setDirectionalContrast, { min: 1, max: 5, step: 0.1 })

    // Style folder
    const styleFolder = addStyleFolder(pane, params, {
      fontSize: setImgFontSize,
      lineHeight: setImgLineHeight,
      color: setImgColor,
      backgroundColor: setImgBg,
    })
    addBinding(styleFolder, params, 'canvasWidth', setImgCanvasWidth, { min: 200, max: 1200, step: 10 })
    addBinding(styleFolder, params, 'canvasHeight', setImgCanvasHeight, { min: 100, max: 800, step: 10 })

    // Ripple folder
    addRippleFolder(pane, params, {
      enableRipple: setImgEnableRipple,
      rippleCount: setImgRippleCount,
      rippleSpeed: setImgRippleSpeed,
      rippleAmplitude: setImgRippleAmplitude,
      rippleDecay: setImgRippleDecay,
      rippleWavelength: setImgRippleWavelength,
      rippleDuration: setImgRippleDuration,
    })

    // Rain folder
    addRainFolder(pane, params, {
      enableRain: setImgEnableRain,
      rainIntensity: setImgRainIntensity,
      rainVariation: setImgRainVariation,
    })

    return () => pane.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── AsciiCanvas Tweakpane ─────────────────────────────────────────────
  useEffect(() => {
    if (!cvPaneContainerRef.current) return

    const params: CanvasPaneParams = {
      gridWidth: cvGridWidth, gridHeight: cvGridHeight,
      canvasWidth: cvCanvasWidth, canvasHeight: cvCanvasHeight,
      fontSize: cvFontSize, lineHeight: cvLineHeight,
      color: cvColor, backgroundColor: cvBg,
      enableRipple: cvEnableRipple, rippleCount: cvRippleCount,
      rippleSpeed: cvRippleSpeed, rippleAmplitude: cvRippleAmplitude,
      rippleDecay: cvRippleDecay, rippleWavelength: cvRippleWavelength,
      rippleDuration: cvRippleDuration,
      enableRain: cvEnableRain, rainIntensity: cvRainIntensity,
      rainVariation: cvRainVariation,
      enableMouseRipple: cvEnableMouseRipple,
      mouseRippleSpeed: cvMouseSpeed,
      mouseRippleAmplitude: cvMouseAmplitude,
      mouseRippleDecay: cvMouseDecay,
      mouseRippleWavelength: cvMouseWavelength,
      mouseRippleDuration: cvMouseDuration,
      mouseThrottleMs: cvMouseThrottle,
    }

    const pane = new Pane({
      container: cvPaneContainerRef.current,
      title: 'AsciiCanvas Settings',
      expanded: false,
    }) as FolderApi

    // Grid folder
    const gridFolder = pane.addFolder({ title: 'Grid' })
    addBinding(gridFolder, params, 'gridWidth', setCvGridWidth, { min: 20, max: 200, step: 1 })
    addBinding(gridFolder, params, 'gridHeight', setCvGridHeight, { min: 10, max: 80, step: 1 })

    // Style folder
    const styleFolder = addStyleFolder(pane, params, {
      fontSize: setCvFontSize,
      lineHeight: setCvLineHeight,
      color: setCvColor,
      backgroundColor: setCvBg,
    })
    addBinding(styleFolder, params, 'canvasWidth', setCvCanvasWidth, { min: 200, max: 1200, step: 10 })
    addBinding(styleFolder, params, 'canvasHeight', setCvCanvasHeight, { min: 100, max: 800, step: 10 })

    // Click ripple folder
    addRippleFolder(pane, params, {
      enableRipple: setCvEnableRipple,
      rippleCount: setCvRippleCount,
      rippleSpeed: setCvRippleSpeed,
      rippleAmplitude: setCvRippleAmplitude,
      rippleDecay: setCvRippleDecay,
      rippleWavelength: setCvRippleWavelength,
      rippleDuration: setCvRippleDuration,
    })

    // Mouse ripple folder
    const mouseFolder = pane.addFolder({ title: 'Mouse Ripple' })
    addBinding(mouseFolder, params, 'enableMouseRipple', setCvEnableMouseRipple)
    addBinding(mouseFolder, params, 'mouseRippleSpeed', setCvMouseSpeed, { min: 50, max: 500, step: 10 })
    addBinding(mouseFolder, params, 'mouseRippleAmplitude', setCvMouseAmplitude, { min: 0.05, max: 1, step: 0.05 })
    addBinding(mouseFolder, params, 'mouseRippleDecay', setCvMouseDecay, { min: 0.5, max: 5, step: 0.5 })
    addBinding(mouseFolder, params, 'mouseRippleWavelength', setCvMouseWavelength, { min: 5, max: 100, step: 5 })
    addBinding(mouseFolder, params, 'mouseRippleDuration', setCvMouseDuration, { min: 200, max: 3000, step: 100 })
    addBinding(mouseFolder, params, 'mouseThrottleMs', setCvMouseThrottle, { min: 16, max: 200, step: 1 })

    // Rain folder
    addRainFolder(pane, params, {
      enableRain: setCvEnableRain,
      rainIntensity: setCvRainIntensity,
      rainVariation: setCvRainVariation,
    })

    return () => pane.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Code examples ─────────────────────────────────────────────────────

  const codeExample = `import { AsciiImage } from 'ascii-img-react';

function MyComponent() {
  return (
    <AsciiImage
      src="${imageUrl}"
      width={${width}}
      height={${height}}
      cellWidth={${cellWidth}}
      cellHeight={${cellHeight}}
      contrast={${contrast}}
      directionalContrast={${directionalContrast}}
      enableDirectionalContrast={${enableDirectionalContrast}}
      fontSize={${imgFontSize}}
      lineHeight={${imgLineHeight}}
      color="${imgColor}"
      backgroundColor="${imgBg}"
      enableRipple={${imgEnableRipple}}
      rippleCount={${imgRippleCount}}
      rippleConfig={{
        speed: ${imgRippleSpeed},
        amplitude: ${imgRippleAmplitude},
        decay: ${imgRippleDecay},
        wavelength: ${imgRippleWavelength},
        duration: ${imgRippleDuration},
      }}
      enableRain={${imgEnableRain}}
      rainConfig={{
        intensity: ${imgRainIntensity},
        variation: ${imgRainVariation},
      }}
      style={{
        width: ${imgCanvasWidth},
        height: ${imgCanvasHeight},
      }}
    />
  );
}`

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <div className="content">
        <h1>ascii-img-react</h1>
        <p>by <a href="https://zander.wtf">Zander Martineau</a></p>
        <p><a href="https://github.com/mrmartineau/ascii-img-react">GitHub Repo</a></p>
        <pre>$ npm install ascii-img-react</pre>
        <p>Convert images to ASCII art with ripple animation effects. Click on the image to trigger ripple animation, or enable Rain mode for automatic raindrops</p>
      </div>

      {/* ── AsciiImage demo ─────────────────────────────────────── */}
      <div className="image-thumbnails">
        {SAMPLE_IMAGES.map((src) => (
          <button
          key={src}
          className={`thumbnail ${imageUrl === src ? 'active' : ''}`}
          onClick={() => setImageUrl(src)}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <p>Choose an image from the list above:</p>

      <div className="controls-container">
        <div className="controls" ref={imgPaneContainerRef} />
      </div>

      <div className="ascii-container">
        <AsciiImage
          src={imageUrl}
          width={width}
          height={height}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          contrast={contrast}
          directionalContrast={directionalContrast}
          enableDirectionalContrast={enableDirectionalContrast}
          fontSize={imgFontSize}
          lineHeight={imgLineHeight}
          color={imgColor}
          backgroundColor={imgBg}
          enableRipple={imgEnableRipple}
          rippleCount={imgRippleCount}
          rippleConfig={{
            speed: imgRippleSpeed,
            amplitude: imgRippleAmplitude,
            decay: imgRippleDecay,
            wavelength: imgRippleWavelength,
            duration: imgRippleDuration,
          }}
          enableRain={imgEnableRain}
          rainConfig={{
            intensity: imgRainIntensity,
            variation: imgRainVariation,
          }}
          style={{
            width: imgCanvasWidth,
            height: imgCanvasHeight,
            padding: '15px',
            borderRadius: '15px',
          }}
        />
      </div>
      <p>Click on the image to trigger ripple animation, or enable Rain mode for automatic raindrops</p>

      {/* ── AsciiCanvas demo ────────────────────────────────────── */}
      <div className="canvas-demo-section">
        <div className="content">
          <h2>AsciiCanvas</h2>
          <p>No image needed — just ripples, rain, and mouse tracking. Move your mouse over the canvas below.</p>
        </div>

        <div className="controls-container">
          <div className="controls" ref={cvPaneContainerRef} />
        </div>

        <div className="ascii-container">
          <AsciiCanvas
            width={cvGridWidth}
            height={cvGridHeight}
            fontSize={cvFontSize}
            lineHeight={cvLineHeight}
            color={cvColor}
            backgroundColor={cvBg}
            enableRipple={cvEnableRipple}
            rippleCount={cvRippleCount}
            rippleConfig={{
              speed: cvRippleSpeed,
              amplitude: cvRippleAmplitude,
              decay: cvRippleDecay,
              wavelength: cvRippleWavelength,
              duration: cvRippleDuration,
            }}
            enableRain={cvEnableRain}
            rainConfig={{
              intensity: cvRainIntensity,
              variation: cvRainVariation,
            }}
            enableMouseRipple={cvEnableMouseRipple}
            mouseRippleConfig={{
              speed: cvMouseSpeed,
              amplitude: cvMouseAmplitude,
              decay: cvMouseDecay,
              wavelength: cvMouseWavelength,
              duration: cvMouseDuration,
            }}
            mouseThrottleMs={cvMouseThrottle}
            style={{
              width: cvCanvasWidth,
              height: cvCanvasHeight,
              padding: '15px',
              borderRadius: '15px',
            }}
          />
        </div>
        <p>Move your mouse over the canvas, click for bigger ripples, or enable Rain mode</p>
      </div>

      {/* ── Code example ────────────────────────────────────────── */}
      <div className="code-section">
        <h2>Code</h2>
        <pre className="code-block">
          <code>{highlightCode(codeExample)}</code>
        </pre>
      </div>
    </div>
  )
}

export default App
