import './ui/core/theme.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { OpenMeteoWeatherRepository } from './data/repositories/openMeteoWeatherRepository'
import { preferencesStore } from './data/repositories/preferencesStore'
import { StoredSettingsRepository } from './data/repositories/storedSettingsRepository'
import { provideDependencies } from './di/dependencies'
import { createI18n } from './l10n/i18n'

/** The country the device is set to, such as "US", or null if it does not say. */
function deviceCountry(): string | null {
  try {
    return new Intl.Locale(navigator.language).region ?? null
  } catch {
    // A language tag the browser itself cannot read.
    return null
  }
}

async function main(): Promise<void> {
  const i18n = createI18n(navigator.languages)
  const app = createApp(App)

  provideDependencies(app, {
    weatherRepository: new OpenMeteoWeatherRepository((url, init) => fetch(url, init)),
    // Read before the app starts, so the saved units are there from the first frame.
    settingsRepository: await StoredSettingsRepository.open(preferencesStore),
    i18n,
    deviceCountry: deviceCountry(),
  })
  app.use(createPinia())
  app.use(i18n)
  app.mount('#app')
}

void main()
