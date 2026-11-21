import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { provideDependencies } from '../di/dependencies'
import { createI18n } from '../l10n/i18n'
import { useHomeStore } from '../ui/home/stores/homeStore'
import { useSearchStore } from '../ui/home/stores/searchStore'
import { FakeSettingsRepository, FakeWeatherRepository } from './fakes'

export interface Stores {
  readonly weather: FakeWeatherRepository
  readonly settings: FakeSettingsRepository
  readonly home: ReturnType<typeof useHomeStore>
  readonly search: ReturnType<typeof useSearchStore>
}

/** The stores, wired as the app wires them, over repositories the test controls. */
export function makeStores(
  options: { settings?: FakeSettingsRepository; deviceCountry?: string | null } = {},
): Stores {
  const weather = new FakeWeatherRepository()
  const settings = options.settings ?? new FakeSettingsRepository()
  const app = createApp({ render: () => null })
  app.use(createPinia())
  provideDependencies(app, {
    weatherRepository: weather,
    settingsRepository: settings,
    i18n: createI18n(['en']),
    deviceCountry: options.deviceCountry === undefined ? 'US' : options.deviceCountry,
  })
  return app.runWithContext(() => ({
    weather,
    settings,
    home: useHomeStore(),
    search: useSearchStore(),
  }))
}
