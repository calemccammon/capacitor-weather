<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'

import maplibregl, {
  type LngLat,
  type MapMouseEvent,
  type MapTouchEvent,
  type Point,
} from 'maplibre-gl'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

/** Where the pin goes. */
export interface MapPin {
  readonly latitude: number
  readonly longitude: number
}

/** How much of each edge of the map something else is covering, in pixels. */
export interface MapInsets {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

/**
 * The map behind everything else, drawn with MapLibre GL JS. A press held in
 * one spot picks the point under it.
 */
const props = defineProps<{
  /** Where the pin goes, or null for no pin. */
  pin: MapPin | null
  /**
   * The parts of the map the search bar and forecast cover. The pin is put
   * in the middle of what is left.
   */
  covered: MapInsets
  dark: boolean
  /** Screen-reader names for the map and its pin. */
  label: string
  pinLabel: string
}>()

const emit = defineEmits<{
  /** A press-and-hold on the map, at the point under it. */
  longPress: [point: MapPin]
}>()

/** OpenFreeMap's hosted styles: free, no key, and no request limit. */
const styleUrl = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const

const view = {
  initialCenter: [0, 25] as [number, number],
  initialZoom: 1.5,
  minZoom: 1,
  maxZoom: 18,
  /** How far in the map goes when a place is chosen from further out. */
  placeZoom: 10,
  moveDurationMs: 600,
} as const

/** How long a press must be held, and how far it may wander, to count. */
const longPressMs = 500
const longPressSlopPx = 8

const container = useTemplateRef<HTMLDivElement>('container')
let map: maplibregl.Map | undefined
let marker: maplibregl.Marker | undefined

onMounted(() => {
  if (container.value === null) return
  map = new maplibregl.Map({
    container: container.value,
    style: props.dark ? styleUrl.dark : styleUrl.light,
    center: view.initialCenter,
    zoom: view.initialZoom,
    minZoom: view.minZoom,
    maxZoom: view.maxZoom,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    // The credit is drawn by the screen, where the forecast cannot cover it.
    attributionControl: false,
  })
  map.touchZoomRotate.disableRotation()
  watchForLongPress(map, ({ lat, lng }) => emit('longPress', { latitude: lat, longitude: lng }))

  // A place may have been chosen before the map existed.
  showPin()
  moveToPin()
})

onBeforeUnmount(() => map?.remove())

watch(
  () => props.dark,
  (dark) => {
    map?.setStyle(dark ? styleUrl.dark : styleUrl.light)
    // The pin is in the theme's colour.
    showPin()
  },
)
watch(() => props.pin, showPin)
// Selecting a place, or a change in what covers the map, moves the map so
// the pin sits in the clear.
watch([() => props.pin, () => props.covered], moveToPin)

function showPin(): void {
  marker?.remove()
  marker = undefined
  if (props.pin === null || map === undefined || container.value === null) return

  const color = getComputedStyle(container.value).getPropertyValue('--md-sys-color-primary').trim()
  // The default marker is a pin whose tip sits on the point.
  marker = new maplibregl.Marker({ color })
    .setLngLat([props.pin.longitude, props.pin.latitude])
    .addTo(map)
  marker.getElement().setAttribute('aria-label', props.pinLabel)
}

function moveToPin(): void {
  if (props.pin === null || map === undefined) return
  map.easeTo({
    center: [props.pin.longitude, props.pin.latitude],
    zoom: Math.max(map.getZoom(), view.placeZoom),
    padding: props.covered,
    duration: view.moveDurationMs,
  })
}

/**
 * MapLibre GL JS has no long-press event, so one is made from a press that
 * is held in one spot.
 */
function watchForLongPress(on: maplibregl.Map, onLongPress: (lngLat: LngLat) => void): void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let start: Point | undefined

  const cancel = () => {
    clearTimeout(timer)
    start = undefined
  }
  const begin = (event: MapMouseEvent | MapTouchEvent) => {
    cancel()
    // A second finger means a pinch, not a press.
    if ('points' in event && event.points.length > 1) return
    start = event.point
    timer = setTimeout(() => onLongPress(event.lngLat), longPressMs)
  }
  const moved = (event: MapMouseEvent | MapTouchEvent) => {
    if (start !== undefined && start.dist(event.point) > longPressSlopPx) cancel()
  }

  on.on('mousedown', begin)
  on.on('touchstart', begin)
  on.on('mousemove', moved)
  on.on('touchmove', moved)
  on.on('mouseup', cancel)
  on.on('touchend', cancel)
  on.on('touchcancel', cancel)
  on.on('movestart', cancel)
  // A held press must not also open the browser's own menu.
  on.on('contextmenu', (event: MapMouseEvent) => event.preventDefault())
}
</script>

<template>
  <div ref="container" class="map" role="application" :aria-label="label" />
</template>

<style scoped>
.map {
  position: absolute;
  inset: 0;
}
</style>
