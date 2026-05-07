import { apiRequest } from './client'
import type { CartItem, Order, OrderHistorySortKey } from './types'

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
