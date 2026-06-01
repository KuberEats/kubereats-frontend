<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getStaffExpenses, getSalaryDeductions, getUserTags, generateBarcode } from '../api/finance'
import type { StaffExpenses, SalaryDeduction } from '../api/finance'

const userId = ref(0)
const expenses = ref<StaffExpenses>({ total_expense: 0, order_count: 0 })
const deductions = ref<SalaryDeduction[]>([])
const tags = ref<string[]>([])
const barcodeImage = ref('')
const loading = ref(true)
const error = ref('')
const actionMessage = ref('')

onMounted(async () => {
  try {
    const user = localStorage.getItem('user')
    if (user) {
      userId.value = JSON.parse(user).id
    }
    if (!userId.value) {
      error.value = '無法取得使用者資訊'
      loading.value = false
      return
    }
    const [exp, ded, tagResult] = await Promise.all([
      getStaffExpenses(userId.value),
      getSalaryDeductions(userId.value),
      getUserTags(userId.value),
    ])
    expenses.value = exp
    deductions.value = ded
    tags.value = tagResult.tags
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
})

async function handleGenerateBarcode() {
  actionMessage.value = ''
  try {
    const result = await generateBarcode(userId.value)
    barcodeImage.value = result.barcode_base64
    actionMessage.value = '識別標籤已產生。'
  } catch (e: unknown) {
    error.value = '標籤產生失敗：' + (e instanceof Error ? e.message : '未知錯誤')
  }
}
</script>

<template>
  <div class="page-container">
    <div class="section-header">
      <h3>我的支出</h3>
      <div class="header-actions">
        <span
          v-for="tag in tags"
          :key="tag"
          class="tag"
        >{{ tag }}</span>
        <button
          class="btn-small btn-accent"
          @click="handleGenerateBarcode"
        >
          產生識別標籤
        </button>
      </div>
    </div>

    <p
      v-if="actionMessage"
      class="success-text"
      role="status"
    >
      {{ actionMessage }}
    </p>

    <div
      v-if="loading"
      class="loading"
    >
      載入中...
    </div>

    <template v-else-if="!error">
      <div
        v-if="barcodeImage"
        class="card barcode-card"
      >
        <div class="barcode-label-title">
          員工識別標籤
        </div>
        <img
          :src="barcodeImage"
          alt="Staff Barcode"
        >
        <div class="barcode-code">
          STAFF-{{ userId.toString().padStart(3, '0') }}
        </div>
      </div>

      <div class="stats-row">
        <div class="card stat-card">
          <div class="stat-label">
            目前支出
          </div>
          <div class="stat-value">
            ${{ expenses.total_expense }}
          </div>
          <div class="stat-desc">
            {{ expenses.order_count }} 筆訂單
          </div>
        </div>
      </div>

      <div class="card">
        <div
          class="section-header"
          style="margin-bottom: 0;"
        >
          <h3>薪資扣款明細</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>金額</th>
              <th>訂單時間</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="deduction in deductions"
              :key="deduction.id"
            >
              <td>{{ deduction.id }}</td>
              <td><strong class="amount">${{ deduction.total_amount }}</strong></td>
              <td>{{ new Date(deduction.order_time).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="deductions.length === 0"
          class="empty"
        >
          尚無扣款紀錄
        </p>
      </div>
    </template>

    <p
      v-if="error"
      class="error-text"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.loading { text-align: center; padding: 2rem; color: #999; }
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.section-header h3 { margin: 0; flex: 1; color: #333; }
.header-actions { display: flex; align-items: center; gap: 0.5rem; }
.tag { background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.stats-row { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1rem; }
.stat-card { text-align: left; }
.stat-label { color: #999; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.02em; }
.stat-value { font-size: 1.75rem; font-weight: 800; color: #0891b2; margin-top: 4px; }
.stat-desc { color: #999; font-size: 0.8rem; margin-top: 2px; }
.barcode-card { text-align: center; max-width: 320px; margin: 0 auto 1rem; padding: 1.5rem; }
.barcode-label-title { color: #999; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
.barcode-card img { margin-top: 0.5rem; max-width: 100%; }
.barcode-code { margin-top: 0.5rem; font-family: monospace; font-size: 0.8rem; color: #666; }
.data-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
.data-table th { text-align: left; padding: 0.5rem 0.75rem; color: #999; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #eee; }
.data-table td { padding: 0.75rem; border-top: 1px solid #f0f0f0; }
.data-table tbody tr:hover { background: #fafafa; }
.amount { color: #c2410c; }
.empty { text-align: center; padding: 1.5rem; color: #999; }
.btn-small { padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: white; color: #333; cursor: pointer; font-size: 0.85rem; }
.btn-accent { background: #f97316; color: white; border-color: #f97316; }
.btn-accent:hover { background: #ea580c; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
.success-text { color: #047857; font-size: 0.875rem; margin-bottom: 1rem; }

@media (max-width: 640px) {
  .page-container { margin: 1rem auto; }
  .section-header { align-items: stretch; flex-direction: column; }
  .header-actions { align-items: stretch; flex-wrap: wrap; }
  .header-actions .btn-small { width: 100%; }
  .data-table { display: block; overflow-x: auto; white-space: nowrap; }
}
</style>
