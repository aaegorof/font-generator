import type { Settings, TextInput } from '../types'

export interface PersistedState {
  settings: Settings
  textInputs: TextInput[]
  toolbarOpen: boolean
  layerFontPins: Record<number, string>
  disabledImages: string[]
}

export function validateUserProfile(state: PersistedState): void {
  // Validate settings
  if (!state.settings || typeof state.settings !== 'object') {
    throw new Error('Invalid settings')
  }

  if (typeof state.settings.columns !== 'number' || state.settings.columns < 1) {
    throw new Error('Invalid columns value')
  }

  if (typeof state.settings.padding !== 'number' || state.settings.padding < 0) {
    throw new Error('Invalid padding value')
  }

  if (
    typeof state.settings.overlayOpacity !== 'number' ||
    state.settings.overlayOpacity < 0 ||
    state.settings.overlayOpacity > 1
  ) {
    throw new Error('Invalid overlayOpacity value')
  }

  if (typeof state.settings.grayscale !== 'boolean') {
    throw new Error('Invalid grayscale value')
  }

  // Validate text inputs
  if (!Array.isArray(state.textInputs)) {
    throw new Error('Invalid textInputs')
  }

  state.textInputs.forEach((input, index) => {
    if (!input.id || typeof input.id !== 'string') {
      throw new Error(`Invalid textInput id at index ${index}`)
    }
    if (typeof input.text !== 'string') {
      throw new Error(`Invalid textInput text at index ${index}`)
    }
    if (typeof input.fontSize !== 'number' || input.fontSize <= 0) {
      throw new Error(`Invalid textInput fontSize at index ${index}`)
    }
  })

  // Validate other fields
  if (typeof state.toolbarOpen !== 'boolean') {
    throw new Error('Invalid toolbarOpen')
  }

  if (typeof state.layerFontPins !== 'object' || state.layerFontPins === null) {
    throw new Error('Invalid layerFontPins')
  }

  if (!Array.isArray(state.disabledImages)) {
    throw new Error('Invalid disabledImages')
  }
}
