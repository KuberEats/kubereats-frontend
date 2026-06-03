<script setup lang="ts">
import { computed } from 'vue'
import type { MerchantInfo } from '../../api/types'

const props = defineProps<{
  merchant: MerchantInfo
  statusText: string
}>()

defineEmits<{
  approve: [merchant: MerchantInfo]
  reject: [merchant: MerchantInfo]
  suspend: [merchant: MerchantInfo]
}>()

const merchantInitial = computed(() => props.merchant.merchantName.trim().slice(0, 1) || '商')
const statusClass = computed(() => `status-${props.merchant.auditStatus}`)
const maxOrderText = computed(() => (
  props.merchant.maxOrderQuantity === 0 ? '不限' : `${props.merchant.maxOrderQuantity} 份`
))
const cooperationPeriod = computed(() => {
  if (!props.merchant.cooperationStartDate && !props.merchant.cooperationEndDate) return null
  return `${props.merchant.cooperationStartDate ?? '未設定'} - ${props.merchant.cooperationEndDate ?? '未設定'}`
})
const detailItems = computed(() => [
  { label: '廠區', value: props.merchant.campus },
  { label: '分類', value: props.merchant.category },
  { label: '配送時間', value: props.merchant.deliveryTime },
  { label: '最低訂購', value: `$${props.merchant.minOrder}` },
  { label: '單次上限', value: maxOrderText.value },
  ...(cooperationPeriod.value ? [{ label: '合作期限', value: cooperationPeriod.value }] : []),
  ...(props.merchant.suspensionReason ? [{ label: '停權原因', value: props.merchant.suspensionReason }] : []),
])
</script>

<template>
  <article
    class="committee-merchant-card merchant-card"
    :data-merchant-name="merchant.merchantName"
  >
    <div
      class="merchant-avatar"
      aria-hidden="true"
    >
      {{ merchantInitial }}
    </div>

    <div class="merchant-content">
      <div class="merchant-topline">
        <div class="merchant-title-block">
          <h3 class="merchant-name">
            {{ merchant.merchantName }}
          </h3>
          <p class="merchant-category">
            {{ merchant.campus }} / {{ merchant.category }}
          </p>
        </div>
        <span
          class="status-badge"
          :class="statusClass"
        >
          {{ statusText }}
        </span>
      </div>

      <dl class="merchant-details">
        <div
          v-for="item in detailItems"
          :key="item.label"
          class="detail-item"
        >
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>

      <div
        v-if="merchant.tags.length"
        class="tags"
        aria-label="商家標籤"
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
            type="button"
            class="action-button approve"
            data-testid="committee-approve-button"
            @click="$emit('approve', merchant)"
          >
            通過
          </button>
          <button
            type="button"
            class="action-button reject"
            data-testid="committee-reject-button"
            @click="$emit('reject', merchant)"
          >
            拒絕
          </button>
        </template>
        <button
          v-else
          type="button"
          class="action-button suspend"
          data-testid="committee-suspend-button"
          @click="$emit('suspend', merchant)"
        >
          停權
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.committee-merchant-card {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.committee-merchant-card:hover {
  border-color: #fed7aa;
  box-shadow: 0 12px 28px rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
}

.merchant-avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
}

.merchant-content {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.merchant-topline {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.merchant-title-block {
  min-width: 0;
}

.merchant-name {
  color: #111827;
  font-size: 20px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.merchant-category {
  margin-top: 4px;
  color: #6b7280;
  font-size: 14px;
}

.status-badge {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.status-0 {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.status-1 {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #047857;
}

.status-2 {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.status-3 {
  border-color: #d1d5db;
  background: #f3f4f6;
  color: #374151;
}

.merchant-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  min-width: 0;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #f9fafb;
  padding: 10px 12px;
}

.detail-item dt {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.detail-item dd {
  margin-top: 4px;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 800;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #f3f4f6;
  padding-top: 14px;
}

.action-button {
  min-width: 92px;
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 9px 14px;
  font-weight: 900;
}

.action-button.approve {
  background: #f97316;
  color: #ffffff;
}

.action-button.approve:hover {
  background: #ea580c;
}

.action-button.reject,
.action-button.suspend {
  background: #ffffff;
  color: #b91c1c;
  border-color: #fecaca;
}

.action-button.reject:hover,
.action-button.suspend:hover {
  background: #fef2f2;
}

@media (max-width: 760px) {
  .committee-merchant-card {
    grid-template-columns: 1fr;
  }

  .merchant-avatar {
    width: 52px;
    height: 52px;
    font-size: 20px;
  }

  .merchant-topline {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .merchant-details {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .action-button.suspend {
    grid-column: 1 / -1;
  }
}
</style>
