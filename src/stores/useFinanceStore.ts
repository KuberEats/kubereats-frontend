import { defineStore } from 'pinia'
import api from '../api'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    incomeStatus: { total_income: 0, order_count: 0 },
    payouts: [],
    monthlyTotal: 0,
    expenses: { total_expense: 0, order_count: 0 },
    salaryDeductions: [],
    history: [],
    userTags: [],
    barcodeImage: '',
  }),
  actions: {
    async generateBarcode(userId: number) {
      const res = await api.post(`/tagging/generate-barcode/${userId}`)
      this.barcodeImage = res.data.barcode_base64
    },
    async fetchUserTags(userId: number) {
      const res = await api.get(`/tagging/user/${userId}`)
      this.userTags = res.data.tags
    },
    async fetchMerchantIncome(merchantId: number) {
      const res = await api.get(`/merchant/income-status?merchant_id=${merchantId}`)
      this.incomeStatus = res.data
    },
    async fetchMerchantPayouts(merchantId: number) {
      const res = await api.get(`/merchant/payouts?merchant_id=${merchantId}`)
      this.payouts = res.data
    },
    async fetchMonthlyTotal(merchantId: number) {
      const res = await api.get(`/merchant/monthly-total?merchant_id=${merchantId}`)
      this.monthlyTotal = res.data.monthly_total
    },
    async fetchStaffExpenses(userId: number) {
      const res = await api.get(`/staff/expenses?user_id=${userId}`)
      this.expenses = res.data
    },
    async fetchSalaryDeductions(userId: number) {
      const res = await api.get(`/staff/salary-deductions?user_id=${userId}`)
      this.salaryDeductions = res.data
    },
    async fetchFinanceHistory() {
      const res = await api.get('/finance/history')
      this.history = res.data
    },
    async triggerReport(merchantId: number) {
      await api.post(`/finance/generate-report?merchant_id=${merchantId}`)
    }
  }
})
