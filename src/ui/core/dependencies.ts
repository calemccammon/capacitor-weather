import { inject, type InjectionKey } from 'vue'

import type { GetForecast } from '../../domain/useCases/getForecast'
import type { GetUnits } from '../../domain/useCases/getUnits'
import type { SearchPlaces } from '../../domain/useCases/searchPlaces'
import type { SetUnits } from '../../domain/useCases/setUnits'
import type { Wording } from '../../l10n/i18n'

/*
 * What the UI needs handed to it.
 *
 * The stores ask for use cases by these keys and nothing more. How a use
 * case is built, and over which repository, is decided in `src/di`, which
 * provides each one when the app starts. So nothing in `ui` imports `di` or
 * `data`.
 */

export const searchPlacesKey: InjectionKey<SearchPlaces> = Symbol('SearchPlaces')
export const getForecastKey: InjectionKey<GetForecast> = Symbol('GetForecast')
export const getUnitsKey: InjectionKey<GetUnits> = Symbol('GetUnits')
export const setUnitsKey: InjectionKey<SetUnits> = Symbol('SetUnits')

/** The app's wording as it is now; asked for each time something is worded. */
export const wordingKey: InjectionKey<() => Wording> = Symbol('Wording')

/** The country the device is set to, such as "US", or null if it does not say. */
export const deviceCountryKey: InjectionKey<string | null> = Symbol('DeviceCountry')

/** What was provided under `key`. Fails loudly if `src/di` has not provided it. */
export function need<T>(key: InjectionKey<T>): T {
  const provided = inject(key)
  if (provided === undefined) {
    throw new Error(`${String(key.description)} has not been provided. See src/di/dependencies.ts.`)
  }
  return provided
}
