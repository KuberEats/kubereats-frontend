import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelOrder,
  cancelReservation,
  createOrder,
  createReservationRequest,
  getOrderById,
  getOrderSchedulerHealth,
  getReservationStatus,
  listOrders,
  updateOrderStatus,
} from '../orders'
import type { CartItem, ReservationRequestPayload } from '../types'

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

vi.mock('../client', () => ({
  apiRequest: mocks.apiRequest,
}))

const cartItems: CartItem[] = [
  {
    menuItem: {
      id: 11,
      merchantId: 3,
      itemName: '雞腿便當',
      price: 120,
      maxDailyQuantity: 20,
      imageId: null,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    },
    quantity: 2,
  },
]

const reservationPayload: ReservationRequestPayload = {
  user_id: 1,
  merchant_id: 3,
  service_date: '2026-06-07',
  pickup_slot: '12:00-12:30',
  pickup_option: 'SELF_PICKUP',
  comments: '少冰，餐點分開裝',
  diner_name: '王小明',
  diner_phone: '0912345678',
  items: [{ menu_id: 11, quantity: 2 }],
}

beforeEach(() => {
  mocks.apiRequest.mockReset()
  mocks.apiRequest.mockResolvedValue({})
})

describe('order scheduler API routes', () => {
  it('uses the public prefix for health checks', async () => {
    await getOrderSchedulerHealth()

    expect(mocks.apiRequest).toHaveBeenCalledWith('/order-scheduler/health')
  })

  it('uses the public prefix for order routes', async () => {
    await createOrder(1, cartItems)
    await listOrders(1, 'time')
    await getOrderById(9)
    await updateOrderStatus(9, 1)
    await cancelOrder(9)

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      1,
      '/order-scheduler/orders',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      2,
      '/order-scheduler/orders?userId=1&sortBy=time',
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(3, '/order-scheduler/orders/9')
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      4,
      '/order-scheduler/orders/9/status',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      5,
      '/order-scheduler/orders/9/cancel',
      { method: 'POST' },
    )
  })

  it('uses the public prefix for reservation routes', async () => {
    await createReservationRequest(reservationPayload, 'idem-key')
    await getReservationStatus('token/with slash')
    await cancelReservation('token/with slash')

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      1,
      '/order-scheduler/reservation-requests',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Idempotency-Key': 'idem-key' },
      }),
    )
    expect(JSON.parse(mocks.apiRequest.mock.calls[0][1].body)).toEqual(reservationPayload)
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      2,
      '/order-scheduler/reservation-requests/token%2Fwith%20slash',
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      3,
      '/order-scheduler/reservation-requests/token%2Fwith%20slash/cancel',
      { method: 'POST' },
    )
  })

  it('normalizes reservation tokens from camelCase backend responses', async () => {
    mocks.apiRequest.mockResolvedValueOnce({
      reservationId: 4,
      reservationToken: 'reservation-token',
      orderToken: 'order-token',
      status: 'PENDING_RESERVATION',
      message: 'accepted',
    })

    const result = await createReservationRequest(reservationPayload)

    expect(result).toEqual({
      reservation_id: '4',
      order_token: 'order-token',
      status: 'PENDING_RESERVATION',
      message: 'accepted',
    })
  })

  it('normalizes reservation status fields from camelCase backend responses', async () => {
    mocks.apiRequest.mockResolvedValueOnce({
      orderToken: 'public-token',
      status: 'RESERVED',
      serviceDate: '2026-06-07',
      pickupSlot: '12:00-12:30',
      pickupOption: 'SELF_PICKUP',
      pickupNumber: null,
      comments: '少冰，餐點分開裝',
      dinerName: '王小明',
      dinerPhone: '0912345678',
      createdAt: '2026-06-01T00:00:00Z',
      items: [{ id: 1, menuItemId: 11, itemName: '雞腿便當', unitPrice: 120 }],
    })

    const result = await getReservationStatus('public-token')

    expect(result.order_token).toBe('public-token')
    expect(result.service_date).toBe('2026-06-07')
    expect(result.pickup_slot).toBe('12:00-12:30')
    expect(result.pickup_option).toBe('SELF_PICKUP')
    expect(result.comments).toBe('少冰，餐點分開裝')
    expect(result.diner_name).toBe('王小明')
    expect(result.diner_phone).toBe('0912345678')
    expect(result.order_time).toBe('2026-06-01T00:00:00Z')
    expect(result.items?.[0]).toEqual(
      expect.objectContaining({
        menu_id: 11,
        item_name: '雞腿便當',
        unit_price: 120,
      }),
    )
  })
})
