import { ref } from 'vue'
import type { Locale } from './types'
import { ru } from './ru'
import { en } from './en'

export type { Locale, MessageDict } from './types'

const STORAGE_KEY = 'jtl_locale'

const dicts: Record<Locale, Record<string, string>> = { ru, en }

function readInitial(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'en' || raw === 'ru' ? raw : 'en'
  } catch {
    return 'en'
  }
}

export const locale = ref<Locale>(readInitial())

export function setLocale(value: Locale) {
  locale.value = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // storage unavailable - language just won't persist
  }
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dicts[locale.value]
  let text = dict[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}

export function useI18n() {
  return { locale, t }
}