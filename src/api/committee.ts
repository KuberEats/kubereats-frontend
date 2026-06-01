import { apiRequest } from './client'
import type { AuditResult, MerchantInfo } from './types'

export function listPendingMerchants(): Promise<MerchantInfo[]> {
  return apiRequest<MerchantInfo[]>('/committee/merchants/pending')
}

export function listAllMerchants(): Promise<MerchantInfo[]> {
  return apiRequest<MerchantInfo[]>('/committee/merchants')
}

export function approveMerchant(
  merchantId: number,
  data: {
    cooperationStartDate: string
    cooperationEndDate: string
  },
): Promise<AuditResult> {
  return apiRequest<AuditResult>(`/committee/merchants/${merchantId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function rejectMerchant(merchantId: number): Promise<AuditResult> {
  return apiRequest<AuditResult>(`/committee/merchants/${merchantId}/reject`, {
    method: 'PATCH',
  })
}

export function suspendMerchant(merchantId: number, reason: string): Promise<AuditResult> {
  return apiRequest<AuditResult>(`/committee/merchants/${merchantId}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}
