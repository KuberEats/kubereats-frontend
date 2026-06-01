<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getReservationStatus, listOrders } from '../api/orders'
import type { Order, OrderHistorySortKey, ReservationStatus, ReservationStatusResponse } from '../api/types'
import EmptyState from '../components/ux/EmptyState.vue'
import ErrorState from '../components/ux/ErrorState.vue'
import LoadingState from '../components/ux/LoadingState.vue'
import PageHeader from '../components/ux/PageHeader.vue'
import PriceText from '../components/ux/PriceText.vue'
import StatusBadge from '../components/ux/StatusBadge.vue'
import { formatDateTime } from '../utils/formatters'
import { navigateTo } from '../router'
import { useI18n, type MessageKey } from '../i18n'

const { t } = useI18n()

const sortOptions: { labelKey: MessageKey; value: OrderHistorySortKey }[] = [
  { labelKey: 'orders.sort.time', value: 'time' },
  { labelKey: 'orders.sort.merchant', value: 'merchant' },
]

const statusFilters: { labelKey: MessageKey; value: string }[] = [
  { labelKey: 'orders.filter.all', value: 'all' },
  { labelKey: 'orders.filter.processing', value: 'processing' },
  { labelKey: 'orders.filter.done', value: 'done' },
  { labelKey: 'orders.filter.cancelled', value: 'cancelled' },
]

const selectedSort = ref<OrderHistorySortKey>('time')
const selectedStatus = ref('all')
const orders = ref<Order[]>([])
const latestReservation = ref<ReservationStatusResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const visibleOrders = computed(() =>
  orders.value.filter(order => {
    if (selectedStatus.value === 'done') return order.orderStatus === 1
    if (selectedStatus.value === 'cancelled') return order.orderStatus === 2
    if (selectedStatus.value === 'processing') return order.orderStatus === 0
    return true
  }),
)

function currentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: number }
    return user.id || 1
  } catch {
    return 1
  }
}

function merchantNames(order: Order) {
  const names = order.financeRecords.map(record => record.merchantName)
  return [...new Set(names)].join('、') || t('orders.noMerchant')
}

function statusLabel(status: number) {
  if (status === 1) return t('status.done')
  if (status === 2) return t('status.cancelled')
  return t('status.processing')
}

function statusTone(status: number): 'success' | 'warning' | 'danger' {
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'warning'
}

function reservationStatusLabel(status: ReservationStatus) {
  if (status === 'PENDING_RESERVATION' || status === 'PROCESSING') return t('reservation.confirming')
  if (status === 'RESERVED') return t('reservation.reserved')
  if (status === 'SOLD_OUT') return t('reservation.soldOut')
  if (status === 'CANCELLED') return t('reservation.cancelled')
  if (status === 'EXPIRED') return t('reservation.expired')
  return t('reservation.failed')
}

function reservationTone(status: ReservationStatus): 'success' | 'warning' | 'danger' {
  if (status === 'RESERVED') return 'success'
  if (status === 'PENDING_RESERVATION' || status === 'PROCESSING') return 'warning'
  return 'danger'
}

function reservationMerchantName(reservation: ReservationStatusResponse) {
  return reservation.merchant_name || t('checkout.title')
}

function reservationItemCount(reservation: ReservationStatusResponse) {
  return reservation.items?.length || reservation.failed_items?.length || 0
}

async function fetchOrders() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    orders.value = await listOrders(currentUserId(), selectedSort.value)
    const latestOrderToken = localStorage.getItem('latestReservationOrderToken')
    if (latestOrderToken) {
      try {
        latestReservation.value = await getReservationStatus(latestOrderToken)
      } catch {
        latestReservation.value = null
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('orders.loadFailed')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchOrders)
watch(selectedSort, fetchOrders)
</script>

<template>
  <main class="page">
    <PageHeader
      :eyebrow="t('orders.eyebrow')"
      :title="t('orders.title')"
      :subtitle="t('orders.subtitle', { count: visibleOrders.length })"
    />

    <section class="search-panel">
      <div
        class="filter-bar compact"
        aria-label="訂單狀態篩選"
      >
        <button
          v-for="filter in statusFilters"
          :key="filter.value"
          class="pill-button"
          :class="{ active: selectedStatus === filter.value }"
          type="button"
          @click="selectedStatus = filter.value"
        >
          {{ t(filter.labelKey) }}
        </button>
      </div>

      <div
        class="filter-bar compact"
        aria-label="歷史訂單排序"
      >
        <button
          v-for="option in sortOptions"
          :key="option.value"
          class="pill-button"
          :class="{ active: selectedSort === option.value }"
          type="button"
          @click="selectedSort = option.value"
        >
          {{ t(option.labelKey) }}
        </button>
      </div>
    </section>

    <ErrorState
      v-if="errorMessage"
      :message="errorMessage"
      :retry-label="t('action.reload')"
      @retry="fetchOrders"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="list"
      :rows="3"
      :label="t('orders.loading')"
    />

    <template v-else>
      <section
        v-if="latestReservation"
        class="history-list"
        aria-label="近期預訂列表"
      >
        <button
          class="history-order-row"
          type="button"
          @click="navigateTo(`/reservation-status/${encodeURIComponent(latestReservation.order_token)}`)"
        >
          <div class="history-order-main">
            <div>
              <p class="eyebrow">
                {{ t('orders.reservation') }}
              </p>
              <h2>{{ reservationMerchantName(latestReservation) }}</h2>
            </div>
            <StatusBadge
              :label="reservationStatusLabel(latestReservation.status)"
              :tone="reservationTone(latestReservation.status)"
            />
          </div>

          <div class="history-order-meta">
            <span>{{ latestReservation.service_date || t('orders.datePending') }}</span>
            <span>{{ latestReservation.pickup_slot || t('orders.slotPending') }}</span>
            <span>{{ t('orders.itemCount', { count: reservationItemCount(latestReservation) }) }}</span>
            <strong v-if="latestReservation.pickup_number">
              {{ t('orders.pickupNumber', { number: latestReservation.pickup_number }) }}
            </strong>
          </div>
        </button>
      </section>

      <section
        v-if="visibleOrders.length > 0"
        class="history-list"
        aria-label="歷史訂單列表"
      >
        <button
          v-for="order in visibleOrders"
          :key="order.id"
          class="history-order-row"
          type="button"
          @click="navigateTo(`/orders/${order.id}`)"
        >
          <div class="history-order-main">
            <div>
              <p class="eyebrow">
                {{ t('orders.orderLabel', { id: order.id }) }}
              </p>
              <h2>{{ merchantNames(order) }}</h2>
            </div>
            <StatusBadge
              :label="statusLabel(order.orderStatus)"
              :tone="statusTone(order.orderStatus)"
            />
          </div>

          <div class="history-order-meta">
            <span>{{ formatDateTime(order.orderTime) }}</span>
            <span>{{ t('orders.itemCount', { count: order.items.length }) }}</span>
            <strong><PriceText :value="order.totalAmount" /></strong>
          </div>
        </button>
      </section>

      <EmptyState
        v-else
        icon="?"
        :title="t('orders.emptyTitle')"
        :description="t('orders.emptyDescription')"
        :action-label="t('orders.findMerchants')"
        @action="navigateTo('/merchants')"
      />
    </template>
  </main>
</template>
