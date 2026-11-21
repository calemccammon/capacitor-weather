<script setup lang="ts">
import { computed, ref } from 'vue'

import { useMediaQuery, useWindowHeight } from '../core/window'
import { useWording } from '../core/wording'
import BottomSheet from './components/BottomSheet.vue'
import ForecastPanel from './components/ForecastPanel.vue'
import PlaceSearchBar from './components/PlaceSearchBar.vue'
import WeatherMap, { type MapInsets, type MapPin } from './components/WeatherMap.vue'
import { useHomeStore } from './stores/homeStore'
import { useSearchStore } from './stores/searchStore'

/*
 * The app's one screen: a map, a search bar over it, and the forecast for
 * the selected place.
 *
 * On a phone the forecast is a bottom sheet that drags up over the map. From
 * Material's "expanded" window width up, it is a panel at the side.
 */

/** Material's "expanded" window width: room for a panel beside the map. */
const expandedBreakpointPx = 840

// Sizes the map is told about. The same ones are in the styles below.
const sidePanelWidthPx = 400
const searchBarHeightPx = 56
const marginPx = 16
const gapPx = 12

/** How much of the screen's height the bottom sheet takes at rest. */
const sheetResting = 0.3

const { t } = useWording()
const home = useHomeStore()
const search = useSearchStore()

const searchOpen = ref(false)
const isWide = useMediaQuery(`(min-width: ${expandedBreakpointPx}px)`)
const dark = useMediaQuery('(prefers-color-scheme: dark)')
const height = useWindowHeight()

const underSearchBar = marginPx + searchBarHeightPx + gapPx
const sheetRestingHeight = computed(() => height.value * sheetResting)
// Pulled right up, the sheet stops just under the search bar.
const sheetExpandedHeight = computed(() => height.value - underSearchBar)

const pin = computed<MapPin | null>(() => {
  const place = home.state.place
  return place === null ? null : { latitude: place.latitude, longitude: place.longitude }
})

/**
 * What covers the map, so the selected place can be shown in the clear. It
 * changes when the window crosses between the two layouts (a rotated phone,
 * a resized window), and the map then moves the place again.
 */
const covered = computed<MapInsets>(() =>
  isWide.value
    ? { top: 0, right: 0, bottom: 0, left: sidePanelWidthPx + marginPx * 2 }
    : { top: underSearchBar, right: 0, bottom: sheetRestingHeight.value, left: 0 },
)

function onSearchOpenChange(open: boolean): void {
  if (open) search.reset()
  searchOpen.value = open
}
</script>

<template>
  <main class="screen">
    <WeatherMap
      :pin="pin"
      :covered="covered"
      :dark="dark"
      :label="t('map.label')"
      :pin-label="t('map.selectedPlace')"
      @long-press="home.selectPoint($event.latitude, $event.longitude)"
    />

    <!-- The map's makers ask for their credit to stay visible. On a phone it
         sits just above the sheet where it rests. -->
    <p
      class="credit"
      :style="
        isWide ? undefined : { bottom: `calc(${sheetRestingHeight}px + var(--app-space-sm))` }
      "
    >
      {{ t('map.credit') }}
    </p>

    <!-- The sheet's look, rounded on every corner since it floats clear of
         the window's edges. -->
    <section v-if="isWide" class="side-panel">
      <ForecastPanel
        :state="home.state"
        @units-change="home.setUnits"
        @retry="home.retryForecast"
      />
    </section>
    <BottomSheet
      v-else
      :resting-height="sheetRestingHeight"
      :expanded-height="sheetExpandedHeight"
      :expand-label="t('forecast.expand')"
      :collapse-label="t('forecast.collapse')"
    >
      <ForecastPanel
        class="in-sheet"
        :state="home.state"
        @units-change="home.setUnits"
        @retry="home.retryForecast"
      />
    </BottomSheet>

    <!-- A press anywhere else closes the search results. This is for a finger
         or a mouse only: from the keyboard, Escape in the search bar does it. -->
    <div v-if="searchOpen" class="scrim" aria-hidden="true" @click="onSearchOpenChange(false)" />

    <!-- Last, so its results lie over everything else. -->
    <PlaceSearchBar
      class="search"
      :class="{ wide: isWide }"
      :place-title="home.state.place?.title ?? null"
      :search="search.state"
      :open="searchOpen"
      @update:open="onSearchOpenChange"
      @query-change="search.queryChanged"
      @choose="search.choose"
      @retry="search.retry"
      @clear-place="home.clear"
    />
  </main>
</template>

<style scoped>
.screen {
  /* Shared with the script, which tells the map what covers it. */
  --side-panel-width: 400px;
  --margin: 16px;
  --gap: 12px;

  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--md-sys-color-surface);
}

.search {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + var(--margin));
  left: calc(env(safe-area-inset-left, 0px) + var(--margin));
  right: calc(env(safe-area-inset-right, 0px) + var(--margin));
}

.search.wide {
  right: auto;
  width: var(--side-panel-width);
}

.side-panel {
  position: absolute;
  top: calc(
    env(safe-area-inset-top, 0px) + var(--margin) + var(--app-search-bar-height) + var(--gap)
  );
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--margin));
  left: calc(env(safe-area-inset-left, 0px) + var(--margin));
  width: var(--side-panel-width);
  border-radius: var(--app-shape-extra-large);
  background: var(--md-sys-color-surface-container-low);
  box-shadow: var(--app-elevation-1);
  overflow: hidden;
}

/* The sheet's handle already gives room above. */
.in-sheet {
  --panel-padding: 0 var(--app-space-xl) var(--app-space-xl);
}

.scrim {
  position: absolute;
  inset: 0;
}

.credit {
  position: absolute;
  right: calc(env(safe-area-inset-right, 0px) + var(--app-space-sm));
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--app-space-sm));
  margin: 0;
  padding: var(--app-space-xxs) var(--app-space-xs);
  border-radius: var(--app-shape-extra-small);
  background: color-mix(in srgb, var(--md-sys-color-surface) 80%, transparent);
  color: var(--md-sys-color-on-surface);
  font-size: 0.6875rem;
  pointer-events: none;
}
</style>
