import { beforeEach } from 'vitest'
import { useI18n } from '../i18n'

const { setLocale } = useI18n()

beforeEach(() => {
  localStorage.setItem('kubereatsLocale', 'zh-TW')
  setLocale('zh-TW')
})
