import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App.vue'
import { clearTokens, setTokens } from '../../api/client'
import { navigateTo } from '../../router'
import MerchantDetailPage from '../MerchantDetailPage.vue'
import ReservationStatusPage from '../ReservationStatusPage.vue'

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

const mocks = vi.hoisted(() => ({
  getMerchantDetail: vi.fn(),
  listMerchantMenuItems: vi.fn(),
  createReservationRequest: vi.fn(),
  getReservationStatus: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  navigateTo: vi.fn(),
}))

vi.mock('../../api/merchants', () => ({
  applyMerchant: vi.fn(),
  confirmTodayOrders: vi.fn(),
  createMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  getMerchantDetail: mocks.getMerchantDetail,
  getMyMerchant: vi.fn(),
  getTodayOrders: vi.fn(),
  listMerchantMenuItems: mocks.listMerchantMenuItems,
  listMenuItems: vi.fn(),
  listMerchants: vi.fn(),
  updateMenuItem: vi.fn(),
  updateMyMerchant: vi.fn(),
}))

vi.mock('../../api/orders', () => ({
  createReservationRequest: mocks.createReservationRequest,
  getOrderById: vi.fn(),
  getReservationStatus: mocks.getReservationStatus,
  listOrders: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn(),
}))

vi.mock('../../api/auth', () => ({
  getMe: mocks.getMe,
  login: mocks.login,
  register: mocks.register,
}))

vi.mock('../../router', async importOriginal => {
  const actual = await importOriginal<typeof import('../../router')>()
  return {
    ...actual,
    navigateTo: (path: string) => {
      mocks.navigateTo(path)
      actual.navigateTo(path)
    },
  }
})

function reservedStatus(overrides = {}) {
  return {
    order_token: 'token-123',
    status: 'RESERVED',
    service_date: '2026-06-07',
    pickup_slot: '12:00-12:30',
    pickup_option: 'SELF_PICKUP',
    pickup_number: null,
    merchant_name: '測試餐館',
    items: [],
    ...overrides,
  }
}

async function mountMerchantDetail() {
  mocks.getMerchantDetail.mockResolvedValue(merchant)
  mocks.listMerchantMenuItems.mockResolvedValue([menuItem])

  const wrapper = mount(MerchantDetailPage, {
    props: { merchantId: 7 },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  clearTokens()
  localStorage.clear()
  localStorage.setItem('user', JSON.stringify({ id: 1, role: 'employee' }))
  vi.stubGlobal('crypto', { randomUUID: () => 'idem-key-1' })
  mocks.getMerchantDetail.mockReset()
  mocks.listMerchantMenuItems.mockReset()
  mocks.createReservationRequest.mockReset()
  mocks.getReservationStatus.mockReset()
  mocks.getMe.mockReset()
  mocks.login.mockReset()
  mocks.register.mockReset()
  mocks.getMe.mockResolvedValue({
    id: 1,
    username: 'employee@example.com',
    email: null,
    role: 'employee',
    isActive: true,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  })
  mocks.navigateTo.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('reservation request flow', () => {
  it('stores the order token and navigates after successful submission', async () => {
    mocks.createReservationRequest.mockResolvedValue({
      reservation_id: 'internal-id',
      order_token: 'public-token',
      status: 'PENDING_RESERVATION',
      message: 'Reservation request received.',
    })

    const wrapper = await mountMerchantDetail()
    await wrapper.find('.icon-text-button').trigger('click')
    await wrapper.find('.primary-button.full-width').trigger('click')
    await flushPromises()

    expect(mocks.createReservationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 1,
        merchant_id: 7,
        pickup_option: 'SELF_PICKUP',
        items: [{ menu_id: 11, quantity: 1 }],
      }),
      'idem-key-1',
    )
    expect(localStorage.getItem('latestReservationOrderToken')).toBe('public-token')
    expect(mocks.navigateTo).toHaveBeenCalledWith('/reservation-status/public-token')
  })

  it('rejects service dates beyond seven days', async () => {
    const wrapper = await mountMerchantDetail()
    await wrapper.find('.icon-text-button').trigger('click')
    const input = wrapper.find('input[type="date"]')
    await input.setValue('2099-01-01')
    await wrapper.find('.primary-button.full-width').trigger('click')

    expect(mocks.createReservationRequest).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('僅能預訂今天起 7 天內的餐點')
  })
})

describe('reservation status page', () => {
  it('renders pending state and starts polling', async () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    mocks.getReservationStatus.mockResolvedValue({
      order_token: 'pending-token',
      status: 'PENDING_RESERVATION',
      message: 'Checking meal availability.',
      items: [],
    })

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'pending-token' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('正在確認預訂名額')
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('polls from pending to reserved and then stops', async () => {
    vi.useFakeTimers()
    mocks.getReservationStatus
      .mockResolvedValueOnce({
        order_token: 'token-123',
        status: 'PENDING_RESERVATION',
        items: [],
      })
      .mockResolvedValueOnce(reservedStatus())

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'token-123' },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('正在確認預訂名額')

    await vi.advanceTimersByTimeAsync(1500)
    await flushPromises()

    expect(wrapper.text()).toContain('預訂成功')
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.getReservationStatus).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('shows reserved success even when pickup number is missing', async () => {
    mocks.getReservationStatus.mockResolvedValue(reservedStatus({ pickup_number: null }))

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'token-123' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('預訂成功')
    expect(wrapper.text()).toContain('取餐號碼將於取餐日前或商家出餐前產生')
  })

  it('shows sold out actions', async () => {
    mocks.getReservationStatus.mockResolvedValue({
      order_token: 'sold-token',
      status: 'SOLD_OUT',
      message: 'sold out',
      failed_items: [{ id: 1, item_name: '雞腿便當', quantity: 1 }],
    })

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'sold-token' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('預訂失敗')
    expect(wrapper.text()).toContain('此餐點在該日期或時段已售完')
    expect(wrapper.text()).toContain('選擇其他時段')
    expect(wrapper.text()).toContain('回到菜單')
    expect(wrapper.text()).toContain('回到訂單紀錄')
  })

  it('shows backend failure reason', async () => {
    mocks.getReservationStatus.mockResolvedValue({
      order_token: 'failed-token',
      status: 'FAILED',
      failure_reason: '商家暫停接單',
    })

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'failed-token' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('預訂失敗')
    expect(wrapper.text()).toContain('商家暫停接單')
  })

  it('loads from the refresh-safe route token', async () => {
    setTokens('access-token', 'refresh-token')
    mocks.getReservationStatus.mockResolvedValue(reservedStatus({ order_token: 'refresh-token' }))
    navigateTo('/reservation-status/refresh-token')

    const wrapper = mount(App)
    await flushPromises()

    expect(mocks.getReservationStatus).toHaveBeenCalledWith('refresh-token')
    expect(wrapper.text()).toContain('預訂成功')
  })

  it('redirects protected routes to login when unauthenticated', async () => {
    clearTokens()
    navigateTo('/merchants')

    const wrapper = mount(App)
    await flushPromises()

    expect(mocks.getMe).not.toHaveBeenCalled()
    expect(mocks.navigateTo).toHaveBeenCalledWith('/login')
    expect(wrapper.text()).toContain('登入')
  })

  it('shows a non-blocking warning after repeated polling failures', async () => {
    vi.useFakeTimers()
    mocks.getReservationStatus.mockRejectedValue(new Error('network down'))

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'network-token' },
    })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1500)
    await flushPromises()

    expect(wrapper.text()).toContain('目前連線不穩')
    expect(wrapper.text()).toContain('正在確認預訂名額')
    wrapper.unmount()
  })

  it('does not create duplicate polling intervals on re-render', async () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    mocks.getReservationStatus.mockResolvedValue({
      order_token: 'dup-token',
      status: 'PENDING_RESERVATION',
      items: [],
    })

    const wrapper = mount(ReservationStatusPage, {
      props: { orderToken: 'dup-token' },
    })
    await flushPromises()
    wrapper.vm.$forceUpdate()
    await flushPromises()

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
