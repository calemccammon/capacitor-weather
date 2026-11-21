import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

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
 * Selecting a place while an earlier forecast is still on its way throws the
 * earlier answer away when it arrives.
 */
export const useHomeStore = defineStore('home', () => {
  const getForecast = need(getForecastKey)
  const saveUnits = need(setUnitsKey)
  const wording = need(wordingKey)

  let place: Place | null = null
  let units: Units = need(getUnitsKey).execute(need(deviceCountryKey))

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
    request++
    state.value = { units: unitsUiModelFrom(units), place: null, forecast: { kind: 'idle' } }
  }

  /**
   * Shows forecasts in `chosen` from now on, and remembers the choice. The
   * forecast on screen is asked for again in them.
   */
  function setUnits(chosen: UnitsUiModel): void {
    const next = unitsUiModelToDomain(chosen)
    if (next === units) return
    units = next
    // Not saved means the next launch starts from the old choice; this one
    // carries on with the new.
    saveUnits.execute(next).catch(() => undefined)

    const shown = state.value.place
    if (shown === null) {
      state.value = { ...state.value, units: chosen }
    } else {
      // The same place as before, so the map has no reason to move.
      void load(shown)
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
    const askedIn = units
    show(shown, askedIn, { kind: 'loading' })

    let outcome: ForecastState
    try {
      const forecast = await getForecast.execute(asked, askedIn)
      outcome = { kind: 'loaded', forecast: forecastUiModelFrom(forecast, askedIn, wording()) }
    } catch (error) {
      outcome = { kind: 'failed', message: messageForError(error, wording().t) }
    }
    if (mine === request) show(shown, askedIn, outcome)
  }

  function show(shown: PlaceUiModel, shownIn: Units, forecast: ForecastState): void {
    state.value = { units: unitsUiModelFrom(shownIn), place: shown, forecast }
  }

  return { state, select, selectPoint, clear, setUnits, retryForecast }
})
