<script setup lang="ts">
import '@material/web/button/filled-tonal-button.js'
import '@material/web/labs/segmentedbutton/outlined-segmented-button.js'
import '@material/web/labs/segmentedbuttonset/outlined-segmented-button-set.js'
import '@material/web/progress/linear-progress.js'

import AppIcon from '../../core/AppIcon.vue'
import { useWording } from '../../core/wording'
import type { HomeState } from '../models/homeState'
import type { UnitsUiModel } from '../models/unitsUiModel'

/**
 * Current conditions and the week ahead for the selected place. It scrolls,
 * so it can live inside the bottom sheet or the side panel.
 */
defineProps<{ state: HomeState }>()

const emit = defineEmits<{
  unitsChange: [units: UnitsUiModel]
  retry: []
}>()

const { t } = useWording()
</script>

<template>
  <div class="panel">
    <header v-if="state.place !== null">
      <h1>{{ state.place.title }}</h1>
      <p v-if="state.place.subtitle !== ''" class="muted">{{ state.place.subtitle }}</p>
    </header>

    <template v-if="state.forecast.kind === 'loaded'">
      <!-- Read out as one sentence. Wraps onto a second line when the text
           is too large for one. -->
      <section
        class="current"
        role="group"
        :aria-label="state.forecast.forecast.current.accessibilityLabel"
      >
        <div class="temperature" aria-hidden="true">
          <AppIcon :name="state.forecast.forecast.current.icon" />
          <span>{{ state.forecast.forecast.current.temperature }}</span>
        </div>
        <div aria-hidden="true">
          <p class="title">{{ state.forecast.forecast.current.condition }}</p>
          <p class="muted">{{ state.forecast.forecast.current.feelsLike }}</p>
          <p class="muted">{{ state.forecast.forecast.current.wind }}</p>
        </div>
      </section>

      <!-- The units choice drops below the heading when the text is too
           large for both on one line. -->
      <div class="week-heading">
        <h2>{{ t('forecast.thisWeek') }}</h2>
        <md-outlined-segmented-button-set :aria-label="t('units.label')">
          <md-outlined-segmented-button
            no-checkmark
            :label="t('units.celsius')"
            :aria-label="t('units.celsiusName')"
            :selected="state.units === 'celsius'"
            @click="emit('unitsChange', 'celsius')"
          />
          <md-outlined-segmented-button
            no-checkmark
            :label="t('units.fahrenheit')"
            :aria-label="t('units.fahrenheitName')"
            :selected="state.units === 'fahrenheit'"
            @click="emit('unitsChange', 'fahrenheit')"
          />
        </md-outlined-segmented-button-set>
      </div>

      <p v-if="state.forecast.forecast.days.length === 0">{{ t('forecast.noDays') }}</p>
      <ul v-else class="week">
        <!-- Each row is read out as one sentence. -->
        <li
          v-for="day in state.forecast.forecast.days"
          :key="day.key"
          :aria-label="day.accessibilityLabel"
        >
          <span aria-hidden="true">{{ day.dayLabel }}</span>
          <AppIcon :name="day.icon" />
          <span class="chance" aria-hidden="true">{{ day.chance }}</span>
          <span class="low" aria-hidden="true">{{ day.low }}</span>
          <span
            class="bar"
            aria-hidden="true"
            :style="{ '--start': day.barStart, '--end': day.barEnd }"
          />
          <span class="high" aria-hidden="true">{{ day.high }}</span>
        </li>
      </ul>

      <p class="credit">{{ t('forecast.credit') }}</p>
    </template>

    <!-- What is happening is read out by a screen reader as it changes:
         loading, then failed. -->
    <div v-else class="status" aria-live="polite">
      <div v-if="state.forecast.kind === 'idle'" class="message">
        <AppIcon class="hint" name="touch" />
        <span>{{ t('forecast.hint') }}</span>
      </div>
      <md-linear-progress
        v-else-if="state.forecast.kind === 'loading'"
        indeterminate
        :aria-label="t('forecast.loading')"
      />
      <template v-else-if="state.forecast.kind === 'failed'">
        <div class="message">
          <AppIcon class="error" name="cloudOff" />
          <span>{{ state.forecast.message }}</span>
        </div>
        <md-filled-tonal-button @click="emit('retry')">
          <AppIcon slot="icon" name="refresh" />
          {{ t('tryAgain') }}
        </md-filled-tonal-button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-lg);
  box-sizing: border-box;
  height: 100%;
  padding: var(--panel-padding, var(--app-space-xl));
  overflow-y: auto;
  color: var(--md-sys-color-on-surface);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 1.5rem;
  font-weight: 400;
}

h2,
.title {
  font-size: 1rem;
  font-weight: 500;
}

.muted {
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.current {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-sm) var(--app-space-lg);
}

.temperature {
  display: flex;
  align-items: center;
  gap: var(--app-space-lg);
  font-size: 2.8125rem;
}

.temperature .icon {
  font-size: 56px;
  color: var(--md-sys-color-primary);
}

.week-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-sm) var(--app-space-lg);
  margin-top: var(--app-space-sm);
}

md-outlined-segmented-button-set {
  width: 160px;
  /* Material draws a segment 40 high; this gives it the 48 a finger needs. */
  --md-outlined-segmented-button-container-height: var(--app-min-touch-target);
}

.week {
  list-style: none;
  margin: 0;
  padding: var(--app-space-sm) 0;
  border-radius: var(--app-shape-medium);
  background: var(--md-sys-color-surface-container-highest);
}

.week li {
  /* Column widths are in text units, so they grow with the reader's text
     size and nothing wraps: room for "Today", "100%" and "-88°". */
  display: grid;
  grid-template-columns: 3.5rem 1.5rem 2.75rem 2.25rem minmax(0, 1fr) 2.25rem;
  align-items: center;
  padding: var(--app-space-sm) var(--app-space-lg);
  white-space: nowrap;
}

.week .icon {
  color: var(--md-sys-color-primary);
}

.chance {
  font-size: 0.75rem;
  text-align: center;
  color: var(--md-sys-color-tertiary);
}

.low,
.high {
  text-align: end;
}

.low {
  color: var(--md-sys-color-on-surface-variant);
}

/* A track for the week's whole temperature range with one day's part of it
   filled in, from --start to --end (each 0 to 1). */
.bar {
  --thickness: 6px;
  /* Never thinner than the bar is tall, or a day whose low and high match
     would vanish. */
  --fill: max(var(--thickness), calc((var(--end) - var(--start)) * 100%));

  position: relative;
  height: var(--thickness);
  margin: 0 var(--app-space-md) 0 var(--app-space-sm);
  border-radius: calc(var(--thickness) / 2);
  background: var(--md-sys-color-surface);
}

.bar::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  /* And never pushed off the end of the track. */
  left: min(calc(var(--start) * 100%), calc(100% - var(--fill)));
  width: var(--fill);
  border-radius: inherit;
  background: var(--md-sys-color-primary);
}

.credit {
  font-size: 0.6875rem;
  color: var(--md-sys-color-on-surface-variant);
}

.status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--app-space-lg);
}

.status md-linear-progress {
  align-self: stretch;
  margin: var(--app-space-xl) 0;
}

.message {
  display: flex;
  align-items: center;
  gap: var(--app-space-lg);
}

.message .hint {
  color: var(--md-sys-color-primary);
}

.message .error {
  color: var(--md-sys-color-error);
}
</style>
