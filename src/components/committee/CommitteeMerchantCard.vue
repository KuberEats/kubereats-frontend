<script setup lang="ts">
import type { MerchantInfo } from '../../api/types'

defineProps<{
  merchant: MerchantInfo
  statusText: string
}>()

defineEmits<{
  approve: [merchant: MerchantInfo]
  reject: [merchant: MerchantInfo]
  suspend: [merchant: MerchantInfo]
}>()
</script>

<template>
  <article
    class="card merchant-card"
    :data-merchant-name="merchant.merchantName"
  >
    <div class="merchant-header">
      <h3>{{ merchant.merchantName }}</h3>
      <span
        class="status"
        :class="'status-' + merchant.auditStatus"
      >
        {{ statusText }}
      </span>
    </div>

    <div class="merchant-details">
      <span>廠區：{{ merchant.campus }}</span>
      <span>分類：{{ merchant.category }}</span>
      <span>配送時間：{{ merchant.deliveryTime }}</span>
      <span>最低訂購：${{ merchant.minOrder }}</span>
      <span>最多訂購數量：{{ merchant.maxOrderQuantity === 0 ? '不限' : merchant.maxOrderQuantity }}</span>
      <span v-if="merchant.cooperationStartDate || merchant.cooperationEndDate">
        合作期限：{{ merchant.cooperationStartDate ?? '未設定' }} - {{ merchant.cooperationEndDate ?? '未設定' }}
      </span>
      <span v-if="merchant.suspensionReason">
        停權原因：{{ merchant.suspensionReason }}
      </span>
    </div>

    <div
      v-if="merchant.tags.length"
      class="tags"
    >
      <span
        v-for="tag in merchant.tags"
        :key="tag"
        class="tag"
      >{{ tag }}</span>
    </div>

    <div
      v-if="merchant.auditStatus === 0 || merchant.auditStatus === 1"
      class="action-buttons"
    >
      <template v-if="merchant.auditStatus === 0">
        <button
          class="btn-approve"
          data-testid="committee-approve-button"
          @click="$emit('approve', merchant)"
        >
          通過
        </button>
        <button
          class="btn-reject"
          data-testid="committee-reject-button"
          @click="$emit('reject', merchant)"
        >
          拒絕
        </button>
      </template>
      <button
        v-else
        class="btn-reject"
        data-testid="committee-suspend-button"
        @click="$emit('suspend', merchant)"
      >
        停權
      </button>
    </div>
  </article>
</template>

<style scoped>
.card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem; }
.merchant-header { display: flex; justify-content: space-between; align-items: center; }
.merchant-header h3 { margin: 0; }
.merchant-details { display: flex; flex-wrap: wrap; gap: 1rem; color: #666; font-size: 0.9rem; margin-top: 0.5rem; }
.tags { margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tag { background: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.status { font-weight: 600; }
.status-0 { color: #f39c12; }
.status-1 { color: #27ae60; }
.status-2 { color: #e74c3c; }
.status-3 { color: #7c2d12; }
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

@media (max-width: 640px) {
  .merchant-header { align-items: flex-start; flex-direction: column; gap: 0.35rem; }
  .merchant-details { flex-direction: column; gap: 0.35rem; }
  .action-buttons { display: grid; grid-template-columns: 1fr 1fr; }
}
</style>
