import { type FolderApi } from 'tweakpane'

/**
 * Shared tweakpane helpers so multiple demo panes can be created
 * without duplicating boilerplate.
 */

/** Create a binding that auto-syncs to a React setState dispatcher. */
export function addBinding<TParams extends Record<string, unknown>, K extends keyof TParams & string>(
  folder: FolderApi,
  params: TParams,
  key: K,
  setter: React.Dispatch<React.SetStateAction<TParams[K]>>,
  options?: { min?: number; max?: number; step?: number },
  onChange?: (value: TParams[K]) => void,
) {
  return folder.addBinding(params, key, options).on('change', (ev: { value: TParams[K] }) => {
    setter(ev.value)
    onChange?.(ev.value)
  })
}

/** Shared style params used by both AsciiImage and AsciiCanvas demos. */
export type StyleParams = {
  fontSize: number
  lineHeight: number
  color: string
  backgroundColor: string
}

/** Shared ripple params used by both demos. */
export type RippleParams = {
  enableRipple: boolean
  rippleCount: number
  rippleSpeed: number
  rippleAmplitude: number
  rippleDecay: number
  rippleWavelength: number
  rippleDuration: number
}

/** Shared rain params used by both demos. */
export type RainParams = {
  enableRain: boolean
  rainIntensity: number
  rainVariation: number
}

type Setter<T> = React.Dispatch<React.SetStateAction<T>>
type SettersFor<T> = { [K in keyof T]: Setter<T[K]> }

/** Add a Style folder to a pane with fontSize, lineHeight, color, background. */
export function addStyleFolder(
  pane: FolderApi,
  params: StyleParams,
  setters: SettersFor<StyleParams>,
) {
  const folder = pane.addFolder({ title: 'Style' })
  addBinding(folder, params, 'fontSize', setters.fontSize, { min: 4, max: 30, step: 1 })
  addBinding(folder, params, 'lineHeight', setters.lineHeight, { min: 0.5, max: 2, step: 0.1 })
  addBinding(folder, params, 'color', setters.color)
  addBinding(folder, params, 'backgroundColor', setters.backgroundColor)
  return folder
}

/** Add a Ripple folder to a pane. */
export function addRippleFolder(
  pane: FolderApi,
  params: RippleParams,
  setters: SettersFor<RippleParams>,
) {
  const folder = pane.addFolder({ title: 'Ripple' })
  addBinding(folder, params, 'enableRipple', setters.enableRipple)
  addBinding(folder, params, 'rippleCount', setters.rippleCount, { min: 1, max: 5, step: 1 })
  addBinding(folder, params, 'rippleSpeed', setters.rippleSpeed, { min: 50, max: 500, step: 10 })
  addBinding(folder, params, 'rippleAmplitude', setters.rippleAmplitude, { min: 0.1, max: 1, step: 0.05 })
  addBinding(folder, params, 'rippleDecay', setters.rippleDecay, { min: 0.5, max: 5, step: 0.5 })
  addBinding(folder, params, 'rippleWavelength', setters.rippleWavelength, { min: 10, max: 100, step: 5 })
  addBinding(folder, params, 'rippleDuration', setters.rippleDuration, { min: 500, max: 5000, step: 100 })
  return folder
}

/** Add a Rain folder to a pane. */
export function addRainFolder(
  pane: FolderApi,
  params: RainParams,
  setters: SettersFor<RainParams>,
) {
  const folder = pane.addFolder({ title: 'Rain' })
  addBinding(folder, params, 'enableRain', setters.enableRain)
  addBinding(folder, params, 'rainIntensity', setters.rainIntensity, { min: 1, max: 10, step: 0.5 })
  addBinding(folder, params, 'rainVariation', setters.rainVariation, { min: 0, max: 1, step: 0.05 })
  return folder
}
