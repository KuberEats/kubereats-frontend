import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MerchantListPage from '../MerchantListPage.vue'

const mocks = vi.hoisted(() => ({
  listMerchants: vi.fn(),
  recommendMerchants: vi.fn(),
  navigateTo: vi.fn(),
}))

vi.mock('../../api/merchants', () => ({
  listMerchants: mocks.listMerchants,
  recommendMerchants: mocks.recommendMerchants,
}))

vi.mock('../../router', () => ({
  navigateTo: mocks.navigateTo,
}))

const merchants = [
  {
    id: 1,
    name: '阿明便當',
    campus: '竹科',
    category: '便當',
    rating: 4.8,
    orderCount: 120,
    minOrder: 80,
    deliveryTime: '25 分鐘',
    tags: ['雞腿飯', '熱門'],
  },
  {
    id: 2,
    name: '小森咖哩',
    campus: '竹科',
    category: '咖哩',
    rating: 4.5,
    orderCount: 20,
    minOrder: 120,
    deliveryTime: '30 分鐘',
    tags: ['日式'],
  },
]

beforeEach(() => {
  mocks.listMerchants.mockReset()
  mocks.recommendMerchants.mockReset()
  mocks.navigateTo.mockReset()
})

describe('MerchantListPage', () => {
  it('opens system recommendation by default', async () => {
    mocks.listMerchants.mockResolvedValue(merchants)

    const wrapper = mount(MerchantListPage)
    await flushPromises()

    expect(wrapper.text()).toContain('想吃什麼？')
    expect(wrapper.find('input[type="search"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('營業中')
    expect(wrapper.text()).not.toContain('熱門')
  })

  it('shows loading skeleton while fetching merchants after leaving recommendation', async () => {
    mocks.listMerchants.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(MerchantListPage)
    await wrapper.get('button[aria-label="排序：最多人美食"]').trigger('click')

    expect(wrapper.text()).toContain('竹科 今日訂餐')
    expect(wrapper.findAll('.loading-row').length).toBeGreaterThan(0)
  })

  it('shows empty state and can reopen recommendation', async () => {
    mocks.listMerchants.mockResolvedValue([])
    const wrapper = mount(MerchantListPage)
    await wrapper.get('button[aria-label="排序：最多人美食"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('找不到符合條件的商家')

    await wrapper.get('.empty-state-panel button').trigger('click')
    expect(wrapper.text()).toContain('想吃什麼？')
  })

  it('sorts least ordered merchants locally', async () => {
    mocks.listMerchants.mockResolvedValue(merchants)
    const wrapper = mount(MerchantListPage)
    await flushPromises()

    await wrapper.get('button[aria-label="排序：最少人美食"]').trigger('click')
    await flushPromises()

    const text = wrapper.text()
    expect(text.indexOf('小森咖哩')).toBeLessThan(text.indexOf('阿明便當'))
  })

  it('shows retryable error state', async () => {
    mocks.listMerchants
      .mockRejectedValueOnce(new Error('API down'))
      .mockResolvedValueOnce(merchants)
    const wrapper = mount(MerchantListPage)
    await wrapper.get('button[aria-label="排序：最多人美食"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('API down')
    await wrapper.get('.error-state-panel button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('阿明便當')
  })
})
