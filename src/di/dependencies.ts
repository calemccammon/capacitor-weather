import type { App } from 'vue'

import type { SettingsRepository } from '../domain/repositories/settingsRepository'
import type { WeatherRepository } from '../domain/repositories/weatherRepository'
import { GetForecast } from '../domain/useCases/getForecast'
import { GetUnits } from '../domain/useCases/getUnits'
import { SearchPlaces } from '../domain/useCases/searchPlaces'
import { SetUnits } from '../domain/useCases/setUnits'
import { wordingOf, type AppI18n } from '../l10n/i18n'
import {
  deviceCountryKey,
  getForecastKey,
  getUnitsKey,
  searchPlacesKey,
  setUnitsKey,
  wordingKey,
} from '../ui/core/dependencies'

/** What `provideDependencies` is given: the implementations and the device's facts. */
export interface Parts {
  readonly weatherRepository: WeatherRepository
  readonly settingsRepository: SettingsRepository
  readonly i18n: AppI18n
  /** The country the device is set to, such as "US", if it says. */
  readonly deviceCountry: string | null
}

/**
 * Builds the use cases over the given repositories and provides them to
 * `app` under the keys the UI asks by. This is the one place that knows how
 * each is built; tests call it with fakes, `main.ts` with the real ones.
 */
export function provideDependencies(app: App, parts: Parts): void {
  app.provide(searchPlacesKey, new SearchPlaces(parts.weatherRepository))
  app.provide(getForecastKey, new GetForecast(parts.weatherRepository))
  app.provide(getUnitsKey, new GetUnits(parts.settingsRepository))
  app.provide(setUnitsKey, new SetUnits(parts.settingsRepository))
  app.provide(wordingKey, () => wordingOf(parts.i18n))
  app.provide(deviceCountryKey, parts.deviceCountry)
}
