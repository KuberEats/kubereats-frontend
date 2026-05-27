<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getMyMerchant } from '../../api/merchants'
import { getMerchantIncome, getMerchantPayouts, getMerchantMonthlyTotal, generateReport } from '../../api/finance'
import { navigateTo } from '../../router'
import type { MerchantInfo } from '../../api/types'
import type { IncomeStatus, Payout } from '../../api/finance'

const merchant = ref<MerchantInfo | null>(null)
const income = ref<IncomeStatus>({ total_income: 0, order_count: 0 })
const payouts = ref<Payout[]>([])
const monthlyTotal = ref(0)
const loading = ref(true)
const generating = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    merchant.value = await getMyMerchant()
    const [inc, pays, monthly] = await Promise.all([
      getMerchantIncome(merchant.value.id),
      getMerchantPayouts(merchant.value.id),
      getMerchantMonthlyTotal(merchant.value.id),
    ])
    income.value = inc
    payouts.value = pays
    monthlyTotal.value = monthly.monthly_total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
})

async function handleGenerateReport() {
  if (!merchant.value) return
  generating.value = true
  try {
    const result = await generateReport(merchant.value.id)
    window.open(result.url, '_blank')
  } catch (e: unknown) {
    alert('報表產生失敗：' + (e instanceof Error ? e.message : '未知錯誤'))
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="section-header">
      <h3>收入總覽</h3>
      <button class="btn-small" @click="navigateTo('/merchant/dashboard')">返回商家後台</button>
      <button class="btn-small btn-accent" :disabled="generating" @click="handleGenerateReport">
        {{ generating ? '產生中...' : '產生報表' }}
      </button>
    </div>

    <div v-if="loading" class="loading">載入中...</div>

    <template v-else-if="!error">
      <div class="stats-row">
        <div class="card stat-card">
          <div class="stat-label">目前收入</div>
          <div class="stat-value">${{ income.total_income }}</div>
          <div class="stat-desc">{{ income.order_count }} 筆訂單</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">本月總額</div>
          <div class="stat-value secondary">${{ monthlyTotal }}</div>
          <div class="stat-desc">本月累計</div>
        </div>
      </div>

      <div class="card">
        <div class="section-header" style="margin-bottom: 0;">
          <h3>撥款紀錄</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>撥款金額</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payout in payouts" :key="payout.id">
              <td>{{ payout.order_id }}</td>
              <td><strong class="amount">${{ payout.settlement_amount }}</strong></td>
              <td>
                <span class="badge" :class="payout.status === 'payout_done' ? 'badge-success' : 'badge-warning'">
                  {{ payout.status === 'payout_done' ? '已撥款' : '處理中' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="payouts.length === 0" class="empty">尚無撥款紀錄</p>
      </div>
    </template>

    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.loading { text-align: center; padding: 2rem; color: #999; }
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.section-header h3 { margin: 0; flex: 1; color: #333; }
.stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.stat-card { text-align: left; }
.stat-label { color: #999; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.02em; }
.stat-value { font-size: 1.75rem; font-weight: 800; color: #c2410c; margin-top: 4px; }
.stat-value.secondary { color: #7c3aed; }
.stat-desc { color: #999; font-size: 0.8rem; margin-top: 2px; }
.data-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
.data-table th { text-align: left; padding: 0.5rem 0.75rem; color: #999; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #eee; }
.data-table td { padding: 0.75rem; border-top: 1px solid #f0f0f0; }
.data-table tbody tr:hover { background: #fafafa; }
.amount { color: #c2410c; }
.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge-success { background: #ecfdf5; color: #047857; }
.badge-warning { background: #fffbeb; color: #b45309; }
.empty { text-align: center; padding: 1.5rem; color: #999; }
.btn-small { padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: white; color: #333; cursor: pointer; font-size: 0.85rem; }
.btn-small:hover { background: #f5f5f5; }
.btn-accent { background: #f97316; color: white; border-color: #f97316; }
.btn-accent:hover { background: #ea580c; }
.btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
@media (max-width: 600px) { .stats-row { grid-template-columns: 1fr; } }
</style>
