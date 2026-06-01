<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  listPendingMerchants,
  listAllMerchants,
  approveMerchant,
  rejectMerchant,
  suspendMerchant,
} from '../../api/committee'
import type { MerchantInfo } from '../../api/types'
import CommitteeMerchantCard from '../../components/committee/CommitteeMerchantCard.vue'
import CommitteeReviewActionPanel from '../../components/committee/CommitteeReviewActionPanel.vue'

const tab = ref<'pending' | 'all'>('pending')
const merchants = ref<MerchantInfo[]>([])
const error = ref('')
const loading = ref(true)
const reviewing = ref(false)
const pendingReview = ref<{ merchant: MerchantInfo; action: 'approve' | 'reject' | 'suspend' } | null>(null)

const auditStatusText: Record<number, string> = {
  0: '待審核',
  1: '已通過',
  2: '已拒絕',
  3: '已停權',
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

function askApprove(merchant: MerchantInfo) {
  pendingReview.value = { merchant, action: 'approve' }
}

function askReject(merchant: MerchantInfo) {
  pendingReview.value = { merchant, action: 'reject' }
}

function askSuspend(merchant: MerchantInfo) {
  pendingReview.value = { merchant, action: 'suspend' }
}

async function handleReview(payload?: {
  cooperationStartDate?: string
  cooperationEndDate?: string
  reason?: string
}) {
  if (!pendingReview.value) return
  reviewing.value = true
  error.value = ''

  try {
    const merchantId = pendingReview.value.merchant.id
    if (pendingReview.value.action === 'approve') {
      if (!payload?.cooperationStartDate || !payload.cooperationEndDate) {
        throw new Error('請填寫合作期限')
      }
      await approveMerchant(merchantId, {
        cooperationStartDate: payload.cooperationStartDate,
        cooperationEndDate: payload.cooperationEndDate,
      })
    } else if (pendingReview.value.action === 'suspend') {
      if (!payload?.reason) {
        throw new Error('請填寫停權原因')
      }
      await suspendMerchant(merchantId, payload.reason)
    } else if (pendingReview.value.action === 'reject') {
      await rejectMerchant(merchantId)
    }
    pendingReview.value = null
    await loadMerchants()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '審核失敗'
  } finally {
    reviewing.value = false
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
        data-testid="committee-pending-tab"
        @click="switchTab('pending')"
      >
        待審核
      </button>
      <button
        :class="['tab', { active: tab === 'all' }]"
        data-testid="committee-all-tab"
        @click="switchTab('all')"
      >
        全部商家
      </button>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      載入中...
    </div>

    <div
      v-else-if="merchants.length === 0"
      class="notice"
    >
      {{ tab === 'pending' ? '目前沒有待審核的商家' : '目前沒有任何商家' }}
    </div>

    <div
      v-else
      class="merchant-list"
    >
      <CommitteeMerchantCard
        v-for="m in merchants"
        :key="m.id"
        :merchant="m"
        :status-text="auditStatusText[m.auditStatus] ?? '未知'"
        @approve="askApprove"
        @reject="askReject"
        @suspend="askSuspend"
      />
    </div>

    <p
      v-if="error"
      class="error-text"
    >
      {{ error }}
    </p>

    <CommitteeReviewActionPanel
      :merchant="pendingReview?.merchant ?? null"
      :action="pendingReview?.action ?? null"
      :loading="reviewing"
      @approve="handleReview"
      @reject="handleReview"
      @suspend="reason => handleReview({ reason })"
      @cancel="pendingReview = null"
    />
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
.error-text { color: #e74c3c; font-size: 0.875rem; }

@media (max-width: 640px) {
  .page-container { margin: 1rem auto; }
  .tabs { display: grid; grid-template-columns: 1fr 1fr; }
}
</style>
