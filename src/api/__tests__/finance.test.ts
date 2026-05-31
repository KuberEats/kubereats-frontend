import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generateBarcode,
  generateReport,
  getFinanceHistory,
  getMerchantIncome,
  getMerchantMonthlyTotal,
  getMerchantPayouts,
  getMonthlyItemDistribution,
  getSalaryDeductions,
  getStaffExpenses,
  getUserTags,
  listReports,
} from '../finance'

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

vi.mock('../client', () => ({
  apiRequest: mocks.apiRequest,
}))

beforeEach(() => {
  mocks.apiRequest.mockReset()
  mocks.apiRequest.mockResolvedValue({})
})

describe('finance and tagging API routes', () => {
  it('uses canonical merchant finance routes', async () => {
    await getMerchantIncome(1)
    await getMerchantPayouts(1)
    await getMerchantMonthlyTotal(1)
    await getMonthlyItemDistribution(1)

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      1,
      '/finance/merchant/income-status?merchant_id=1',
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      2,
      '/finance/merchant/payouts?merchant_id=1',
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      3,
      '/finance/merchant/monthly-total?merchant_id=1',
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      4,
      '/finance/merchant/monthly-item-distribution?merchant_id=1',
    )
  })

  it('uses canonical finance report routes', async () => {
    await generateReport(1)
    await listReports()
    await getFinanceHistory()

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      1,
      '/finance/generate-report?merchant_id=1',
      { method: 'POST' },
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(2, '/finance/reports')
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(3, '/finance/history')
  })

  it('uses canonical staff finance routes', async () => {
    await getStaffExpenses(1)
    await getSalaryDeductions(1)

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      1,
      '/finance/staff/expenses?user_id=1',
    )
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      2,
      '/finance/staff/salary-deductions?user_id=1',
    )
  })

  it('uses canonical tagging routes', async () => {
    await getUserTags(1)
    await generateBarcode(1)

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(1, '/tagging/user/1')
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(
      2,
      '/tagging/generate-barcode/1',
      { method: 'POST' },
    )
  })
})
