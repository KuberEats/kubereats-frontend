import { apiRequest } from './client'
import type { CartItem, Order } from './types'

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

export function getOrderById(orderId: number) {
  return apiRequest<Order>(`/orders/${orderId}`)
}

export function updateOrderStatus(orderId: number, orderStatus: number) {
  return apiRequest<Order>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus }),
  })
}
