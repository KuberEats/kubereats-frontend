<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
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
import { useI18n } from '../i18n'

const cart = useCart()
const isSubmitting = ref(false)
const submitError = ref('')
const successReservation = ref<ReservationRequestResponse | null>(null)
const toastMessage = ref('')
const dinerName = shallowRef('')
const dinerPhone = shallowRef('')
const comments = shallowRef('')
const { t } = useI18n()

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

function optionalText(value: string) {
  const normalized = value.trim()
  return normalized || undefined
}

function buildPayload(): ReservationRequestPayload | null {
  if (!cart.merchantId.value) return null
  return {
    user_id: currentUserId(),
    merchant_id: cart.merchantId.value,
    service_date: cart.serviceDate.value,
    pickup_slot: cart.pickupSlot.value,
    pickup_option: 'SELF_PICKUP',
    comments: optionalText(comments.value),
    diner_name: optionalText(dinerName.value),
    diner_phone: optionalText(dinerPhone.value),
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
  const message = error instanceof Error ? error.message : t('checkout.failed')
  const quantityMatch = message.match(/^(.+) exceeds (?:daily available|remaining daily) quantity$/)

  if (quantityMatch) {
    return `${quantityMatch[1]} ${t('checkout.soldOut')}`
  }
  if (message.includes('minimum order is')) {
    const [merchantName, minimumAmount] = message.split(' minimum order is ')
    return `${merchantName} ${t('cart.minimumGap', { amount: formatMoney(Number(minimumAmount)) })}`
  }
  if (error instanceof ApiError && error.code === 'unauthorized') {
    return t('checkout.authExpired')
  }
  if (error instanceof ApiError && error.code === 'network_error') {
    return t('checkout.networkFailure')
  }
  return message || t('checkout.failed')
}

async function submitOrder() {
  if (!canSubmit.value) return

  const payload = buildPayload()
  if (!payload) {
    submitError.value = t('checkout.missingMerchant')
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const idempotencyKey = getSubmissionIdempotencyKey(payload)
    const reservation = await createReservationRequest(payload, idempotencyKey)

    if (reservation.status === 'SOLD_OUT') {
      submitError.value = reservation.message || t('checkout.soldOut')
      return
    }
    if (!reservation.order_token) {
      submitError.value = t('checkout.missingToken')
      return
    }

    localStorage.setItem('latestReservationOrderToken', reservation.order_token)
    localStorage.removeItem('currentReservationAttempt')
    successReservation.value = reservation
    toastMessage.value = t('checkout.toastSuccess')
    cart.clearCart()
    dinerName.value = ''
    dinerPhone.value = ''
    comments.value = ''
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
      :eyebrow="t('checkout.eyebrow')"
      :title="t('checkout.title')"
      :subtitle="t('checkout.subtitle')"
    >
      <template #action>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo(cart.merchantId.value ? `/merchants/${cart.merchantId.value}` : '/merchants')"
        >
          {{ t('checkout.backToMenu') }}
        </button>
      </template>
    </PageHeader>

    <SectionCard
      v-if="successReservation"
      class="checkout-success"
    >
      <StatusBadge
        :label="t('status.success')"
        tone="success"
      />
      <h2>{{ t('checkout.successTitle') }}</h2>
      <p>{{ t('checkout.successDescription') }}</p>
      <div class="checkout-actions">
        <button
          class="primary-button"
          type="button"
          @click="navigateTo(`/reservation-status/${encodeURIComponent(successReservation.order_token)}`)"
        >
          {{ t('checkout.viewStatus') }}
        </button>
        <button
          class="ghost-button"
          type="button"
          @click="navigateTo('/orders')"
        >
          {{ t('checkout.viewHistory') }}
        </button>
      </div>
    </SectionCard>

    <EmptyState
      v-else-if="cart.items.value.length === 0"
      icon="?"
      :title="t('checkout.emptyTitle')"
      :description="t('checkout.emptyDescription')"
      :action-label="t('checkout.findMerchants')"
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
              {{ t('checkout.review') }}
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
              <span><PriceText :value="item.menuItem.price" /> {{ t('checkout.unit') }}</span>
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
          <span>{{ t('checkout.total') }}</span>
          <PriceText :value="cart.total.value" />
        </div>
      </SectionCard>

      <SectionCard>
        <div class="section-title-row">
          <div>
            <p class="eyebrow">
              {{ t('checkout.options') }}
            </p>
            <h2>{{ t('checkout.pickupInfo') }}</h2>
          </div>
        </div>

        <div class="checkout-options">
          <FormField :label="t('detail.date')">
            <input
              v-model="cart.serviceDate.value"
              type="date"
              :disabled="isSubmitting"
            >
          </FormField>
          <FormField :label="t('detail.pickupSlot')">
            <input
              v-model="cart.pickupSlot.value"
              type="text"
              :disabled="isSubmitting"
            >
          </FormField>
          <FormField :label="t('checkout.dinerName')">
            <input
              v-model="dinerName"
              type="text"
              autocomplete="name"
              :placeholder="t('checkout.dinerNamePlaceholder')"
              :disabled="isSubmitting"
            >
          </FormField>
          <FormField :label="t('checkout.dinerPhone')">
            <input
              v-model="dinerPhone"
              type="tel"
              autocomplete="tel"
              :placeholder="t('checkout.dinerPhonePlaceholder')"
              :disabled="isSubmitting"
            >
          </FormField>
          <FormField :label="t('checkout.comments')">
            <textarea
              v-model="comments"
              rows="3"
              :placeholder="t('checkout.commentsPlaceholder')"
              :disabled="isSubmitting"
            />
          </FormField>
          <p class="checkout-note">
            {{ t('checkout.note') }}
          </p>
        </div>

        <ErrorState
          v-if="submitError"
          :title="t('cart.errorTitle')"
          :message="submitError"
          :retry-label="t('checkout.retry')"
          @retry="submitOrder"
        />

        <button
          class="primary-button full-width"
          type="button"
          data-testid="checkout-submit-button"
          :disabled="!canSubmit"
          @click="submitOrder"
        >
          {{ isSubmitting ? t('checkout.submitting') : t('checkout.submit') }}
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
