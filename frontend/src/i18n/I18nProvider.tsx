import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getTranslations } from '@/api/translations'
import { APP_LOCALES, isAppLocale } from './locales'
import type { AppLocale } from './locales'
import { createPhraseLookup, lookupFaqCopy } from './labels'
import type { FaqCopy, Phrase } from './labels'
import { createTranslator } from './translate'
import type { MessageTree, Translate } from './translate'

const LOCALE_KEY = 'merkurflow.locale'
const CACHE_PREFIX = 'merkurflow.translations.'

type I18nContextValue = {
  locale: AppLocale
  locales: typeof APP_LOCALES
  setLocale: (locale: AppLocale) => void
  t: Translate
  phrase: Phrase
  faqCopy: (sourceTitle: string) => FaqCopy | null
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    return isAppLocale(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

function writeStoredLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // The choice still applies for this visit when storage is blocked.
  }
}

function readCache(locale: AppLocale): MessageTree | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + locale)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as MessageTree
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeCache(locale: AppLocale, messages: MessageTree): void {
  try {
    localStorage.setItem(CACHE_PREFIX + locale, JSON.stringify(messages))
  } catch {
    // A failed cache write only means the next visit fetches again.
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(readStoredLocale)
  const [messages, setMessages] = useState<MessageTree | null>(() => readCache(readStoredLocale()))
  const [fallbackMessages, setFallbackMessages] = useState<MessageTree | null>(() => readCache('en'))

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    let cancelled = false
    const requested = locale

    async function load() {
      try {
        const codes: AppLocale[] = requested === 'en' ? ['en'] : [requested, 'en']
        const results = await Promise.all(codes.map((code) => getTranslations(code)))
        if (cancelled) {
          return
        }

        for (const payload of results) {
          if (!isAppLocale(payload.locale) || !payload.messages) {
            continue
          }
          writeCache(payload.locale, payload.messages)
          if (payload.locale === 'en') {
            setFallbackMessages(payload.messages)
          }
          if (payload.locale === requested) {
            setMessages(payload.messages)
          }
        }
      } catch {
        // Components keep their English fallback until the JSON files load.
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [locale])

  const setLocale = useCallback((next: AppLocale) => {
    writeStoredLocale(next)
    setMessages(readCache(next))
    setLocaleState(next)
  }, [])

  const t = useMemo(() => createTranslator(messages, fallbackMessages), [messages, fallbackMessages])
  const phrase = useMemo(() => createPhraseLookup(messages, fallbackMessages), [messages, fallbackMessages])
  const faqCopy = useCallback(
    (sourceTitle: string) => lookupFaqCopy(messages, sourceTitle) ?? lookupFaqCopy(fallbackMessages, sourceTitle),
    [fallbackMessages, messages],
  )

  const value = useMemo(
    () => ({
      locale,
      locales: APP_LOCALES,
      setLocale,
      t,
      phrase,
      faqCopy,
    }),
    [faqCopy, locale, phrase, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext)
  if (!value) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return value
}
