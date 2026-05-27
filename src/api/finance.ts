import { apiRequest } from './client'

export interface IncomeStatus {
  total_income: number
  order_count: number
}

export interface Payout {
  id: number
  order_id: number
  settlement_amount: number
  status: string
}

export interface MonthlyTotal {
  monthly_total: number
}

export interface ReportResult {
  filename: string
  url: string
}

export interface FinanceHistoryRecord {
  id: number
  merchant_id: number
  order_id: number
  settlement_amount: number
  report_data: string
}

export interface StaffExpenses {
  total_expense: number
  order_count: number
}

export interface SalaryDeduction {
  id: number
  total_amount: number
  order_time: string
}

export interface UserTags {
  user_id: number
  tags: string[]
}

export interface BarcodeResult {
  user_id: number
  staff_code: string
  barcode_base64: string
}

export function getMerchantIncome(merchantId: number): Promise<IncomeStatus> {
  return apiRequest<IncomeStatus>(`/api/merchant/income-status?merchant_id=${merchantId}`)
}

export function getMerchantPayouts(merchantId: number): Promise<Payout[]> {
  return apiRequest<Payout[]>(`/api/merchant/payouts?merchant_id=${merchantId}`)
}

export function getMerchantMonthlyTotal(merchantId: number): Promise<MonthlyTotal> {
  return apiRequest<MonthlyTotal>(`/api/merchant/monthly-total?merchant_id=${merchantId}`)
}

export function generateReport(merchantId: number): Promise<ReportResult> {
  return apiRequest<ReportResult>(`/api/finance/generate-report?merchant_id=${merchantId}`, {
    method: 'POST',
  })
}

export function listReports(): Promise<ReportResult[]> {
  return apiRequest<ReportResult[]>('/api/finance/reports')
}

export function getFinanceHistory(): Promise<FinanceHistoryRecord[]> {
  return apiRequest<FinanceHistoryRecord[]>('/api/finance/history')
}

export function getStaffExpenses(userId: number): Promise<StaffExpenses> {
  return apiRequest<StaffExpenses>(`/api/staff/expenses?user_id=${userId}`)
}

export function getSalaryDeductions(userId: number): Promise<SalaryDeduction[]> {
  return apiRequest<SalaryDeduction[]>(`/api/staff/salary-deductions?user_id=${userId}`)
}

export function getUserTags(userId: number): Promise<UserTags> {
  return apiRequest<UserTags>(`/api/tagging/user/${userId}`)
}

export function generateBarcode(userId: number): Promise<BarcodeResult> {
  return apiRequest<BarcodeResult>(`/api/tagging/generate-barcode/${userId}`, {
    method: 'POST',
  })
}
