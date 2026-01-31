import { useState, useEffect, useRef } from 'react'
import { Pane } from 'tweakpane'
import { AsciiImage } from './components/AsciiImage'
import './App.css'

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
  const remaining = code

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
  '/deep-pMfqcyzTB9c-unsplash.jpg',
  '/alexander-krivitskiy-o7wiNx9x9OQ-unsplash.jpg',
  '/vite.svg',
]

function App() {
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES[0])

  // Grid settings
  const [width, setWidth] = useState(80)
  const [height, setHeight] = useState(30)
  const [cellWidth, setCellWidth] = useState(6)
  const [cellHeight, setCellHeight] = useState(12)

  // Contrast settings
  const [contrast, setContrast] = useState(1.5)
  const [directionalContrast, setDirectionalContrast] = useState(2)
  const [enableDirectionalContrast, setEnableDirectionalContrast] = useState(true)

  // Style settings
  const [fontSize, setFontSize] = useState(15)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [color, setColor] = useState({ r: 0, g: 168, b: 158 })
  const [backgroundColor, setBackgroundColor] = useState({ r: 0, g: 0, b: 0 })
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

  const colorToHex = (c: { r: number; g: number; b: number }) =>
    `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`

  useEffect(() => {
    if (!paneContainerRef.current) return

    const params = {
      width,
      height,
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

    const pane = new Pane({ container: paneContainerRef.current, title: 'Settings', expanded: false })
    paneRef.current = pane

    // Grid folder
    const gridFolder = pane.addFolder({ title: 'Grid' })
    gridFolder.addBinding(params, 'width', { min: 20, max: 200, step: 1 })
      .on('change', (ev) => setWidth(ev.value))
    gridFolder.addBinding(params, 'height', { min: 10, max: 100, step: 1 })
      .on('change', (ev) => setHeight(ev.value))
    gridFolder.addBinding(params, 'cellWidth', { min: 2, max: 20, step: 1 })
      .on('change', (ev) => setCellWidth(ev.value))
    gridFolder.addBinding(params, 'cellHeight', { min: 4, max: 40, step: 1 })
      .on('change', (ev) => setCellHeight(ev.value))

    // Contrast folder
    const contrastFolder = pane.addFolder({ title: 'Contrast' })
    contrastFolder.addBinding(params, 'contrast', { min: 1, max: 5, step: 0.1 })
      .on('change', (ev) => setContrast(ev.value))
    contrastFolder.addBinding(params, 'enableDirectionalContrast')
      .on('change', (ev) => setEnableDirectionalContrast(ev.value))
    contrastFolder.addBinding(params, 'directionalContrast', { min: 1, max: 5, step: 0.1 })
      .on('change', (ev) => setDirectionalContrast(ev.value))

    // Style folder
    const styleFolder = pane.addFolder({ title: 'Style' })
    styleFolder.addBinding(params, 'fontSize', { min: 4, max: 30, step: 1 })
      .on('change', (ev) => setFontSize(ev.value))
    styleFolder.addBinding(params, 'lineHeight', { min: 0.5, max: 2, step: 0.1 })
      .on('change', (ev) => setLineHeight(ev.value))
    styleFolder.addBinding(params, 'color', { color: { type: 'int' } })
      .on('change', (ev) => setColor(ev.value))
    styleFolder.addBinding(params, 'backgroundColor', { color: { type: 'int' } })
      .on('change', (ev) => setBackgroundColor(ev.value))
    styleFolder.addBinding(params, 'canvasWidth', { min: 200, max: 1200, step: 10 })
      .on('change', (ev) => setCanvasWidth(ev.value))
    styleFolder.addBinding(params, 'canvasHeight', { min: 100, max: 800, step: 10 })
      .on('change', (ev) => setCanvasHeight(ev.value))

    // Ripple folder
    const rippleFolder = pane.addFolder({ title: 'Ripple' })
    rippleFolder.addBinding(params, 'enableRipple')
      .on('change', (ev) => setEnableRipple(ev.value))
    rippleFolder.addBinding(params, 'rippleCount', { min: 1, max: 5, step: 1 })
      .on('change', (ev) => setRippleCount(ev.value))
    rippleFolder.addBinding(params, 'rippleSpeed', { min: 50, max: 500, step: 10 })
      .on('change', (ev) => setRippleSpeed(ev.value))
    rippleFolder.addBinding(params, 'rippleAmplitude', { min: 0.1, max: 1, step: 0.05 })
      .on('change', (ev) => setRippleAmplitude(ev.value))
    rippleFolder.addBinding(params, 'rippleDecay', { min: 0.5, max: 5, step: 0.5 })
      .on('change', (ev) => setRippleDecay(ev.value))
    rippleFolder.addBinding(params, 'rippleWavelength', { min: 10, max: 100, step: 5 })
      .on('change', (ev) => setRippleWavelength(ev.value))
    rippleFolder.addBinding(params, 'rippleDuration', { min: 500, max: 5000, step: 100 })
      .on('change', (ev) => setRippleDuration(ev.value))

    return () => {
      pane.dispose()
    }
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
      color="${colorToHex(color)}"
      backgroundColor="${colorToHex(backgroundColor)}"
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

      <div className="ascii-container">
        <div className="controls" ref={paneContainerRef} />
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
          color={colorToHex(color)}
          backgroundColor={colorToHex(backgroundColor)}
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
