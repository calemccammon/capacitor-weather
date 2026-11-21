<script setup lang="ts">
import { icons, type IconName } from './icons'

/** One of the app's icons, in the colour and size of the text around it. */
defineProps<{ name: IconName }>()
</script>

<template>
  <!-- The SVG is one of the app's own bundled files, never anything typed or fetched. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span class="icon" aria-hidden="true" v-html="icons[name]" />
</template>

<style scoped>
.icon {
  display: inline-flex;
  flex: none;
  width: 1em;
  height: 1em;
  font-size: 24px;
}

.icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}
</style>
