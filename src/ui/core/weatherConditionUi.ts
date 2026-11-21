import type { Translate } from '../../l10n/i18n'

import type { WeatherCondition } from '../../domain/models/weatherCondition'
import type { IconName } from './icons'

/** How a weather condition is worded. */
export function conditionLabel(condition: WeatherCondition, t: Translate): string {
  return t(`condition.${condition}`)
}

const conditionIcons: Readonly<
  Record<WeatherCondition, IconName | { day: IconName; night: IconName }>
> = {
  clear: { day: 'sunny', night: 'bedtime' },
  mostlyClear: { day: 'sunny', night: 'bedtime' },
  partlyCloudy: { day: 'partlyCloudy', night: 'cloudyNight' },
  overcast: 'cloud',
  fog: 'foggy',
  drizzle: 'drizzle',
  freezingDrizzle: 'sleet',
  rain: 'rainy',
  freezingRain: 'sleet',
  snow: 'snowy',
  rainShowers: 'showers',
  snowShowers: 'snowy',
  thunderstorm: 'thunderstorm',
  unknown: 'help',
}

/** How a weather condition is drawn. Clear and partly cloudy skies differ at night. */
export function conditionIcon(condition: WeatherCondition, isDay = true): IconName {
  const icon = conditionIcons[condition]
  if (typeof icon === 'string') return icon
  return isDay ? icon.day : icon.night
}
