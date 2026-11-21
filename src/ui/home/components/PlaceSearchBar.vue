<script setup lang="ts">
import '@material/web/button/text-button.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/progress/linear-progress.js'

import { computed, ref } from 'vue'

import AppIcon from '../../core/AppIcon.vue'
import { useWording } from '../../core/wording'
import type { SearchState } from '../models/searchState'

/**
 * Material 3 search bar that opens into a list of matching places.
 *
 * Closed, it shows the selected place's name. Open, it holds what is being
 * typed and shows `search` under itself. It does no searching of its own: it
 * reports what was typed and which row was chosen.
 */
const props = defineProps<{
  /** The selected place's name, or null when no place is selected. */
  placeTitle: string | null
  search: SearchState
}>()

/** Whether the bar is open for typing, with its results under it. */
const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  queryChange: [text: string]
  /** The row of the results the user chose. */
  choose: [index: number]
  retry: []
  /** The user pressed the button that deselects the place. */
  clearPlace: []
}>()

const { t } = useWording()

/** What has been typed since the bar opened. */
const typed = ref('')

/** What the bar shows: what is being typed, or the place's name. */
const text = computed(() => (open.value ? typed.value : (props.placeTitle ?? '')))

function onFocus(): void {
  if (open.value) return
  // Opening starts from an empty search: the place's name is a label, not
  // something to search for.
  typed.value = ''
  open.value = true
}

function onInput(event: Event): void {
  typed.value = (event.target as HTMLInputElement).value
  emit('queryChange', typed.value)
}

function onChoose(index: number): void {
  emit('choose', index)
  open.value = false
}
</script>

<template>
  <div class="bar" :class="{ open }">
    <label class="field">
      <AppIcon name="search" />
      <input
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :value="text"
        :placeholder="t('search.hint')"
        :aria-label="t('search.hint')"
        @focus="onFocus"
        @input="onInput"
        @keydown.escape="open = false"
      />
      <md-icon-button
        v-if="placeTitle !== null && !open"
        :aria-label="t('search.clear')"
        @click="emit('clearPlace')"
      >
        <AppIcon name="close" />
      </md-icon-button>
    </label>

    <div v-if="open" class="results">
      <md-list v-if="search.kind === 'results'">
        <md-list-item
          v-for="(place, index) in search.places"
          :key="index"
          type="button"
          @click="onChoose(index)"
        >
          <AppIcon slot="start" name="place" />
          <div slot="headline">{{ place.title }}</div>
          <div v-if="place.subtitle !== ''" slot="supporting-text">{{ place.subtitle }}</div>
        </md-list-item>
      </md-list>

      <!-- What is happening is read out by a screen reader as it changes:
           searching, then what came of it. -->
      <div v-else class="status" aria-live="polite">
        <div v-if="search.kind === 'idle'" class="message">
          <AppIcon name="travelExplore" />
          <span>{{ t('search.prompt') }}</span>
        </div>
        <md-linear-progress
          v-else-if="search.kind === 'loading'"
          indeterminate
          :aria-label="t('search.searching')"
        />
        <div v-else-if="search.kind === 'empty'" class="message">
          <AppIcon name="searchOff" />
          <span>{{ t('search.nothingFound', { query: search.query }) }}</span>
        </div>
        <div v-else-if="search.kind === 'failed'" class="message">
          <AppIcon name="cloudOff" />
          <span>{{ search.message }}</span>
          <md-text-button @click="emit('retry')">{{ t('tryAgain') }}</md-text-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  border-radius: var(--app-shape-extra-large);
  background: var(--md-sys-color-surface-container-high);
  box-shadow: var(--app-elevation-3);
  color: var(--md-sys-color-on-surface);
  overflow: hidden;
}

.field {
  display: flex;
  align-items: center;
  gap: var(--app-space-lg);
  height: var(--app-search-bar-height);
  padding: 0 var(--app-space-xs) 0 var(--app-space-lg);
}

input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 1rem;
}

input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

/* The browser's own clear button: the bar has its own. */
input::-webkit-search-cancel-button {
  display: none;
}

.results {
  border-top: 1px solid var(--md-sys-color-outline-variant);
  max-height: var(--results-max-height, 50vh);
  overflow-y: auto;
}

md-list {
  --md-list-container-color: transparent;
}

.status {
  min-height: 4px;
}

.message {
  display: flex;
  align-items: center;
  gap: var(--app-space-lg);
  padding: var(--app-space-md) var(--app-space-lg);
  color: var(--md-sys-color-on-surface-variant);
}

.message span {
  flex: 1;
}
</style>
