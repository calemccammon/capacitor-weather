import { Preferences } from '@capacitor/preferences'

import type { KeyValueStore } from './storedSettingsRepository'

/**
 * The device's key-value store, through Capacitor: shared preferences on
 * Android, user defaults on iOS, and local storage in a browser.
 */
export const preferencesStore: KeyValueStore = {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: (key, value) => Preferences.set({ key, value }),
}
