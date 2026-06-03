<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
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

const tab = shallowRef<'pending' | 'all'>('pending')
const merchants = ref<MerchantInfo[]>([])
const error = shallowRef('')
const loading = shallowRef(true)
const reviewing = shallowRef(false)
const pendingReview = ref<{ merchant: MerchantInfo; action: 'approve' | 'reject' | 'suspend' } | null>(null)

const auditStatusText: Record<number, string> = {
  0: '待審核',
  1: '已通過',
  2: '已拒絕',
  3: '已停權',
}

const pendingCount = computed(() => merchants.value.filter(merchant => merchant.auditStatus === 0).length)
const approvedCount = computed(() => merchants.value.filter(merchant => merchant.auditStatus === 1).length)
const suspendedCount = computed(() => merchants.value.filter(merchant => merchant.auditStatus === 3).length)
const toolbarDescription = computed(() => (
  tab.value === 'pending'
    ? '只顯示尚未完成審核的商家申請，適合每日快速處理。'
    : '檢視所有商家狀態，包含已通過、已拒絕與停權紀錄。'
))

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
  <div class="committee-page">
    <header class="review-hero">
      <div class="review-heading">
        <p class="review-eyebrow">
          Committee console
        </p>
        <h2>福委會 — 商家審核</h2>
        <p class="review-subtitle">
          集中處理新商家准入、合作期限與停權管理，讓審核狀態一眼可讀。
        </p>
      </div>

      <div
        class="review-summary"
        aria-label="商家審核摘要"
      >
        <div class="summary-item urgent">
          <span>待處理</span>
          <strong>{{ pendingCount }}</strong>
        </div>
        <div class="summary-item">
          <span>已通過</span>
          <strong>{{ approvedCount }}</strong>
        </div>
        <div class="summary-item">
          <span>停權中</span>
          <strong>{{ suspendedCount }}</strong>
        </div>
      </div>
    </header>

    <section
      class="review-toolbar"
      aria-label="審核清單篩選"
    >
      <div
        class="tabs"
        role="tablist"
        aria-label="商家審核狀態"
      >
        <button
          type="button"
          :class="['tab', { active: tab === 'pending' }]"
          :aria-selected="tab === 'pending'"
          role="tab"
          data-testid="committee-pending-tab"
          @click="switchTab('pending')"
        >
          待審核
        </button>
        <button
          type="button"
          :class="['tab', { active: tab === 'all' }]"
          :aria-selected="tab === 'all'"
          role="tab"
          data-testid="committee-all-tab"
          @click="switchTab('all')"
        >
          全部商家
        </button>
      </div>
      <p class="toolbar-description">
        {{ toolbarDescription }}
      </p>
    </section>

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
      class="review-list"
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
.committee-page {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 28px 24px 64px;
}

.review-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 24px;
  align-items: stretch;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 56%, #fff7ed 100%);
  padding: 24px;
}

.review-heading {
  display: grid;
  align-content: center;
  gap: 8px;
  min-width: 0;
}

.review-eyebrow {
  color: #c2410c;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.review-heading h2 {
  color: #111827;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
}

.review-subtitle,
.toolbar-description {
  color: #6b7280;
}

.review-subtitle {
  max-width: 620px;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.summary-item {
  display: grid;
  align-content: center;
  gap: 8px;
  min-height: 112px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.86);
  padding: 16px;
}

.summary-item span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
}

.summary-item strong {
  color: #111827;
  font-size: 34px;
  line-height: 1;
}

.summary-item.urgent {
  border-color: #fed7aa;
  background: #fff7ed;
}

.summary-item.urgent strong {
  color: #c2410c;
}

.review-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}

.tabs {
  display: flex;
  gap: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 4px;
}

.tab {
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4b5563;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

.tab.active {
  background: #ffffff;
  color: #c2410c;
  box-shadow: 0 1px 4px rgba(17, 24, 39, 0.12);
}

.toolbar-description {
  font-size: 14px;
  text-align: right;
}

.review-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
  padding-bottom: 48px;
}

.loading,
.notice {
  margin-top: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 36px 18px;
  color: #6b7280;
  text-align: center;
}

.error-text {
  margin-top: 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px 14px;
  font-size: 14px;
}

@media (max-width: 860px) {
  .committee-page {
    padding: 20px 16px 88px;
  }

  .review-hero {
    grid-template-columns: 1fr;
  }

  .review-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-description {
    text-align: left;
  }
}

@media (max-width: 640px) {
  .review-summary {
    grid-template-columns: 1fr;
  }

  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
  }
}
</style>
