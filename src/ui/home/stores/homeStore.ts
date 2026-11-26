import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import { inUnits, type Forecast } from '../../../domain/models/forecast'
import { placeFromCoordinates, type Place } from '../../../domain/models/place'
import type { Units } from '../../../domain/models/units'
import {
  deviceCountryKey,
  getForecastKey,
  getUnitsKey,
  need,
  setUnitsKey,
  wordingKey,
} from '../../core/dependencies'
import { messageForError } from '../../core/failureMessages'
import { forecastUiModelFrom } from '../models/forecastUiModel'
import type { ForecastState, HomeState } from '../models/homeState'
import { placeUiModelFrom, type PlaceUiModel } from '../models/placeUiModel'
import { unitsUiModelFrom, unitsUiModelToDomain, type UnitsUiModel } from '../models/unitsUiModel'

/**
 * Holds the selected place and the chosen units, and loads the forecast.
 *
 * The forecast is kept as it came, in metric units, and converted for the
 * screen, so changing units needs no request.
 *
 * Selecting a place while an earlier forecast is still on its way throws the
 * earlier answer away when it arrives.
 */
export const useHomeStore = defineStore('home', () => {
  const getForecast = need(getForecastKey)
  const saveUnits = need(setUnitsKey)
  const wording = need(wordingKey)

  let place: Place | null = null
  let units: Units = need(getUnitsKey).execute(need(deviceCountryKey))
  /** The forecast on screen, in metric units, or null when none is. */
  let shownForecast: Forecast | null = null

  /**
   * Counts forecast requests, so an answer can tell whether it is still the
   * newest one.
   */
  let request = 0

  /** What the screen shows. */
  const state = shallowRef<HomeState>({
    units: unitsUiModelFrom(units),
    place: null,
    forecast: { kind: 'idle' },
  })

  /** Makes `chosen` the selected place and loads its forecast. */
  function select(chosen: Place): void {
    place = chosen
    void load(placeUiModelFrom(chosen, wording().t))
  }

  /** Selects a point picked straight off the map. */
  function selectPoint(latitude: number, longitude: number): void {
    select(placeFromCoordinates(latitude, longitude))
  }

  function clear(): void {
    place = null
    shownForecast = null
    request++
    state.value = { units: unitsUiModelFrom(units), place: null, forecast: { kind: 'idle' } }
  }

  /**
   * Shows forecasts in `chosen` from now on, and remembers the choice. The
   * forecast on screen is converted on the spot, with no request.
   */
  function setUnits(chosen: UnitsUiModel): void {
    const next = unitsUiModelToDomain(chosen)
    if (next === units) return
    units = next
    // Not saved means the next launch starts from the old choice; this one
    // carries on with the new.
    saveUnits.execute(next).catch(() => undefined)

    // The same place as before, so the map has no reason to move. A forecast
    // still loading or failed stays as it is.
    state.value = {
      ...state.value,
      units: chosen,
      ...(shownForecast === null ? {} : { forecast: loaded(shownForecast) }),
    }
  }

  /** Asks for the selected place's forecast again, after a failure. */
  function retryForecast(): void {
    const shown = state.value.place
    if (shown !== null) void load(shown)
  }

  async function load(shown: PlaceUiModel): Promise<void> {
    const asked = place
    if (asked === null) return
    const mine = ++request
    shownForecast = null
    show(shown, { kind: 'loading' })

    let forecast: Forecast | null = null
    let failure: unknown
    try {
      forecast = await getForecast.execute(asked)
    } catch (error) {
      failure = error
    }
    if (mine !== request) return
    // In the units chosen now, which may not be those chosen when it was asked for.
    shownForecast = forecast
    show(
      shown,
      forecast === null
        ? { kind: 'failed', message: messageForError(failure, wording().t) }
        : loaded(forecast),
    )
  }

  /** The metric `forecast` as the screen shows it, in the units chosen. */
  function loaded(forecast: Forecast): ForecastState {
    return {
      kind: 'loaded',
      forecast: forecastUiModelFrom(inUnits(forecast, units), units, wording()),
    }
  }

  function show(shown: PlaceUiModel, forecast: ForecastState): void {
    state.value = { units: unitsUiModelFrom(units), place: shown, forecast }
  }

  return { state, select, selectPoint, clear, setUnits, retryForecast }
})
