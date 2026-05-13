<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listPendingMerchants, listAllMerchants, approveMerchant, rejectMerchant } from '../../api/committee'
import type { MerchantInfo } from '../../api/types'

const tab = ref<'pending' | 'all'>('pending')
const merchants = ref<MerchantInfo[]>([])
const error = ref('')
const loading = ref(true)

const auditStatusText: Record<number, string> = {
  0: '待審核',
  1: '已通過',
  2: '已拒絕',
}

async function loadMerchants() {
  loading.value = true
  error.value = ''
  try {
    merchants.value = tab.value === 'pending'
      ? await listPendingMerchants()
      : await listAllMerchants()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

async function handleApprove(id: number) {
  if (!confirm('確定通過此商家？')) return
  try {
    await approveMerchant(id)
    await loadMerchants()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '審核失敗'
  }
}

async function handleReject(id: number) {
  if (!confirm('確定拒絕此商家？')) return
  try {
    await rejectMerchant(id)
    await loadMerchants()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '審核失敗'
  }
}

function switchTab(newTab: 'pending' | 'all') {
  tab.value = newTab
  loadMerchants()
}

onMounted(loadMerchants)
</script>

<template>
  <div class="page-container">
    <h2>福委會 — 商家審核</h2>

    <div class="tabs">
      <button
        :class="['tab', { active: tab === 'pending' }]"
        @click="switchTab('pending')"
      >
        待審核
      </button>
      <button
        :class="['tab', { active: tab === 'all' }]"
        @click="switchTab('all')"
      >
        全部商家
      </button>
    </div>

    <div v-if="loading" class="loading">載入中...</div>

    <div v-else-if="merchants.length === 0" class="notice">
      {{ tab === 'pending' ? '目前沒有待審核的商家' : '目前沒有任何商家' }}
    </div>

    <div v-else class="merchant-list">
      <div v-for="m in merchants" :key="m.id" class="card merchant-card">
        <div class="merchant-header">
          <h3>{{ m.merchantName }}</h3>
          <span class="status" :class="'status-' + m.auditStatus">
            {{ auditStatusText[m.auditStatus] ?? '未知' }}
          </span>
        </div>
        <div class="merchant-details">
          <span>廠區：{{ m.campus }}</span>
          <span>分類：{{ m.category }}</span>
          <span>配送時間：{{ m.deliveryTime }}</span>
          <span>最低訂購：${{ m.minOrder }}</span>
          <span>最多訂購數量：{{ m.maxOrderQuantity === 0 ? '不限' : m.maxOrderQuantity }}</span>
        </div>
        <div v-if="m.tags.length" class="tags">
          <span v-for="tag in m.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <div v-if="m.auditStatus === 0" class="action-buttons">
          <button class="btn-approve" @click="handleApprove(m.id)">通過</button>
          <button class="btn-reject" @click="handleReject(m.id)">拒絕</button>
        </div>
      </div>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab {
  padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 4px;
  background: white; cursor: pointer; font-size: 0.9rem;
}
.tab.active { background: #e74c3c; color: white; border-color: #e74c3c; }
.loading { text-align: center; padding: 2rem; color: #999; }
.notice { text-align: center; padding: 2rem; color: #999; background: #fafafa; border-radius: 8px; }
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.merchant-header { display: flex; justify-content: space-between; align-items: center; }
.merchant-header h3 { margin: 0; }
.merchant-details { display: flex; flex-wrap: wrap; gap: 1rem; color: #666; font-size: 0.9rem; margin-top: 0.5rem; }
.tags { margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tag { background: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.status-0 { color: #f39c12; font-weight: 600; }
.status-1 { color: #27ae60; font-weight: 600; }
.status-2 { color: #e74c3c; font-weight: 600; }
.action-buttons { display: flex; gap: 0.5rem; margin-top: 1rem; }
.btn-approve {
  padding: 0.5rem 1.5rem; background: #27ae60; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;
}
.btn-approve:hover { background: #219a52; }
.btn-reject {
  padding: 0.5rem 1.5rem; background: #e74c3c; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;
}
.btn-reject:hover { background: #c0392b; }
.error-text { color: #e74c3c; font-size: 0.875rem; }
</style>
