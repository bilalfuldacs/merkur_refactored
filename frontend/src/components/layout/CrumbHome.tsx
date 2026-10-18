import { useI18n } from '@/i18n'

export function CrumbHome() {
  const { t } = useI18n()
  return t('common.start', 'Start')
}
