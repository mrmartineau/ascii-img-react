import { useState, useEffect, useRef } from 'react'
import { Pane, FolderApi } from 'tweakpane'
import { AsciiImage } from './components/AsciiImage'
import './App.css'

type PaneParams = {
  width: number
  height: number
  lockAspectRatio: boolean
  cellWidth: number
  cellHeight: number
  contrast: number
  directionalContrast: number
  enableDirectionalContrast: boolean
  fontSize: number
  lineHeight: number
  color: string
  backgroundColor: string
  canvasWidth: number
  canvasHeight: number
  enableRipple: boolean
  rippleCount: number
  rippleSpeed: number
  rippleAmplitude: number
  rippleDecay: number
  rippleWavelength: number
  rippleDuration: number
}

type SettersMap = {
  [K in keyof PaneParams]: React.Dispatch<React.SetStateAction<PaneParams[K]>>
}

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

  // Find all matches and their positions
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

  // Sort by position and filter overlaps
  allMatches.sort((a, b) => a.start - b.start)
  const filtered: typeof allMatches = []
  let lastEnd = 0
  for (const m of allMatches) {
    if (m.start >= lastEnd) {
      filtered.push(m)
      lastEnd = m.end
    }
  }

  // Build tokens
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

const SAMPLE_IMAGES = [
  '/z.png',
  '/react-logo.png',
  '/deep-pMfqcyzTB9c-unsplash.jpg',
  '/alexander-krivitskiy-o7wiNx9x9OQ-unsplash.jpg',
  '/vite.svg',
]

function App() {
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES[0])

  // Grid settings
  const [width, setWidth] = useState(80)
  const [height, setHeight] = useState(80)
  const [cellWidth, setCellWidth] = useState(6)
  const [cellHeight, setCellHeight] = useState(12)
  const [aspectRatio, setAspectRatio] = useState(1)
  const [lockAspectRatio, setLockAspectRatio] = useState(true)

  // Contrast settings
  const [contrast, setContrast] = useState(1.5)
  const [directionalContrast, setDirectionalContrast] = useState(2)
  const [enableDirectionalContrast, setEnableDirectionalContrast] = useState(true)

  // Style settings
  const [fontSize, setFontSize] = useState(15)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [color, setColor] = useState('#00a89e')
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [canvasWidth, setCanvasWidth] = useState(800)
  const [canvasHeight, setCanvasHeight] = useState(800)

  // Ripple settings
  const [enableRipple, setEnableRipple] = useState(true)
  const [rippleCount, setRippleCount] = useState(1)
  const [rippleSpeed, setRippleSpeed] = useState(150)
  const [rippleAmplitude, setRippleAmplitude] = useState(0.9)
  const [rippleDecay, setRippleDecay] = useState(2)
  const [rippleWavelength, setRippleWavelength] = useState(40)
  const [rippleDuration, setRippleDuration] = useState(2000)

  const paneContainerRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const paramsRef = useRef<PaneParams | null>(null)

  const aspectRatioRef = useRef(aspectRatio)
  const lockAspectRatioRef = useRef(lockAspectRatio)

  // Load image and calculate aspect ratio
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      // Account for cell aspect ratio (cells are taller than wide)
      const cellAspect = cellWidth / cellHeight
      const imageAspect = img.width / img.height
      const adjustedAspect = imageAspect / cellAspect
      setAspectRatio(adjustedAspect)

      // Set initial dimensions based on image aspect ratio
      const baseWidth = 80
      const newHeight = Math.max(10, Math.min(100, Math.round(baseWidth / adjustedAspect)))
      setWidth(baseWidth)
      setHeight(newHeight)

      // Update canvas dimensions to match
      const charWidth = fontSize * 0.6
      const charHeight = fontSize * lineHeight
      setCanvasWidth(Math.round(baseWidth * charWidth))
      setCanvasHeight(Math.round(newHeight * charHeight))
    }
    img.src = imageUrl
  }, [imageUrl, cellWidth, cellHeight, fontSize, lineHeight])

  // Keep refs in sync
  useEffect(() => {
    aspectRatioRef.current = aspectRatio
  }, [aspectRatio])

  useEffect(() => {
    lockAspectRatioRef.current = lockAspectRatio
  }, [lockAspectRatio])


  // Initialize Tweakpane once
  useEffect(() => {
    if (!paneContainerRef.current) return

    const setters: SettersMap = {
      width: setWidth,
      height: setHeight,
      lockAspectRatio: setLockAspectRatio,
      cellWidth: setCellWidth,
      cellHeight: setCellHeight,
      contrast: setContrast,
      directionalContrast: setDirectionalContrast,
      enableDirectionalContrast: setEnableDirectionalContrast,
      fontSize: setFontSize,
      lineHeight: setLineHeight,
      color: setColor,
      backgroundColor: setBackgroundColor,
      canvasWidth: setCanvasWidth,
      canvasHeight: setCanvasHeight,
      enableRipple: setEnableRipple,
      rippleCount: setRippleCount,
      rippleSpeed: setRippleSpeed,
      rippleAmplitude: setRippleAmplitude,
      rippleDecay: setRippleDecay,
      rippleWavelength: setRippleWavelength,
      rippleDuration: setRippleDuration,
    }

    const params: PaneParams = {
      width,
      height,
      lockAspectRatio,
      cellWidth,
      cellHeight,
      contrast,
      directionalContrast,
      enableDirectionalContrast,
      fontSize,
      lineHeight,
      color,
      backgroundColor,
      canvasWidth,
      canvasHeight,
      enableRipple,
      rippleCount,
      rippleSpeed,
      rippleAmplitude,
      rippleDecay,
      rippleWavelength,
      rippleDuration,
    }
    paramsRef.current = params

    const pane = new Pane({ container: paneContainerRef.current, title: 'Demo Settings', expanded: false }) as FolderApi
    paneRef.current = pane as unknown as Pane

    // Helper to create a binding with automatic state sync
    const addBinding = <K extends keyof PaneParams>(
      folder: FolderApi,
      key: K,
      options?: { min?: number; max?: number; step?: number; color?: { type: 'int' } },
      onChange?: (value: PaneParams[K]) => void
    ) => {
      folder.addBinding(params, key, options).on('change', (ev: { value: PaneParams[K] }) => {
        setters[key](ev.value)
        onChange?.(ev.value)
      })
    }

    // Helper to update canvas dimensions based on grid size
    const updateCanvasDimensions = (w: number, h: number) => {
      const charWidth = params.fontSize * 0.6
      const charHeight = params.fontSize * params.lineHeight
      const newCanvasWidth = Math.round(w * charWidth)
      const newCanvasHeight = Math.round(h * charHeight)
      params.canvasWidth = newCanvasWidth
      params.canvasHeight = newCanvasHeight
      setCanvasWidth(newCanvasWidth)
      setCanvasHeight(newCanvasHeight)
    }

    // Grid folder
    const gridFolder = pane.addFolder({ title: 'Grid' })
    const widthBinding = gridFolder.addBinding(params, 'width', { min: 20, max: 200, step: 1 })
    const heightBinding = gridFolder.addBinding(params, 'height', { min: 10, max: 100, step: 1 })
    addBinding(gridFolder, 'lockAspectRatio')
    addBinding(gridFolder, 'cellWidth', { min: 2, max: 20, step: 1 })
    addBinding(gridFolder, 'cellHeight', { min: 4, max: 40, step: 1 })

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
    addBinding(contrastFolder, 'contrast', { min: 1, max: 5, step: 0.1 })
    addBinding(contrastFolder, 'enableDirectionalContrast')
    addBinding(contrastFolder, 'directionalContrast', { min: 1, max: 5, step: 0.1 })

    // Style folder
    const styleFolder = pane.addFolder({ title: 'Style' })
    addBinding(styleFolder, 'fontSize', { min: 4, max: 30, step: 1 })
    addBinding(styleFolder, 'lineHeight', { min: 0.5, max: 2, step: 0.1 })
    addBinding(styleFolder, 'color')
    addBinding(styleFolder, 'backgroundColor')
    addBinding(styleFolder, 'canvasWidth', { min: 200, max: 1200, step: 10 })
    addBinding(styleFolder, 'canvasHeight', { min: 100, max: 800, step: 10 })

    // Ripple folder
    const rippleFolder = pane.addFolder({ title: 'Ripple' })
    addBinding(rippleFolder, 'enableRipple')
    addBinding(rippleFolder, 'rippleCount', { min: 1, max: 5, step: 1 })
    addBinding(rippleFolder, 'rippleSpeed', { min: 50, max: 500, step: 10 })
    addBinding(rippleFolder, 'rippleAmplitude', { min: 0.1, max: 1, step: 0.05 })
    addBinding(rippleFolder, 'rippleDecay', { min: 0.5, max: 5, step: 0.5 })
    addBinding(rippleFolder, 'rippleWavelength', { min: 10, max: 100, step: 5 })
    addBinding(rippleFolder, 'rippleDuration', { min: 500, max: 5000, step: 100 })

    return () => pane.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      fontSize={${fontSize}}
      lineHeight={${lineHeight}}
      color="${color}"
      backgroundColor="${backgroundColor}"
      enableRipple={${enableRipple}}
      rippleCount={${rippleCount}}
      rippleConfig={{
        speed: ${rippleSpeed},
        amplitude: ${rippleAmplitude},
        decay: ${rippleDecay},
        wavelength: ${rippleWavelength},
        duration: ${rippleDuration},
      }}
      style={{
        width: ${canvasWidth},
        height: ${canvasHeight},
      }}
    />
  );
}`

  return (
    <div className="app">
      <h1>ASCII React</h1>

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

      <div className="controls-container">
        <div className="controls" ref={paneContainerRef} />
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
          fontSize={fontSize}
          lineHeight={lineHeight}
          color={color}
          backgroundColor={backgroundColor}
          enableRipple={enableRipple}
          rippleCount={rippleCount}
          rippleConfig={{
            speed: rippleSpeed,
            amplitude: rippleAmplitude,
            decay: rippleDecay,
            wavelength: rippleWavelength,
            duration: rippleDuration,
          }}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            padding: '15px',
            borderRadius: '15px',
          }}
        />
      </div>
      <p>Click on the image to trigger ripple animation</p>

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
