import type { Translate } from '../../l10n/i18n'

import { WeatherError, type WeatherFailure } from '../../domain/repositories/weatherRepository'

/** What to tell the user about each kind of failure. */
export function failureMessage(failure: WeatherFailure, t: Translate): string {
  return t(`failure.${failure}`)
}

/**
 * The message for whatever was thrown: a `WeatherError`'s own, or a general
 * one for anything unexpected.
 */
export function messageForError(error: unknown, t: Translate): string {
  return error instanceof WeatherError ? failureMessage(error.failure, t) : t('failure.unexpected')
}
