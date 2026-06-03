<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTodayOrders, confirmTodayOrders } from '../../api/merchants'
import { generateBarcode } from '../../api/finance'
import { navigateTo } from '../../router'
import type { TodayOrderSummary } from '../../api/types'
import type { BarcodeResult } from '../../api/finance'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const summary = ref<TodayOrderSummary | null>(null)
const barcodes = ref<BarcodeResult[]>([])
const error = ref('')
const successMessage = ref('')
const loading = ref(true)
const confirming = ref(false)
const generatingBarcodes = ref(false)
const showConfirmDialog = ref(false)

onMounted(async () => {
  try {
    summary.value = await getTodayOrders()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
})

async function handleGenerateOrderBarcodes() {
  if (!summary.value?.userIds || summary.value.userIds.length === 0) {
    error.value = '目前今日尚無訂單或無法取得員工資訊。'
    return
  }

  generatingBarcodes.value = true
  error.value = ''
  successMessage.value = ''
  barcodes.value = []

  try {
    // Generate barcodes for each userId (simulating label printing for each order)
    const results = await Promise.all(
      summary.value.userIds.map(uid => generateBarcode(uid))
    )
    barcodes.value = results
    successMessage.value = `已成功為 ${results.length} 筆訂單產生識別標籤。`
  } catch (e: unknown) {
    error.value = '標籤產生失敗：' + (e instanceof Error ? e.message : '未知錯誤')
  } finally {
    generatingBarcodes.value = false
  }
}

async function handleConfirmToday() {
  showConfirmDialog.value = false
  confirming.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const result = await confirmTodayOrders()
    if (result.confirmed_count === 0) {
      successMessage.value = '今日所有訂單已是完成狀態，無需重複確認。'
    } else {
      successMessage.value = `已確認完成 ${result.confirmed_count} 筆訂單，將從員工薪資扣款。`
    }
    summary.value = await getTodayOrders()
  } catch (e: unknown) {
    error.value = '確認失敗：' + (e instanceof Error ? e.message : '未知錯誤')
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="section-header">
      <h2>今日訂單彙整</h2>
      <div class="header-actions">
        <button
          class="btn-small btn-accent"
          :disabled="generatingBarcodes || loading"
          @click="handleGenerateOrderBarcodes"
        >
          {{ generatingBarcodes ? '產生中...' : '生成訂單條碼' }}
        </button>
        <button
          class="btn-small btn-confirm"
          :disabled="confirming"
          @click="showConfirmDialog = true"
        >
          {{ confirming ? '確認中...' : '確認今日訂單完成' }}
        </button>
        <button
          class="btn-small"
          @click="navigateTo('/merchant/dashboard')"
        >
          ← 返回
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      載入中...
    </div>

    <template v-else-if="summary">
      <div class="summary-card card">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">日期</span>
            <span class="summary-value">{{ summary.date }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">總訂購數量</span>
            <span class="summary-value">{{ summary.totalOrders }} 份</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">總金額</span>
            <span class="summary-value">${{ summary.totalAmount }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="summary.items.length === 0"
        class="notice"
      >
        今日尚無訂單
      </div>

      <table
        v-else
        class="orders-table"
      >
        <caption class="sr-only">
          今日訂單彙整，包含品項、訂購數量與金額。
        </caption>
        <thead>
          <tr>
            <th>品項</th>
            <th>數量</th>
            <th>金額</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in summary.items"
            :key="item.menuId"
          >
            <td>{{ item.itemName }}</td>
            <td>{{ item.totalQuantity }} 份</td>
            <td>${{ item.totalAmount }}</td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="barcodes.length > 0"
        class="barcodes-section"
      >
        <h3>訂單識別標籤</h3>
        <p class="section-desc">
          模擬標籤機輸出，可用於貼在餐點上辨識取餐員工
        </p>
        <div class="barcodes-grid">
          <div
            v-for="(bc, index) in barcodes"
            :key="index"
            class="card barcode-card"
          >
            <div class="barcode-label-title">
              員工識別標籤
            </div>
            <img
              :src="bc.barcode_base64"
              :alt="'Order Barcode ' + bc.staff_code"
            >
            <div class="barcode-code">
              {{ bc.staff_code }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <p
      v-if="successMessage"
      class="success-text"
      role="status"
    >
      {{ successMessage }}
    </p>

    <p
      v-if="error"
      class="error-text"
    >
      {{ error }}
    </p>

    <ConfirmDialog
      :open="showConfirmDialog"
      title="確認今日訂單完成"
      message="確定要將今日所有待處理訂單標記為完成？完成後將從員工薪資扣款。"
      confirm-label="確認完成"
      :loading="confirming"
      @confirm="handleConfirmToday"
      @cancel="showConfirmDialog = false"
    />
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.section-header h2 { margin: 0; flex: 1; color: #333; }
.header-actions { display: flex; gap: 0.5rem; }
.loading { text-align: center; padding: 2rem; color: #999; }
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.summary-grid { display: flex; gap: 2rem; justify-content: center; }
.summary-item { text-align: center; }
.summary-label { display: block; font-size: 0.85rem; color: #999; }
.summary-value { display: block; font-size: 1.5rem; font-weight: 700; color: #333; }
.notice { text-align: center; padding: 1rem; color: #999; }
.orders-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 2rem; }
.orders-table th { background: #f5f5f5; padding: 0.75rem; text-align: left; font-weight: 600; color: #555; }
.orders-table td { padding: 0.75rem; border-top: 1px solid #eee; }

.barcodes-section { margin-top: 2rem; border-top: 1px dashed #ddd; padding-top: 2rem; }
.barcodes-section h3 { margin-bottom: 0.25rem; }
.section-desc { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
.barcodes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.barcode-card { text-align: center; padding: 1.25rem; margin-bottom: 0; }
.barcode-label-title { color: #999; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; }
.barcode-card img { margin-top: 0.5rem; max-width: 100%; height: auto; }
.barcode-code { margin-top: 0.5rem; font-family: monospace; font-size: 0.8rem; color: #666; }

.btn-small { padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: white; color: #333; cursor: pointer; white-space: nowrap; }
.btn-small:hover { background: #f5f5f5; }
.btn-confirm { background: #27ae60; color: white; border-color: #27ae60; }
.btn-confirm:hover { background: #219a52; }
.btn-confirm:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-accent { background: #f97316; color: white; border-color: #f97316; }
.btn-accent:hover { background: #ea580c; }
.btn-accent:disabled { opacity: 0.55; cursor: not-allowed; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
.success-text { color: #047857; font-size: 0.875rem; margin-top: 1rem; }

@media (max-width: 640px) {
  .page-container { margin: 1rem auto; }
  .section-header { align-items: stretch; flex-direction: column; }
  .header-actions { flex-direction: column; }
  .summary-grid { flex-direction: column; gap: 1rem; }
  .orders-table { display: block; overflow-x: auto; white-space: nowrap; }
  .barcodes-grid { grid-template-columns: 1fr; }
}
</style>
