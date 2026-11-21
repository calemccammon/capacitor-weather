import cloudyNight from '@material-symbols/svg-400/rounded/partly_cloudy_night-fill.svg?raw'
import bedtime from '@material-symbols/svg-400/rounded/bedtime-fill.svg?raw'
import close from '@material-symbols/svg-400/rounded/close.svg?raw'
import cloud from '@material-symbols/svg-400/rounded/cloud-fill.svg?raw'
import cloudOff from '@material-symbols/svg-400/rounded/cloud_off.svg?raw'
import foggy from '@material-symbols/svg-400/rounded/foggy-fill.svg?raw'
import help from '@material-symbols/svg-400/rounded/help.svg?raw'
import place from '@material-symbols/svg-400/rounded/location_on.svg?raw'
import partlyCloudy from '@material-symbols/svg-400/rounded/partly_cloudy_day-fill.svg?raw'
import rainy from '@material-symbols/svg-400/rounded/rainy-fill.svg?raw'
import drizzle from '@material-symbols/svg-400/rounded/rainy_light-fill.svg?raw'
import refresh from '@material-symbols/svg-400/rounded/refresh.svg?raw'
import search from '@material-symbols/svg-400/rounded/search.svg?raw'
import searchOff from '@material-symbols/svg-400/rounded/search_off.svg?raw'
import sunny from '@material-symbols/svg-400/rounded/sunny-fill.svg?raw'
import thunderstorm from '@material-symbols/svg-400/rounded/thunderstorm-fill.svg?raw'
import touch from '@material-symbols/svg-400/rounded/touch_app.svg?raw'
import travelExplore from '@material-symbols/svg-400/rounded/travel_explore.svg?raw'
import showers from '@material-symbols/svg-400/rounded/umbrella-fill.svg?raw'
import sleet from '@material-symbols/svg-400/rounded/weather_mix-fill.svg?raw'
import snowy from '@material-symbols/svg-400/rounded/weather_snowy-fill.svg?raw'

/**
 * The icons the app draws: Google's Material Symbols, as the SVG each is
 * published as. Only these are bundled.
 */
export const icons = {
  bedtime,
  close,
  cloud,
  cloudOff,
  cloudyNight,
  drizzle,
  foggy,
  help,
  partlyCloudy,
  place,
  rainy,
  refresh,
  search,
  searchOff,
  showers,
  sleet,
  snowy,
  sunny,
  thunderstorm,
  touch,
  travelExplore,
} as const

export type IconName = keyof typeof icons
