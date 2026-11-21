<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * A sheet that rests over the bottom of the screen and is pulled up by its
 * handle. Material Web has no bottom sheet of its own.
 */
const props = defineProps<{
  /** How much of the sheet shows while it is at rest, in pixels. */
  restingHeight: number
  /** How tall the sheet is when it is pulled right up, in pixels. */
  expandedHeight: number
  /** Screen-reader names for the handle, by what pressing it would do. */
  expandLabel: string
  collapseLabel: string
}>()

/** A drag has to carry the sheet this far towards the other stop to take it there. */
const snapFraction = 0.25

/** A press that moves less than this is a press, not a drag. */
const pressSlopPx = 4

const expanded = ref(false)

/** How far the sheet has been dragged down from its stop, while a drag is under way. */
const dragged = ref<number | null>(null)
let dragStartY = 0

/**
 * The sheet is always as tall as it gets; at rest it is pushed down so that
 * only its top shows. This is how far.
 */
const restingOffset = computed(() => Math.max(0, props.expandedHeight - props.restingHeight))
const stop = computed(() => (expanded.value ? 0 : restingOffset.value))
const offset = computed(() =>
  dragged.value === null
    ? stop.value
    : Math.min(restingOffset.value, Math.max(0, stop.value + dragged.value)),
)

function onPointerDown(event: PointerEvent): void {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  dragStartY = event.clientY
  dragged.value = 0
}

function onPointerMove(event: PointerEvent): void {
  if (dragged.value !== null) dragged.value = event.clientY - dragStartY
}

function onPointerUp(): void {
  if (dragged.value === null) return
  const moved = dragged.value
  const enough = restingOffset.value * snapFraction
  if (Math.abs(moved) < pressSlopPx) toggle()
  else if (expanded.value && moved > enough) expanded.value = false
  else if (!expanded.value && moved < -enough) expanded.value = true
  dragged.value = null
}

/** A press of the handle, or its key, moves the sheet to its other stop. */
function toggle(): void {
  expanded.value = !expanded.value
}
</script>

<template>
  <section
    class="sheet"
    :class="{ dragging: dragged !== null }"
    :style="{ height: `${expandedHeight}px`, transform: `translateY(${offset}px)` }"
  >
    <button
      class="handle"
      type="button"
      :aria-label="expanded ? collapseLabel : expandLabel"
      :aria-expanded="expanded"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <span class="grip" />
    </button>
    <div class="body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--app-shape-extra-large) var(--app-shape-extra-large) 0 0;
  background: var(--md-sys-color-surface-container-low);
  box-shadow: var(--app-elevation-1);
  transition: transform 200ms ease-out;
}

/* Under the finger, the sheet moves at once. */
.sheet.dragging {
  transition: none;
}

.handle {
  flex: none;
  display: grid;
  place-items: center;
  height: var(--app-min-touch-target);
  border: 0;
  border-radius: inherit;
  background: none;
  cursor: grab;
  /* The drag is the sheet's, not the page's scroll. */
  touch-action: none;
}

.grip {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: var(--md-sys-color-on-surface-variant);
  opacity: 0.4;
}

.body {
  flex: 1;
  min-height: 0;
}
</style>
