import { apiRequest } from './client'
import type {
  CartItem,
  Order,
  OrderHistorySortKey,
  ReservationRequestPayload,
  ReservationRequestResponse,
  ReservationStatusResponse,
} from './types'

const ORDER_SCHEDULER_BASE_PATH = '/order-scheduler'

export interface OrderSchedulerHealth {
  status: string
}

export function getOrderSchedulerHealth() {
  return apiRequest<OrderSchedulerHealth>(`${ORDER_SCHEDULER_BASE_PATH}/health`)
}

export function createOrder(userId: number, items: CartItem[]) {
  return apiRequest<Order>(`${ORDER_SCHEDULER_BASE_PATH}/orders`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      items: items.map(item => ({
        menuId: item.menuItem.id,
        quantity: item.quantity,
      })),
    }),
  })
}

export function createReservationRequest(
  payload: ReservationRequestPayload,
  idempotencyKey?: string,
) {
  const headers: Record<string, string> = {}

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  return apiRequest<ReservationRequestResponse>(
    `${ORDER_SCHEDULER_BASE_PATH}/reservation-requests`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
  )
}

export function getReservationStatus(orderToken: string) {
  return apiRequest<ReservationStatusResponse>(
    `${ORDER_SCHEDULER_BASE_PATH}/reservation-requests/${encodeURIComponent(orderToken)}`,
  )
}

export function cancelReservation(orderToken: string) {
  return apiRequest<ReservationStatusResponse>(
    `${ORDER_SCHEDULER_BASE_PATH}/reservation-requests/${encodeURIComponent(orderToken)}/cancel`,
    { method: 'POST' },
  )
}

export function listOrders(userId: number, sortBy: OrderHistorySortKey) {
  const params = new URLSearchParams({
    userId: String(userId),
    sortBy,
  })

  return apiRequest<Order[]>(`${ORDER_SCHEDULER_BASE_PATH}/orders?${params.toString()}`)
}

export function getOrderById(orderId: number) {
  return apiRequest<Order>(`${ORDER_SCHEDULER_BASE_PATH}/orders/${orderId}`)
}

export function updateOrderStatus(orderId: number, orderStatus: number) {
  return apiRequest<Order>(`${ORDER_SCHEDULER_BASE_PATH}/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus }),
  })
}

export function cancelOrder(orderId: number) {
  return apiRequest<Order>(`${ORDER_SCHEDULER_BASE_PATH}/orders/${orderId}/cancel`, {
    method: 'POST',
  })
}
