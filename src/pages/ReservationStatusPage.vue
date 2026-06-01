<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getReservationStatus } from '../api/orders'
import type {
  ReservationStatus,
  ReservationStatusItem,
  ReservationStatusResponse,
} from '../api/types'
import { navigateTo } from '../router'
import { useI18n } from '../i18n'

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
const { t, locale } = useI18n()
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
  if (currentStatus.value === 'RESERVED') return t('reservation.successTitle')
  if (currentStatus.value === 'SOLD_OUT') return t('reservation.failureTitle')
  if (currentStatus.value === 'CANCELLED') return t('reservation.cancelledTitle')
  if (currentStatus.value === 'EXPIRED') return t('reservation.expiredTitle')
  if (currentStatus.value === 'FAILED') return t('reservation.failureTitle')
  return t('reservation.pendingTitle')
})

const subtitle = computed(() => {
  if (currentStatus.value === 'RESERVED') return t('reservation.successSubtitle')
  if (currentStatus.value === 'SOLD_OUT') return t('reservation.soldOutSubtitle')
  if (currentStatus.value === 'CANCELLED') return t('reservation.cancelledSubtitle')
  if (currentStatus.value === 'EXPIRED') return t('reservation.expiredSubtitle')
  if (currentStatus.value === 'FAILED') {
    return reservation.value?.failure_reason || t('reservation.failedSubtitle')
  }
  return t('reservation.pendingSubtitle')
})

const statusChip = computed(() => {
  if (currentStatus.value === 'RESERVED') return t('reservation.reserved')
  if (currentStatus.value === 'SOLD_OUT') return t('reservation.soldOut')
  if (currentStatus.value === 'CANCELLED') return t('reservation.cancelled')
  if (currentStatus.value === 'EXPIRED') return t('reservation.expired')
  if (currentStatus.value === 'FAILED') return t('reservation.failed')
  return t('reservation.confirming')
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
  if (!option) return t('reservation.notProvided')
  if (option === 'SELF_PICKUP') return t('reservation.selfPickup')
  if (option === 'DELIVERY') return t('reservation.delivery')
  return option
}

function itemLabel(item: ReservationStatusItem) {
  const name = item.item_name || item.name || t('reservation.itemFallback', { id: item.menu_id ?? item.id ?? '' }).trim()
  return item.quantity ? `${name} × ${item.quantity}` : name
}

function formatDateTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value, {
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
    errorMessage.value = t('reservation.missingToken')
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
      networkWarning.value = t('reservation.networkWarning')
    }
    if (!reservation.value) {
      errorMessage.value = error instanceof Error ? error.message : t('reservation.loadFailed')
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
      data-testid="reservation-status-card"
      :class="statusTone"
    >
      <span class="status-icon">{{ statusIcon }}</span>
      <span
        class="status-badge"
        data-testid="reservation-status-chip"
      >{{ statusChip }}</span>
      <h1 data-testid="reservation-status-title">
        {{ title }}
      </h1>
      <p>{{ subtitle }}</p>

      <p
        v-if="isLoading && !reservation"
        class="status-message compact"
      >
        {{ t('reservation.loading') }}
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
        {{ t('reservation.slowWarning') }}
      </p>
    </section>

    <section
      v-if="currentStatus === 'RESERVED'"
      class="pickup-number-card"
    >
      <strong v-if="reservation?.pickup_number">
        {{ t('reservation.pickupNumber', { number: reservation.pickup_number }) }}
      </strong>
      <strong v-else>
        {{ t('reservation.pickupNumberPending') }}
      </strong>
    </section>

    <section
      v-if="shouldShowInfoCard"
      class="reservation-info-card"
    >
      <h2>{{ t('reservation.info') }}</h2>
      <dl>
        <div v-if="reservation?.merchant_name">
          <dt>{{ t('reservation.merchant') }}</dt>
          <dd>{{ reservation.merchant_name }}</dd>
        </div>
        <div v-if="reservation?.service_date">
          <dt>{{ t('detail.date') }}</dt>
          <dd>{{ reservation.service_date }}</dd>
        </div>
        <div v-if="reservation?.pickup_slot">
          <dt>{{ t('detail.pickupSlot') }}</dt>
          <dd>{{ reservation.pickup_slot }}</dd>
        </div>
        <div v-if="reservation?.pickup_option">
          <dt>{{ t('reservation.pickupOption') }}</dt>
          <dd>{{ pickupOptionLabel(reservation.pickup_option) }}</dd>
        </div>
        <div v-if="reservation?.order_time">
          <dt>{{ t('reservation.orderTime') }}</dt>
          <dd>{{ formatDateTime(reservation.order_time) }}</dd>
        </div>
        <div v-if="reservation?.comments">
          <dt>{{ t('reservation.comments') }}</dt>
          <dd>{{ reservation.comments }}</dd>
        </div>
      </dl>

      <div
        v-if="reservation?.items?.length"
        class="reservation-item-list"
      >
        <h3>{{ t('reservation.items') }}</h3>
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
      <h2>{{ t('reservation.soldOutItems') }}</h2>
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
          {{ t('reservation.chooseAnotherTime') }}
        </button>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/merchants')"
        >
          {{ t('reservation.backToMenu') }}
        </button>
      </template>
      <template v-else-if="currentStatus === 'EXPIRED' || currentStatus === 'FAILED'">
        <button
          class="primary-button"
          type="button"
          @click="navigateTo('/merchants')"
        >
          {{ t('reservation.reorder') }}
        </button>
      </template>
      <button
        class="ghost-button"
        type="button"
        @click="navigateTo('/orders')"
      >
        {{ t('reservation.backToOrders') }}
      </button>
    </nav>
  </main>
</template>
