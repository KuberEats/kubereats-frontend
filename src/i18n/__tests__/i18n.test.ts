import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to Chinese when no preference exists', async () => {
    vi.stubGlobal('navigator', { language: 'zh-TW' })
    const { useI18n } = await import('../index')

    const { locale, t } = useI18n()

    expect(locale.value).toBe('zh-TW')
    expect(t('checkout.title')).toBe('確認訂單')
  })

  it('uses browser English when no stored preference exists', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    const { useI18n } = await import('../index')

    const { locale, t } = useI18n()

    expect(locale.value).toBe('en')
    expect(t('checkout.title')).toBe('Review order')
  })

  it('persists explicit locale preference', async () => {
    const { useI18n } = await import('../index')
    const { locale, setLocale, t } = useI18n()

    setLocale('en')
    await nextTick()

    expect(locale.value).toBe('en')
    expect(localStorage.getItem('kubereatsLocale')).toBe('en')
    expect(t('merchantList.title', { campus: '竹科' })).toBe('竹科 Ordering')
  })
})
