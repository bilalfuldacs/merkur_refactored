export const APP_LOCALES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
] as const

export type AppLocale = (typeof APP_LOCALES)[number]['code']

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.some((item) => item.code === value)
}
