import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCart } from '../../composables/useCart'
import MerchantDetailPage from '../MerchantDetailPage.vue'

const mocks = vi.hoisted(() => ({
  getMerchantDetail: vi.fn(),
  listMerchantMenuItems: vi.fn(),
  navigateTo: vi.fn(),
}))

vi.mock('../../api/merchants', () => ({
  getMerchantDetail: mocks.getMerchantDetail,
  listMerchantMenuItems: mocks.listMerchantMenuItems,
}))

vi.mock('../../router', () => ({
  navigateTo: mocks.navigateTo,
}))

const merchant = {
  id: 7,
  name: '測試餐館',
  campus: '竹科',
  category: '便當',
  rating: 4.8,
  orderCount: 30,
  minOrder: 0,
  deliveryTime: '12:00',
  tags: ['午餐'],
}

const menuItem = {
  id: 11,
  merchantId: 7,
  itemName: '雞腿便當',
  price: 120,
  maxDailyQuantity: 20,
  imageUrl: 'https://storage.googleapis.com/kubereats-menu-images/7/chicken.jpg',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

beforeEach(() => {
  useCart().clearCart()
  mocks.getMerchantDetail.mockReset()
  mocks.listMerchantMenuItems.mockReset()
  mocks.navigateTo.mockReset()
  mocks.getMerchantDetail.mockResolvedValue(merchant)
  mocks.listMerchantMenuItems.mockResolvedValue([menuItem])
})

describe('MerchantDetailPage', () => {
  it('adds an item and updates quantity in cart summary', async () => {
    const wrapper = mount(MerchantDetailPage, {
      props: { merchantId: 7 },
    })
    await flushPromises()

    await wrapper.get('[data-testid="add-menu-item-button"]').trigger('click')
    await wrapper.get('[aria-label="雞腿便當增加"]').trigger('click')

    expect(wrapper.get('[data-testid="cart-panel"]').text()).toContain('2 份餐點')
    expect(wrapper.get('[data-testid="cart-panel"]').text()).toContain('$240')
  })

  it('renders menu item pictures for customers', async () => {
    const wrapper = mount(MerchantDetailPage, {
      props: { merchantId: 7 },
    })
    await flushPromises()

    const image = wrapper.get('img[alt="雞腿便當 圖片"]')
    expect(image.attributes('src')).toBe(
      'https://storage.googleapis.com/kubereats-menu-images/7/chicken.jpg',
    )
  })

  it('navigates to checkout from sticky cart', async () => {
    const wrapper = mount(MerchantDetailPage, {
      props: { merchantId: 7 },
    })
    await flushPromises()

    await wrapper.get('[data-testid="add-menu-item-button"]').trigger('click')
    await wrapper.get('[data-testid="submit-order-button"]').trigger('click')

    expect(mocks.navigateTo).toHaveBeenCalledWith('/checkout')
  })
})
