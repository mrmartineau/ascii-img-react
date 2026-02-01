# ascii-img-react

A React component that converts images to ASCII art using 6-dimensional shape vector matching, with interactive ripple animations.

## Installation

```bash
npm install ascii-img-react
# or
yarn add ascii-img-react
# or
pnpm add ascii-img-react
# or
bun add ascii-img-react
```

### Requirements

- React 18.0+ or React 19.0+
- Images must be CORS-accessible (use `crossorigin` attribute or serve from same origin)

## Usage

```tsx
import { AsciiImage } from 'ascii-img-react';

function App() {
  return (
    <AsciiImage
      src="https://example.com/image.jpg"
      width={80}
      height={40}
      contrast={1.5}
      enableRipple={true}
      color="#00ff00"
      backgroundColor="#000"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | required | Image source URL |
| `width` | `number` | auto | Width in ASCII characters |
| `height` | `number` | auto | Height in ASCII characters |
| `cellWidth` | `number` | `6` | Sampling cell width in pixels |
| `cellHeight` | `number` | `12` | Sampling cell height in pixels |
| `contrast` | `number` | `1.5` | Global contrast enhancement (1 = none) |
| `directionalContrast` | `number` | `2` | Directional contrast for edges |
| `enableDirectionalContrast` | `boolean` | `true` | Enable edge-aware contrast |
| `fontSize` | `number` | `10` | Font size in pixels |
| `lineHeight` | `number` | `0.8` | Line height multiplier |
| `enableRipple` | `boolean` | `true` | Enable click ripple animation |
| `rippleCount` | `number` | `1` | Number of cascading ripples per click |
| `rippleConfig` | `RippleConfig` | - | Customize ripple animation |
| `color` | `string` | inherit | ASCII character color |
| `backgroundColor` | `string` | transparent | Background color |
| `className` | `string` | - | CSS class for container |
| `style` | `CSSProperties` | - | Inline styles |
| `onClick` | `function` | - | Click handler |

## Examples

### Terminal-style with green text

```tsx
<AsciiImage
  src="/photo.jpg"
  width={100}
  height={50}
  color="#00ff00"
  backgroundColor="#000"
  fontSize={12}
  lineHeight={0.8}
/>
```

### Multiple cascading ripples

```tsx
<AsciiImage
  src="/photo.jpg"
  width={80}
  height={40}
  rippleCount={3}
  rippleConfig={{
    speed: 120,
    amplitude: 0.5,
    duration: 3000,
  }}
/>
```

### High contrast for detailed images

```tsx
<AsciiImage
  src="/detailed-image.jpg"
  width={120}
  contrast={2.5}
  directionalContrast={3}
/>
```

### Static image (no animation)

```tsx
<AsciiImage
  src="/logo.png"
  width={60}
  enableRipple={false}
/>
```

## Ripple Configuration

```tsx
<AsciiImage
  src="/image.jpg"
  rippleConfig={{
    speed: 150,       // Pixels per second
    amplitude: 0.4,   // Wave strength (0-1)
    decay: 2,         // Fade rate
    wavelength: 40,   // Wave size in pixels
    duration: 2000,   // Animation length in ms
  }}
/>
```

## How It Works

This library uses a shape-aware approach to ASCII rendering:

1. **6D Shape Vectors**: Each ASCII character is pre-computed with a 6-dimensional vector representing its visual density in 6 sampling regions
2. **Grid Sampling**: The source image is divided into cells, and each cell is sampled using 6 circular regions
3. **Nearest Neighbor Matching**: Each cell's sampling vector is matched to the closest character vector using Euclidean distance
4. **Contrast Enhancement**: Edge regions are enhanced to produce sharper boundaries between different colored areas
5. **Ripple Animation**: Click events trigger water-like waves that modify the sampling vectors, causing character selection to shift dynamically

## TypeScript

All types are exported for TypeScript users:

```tsx
import type { AsciiImageProps, RippleConfig, GridConfig, CharacterData } from 'ascii-img-react';

const config: Partial<RippleConfig> = {
  speed: 200,
  amplitude: 0.6,
};
```

## Advanced Usage

For custom implementations, you can import the underlying utilities:

```tsx
import {
  // Sampling
  sampleCell,
  sampleGrid,
  sampleExternalCircles,
  rgbToLightness,
  DEFAULT_GRID_CONFIG,

  // Character matching
  findBestCharacter,
  CachedCharacterLookup,
  cachedLookup,
  CHARACTERS,
  NORMALIZED_CHARACTERS,

  // Contrast
  applyGlobalContrast,
  applyDirectionalContrast,
  applyFullContrast,

  // Ripple animation
  createRipple,
  calculateWaveValue,
  applyRippleToVector,
  pruneExpiredRipples,
  hasActiveRipples,
  DEFAULT_RIPPLE_CONFIG,
} from 'ascii-img-react';
```

### Custom character lookup

```tsx
import { CachedCharacterLookup, sampleCell, DEFAULT_GRID_CONFIG } from 'ascii-img-react';

// Create a lookup with custom character set
const customChars = [
  { char: ' ', vector: [0, 0, 0, 0, 0, 0] },
  { char: '█', vector: [1, 1, 1, 1, 1, 1] },
  // ... your custom characters
];
const lookup = new CachedCharacterLookup(customChars);

// Sample image data and find matching character
const vector = sampleCell(imageData, col, row, DEFAULT_GRID_CONFIG);
const char = lookup.findBest(vector);
```

## CSS Variables

The component exposes CSS custom properties for easy theming and style overrides:

| Variable | Default | Description |
|----------|---------|-------------|
| `--ascii-font-family` | `monospace` | Font family for ASCII characters |
| `--ascii-font-size` | `10px` | Font size (set via `fontSize` prop) |
| `--ascii-line-height` | `0.8` | Line height (set via `lineHeight` prop) |
| `--ascii-color` | `inherit` | Text color (set via `color` prop) |
| `--ascii-background` | `transparent` | Background color (set via `backgroundColor` prop) |

### Overriding via CSS

You can override these variables in your stylesheet to theme all instances:

```css
/* Global theme */
.ascii-art {
  --ascii-font-family: 'Fira Code', monospace;
  --ascii-color: #0f0;
  --ascii-background: #111;
}
```

```tsx
<AsciiImage
  src="/photo.jpg"
  width={80}
  className="ascii-art"
/>
```

### Responsive styling

CSS variables make it easy to adjust styles at different breakpoints:

```css
.ascii-responsive {
  --ascii-font-size: 8px;
}

@media (min-width: 768px) {
  .ascii-responsive {
    --ascii-font-size: 12px;
  }
}

@media (min-width: 1200px) {
  .ascii-responsive {
    --ascii-font-size: 16px;
  }
}
```

### Dark/Light mode support

```css
.ascii-themed {
  --ascii-color: #333;
  --ascii-background: #fff;
}

@media (prefers-color-scheme: dark) {
  .ascii-themed {
    --ascii-color: #0ff;
    --ascii-background: #0a0a0a;
  }
}
```

## Notes

- **CORS**: External images must have appropriate CORS headers. For local development, serve images from the same origin or use a CORS proxy.
- **Performance**: Large ASCII grids (>150 columns) may impact animation performance. Consider reducing `width`/`height` or disabling ripples for very large outputs.
- **Fonts**: Results look best with monospace fonts. The component uses `font-family: monospace` by default.

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build library
bun run build:lib

# Lint
bun run lint
```

## Credits

Based on the techniques from [ASCII characters are not pixels](https://alexharri.com/blog/ascii-rendering) by Alex Harri.

## License

MIT
