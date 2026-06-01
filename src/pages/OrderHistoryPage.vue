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

const sortOptions: { label: string; value: OrderHistorySortKey }[] = [
  { label: '依時間', value: 'time' },
  { label: '依商家', value: 'merchant' },
]

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '處理中', value: 'processing' },
  { label: '完成', value: 'done' },
  { label: '取消', value: 'cancelled' },
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
  return [...new Set(names)].join('、') || '尚無商家資料'
}

function statusLabel(status: number) {
  if (status === 1) return '完成'
  if (status === 2) return '取消'
  return '處理中'
}

function statusTone(status: number): 'success' | 'warning' | 'danger' {
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'warning'
}

function reservationStatusLabel(status: ReservationStatus) {
  if (status === 'PENDING_RESERVATION' || status === 'PROCESSING') return '確認中'
  if (status === 'RESERVED') return '已保留'
  if (status === 'SOLD_OUT') return '已售完'
  if (status === 'CANCELLED') return '已取消'
  if (status === 'EXPIRED') return '已逾時'
  return '失敗'
}

function reservationTone(status: ReservationStatus): 'success' | 'warning' | 'danger' {
  if (status === 'RESERVED') return 'success'
  if (status === 'PENDING_RESERVATION' || status === 'PROCESSING') return 'warning'
  return 'danger'
}

function reservationMerchantName(reservation: ReservationStatusResponse) {
  return reservation.merchant_name || '預訂餐點'
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
    errorMessage.value = error instanceof Error ? error.message : '歷史訂單讀取失敗'
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
      eyebrow="Order History"
      title="歷史訂單"
      :subtitle="`共 ${visibleOrders.length} 筆符合條件的訂單`"
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
          {{ filter.label }}
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
          {{ option.label }}
        </button>
      </div>
    </section>

    <ErrorState
      v-if="errorMessage"
      :message="errorMessage"
      retry-label="重新載入"
      @retry="fetchOrders"
    />

    <LoadingState
      v-else-if="isLoading"
      variant="list"
      :rows="3"
      label="歷史訂單載入中"
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
                Reservation
              </p>
              <h2>{{ reservationMerchantName(latestReservation) }}</h2>
            </div>
            <StatusBadge
              :label="reservationStatusLabel(latestReservation.status)"
              :tone="reservationTone(latestReservation.status)"
            />
          </div>

          <div class="history-order-meta">
            <span>{{ latestReservation.service_date || '日期確認中' }}</span>
            <span>{{ latestReservation.pickup_slot || '時段確認中' }}</span>
            <span>{{ reservationItemCount(latestReservation) }} 項餐點</span>
            <strong v-if="latestReservation.pickup_number">
              取餐號碼 {{ latestReservation.pickup_number }}
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
                Order #{{ order.id }}
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
            <span>{{ order.items.length }} 項餐點</span>
            <strong><PriceText :value="order.totalAmount" /></strong>
          </div>
        </button>
      </section>

      <EmptyState
        v-else
        icon="?"
        title="目前沒有符合條件的訂單"
        description="完成訂餐後，訂單會出現在這裡。"
        action-label="去找商家"
        @action="navigateTo('/merchants')"
      />
    </template>
  </main>
</template>
