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
})
