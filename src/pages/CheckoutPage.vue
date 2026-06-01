<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError } from '../api/client'
import { createReservationRequest } from '../api/orders'
import type { ReservationRequestPayload, ReservationRequestResponse } from '../api/types'
import { useCart } from '../composables/useCart'
import { formatMoney } from '../utils/formatters'
import EmptyState from '../components/ux/EmptyState.vue'
import ErrorState from '../components/ux/ErrorState.vue'
import FormField from '../components/ux/FormField.vue'
import PageHeader from '../components/ux/PageHeader.vue'
import PriceText from '../components/ux/PriceText.vue'
import QuantityStepper from '../components/ux/QuantityStepper.vue'
import SectionCard from '../components/ux/SectionCard.vue'
import StatusBadge from '../components/ux/StatusBadge.vue'
import ToastNotification from '../components/ux/ToastNotification.vue'
import { navigateTo } from '../router'

const cart = useCart()
const isSubmitting = ref(false)
const submitError = ref('')
const successReservation = ref<ReservationRequestResponse | null>(null)
const toastMessage = ref('')

const canSubmit = computed(() =>
  cart.items.value.length > 0 &&
  !cart.isBelowMinimum.value &&
  Boolean(cart.merchantId.value) &&
  !isSubmitting.value,
)

function currentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: number }
    return user.id || 0
  } catch {
    return 0
  }
}

function setQuantity(menuId: number, quantity: number) {
  cart.setQuantity(menuId, quantity)
}

function buildPayload(): ReservationRequestPayload | null {
  if (!cart.merchantId.value) return null
  return {
    user_id: currentUserId(),
    merchant_id: cart.merchantId.value,
    service_date: cart.serviceDate.value,
    pickup_slot: cart.pickupSlot.value,
    pickup_option: 'SELF_PICKUP',
    items: cart.items.value.map(item => ({
      menu_id: item.menuItem.id,
      quantity: item.quantity,
    })),
  }
}

function getSubmissionIdempotencyKey(payload: object) {
  const fingerprint = JSON.stringify(payload)
  const storedAttempt = localStorage.getItem('currentReservationAttempt')

  if (storedAttempt) {
    try {
      const attempt = JSON.parse(storedAttempt) as { fingerprint?: string; key?: string }
      if (attempt.fingerprint === fingerprint && attempt.key) return attempt.key
    } catch {
      localStorage.removeItem('currentReservationAttempt')
    }
  }

  const key = crypto.randomUUID()
  localStorage.setItem('currentReservationAttempt', JSON.stringify({ fingerprint, key }))
  return key
}

function formatOrderError(error: unknown) {
  const message = error instanceof Error ? error.message : '訂單建立失敗'
  const quantityMatch = message.match(/^(.+) exceeds (?:daily available|remaining daily) quantity$/)

  if (quantityMatch) {
    return `${quantityMatch[1]} 今日可訂數量不足，請減少份數後再送出。`
  }
  if (message.includes('minimum order is')) {
    const [merchantName, minimumAmount] = message.split(' minimum order is ')
    return `${merchantName} 尚未達到低消 ${formatMoney(Number(minimumAmount))}。`
  }
  if (error instanceof ApiError && error.code === 'unauthorized') {
    return '登入已逾期，請重新登入後繼續下單。'
  }
  if (error instanceof ApiError && error.code === 'network_error') {
    return '網路連線失敗，購物車已保留，請稍後重試。'
  }
  return message || '訂單建立失敗，請稍後再試。'
}

async function submitOrder() {
  if (!canSubmit.value) return

  const payload = buildPayload()
  if (!payload) {
    submitError.value = '找不到商家資訊，請回商家頁重新選擇餐點。'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const idempotencyKey = getSubmissionIdempotencyKey(payload)
    const reservation = await createReservationRequest(payload, idempotencyKey)

    if (reservation.status === 'SOLD_OUT') {
      submitError.value = reservation.message || '餐點容量不足，請調整品項或時段後再試。'
      return
    }
    if (!reservation.order_token) {
      submitError.value = '系統未回傳預訂查詢代碼，請稍後到訂單紀錄確認。'
      return
    }

    localStorage.setItem('latestReservationOrderToken', reservation.order_token)
    localStorage.removeItem('currentReservationAttempt')
    successReservation.value = reservation
    toastMessage.value = '訂單已送出'
    cart.clearCart()
  } catch (error) {
    submitError.value = formatOrderError(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="page checkout-page">
    <PageHeader
      eyebrow="Checkout"
      title="確認訂單"
      subtitle="送出前確認品項、數量、總額與取餐時段。"
    >
      <template #action>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo(cart.merchantId.value ? `/merchants/${cart.merchantId.value}` : '/merchants')"
        >
          回菜單
        </button>
      </template>
    </PageHeader>

    <SectionCard
      v-if="successReservation"
      class="checkout-success"
    >
      <StatusBadge
        label="已送出"
        tone="success"
      />
      <h2>預訂已送出</h2>
      <p>訂單狀態會持續更新，請在狀態頁查看最新結果。</p>
      <div class="checkout-actions">
        <button
          class="primary-button"
          type="button"
          @click="navigateTo(`/reservation-status/${encodeURIComponent(successReservation.order_token)}`)"
        >
          查看訂單狀態
        </button>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/orders')"
        >
          查看歷史訂單
        </button>
      </div>
    </SectionCard>

    <EmptyState
      v-else-if="cart.items.value.length === 0"
      icon="?"
      title="購物車是空的"
      description="回到商家列表選擇想吃的餐點。"
      action-label="找商家"
      @action="navigateTo('/merchants')"
    />

    <div
      v-else
      class="checkout-layout"
    >
      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              Review
            </p>
            <h2>{{ cart.merchantName.value }}</h2>
          </div>
          <PriceText :value="cart.total.value" />
        </div>

        <div class="checkout-items">
          <div
            v-for="item in cart.items.value"
            :key="item.menuItem.id"
            class="checkout-item"
          >
            <div>
              <strong>{{ item.menuItem.itemName }}</strong>
              <span><PriceText :value="item.menuItem.price" /> / 份</span>
            </div>
            <QuantityStepper
              :model-value="item.quantity"
              :min="0"
              :max="item.menuItem.maxDailyQuantity || 99"
              :label="item.menuItem.itemName"
              :disabled="isSubmitting"
              @update:model-value="setQuantity(item.menuItem.id, $event)"
            />
            <PriceText :value="item.menuItem.price * item.quantity" />
          </div>
        </div>

        <div class="total-row">
          <span>總計</span>
          <PriceText :value="cart.total.value" />
        </div>
      </SectionCard>

      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              Options
            </p>
            <h2>取餐資訊</h2>
          </div>
        </div>

        <div class="checkout-options">
          <FormField label="預訂日期">
            <input
              v-model="cart.serviceDate.value"
              type="date"
              :disabled="isSubmitting"
            >
          </FormField>
          <FormField label="取餐時段">
            <input
              v-model="cart.pickupSlot.value"
              type="text"
              :disabled="isSubmitting"
            >
          </FormField>
          <p class="checkout-note">
            目前 API 支援自取預訂日期與取餐時段；備註與用餐人資訊待後端欄位支援後再送出。
          </p>
        </div>

        <ErrorState
          v-if="submitError"
          title="訂單無法送出"
          :message="submitError"
          retry-label="再試一次"
          @retry="submitOrder"
        />

        <button
          class="primary-button full-width"
          type="button"
          data-testid="checkout-submit-button"
          :disabled="!canSubmit"
          @click="submitOrder"
        >
          {{ isSubmitting ? '送出中' : '送出訂單' }}
        </button>
      </SectionCard>
    </div>

    <ToastNotification
      v-if="toastMessage"
      :message="toastMessage"
      tone="success"
      @close="toastMessage = ''"
    />
  </main>
</template>

<style scoped>
.checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
}

.checkout-items,
.checkout-options,
.checkout-success {
  display: grid;
  gap: 14px;
}

.checkout-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  border-top: 1px solid var(--color-border);
  padding-top: 14px;
}

.checkout-item:first-child {
  border-top: 0;
}

.checkout-item span,
.checkout-note,
.checkout-success p {
  color: var(--color-muted);
}

.checkout-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 860px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .checkout-item {
    grid-template-columns: 1fr;
    justify-items: start;
  }
}
</style>
