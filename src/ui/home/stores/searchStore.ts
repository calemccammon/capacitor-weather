import { defineStore } from 'pinia'
import { onScopeDispose, shallowRef } from 'vue'

import type { Place } from '../../../domain/models/place'
import { isSearchable } from '../../../domain/useCases/searchPlaces'
import { need, searchPlacesKey, wordingKey } from '../../core/dependencies'
import { messageForError } from '../../core/failureMessages'
import { placeUiModelFrom } from '../models/placeUiModel'
import type { SearchState } from '../models/searchState'
import { useHomeStore } from './homeStore'

/** How long typing must pause before a search is sent. */
export const searchDebounceMs = 350

/**
 * Turns what the user types into search results.
 *
 * It waits for a pause in typing before searching, and an answer that comes
 * back after a newer search has been sent is thrown away.
 */
export const useSearchStore = defineStore('search', () => {
  const searchPlaces = need(searchPlacesKey)
  const wording = need(wordingKey)
  const home = useHomeStore()

  let debounce: ReturnType<typeof setTimeout> | undefined

  /** The text last asked about; what `retry` asks about again. */
  let latestQuery = ''

  /**
   * Counts changes of the query, so an answer can tell whether it is still
   * wanted. The text alone cannot: the same text can be searched for twice.
   */
  let request = 0

  /** The places behind the rows of the current results, in order. */
  let results: readonly Place[] = []

  /** What the search results area shows. */
  const state = shallowRef<SearchState>({ kind: 'idle' })

  // Stops waiting on a pause in typing when the store is done with.
  onScopeDispose(() => {
    clearTimeout(debounce)
    request++
  })

  function queryChanged(text: string): void {
    const query = text.trim()
    if (query === latestQuery) return
    latestQuery = query
    request++
    clearTimeout(debounce)

    if (!isSearchable(query)) {
      state.value = { kind: 'idle' }
      return
    }
    state.value = { kind: 'loading', query }
    debounce = setTimeout(() => void search(query), searchDebounceMs)
  }

  /** Forgets the current query and results, as when the search bar opens. */
  function reset(): void {
    clearTimeout(debounce)
    latestQuery = ''
    request++
    results = []
    state.value = { kind: 'idle' }
  }

  /** Makes the result in row `index` the selected place. */
  function choose(index: number): void {
    const place = results[index]
    if (state.value.kind !== 'results' || place === undefined) return
    home.select(place)
  }

  /** Runs the last search again after a failure. */
  function retry(): void {
    const query = latestQuery
    if (!isSearchable(query)) return
    clearTimeout(debounce)
    request++
    state.value = { kind: 'loading', query }
    void search(query)
  }

  async function search(query: string): Promise<void> {
    const mine = request
    const { t } = wording()
    let places: Place[] = []
    let found: SearchState
    try {
      places = await searchPlaces.execute(query)
      found =
        places.length === 0
          ? { kind: 'empty', query }
          : { kind: 'results', query, places: places.map((place) => placeUiModelFrom(place, t)) }
    } catch (error) {
      found = { kind: 'failed', query, message: messageForError(error, t) }
    }
    if (mine !== request) return
    results = places
    state.value = found
  }

  return { state, queryChanged, reset, choose, retry }
})
