<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getOrderById, updateOrderStatus } from '../api/orders'
import type { Order } from '../api/types'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ErrorState from '../components/ux/ErrorState.vue'
import LoadingState from '../components/ux/LoadingState.vue'
import PageHeader from '../components/ux/PageHeader.vue'
import PriceText from '../components/ux/PriceText.vue'
import SectionCard from '../components/ux/SectionCard.vue'
import StatusBadge from '../components/ux/StatusBadge.vue'
import ToastNotification from '../components/ux/ToastNotification.vue'
import { formatDateTime } from '../utils/formatters'
import { navigateTo } from '../router'

const props = defineProps<{
  orderId?: number
}>()

const order = ref<Order | null>(null)
const isLoading = ref(false)
const isUpdating = ref(false)
const errorMessage = ref('')
const toastMessage = ref('')
const isCancelDialogOpen = ref(false)

const statusLabel = computed(() => {
  if (!order.value) return ''
  if (order.value.orderStatus === 1) return '完成'
  if (order.value.orderStatus === 2) return '取消'
  return '處理中'
})

const statusTone = computed<'success' | 'warning' | 'danger' | 'neutral'>(() => {
  if (!order.value) return 'neutral'
  if (order.value.orderStatus === 1) return 'success'
  if (order.value.orderStatus === 2) return 'danger'
  return 'warning'
})

const canCancel = computed(() => order.value?.orderStatus === 0)
const cancelDisabledReason = computed(() =>
  canCancel.value ? '' : '只有處理中的訂單可以取消。',
)

async function fetchOrder() {
  if (!props.orderId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    order.value = await getOrderById(props.orderId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '訂單資料讀取失敗'
  } finally {
    isLoading.value = false
  }
}

async function setStatus(status: number) {
  if (!order.value) return

  isUpdating.value = true
  errorMessage.value = ''

  try {
    order.value = await updateOrderStatus(order.value.id, status)
    toastMessage.value = status === 2 ? '訂單已取消' : '訂單已更新'
    isCancelDialogOpen.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '訂單狀態更新失敗'
  } finally {
    isUpdating.value = false
  }
}

onMounted(fetchOrder)
watch(() => props.orderId, fetchOrder)
</script>

<template>
  <main class="page">
    <PageHeader
      eyebrow="Order Detail"
      :title="order ? `訂單 #${order.id}` : '訂單詳情'"
      subtitle="查看狀態、餐點明細與金額。"
    >
      <template #action>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/orders')"
        >
          返回訂單
        </button>
      </template>
    </PageHeader>

    <ErrorState
      v-if="errorMessage"
      :message="errorMessage"
      retry-label="重新載入"
      show-home
      @retry="fetchOrder"
      @home="navigateTo('/orders')"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="card"
      :rows="2"
      label="訂單載入中"
    />

    <section
      v-else-if="order"
      class="order-grid"
    >
      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              Items
            </p>
            <h2>餐點明細</h2>
          </div>
          <PriceText :value="order.totalAmount" />
        </div>

        <div class="order-item-list">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="order-item-row"
          >
            <div>
              <strong>{{ item.itemName }}</strong>
              <span><PriceText :value="item.unitPrice" /> × {{ item.quantity }}</span>
            </div>
            <PriceText :value="item.subtotal" />
          </div>
        </div>

        <div class="total-row">
          <span>總金額</span>
          <PriceText :value="order.totalAmount" />
        </div>
      </SectionCard>

      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              Status
            </p>
            <h2>訂單狀態</h2>
          </div>
          <StatusBadge
            :label="statusLabel"
            :tone="statusTone"
          />
        </div>

        <ol class="status-timeline">
          <li class="done">
            建立訂單：{{ formatDateTime(order.createdAt || order.orderTime) }}
          </li>
          <li :class="{ done: order.orderStatus !== 0 }">
            {{ statusLabel }}：{{ formatDateTime(order.updatedAt) || '等待更新' }}
          </li>
        </ol>

        <div class="status-actions">
          <button
            class="danger-button"
            type="button"
            :disabled="isUpdating || !canCancel"
            :title="cancelDisabledReason"
            @click="isCancelDialogOpen = true"
          >
            {{ isUpdating ? '處理中' : '取消訂單' }}
          </button>
          <span
            v-if="!canCancel"
            class="disabled-reason"
          >
            {{ cancelDisabledReason }}
          </span>
        </div>

        <div class="finance-list">
          <div
            v-for="record in order.financeRecords"
            :key="record.id"
            class="finance-row"
          >
            <span>{{ record.merchantName }}</span>
            <strong>結算 <PriceText :value="record.settlementAmount" /></strong>
          </div>
        </div>
      </SectionCard>
    </section>

    <ConfirmDialog
      :open="isCancelDialogOpen"
      title="取消訂單"
      message="取消後可能無法復原，確定要取消這筆訂單嗎？"
      confirm-label="確認取消"
      tone="danger"
      :loading="isUpdating"
      @cancel="isCancelDialogOpen = false"
      @confirm="setStatus(2)"
    />

    <ToastNotification
      v-if="toastMessage"
      :message="toastMessage"
      tone="success"
      @close="toastMessage = ''"
    />
  </main>
</template>

<style scoped>
.status-timeline {
  display: grid;
  gap: 10px;
  margin: 16px 0;
  padding-left: 20px;
  color: var(--color-muted);
}

.status-timeline li.done {
  color: var(--color-text);
  font-weight: 700;
}

.disabled-reason {
  color: var(--color-muted);
  font-size: 14px;
}
</style>
