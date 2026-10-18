import { apiRequest } from './client'
import type { AppLocale } from '@/i18n/locales'
import type { MessageTree } from '@/i18n/translate'

export type TranslationPayload = {
  locale: AppLocale
  messages: MessageTree
}

export function getTranslations(locale: AppLocale): Promise<TranslationPayload> {
  return apiRequest<TranslationPayload>(`/translations/${locale}`, { silent: true })
}
