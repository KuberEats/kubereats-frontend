<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem } from '../api/types'

const props = defineProps<{
  items: CartItem[]
  submitting: boolean
  errorMessage?: string
}>()

defineEmits<{
  increase: [menuId: number]
  decrease: [menuId: number]
  submit: []
}>()

const total = computed(() =>
  props.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
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
        <h2>購物車</h2>
      </div>
      <strong>${{ total }}</strong>
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
          <span>${{ item.menuItem.price }} × {{ item.quantity }}</span>
        </div>

        <div class="quantity-control">
          <button
            type="button"
            @click="$emit('decrease', item.menuItem.id)"
          >
            −
          </button>
          <span>{{ item.quantity }}</span>
          <button
            type="button"
            @click="$emit('increase', item.menuItem.id)"
          >
            +
          </button>
        </div>
      </div>
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
      :disabled="items.length === 0 || submitting"
      @click="$emit('submit')"
    >
      {{ submitting ? '送出中' : '送出訂單' }}
    </button>
  </aside>
</template>
