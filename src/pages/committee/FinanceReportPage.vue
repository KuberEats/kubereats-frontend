<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getFinanceHistory, listReports } from '../../api/finance'
import type { FinanceHistoryRecord, ReportResult } from '../../api/finance'

const history = ref<FinanceHistoryRecord[]>([])
const reports = ref<ReportResult[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [h, r] = await Promise.all([
      getFinanceHistory(),
      listReports(),
    ])
    history.value = h
    reports.value = r
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <div class="section-header">
      <h3>財務報表</h3>
    </div>

    <div v-if="loading" class="loading">載入中...</div>

    <template v-else-if="!error">
      <div v-if="reports.length > 0" class="card">
        <div class="section-header" style="margin-bottom: 0;">
          <h3>已產生的報表</h3>
        </div>
        <div class="report-list">
          <a
            v-for="report in reports"
            :key="report.filename"
            :href="report.url"
            target="_blank"
            class="report-item"
          >
            <span class="report-icon">PDF</span>
            <span>{{ report.filename }}</span>
          </a>
        </div>
      </div>

      <div class="card">
        <div class="section-header" style="margin-bottom: 0;">
          <h3>結算歷史紀錄</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>編號</th>
              <th>商家編號</th>
              <th>訂單編號</th>
              <th>結算金額</th>
              <th>詳細資料</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in history" :key="record.id">
              <td>{{ record.id }}</td>
              <td>{{ record.merchant_id }}</td>
              <td>{{ record.order_id }}</td>
              <td><strong class="amount">${{ record.settlement_amount }}</strong></td>
              <td>{{ record.report_data }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="history.length === 0" class="empty">尚無歷史紀錄</p>
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
.data-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
.data-table th { text-align: left; padding: 0.5rem 0.75rem; color: #999; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #eee; }
.data-table td { padding: 0.75rem; border-top: 1px solid #f0f0f0; }
.data-table tbody tr:hover { background: #fafafa; }
.amount { color: #c2410c; }
.empty { text-align: center; padding: 1.5rem; color: #999; }
.report-list { display: grid; gap: 0.5rem; margin-top: 0.75rem; }
.report-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 1px solid #eee; border-radius: 8px; text-decoration: none; color: #333; transition: border-color 0.2s; }
.report-item:hover { border-color: #f97316; }
.report-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 6px; background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 800; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
</style>
