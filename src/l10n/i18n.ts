import { createI18n as createVueI18n, type I18n } from 'vue-i18n'

import en from './en.json'

/** Every string the user sees or hears, by language. A second language is one more file. */
export const messages = { en } as const

export const fallbackLanguage = 'en'

/** The dotted paths of every string in `en.json`, such as "search.hint". */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`
}[keyof T & string]

export type MessageKey = Paths<typeof en>

/** Looks a string up by its key, filling its gaps from `named`. A misspelt key does not compile. */
export type Translate = (key: MessageKey, named?: Record<string, unknown>) => string

/** The words to use and the language they are in, such as "en". */
export interface Wording {
  readonly t: Translate
  readonly language: string
}

export type AppI18n = I18n<
  typeof messages,
  Record<string, never>,
  Record<string, never>,
  string,
  false
>

/**
 * The app's wording, in the first of the device's languages (`languageTags`,
 * such as "en-GB") that the app is worded in, or English.
 */
export function createI18n(languageTags: readonly string[] = []): AppI18n {
  const supported = Object.keys(messages)
  const language =
    languageTags.map((tag) => tag.split('-')[0] ?? '').find((each) => supported.includes(each)) ??
    fallbackLanguage

  return createVueI18n({
    legacy: false,
    locale: language,
    fallbackLocale: fallbackLanguage,
    messages,
  }) as AppI18n
}

/** The wording of `i18n` as it is now. */
export function wordingOf(i18n: AppI18n): Wording {
  return { t: i18n.global.t as Translate, language: i18n.global.locale.value }
}
