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
import { useI18n } from '../i18n'

const props = defineProps<{
  orderId?: number
}>()

const order = ref<Order | null>(null)
const isLoading = ref(false)
const isUpdating = ref(false)
const errorMessage = ref('')
const toastMessage = ref('')
const isCancelDialogOpen = ref(false)
const { t } = useI18n()

const statusLabel = computed(() => {
  if (!order.value) return ''
  if (order.value.orderStatus === 1) return t('status.done')
  if (order.value.orderStatus === 2) return t('status.cancelled')
  return t('status.processing')
})

const statusTone = computed<'success' | 'warning' | 'danger' | 'neutral'>(() => {
  if (!order.value) return 'neutral'
  if (order.value.orderStatus === 1) return 'success'
  if (order.value.orderStatus === 2) return 'danger'
  return 'warning'
})

const canCancel = computed(() => order.value?.orderStatus === 0)
const cancelDisabledReason = computed(() =>
  canCancel.value ? '' : t('orderDetail.cancelReason'),
)

async function fetchOrder() {
  if (!props.orderId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    order.value = await getOrderById(props.orderId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('orderDetail.loadFailed')
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
    toastMessage.value = status === 2 ? t('orderDetail.cancelSuccess') : t('orderDetail.updateSuccess')
    isCancelDialogOpen.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('orderDetail.updateFailed')
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
      :eyebrow="t('orderDetail.eyebrow')"
      :title="order ? t('orderDetail.title', { id: order.id }) : t('orderDetail.titleFallback')"
      :subtitle="t('orderDetail.subtitle')"
    >
      <template #action>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/orders')"
        >
          {{ t('orderDetail.back') }}
        </button>
      </template>
    </PageHeader>

    <ErrorState
      v-if="errorMessage"
      :message="errorMessage"
      :retry-label="t('action.reload')"
      show-home
      @retry="fetchOrder"
      @home="navigateTo('/orders')"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="card"
      :rows="2"
      :label="t('orderDetail.loading')"
    />

    <section
      v-else-if="order"
      class="order-grid"
    >
      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              {{ t('orderDetail.items') }}
            </p>
            <h2>{{ t('orderDetail.items') }}</h2>
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
          <span>{{ t('orderDetail.totalAmount') }}</span>
          <PriceText :value="order.totalAmount" />
        </div>
      </SectionCard>

      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              {{ t('orderDetail.status') }}
            </p>
            <h2>{{ t('orderDetail.status') }}</h2>
          </div>
          <StatusBadge
            :label="statusLabel"
            :tone="statusTone"
          />
        </div>

        <ol class="status-timeline">
          <li class="done">
            {{ t('orderDetail.created', { time: formatDateTime(order.createdAt || order.orderTime) }) }}
          </li>
          <li :class="{ done: order.orderStatus !== 0 }">
            {{ t('orderDetail.updated', { status: statusLabel, time: formatDateTime(order.updatedAt) || t('orderDetail.waiting') }) }}
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
            {{ isUpdating ? t('orderDetail.cancelPending') : t('orderDetail.cancel') }}
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
            <strong>{{ t('orderDetail.settlement') }} <PriceText :value="record.settlementAmount" /></strong>
          </div>
        </div>
      </SectionCard>
    </section>

    <ConfirmDialog
      :open="isCancelDialogOpen"
      :title="t('orderDetail.confirmCancelTitle')"
      :message="t('orderDetail.confirmCancelMessage')"
      :confirm-label="t('orderDetail.confirmCancel')"
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
