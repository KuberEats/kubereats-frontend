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

  return apiRequest<Record<string, unknown>>(
    `${ORDER_SCHEDULER_BASE_PATH}/reservation-requests`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
  ).then(normalizeReservationRequest)
}

export function getReservationStatus(orderToken: string) {
  return apiRequest<Record<string, unknown>>(
    `${ORDER_SCHEDULER_BASE_PATH}/reservation-requests/${encodeURIComponent(orderToken)}`,
  ).then(normalizeReservationStatus)
}

export function cancelReservation(orderToken: string) {
  return apiRequest<Record<string, unknown>>(
    `${ORDER_SCHEDULER_BASE_PATH}/reservation-requests/${encodeURIComponent(orderToken)}/cancel`,
    { method: 'POST' },
  ).then(normalizeReservationStatus)
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

function stringField(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
  }
  return ''
}

function optionalStringField(data: Record<string, unknown>, ...keys: string[]) {
  const value = stringField(data, ...keys)
  return value || undefined
}

function normalizeReservationRequest(data: Record<string, unknown>): ReservationRequestResponse {
  return {
    reservation_id: optionalStringField(data, 'reservation_id', 'reservationId'),
    order_token: stringField(
      data,
      'order_token',
      'orderToken',
      'reservation_token',
      'reservationToken',
    ),
    status: data.status as ReservationRequestResponse['status'],
    message: optionalStringField(data, 'message'),
  }
}

function normalizeReservationStatus(data: Record<string, unknown>): ReservationStatusResponse {
  return {
    order_token: stringField(
      data,
      'order_token',
      'orderToken',
      'reservation_token',
      'reservationToken',
    ),
    status: data.status as ReservationStatusResponse['status'],
    service_date: optionalStringField(data, 'service_date', 'serviceDate'),
    pickup_slot: optionalStringField(data, 'pickup_slot', 'pickupSlot'),
    pickup_option: optionalStringField(data, 'pickup_option', 'pickupOption'),
    pickup_number: (data.pickup_number ?? data.pickupNumber) as
      | string
      | number
      | null
      | undefined,
    merchant_name: optionalStringField(data, 'merchant_name', 'merchantName'),
    message: optionalStringField(data, 'message'),
    failure_reason: optionalStringField(data, 'failure_reason', 'failureReason'),
    failed_items: normalizeReservationItems(data.failed_items ?? data.failedItems),
    items: normalizeReservationItems(data.items),
    order_time: optionalStringField(data, 'order_time', 'orderTime', 'created_at', 'createdAt'),
    comments: optionalStringField(data, 'comments', 'note', 'notes'),
    diner_name: optionalStringField(data, 'diner_name', 'dinerName', 'guest_name', 'guestName'),
    diner_phone: optionalStringField(data, 'diner_phone', 'dinerPhone', 'guest_phone', 'guestPhone'),
  }
}

function normalizeReservationItems(value: unknown) {
  if (!Array.isArray(value)) return undefined

  return value.map(item => {
    if (!item || typeof item !== 'object') return {}

    const row = item as Record<string, unknown>
    return {
      id: row.id as number | string | undefined,
      menu_id: (row.menu_id ?? row.menuItemId) as number | undefined,
      item_name: optionalStringField(row, 'item_name', 'itemName', 'name'),
      name: optionalStringField(row, 'name', 'item_name', 'itemName'),
      quantity: row.quantity as number | undefined,
      unit_price: (row.unit_price ?? row.unitPrice) as number | undefined,
      subtotal: row.subtotal as number | undefined,
    }
  })
}
