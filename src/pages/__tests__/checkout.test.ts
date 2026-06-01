import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCart } from '../../composables/useCart'
import CheckoutPage from '../CheckoutPage.vue'

const mocks = vi.hoisted(() => ({
  createReservationRequest: vi.fn(),
  navigateTo: vi.fn(),
}))

vi.mock('../../api/orders', () => ({
  createReservationRequest: mocks.createReservationRequest,
}))

vi.mock('../../router', () => ({
  navigateTo: mocks.navigateTo,
}))

const menuItem = {
  id: 11,
  merchantId: 7,
  itemName: '雞腿便當',
  price: 120,
  maxDailyQuantity: 20,
  imageId: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

function seedCart() {
  const cart = useCart()
  cart.clearCart()
  cart.startCart({
    merchantId: 7,
    merchantName: '測試餐館',
    minOrder: 0,
    serviceDate: '2026-06-07',
    pickupSlot: '12:00-12:30',
  })
  cart.addItem(menuItem)
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('user', JSON.stringify({ id: 1, role: 'employee' }))
  vi.stubGlobal('crypto', { randomUUID: () => 'idem-key-1' })
  mocks.createReservationRequest.mockReset()
  mocks.navigateTo.mockReset()
  seedCart()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CheckoutPage', () => {
  it('submits successfully and navigates to the live reservation status page', async () => {
    mocks.createReservationRequest.mockResolvedValue({
      order_token: 'public-token',
      status: 'PENDING_RESERVATION',
    })

    const wrapper = mount(CheckoutPage)
    await wrapper.get('input[autocomplete="name"]').setValue('王小明')
    await wrapper.get('input[autocomplete="tel"]').setValue('0912345678')
    await wrapper.get('textarea').setValue('少冰，餐點分開裝')
    await wrapper.get('[data-testid="checkout-submit-button"]').trigger('click')
    await flushPromises()

    expect(mocks.createReservationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 1,
        merchant_id: 7,
        comments: '少冰，餐點分開裝',
        diner_name: '王小明',
        diner_phone: '0912345678',
        items: [{ menu_id: 11, quantity: 1 }],
      }),
      'idem-key-1',
    )
    expect(localStorage.getItem('latestReservationOrderToken')).toBe('public-token')
    expect(mocks.navigateTo).toHaveBeenCalledWith('/reservation-status/public-token')
  })

  it('keeps the cart and shows retryable failure', async () => {
    mocks.createReservationRequest.mockRejectedValue(new Error('庫存不足'))

    const wrapper = mount(CheckoutPage)
    await wrapper.get('[data-testid="checkout-submit-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('庫存不足')
    expect(wrapper.text()).toContain('雞腿便當')
  })

  it('disables duplicate submit while pending', async () => {
    mocks.createReservationRequest.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(CheckoutPage)
    await wrapper.get('[data-testid="checkout-submit-button"]').trigger('click')

    expect(wrapper.get('[data-testid="checkout-submit-button"]').attributes('disabled')).toBeDefined()
    expect(mocks.createReservationRequest).toHaveBeenCalledTimes(1)
  })
})
