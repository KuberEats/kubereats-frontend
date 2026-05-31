<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getReservationStatus } from '../api/orders'
import type {
  ReservationStatus,
  ReservationStatusItem,
  ReservationStatusResponse,
} from '../api/types'
import { navigateTo } from '../router'

const props = defineProps<{
  orderToken?: string
}>()

const terminalStatuses: ReservationStatus[] = [
  'RESERVED',
  'SOLD_OUT',
  'CANCELLED',
  'EXPIRED',
  'FAILED',
]

const reservation = ref<ReservationStatusResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const networkWarning = ref('')
const repeatedFailureCount = ref(0)
const showSlowWarning = ref(false)
let pollingTimer: ReturnType<typeof window.setInterval> | null = null
let slowWarningTimer: ReturnType<typeof window.setTimeout> | null = null

const effectiveOrderToken = computed(() =>
  props.orderToken || localStorage.getItem('latestReservationOrderToken') || '',
)

const currentStatus = computed<ReservationStatus>(() =>
  reservation.value?.status || 'PENDING_RESERVATION',
)

const isTerminal = computed(() => terminalStatuses.includes(currentStatus.value))
const shouldShowInfoCard = computed(() => Boolean(reservation.value))

const title = computed(() => {
  if (currentStatus.value === 'RESERVED') return '預訂成功'
  if (currentStatus.value === 'SOLD_OUT') return '預訂失敗'
  if (currentStatus.value === 'CANCELLED') return '訂單已取消'
  if (currentStatus.value === 'EXPIRED') return '預訂已逾時'
  if (currentStatus.value === 'FAILED') return '預訂失敗'
  return '正在確認預訂名額'
})

const subtitle = computed(() => {
  if (currentStatus.value === 'RESERVED') return '你的餐點名額已保留，請於指定時間取餐。'
  if (currentStatus.value === 'SOLD_OUT') return '此餐點在該日期或時段已售完'
  if (currentStatus.value === 'CANCELLED') return '此預訂已取消，未保留餐點名額。'
  if (currentStatus.value === 'EXPIRED') return '系統未能在有效時間內完成預訂，請重新下單。'
  if (currentStatus.value === 'FAILED') {
    return reservation.value?.failure_reason || '系統暫時無法完成預訂，請稍後再試。'
  }
  return '系統正在確認商家餐點容量，請稍候'
})

const statusChip = computed(() => {
  if (currentStatus.value === 'RESERVED') return '已保留'
  if (currentStatus.value === 'SOLD_OUT') return '已售完'
  if (currentStatus.value === 'CANCELLED') return '已取消'
  if (currentStatus.value === 'EXPIRED') return '已逾時'
  if (currentStatus.value === 'FAILED') return '失敗'
  return '確認中'
})

const statusTone = computed(() => {
  if (currentStatus.value === 'RESERVED') return 'success'
  if (currentStatus.value === 'PENDING_RESERVATION' || currentStatus.value === 'PROCESSING') {
    return 'pending'
  }
  return 'danger'
})

const statusIcon = computed(() => {
  if (statusTone.value === 'success') return '✓'
  if (statusTone.value === 'pending') return '◷'
  return '!'
})

function pickupOptionLabel(option?: string) {
  if (!option) return '尚未提供'
  if (option === 'SELF_PICKUP') return '自取'
  if (option === 'DELIVERY') return '外送'
  return option
}

function itemLabel(item: ReservationStatusItem) {
  const name = item.item_name || item.name || `餐點 ${item.menu_id ?? item.id ?? ''}`.trim()
  return item.quantity ? `${name} × ${item.quantity}` : name
}

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function fetchStatus() {
  const orderToken = effectiveOrderToken.value
  if (!orderToken) {
    errorMessage.value = '找不到預訂查詢代碼，請回到訂單紀錄確認。'
    stopPolling()
    return
  }

  if (!reservation.value) isLoading.value = true

  try {
    const data = await getReservationStatus(orderToken)
    reservation.value = data
    errorMessage.value = ''
    networkWarning.value = ''
    repeatedFailureCount.value = 0

    if (terminalStatuses.includes(data.status)) {
      stopPolling()
    }
  } catch (error) {
    repeatedFailureCount.value += 1
    if (repeatedFailureCount.value >= 2) {
      networkWarning.value = '目前連線不穩，系統會持續嘗試更新預訂狀態。'
    }
    if (!reservation.value) {
      errorMessage.value = error instanceof Error ? error.message : '預訂狀態讀取失敗'
    }
  } finally {
    isLoading.value = false
  }
}

function startPolling() {
  stopPolling()
  showSlowWarning.value = false
  void fetchStatus()
  pollingTimer = window.setInterval(() => {
    if (!isTerminal.value) void fetchStatus()
  }, 1500)
  slowWarningTimer = window.setTimeout(() => {
    if (!isTerminal.value) showSlowWarning.value = true
  }, 30000)
}

function stopPolling() {
  if (pollingTimer) {
    window.clearInterval(pollingTimer)
    pollingTimer = null
  }
  if (slowWarningTimer) {
    window.clearTimeout(slowWarningTimer)
    slowWarningTimer = null
  }
}

function chooseAnotherTime() {
  navigateTo('/merchants')
}

onMounted(startPolling)
onBeforeUnmount(stopPolling)
watch(() => props.orderToken, startPolling)
</script>

<template>
  <main class="reservation-status-page">
    <section
      class="reservation-status-card"
      :class="statusTone"
    >
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-badge">{{ statusChip }}</span>
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>

      <p
        v-if="isLoading && !reservation"
        class="status-message compact"
      >
        預訂狀態載入中。
      </p>

      <p
        v-if="errorMessage && !reservation"
        class="status-message error compact"
      >
        {{ errorMessage }}
      </p>

      <p
        v-if="networkWarning"
        class="inline-warning"
        role="status"
      >
        {{ networkWarning }}
      </p>

      <p
        v-if="showSlowWarning"
        class="inline-warning"
      >
        目前預訂流量較高，系統仍在處理，您也可以稍後到訂單紀錄查看結果。
      </p>
    </section>

    <section
      v-if="currentStatus === 'RESERVED'"
      class="pickup-number-card"
    >
      <strong v-if="reservation?.pickup_number">
        取餐號碼 {{ reservation.pickup_number }}
      </strong>
      <strong v-else>
        取餐號碼將於取餐日前或商家出餐前產生
      </strong>
    </section>

    <section
      v-if="shouldShowInfoCard"
      class="reservation-info-card"
    >
      <h2>預訂資訊</h2>
      <dl>
        <div v-if="reservation?.merchant_name">
          <dt>商家</dt>
          <dd>{{ reservation.merchant_name }}</dd>
        </div>
        <div v-if="reservation?.service_date">
          <dt>預訂日期</dt>
          <dd>{{ reservation.service_date }}</dd>
        </div>
        <div v-if="reservation?.pickup_slot">
          <dt>取餐時段</dt>
          <dd>{{ reservation.pickup_slot }}</dd>
        </div>
        <div v-if="reservation?.pickup_option">
          <dt>取餐方式</dt>
          <dd>{{ pickupOptionLabel(reservation.pickup_option) }}</dd>
        </div>
        <div v-if="reservation?.order_time">
          <dt>下單時間</dt>
          <dd>{{ formatDateTime(reservation.order_time) }}</dd>
        </div>
        <div v-if="reservation?.comments">
          <dt>備註</dt>
          <dd>{{ reservation.comments }}</dd>
        </div>
      </dl>

      <div
        v-if="reservation?.items?.length"
        class="reservation-item-list"
      >
        <h3>餐點</h3>
        <div
          v-for="item in reservation.items"
          :key="item.id ?? item.menu_id ?? itemLabel(item)"
          class="reservation-item-row"
        >
          <span>{{ itemLabel(item) }}</span>
          <strong v-if="item.subtotal">${{ item.subtotal }}</strong>
        </div>
      </div>
    </section>

    <section
      v-if="currentStatus === 'SOLD_OUT' && reservation?.failed_items?.length"
      class="reservation-info-card failed-items"
    >
      <h2>售完餐點</h2>
      <div
        v-for="item in reservation.failed_items"
        :key="item.id ?? item.menu_id ?? itemLabel(item)"
        class="reservation-item-row"
      >
        <span>{{ itemLabel(item) }}</span>
      </div>
    </section>

    <nav class="fixed-status-actions">
      <template v-if="currentStatus === 'SOLD_OUT'">
        <button
          class="primary-button"
          type="button"
          @click="chooseAnotherTime"
        >
          選擇其他時段
        </button>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/merchants')"
        >
          回到菜單
        </button>
      </template>
      <template v-else-if="currentStatus === 'EXPIRED' || currentStatus === 'FAILED'">
        <button
          class="primary-button"
          type="button"
          @click="navigateTo('/merchants')"
        >
          重新下單
        </button>
      </template>
      <button
        class="ghost-button"
        type="button"
        @click="navigateTo('/orders')"
      >
        回到訂單紀錄
      </button>
    </nav>
  </main>
</template>
