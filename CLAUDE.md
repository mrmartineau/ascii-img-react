# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server with hot reload
bun run build        # Build demo app (tsc + vite)
bun run build:lib    # Build library for npm publishing
bun run lint         # Run ESLint on TypeScript files
bun run preview      # Preview production build
```

## Architecture

This is a React component library that converts images to ASCII art using 6-dimensional shape vector matching, with optional ripple animations.

### Core Algorithm Pipeline

1. **Image Sampling** (`src/lib/sampling.ts`): Divides image into grid cells and samples each cell using 6 circular regions in a staggered 2x3 pattern, producing a 6D "shape vector" of lightness values.

2. **Character Matching** (`src/lib/lookup.ts`): Matches each cell's 6D vector to pre-computed ASCII character vectors using Euclidean distance. Uses a quantized cache (5 bits per component) for performance.

3. **Contrast Enhancement** (`src/lib/contrast.ts`): Applies global and directional contrast. Directional contrast uses external sampling circles (outside cell boundaries) to sharpen edges between differently-colored regions.

4. **Ripple Animation** (`src/lib/ripple.ts`): Creates Gaussian pulse waves that expand outward from click points, modifying the sampling vectors to cause character selection to shift dynamically.

### Character Vectors

`src/lib/characters.ts` contains pre-computed 6D shape vectors for printable ASCII characters (32-126). Each dimension represents visual density in one of the 6 sampling regions. Characters are normalized so all components span 0-1.

### Library vs Demo

- **Library entry**: `src/index.ts` exports `AsciiImage` component and utility functions
- **Demo app**: `src/App.tsx` provides interactive playground with controls
- **Build modes**: `vite build` for demo, `vite build --mode lib` for npm package

### Key Technical Details

- Uses React Compiler via `babel-plugin-react-compiler`
- Uses rolldown-vite (Rust-based Vite) instead of standard Vite
- Dual CJS/ESM output with TypeScript declarations
- Hidden canvas element extracts ImageData from loaded images
- Animation loop uses `requestAnimationFrame` with ripple state in React state
