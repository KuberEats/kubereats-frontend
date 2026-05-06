import { apiRequest } from './client'
import type { Campus, MenuItem, Merchant, SortKey } from './types'

export function listMerchants(campus: Campus, date: string, sortBy: SortKey) {
  const params = new URLSearchParams({
    campus,
    date,
    sort_by: sortBy,
  })

  return apiRequest<Merchant[]>(`/merchants?${params.toString()}`)
}

export function getMerchantDetail(merchantId: number) {
  return apiRequest<Merchant>(`/merchants/${merchantId}`)
}

export function listMenuItems(merchantId: number) {
  return apiRequest<MenuItem[]>(`/merchants/${merchantId}/menus`)
}
