import { apiRequest } from './client'
import type {
  Campus,
  DietaryType,
  MenuItem,
  Merchant,
  MerchantInfo,
  SortKey,
  TodayOrderSummary,
} from './types'

// ── 組員的：員工端瀏覽商家 ──

interface MerchantRecommendationRequest {
  userId: number
  campus: Campus
  prompt: string
  limit: number
}

export function listMerchants(campus: Campus, date: string, sortBy: SortKey) {
  const params = new URLSearchParams({
    campus,
    sort_by: sortBy,
  })

  if (date) {
    params.set('date', date)
  }

  return apiRequest<Merchant[]>(`/merchants?${params.toString()}`)
}

export function recommendMerchants(request: MerchantRecommendationRequest) {
  return apiRequest<Merchant[]>('/recommendations/merchants', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function getMerchantDetail(merchantId: number) {
  return apiRequest<Merchant>(`/merchants/${merchantId}`)
}

export function listMerchantMenuItems(merchantId: number) {
  return apiRequest<MenuItem[]>(`/merchants/${merchantId}/menus`)
}

// ── 你的：商家管理 ──

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
  dietaryType?: DietaryType
  allergens?: string[]
  certifications?: string[]
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
  dietaryType: DietaryType
  allergens: string[]
  certifications: string[]
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

export function confirmTodayOrders(): Promise<{ confirmed_count: number }> {
  return apiRequest<{ confirmed_count: number }>('/merchants/orders/confirm-today', {
    method: 'POST',
  })
}
