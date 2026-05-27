<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTodayOrders, confirmTodayOrders } from '../../api/merchants'
import { navigateTo } from '../../router'
import type { TodayOrderSummary } from '../../api/types'

const summary = ref<TodayOrderSummary | null>(null)
const error = ref('')
const loading = ref(true)
const confirming = ref(false)

onMounted(async () => {
  try {
    summary.value = await getTodayOrders()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
})

async function handleConfirmToday() {
  if (!confirm('確定要將今日所有待處理訂單標記為完成？\n完成後將從員工薪資扣款。')) return
  confirming.value = true
  try {
    const result = await confirmTodayOrders()
    if (result.confirmed_count === 0) {
      alert('今日所有訂單已是完成狀態，無需重複確認。')
    } else {
      alert(`已確認完成 ${result.confirmed_count} 筆訂單，將從員工薪資扣款。`)
    }
    summary.value = await getTodayOrders()
  } catch (e: unknown) {
    alert('確認失敗：' + (e instanceof Error ? e.message : '未知錯誤'))
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="section-header">
      <h2>今日訂單彙整</h2>
      <button
        class="btn-small btn-confirm"
        :disabled="confirming"
        @click="handleConfirmToday"
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
.section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.section-header h2 { margin: 0; flex: 1; color: #333; }
.loading { text-align: center; padding: 2rem; color: #999; }
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.summary-grid { display: flex; gap: 2rem; justify-content: center; }
.summary-item { text-align: center; }
.summary-label { display: block; font-size: 0.85rem; color: #999; }
.summary-value { display: block; font-size: 1.5rem; font-weight: 700; color: #333; }
.notice { text-align: center; padding: 1rem; color: #999; }
.orders-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.orders-table th { background: #f5f5f5; padding: 0.75rem; text-align: left; font-weight: 600; color: #555; }
.orders-table td { padding: 0.75rem; border-top: 1px solid #eee; }
.btn-small { padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: white; color: #333; cursor: pointer; }
.btn-small:hover { background: #f5f5f5; }
.btn-confirm { background: #27ae60; color: white; border-color: #27ae60; }
.btn-confirm:hover { background: #219a52; }
.btn-confirm:disabled { opacity: 0.55; cursor: not-allowed; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
</style>
