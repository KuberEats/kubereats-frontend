<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem } from '../api/types'
import PriceText from './ux/PriceText.vue'
import QuantityStepper from './ux/QuantityStepper.vue'
import { useI18n } from '../i18n'
import { formatMoney } from '../utils/formatters'

const props = defineProps<{
  items: CartItem[]
  submitting: boolean
  errorMessage?: string
  minOrder?: number
  submitLabel?: string
}>()

defineEmits<{
  increase: [menuId: number]
  decrease: [menuId: number]
  submit: []
}>()

const { t } = useI18n()

const total = computed(() =>
  props.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
)

const itemCount = computed(() =>
  props.items.reduce((sum, item) => sum + item.quantity, 0),
)

const minimumGap = computed(() => {
  if (typeof props.minOrder !== 'number') return 0
  return Math.max(0, props.minOrder - total.value)
})

const minimumGapText = computed(() =>
  t('cart.minimumGap', { amount: formatMoney(minimumGap.value) }),
)
</script>

<template>
  <aside
    class="cart-panel"
    data-testid="cart-panel"
  >
    <div class="section-title-row">
      <div>
        <p class="eyebrow">
          Cart
        </p>
        <h2>{{ t('cart.title') }}</h2>
      </div>
      <PriceText :value="total" />
    </div>

    <div
      v-if="items.length === 0"
      class="empty-box"
    >
      {{ t('cart.empty') }}
    </div>

    <div
      v-else
      class="cart-list"
      data-testid="cart-items"
    >
      <div
        v-for="item in items"
        :key="item.menuItem.id"
        class="cart-row"
      >
        <div>
          <strong>{{ item.menuItem.itemName }}</strong>
          <span><PriceText :value="item.menuItem.price" /> × {{ item.quantity }}</span>
        </div>

        <QuantityStepper
          :model-value="item.quantity"
          :min="0"
          :max="item.menuItem.maxDailyQuantity || 99"
          :label="item.menuItem.itemName"
          @update:model-value="$event > item.quantity ? $emit('increase', item.menuItem.id) : $emit('decrease', item.menuItem.id)"
        />
      </div>
    </div>

    <div
      v-if="items.length > 0"
      class="cart-summary"
    >
      <span>{{ t('cart.itemCount', { count: itemCount }) }}</span>
      <span v-if="minimumGap > 0">{{ minimumGapText }}</span>
      <strong>{{ t('cart.total') }} <PriceText :value="total" /></strong>
    </div>

    <div
      v-if="errorMessage"
      class="cart-error"
      data-testid="cart-error"
      role="alert"
    >
      <strong>{{ t('cart.errorTitle') }}</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <button
      class="primary-button full-width"
      type="button"
      data-testid="submit-order-button"
      :disabled="items.length === 0 || submitting || minimumGap > 0"
      @click="$emit('submit')"
    >
      {{ submitting ? t('cart.pending') : (submitLabel || t('detail.checkout')) }}
    </button>
  </aside>
</template>
