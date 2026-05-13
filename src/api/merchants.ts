import { apiRequest } from './client'
import type { MerchantInfo, MenuItem, TodayOrderSummary } from './types'

export function applyMerchant(data: {
  merchantName: string
  campus: string
  category: string
  minOrder: number
  maxOrderQuantity: number
  deliveryTime: string
  tags: string[]
}): Promise<MerchantInfo> {
  return apiRequest<MerchantInfo>('/merchants/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMyMerchant(): Promise<MerchantInfo> {
  return apiRequest<MerchantInfo>('/merchants/me')
}

export function updateMyMerchant(data: Partial<{
  merchantName: string
  campus: string
  category: string
  minOrder: number
  maxOrderQuantity: number
  deliveryTime: string
  tags: string[]
}>): Promise<MerchantInfo> {
  return apiRequest<MerchantInfo>('/merchants/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function createMenuItem(data: {
  itemName: string
  price: number
  maxDailyQuantity: number
  imageId?: string
}): Promise<MenuItem> {
  return apiRequest<MenuItem>('/merchants/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function listMenuItems(): Promise<MenuItem[]> {
  return apiRequest<MenuItem[]>('/merchants/menu')
}

export function updateMenuItem(menuId: number, data: Partial<{
  itemName: string
  price: number
  maxDailyQuantity: number
  imageId: string
}>): Promise<MenuItem> {
  return apiRequest<MenuItem>(`/merchants/menu/${menuId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteMenuItem(menuId: number): Promise<void> {
  return apiRequest<void>(`/merchants/menu/${menuId}`, {
    method: 'DELETE',
  })
}

export function getTodayOrders(): Promise<TodayOrderSummary> {
  return apiRequest<TodayOrderSummary>('/merchants/orders/today')
}
