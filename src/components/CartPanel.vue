<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem } from '../api/types'
import PriceText from './ux/PriceText.vue'
import QuantityStepper from './ux/QuantityStepper.vue'

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
        <h2>購物車</h2>
      </div>
      <PriceText :value="total" />
    </div>

    <div
      v-if="items.length === 0"
      class="empty-box"
    >
      尚未選擇餐點。
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
      <span>{{ itemCount }} 份餐點</span>
      <span v-if="minimumGap > 0">還差 <PriceText :value="minimumGap" /> 達低消</span>
      <strong>合計 <PriceText :value="total" /></strong>
    </div>

    <div
      v-if="errorMessage"
      class="cart-error"
      data-testid="cart-error"
      role="alert"
    >
      <strong>訂單無法送出</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <button
      class="primary-button full-width"
      type="button"
      data-testid="submit-order-button"
      :disabled="items.length === 0 || submitting || minimumGap > 0"
      @click="$emit('submit')"
    >
      {{ submitting ? '處理中' : (submitLabel || '前往確認訂單') }}
    </button>
  </aside>
</template>
