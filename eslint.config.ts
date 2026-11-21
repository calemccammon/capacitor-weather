import type { Linter } from 'eslint'
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

/**
 * A rule set for one layer: the files under `files` may not import anything
 * matching `forbidden`. Tests are left out, since they bring in fakes.
 */
function layer(files: string | string[], message: string, forbidden: string[]): Linter.Config {
  return {
    name: `app/layer/${[files].flat()[0]}`,
    files: [files].flat(),
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: forbidden, message }] }],
    },
  }
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    'android/**',
    'playwright-report/**',
  ]),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'app/custom-elements',
    files: ['**/*.vue'],
    rules: {
      // Material Web's components are custom elements, whose slots are
      // filled with the `slot` attribute. Vue's own `v-slot` is not for them.
      'vue/no-deprecated-slot-attribute': 'off',
    },
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  // Clean Architecture: dependencies point inward only. Each layer is barred
  // from importing what lies outside it.
  layer(
    'src/domain/**/*.ts',
    'The domain imports nothing but itself: no other layer and no library.',
    [
      '**/data/**',
      '**/ui/**',
      '**/di/**',
      '**/l10n/**',
      'vue',
      'vue-i18n',
      'pinia',
      '@capacitor/*',
      '@material/*',
      'maplibre-gl',
    ],
  ),
  layer(
    'src/data/**/*.ts',
    'Data implements the domain and knows nothing of the screen or the wiring.',
    ['**/ui/**', '**/di/**', '**/l10n/**', 'vue', 'vue-i18n', 'pinia'],
  ),
  layer(
    'src/ui/**/*.{ts,vue}',
    'The screen reaches data only through the domain, and is handed what it needs.',
    ['**/data/**', '**/di/**', '@capacitor/*'],
  ),
  layer(
    ['src/ui/home/components/**/*.vue', 'src/ui/home/HomeScreen.vue'],
    'Components draw UI models and know nothing of the domain, the data or the wiring.',
    ['**/domain/**', '**/data/**', '**/di/**', '@capacitor/*'],
  ),

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
