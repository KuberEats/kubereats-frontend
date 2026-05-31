import { apiRequest } from './client'
import type {
  CartItem,
  Order,
  OrderHistorySortKey,
  ReservationRequestPayload,
  ReservationRequestResponse,
  ReservationStatusResponse,
} from './types'

export function createOrder(userId: number, items: CartItem[]) {
  return apiRequest<Order>('/orders', {
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

  return apiRequest<ReservationRequestResponse>('/reservation-requests', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export function getReservationStatus(orderToken: string) {
  return apiRequest<ReservationStatusResponse>(
    `/reservation-requests/${encodeURIComponent(orderToken)}`,
  )
}

export function cancelReservation(orderToken: string) {
  return apiRequest<ReservationStatusResponse>(
    `/reservation-requests/${encodeURIComponent(orderToken)}/cancel`,
    { method: 'POST' },
  )
}

export function listOrders(userId: number, sortBy: OrderHistorySortKey) {
  const params = new URLSearchParams({
    userId: String(userId),
    sortBy,
  })

  return apiRequest<Order[]>(`/orders?${params.toString()}`)
}

export function getOrderById(orderId: number) {
  return apiRequest<Order>(`/orders/${orderId}`)
}

export function updateOrderStatus(orderId: number, orderStatus: number) {
  return apiRequest<Order>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus }),
  })
}
