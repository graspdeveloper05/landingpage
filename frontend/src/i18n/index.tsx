import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LOCALES, type Locale } from '@/data/types'
import en from './locales/en.json'
import ms from './locales/ms.json'
import zh from './locales/zh.json'
import ta from './locales/ta.json'

type Dict = Record<string, unknown>

const dictionaries: Record<Locale, Dict> = { en, ms, zh, ta }

/** §3 — Bahasa Malaysia and English are the primary languages. BM leads. */
export const DEFAULT_LOCALE: Locale = 'en'

const STORAGE_KEY = 'snd.locale'

/**
 * Chinese and Tamil faces are ~hundreds of KB. §12 asks for good loading
 * speed, so they are fetched only when someone actually chooses that language.
 */
const SCRIPT_FONTS: Partial<Record<Locale, string>> = {
  zh: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500&family=Noto+Sans+SC:wght@400;500&display=swap',
  ta: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;500&family=Noto+Sans+Tamil:wght@400;500&display=swap',
}

function loadScriptFont(locale: Locale) {
  const href = SCRIPT_FONTS[locale]
  if (!href || document.querySelector(`link[data-script-font="${locale}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.scriptFont = locale
  document.head.appendChild(link)
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale
  } catch {
    // Private browsing or blocked storage — fall through to the browser's own preference.
  }
  const browser = window.navigator.language.toLowerCase()
  if (browser.startsWith('ms')) return 'ms'
  if (browser.startsWith('zh')) return 'zh'
  if (browser.startsWith('ta')) return 'ta'
  return DEFAULT_LOCALE
}

function lookup(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Dict)[part]
    return undefined
  }, dict)
}

function interpolate(value: string, vars?: Record<string, string | number>) {
  if (!vars) return value
  return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

interface I18nValue {
  locale: Locale
  setLocale: (next: Locale) => void
  /** Returns a string. Missing keys return the key itself so they are obvious. */
  t: (path: string, vars?: Record<string, string | number>) => string
  /** Returns a list, for keys whose value is an array. */
  tList: (path: string) => string[]
  localeNames: { code: Locale; name: string; short: string }[]
}

const I18nContext = createContext<I18nValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  useEffect(() => {
    const dict = dictionaries[locale]
    const htmlLang = (lookup(dict, 'meta.htmlLang') as string) ?? locale
    document.documentElement.lang = htmlLang
    loadScriptFont(locale)
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Nothing to do — the choice simply will not persist across visits.
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[locale]
    return {
      locale,
      setLocale,
      t: (path, vars) => {
        const found = lookup(dict, path)
        if (typeof found === 'string') return interpolate(found, vars)
        if (typeof found === 'number') return String(found)
        return path
      },
      tList: (path) => {
        const found = lookup(dict, path)
        return Array.isArray(found) ? (found as string[]) : []
      },
      localeNames: LOCALES.map((code) => ({
        code,
        name: lookup(dictionaries[code], 'meta.name') as string,
        short: lookup(dictionaries[code], 'meta.short') as string,
      })),
    }
  }, [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside a LocaleProvider')
  return ctx
}

/** Picks the active language out of a Localized record from the data files. */
export function useLocalized() {
  const { locale } = useI18n()
  return useCallback((value: Record<Locale, string>) => value[locale] ?? value.en, [locale])
}
