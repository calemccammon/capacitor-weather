import { onScopeDispose, readonly, ref, type Ref } from 'vue'

/**
 * Whether `query`, a CSS media query, matches, kept up to date as the window
 * or the system's settings change.
 */
export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const list = window.matchMedia(query)
  const matches = ref(list.matches)
  const update = () => (matches.value = list.matches)
  list.addEventListener('change', update)
  onScopeDispose(() => list.removeEventListener('change', update))
  return readonly(matches)
}

/** The window's height in pixels, kept up to date. */
export function useWindowHeight(): Readonly<Ref<number>> {
  const height = ref(window.innerHeight)
  const update = () => (height.value = window.innerHeight)
  window.addEventListener('resize', update)
  onScopeDispose(() => window.removeEventListener('resize', update))
  return readonly(height)
}
