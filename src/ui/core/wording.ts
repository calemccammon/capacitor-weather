import { useI18n } from 'vue-i18n'

import type { Translate } from '../../l10n/i18n'

/**
 * The app's wording, for a component. `t` here takes only the keys of
 * `en.json`, so a misspelt one does not compile; vue-i18n's own takes any
 * text.
 */
export function useWording(): { t: Translate } {
  return { t: useI18n().t as Translate }
}
