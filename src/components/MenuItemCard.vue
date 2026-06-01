<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '../api/types'
import PriceText from './ux/PriceText.vue'
import QuantityStepper from './ux/QuantityStepper.vue'

const props = withDefaults(defineProps<{
  item: MenuItem
  quantity?: number
  disabled?: boolean
}>(), {
  quantity: 0,
  disabled: false,
})

defineEmits<{
  add: [item: MenuItem]
  quantity: [menuId: number, quantity: number]
}>()

const isUnavailable = computed(() =>
  props.disabled || props.item.isAvailable === false || props.item.maxDailyQuantity <= 0,
)
</script>

<template>
  <article
    class="menu-item-card"
    :class="{ unavailable: isUnavailable }"
    :data-testid="`menu-item-${item.id}`"
    :data-menu-item-name="item.itemName"
  >
    <div>
      <h3>{{ item.itemName }}</h3>
      <p v-if="item.description">
        {{ item.description }}
      </p>
      <p>每日限量 {{ item.maxDailyQuantity }} 份</p>
      <PriceText :value="item.price" />
    </div>

    <QuantityStepper
      v-if="quantity > 0"
      :model-value="quantity"
      :min="0"
      :max="item.maxDailyQuantity || 99"
      :disabled="isUnavailable"
      :label="item.itemName"
      @update:model-value="$emit('quantity', item.id, $event)"
    />
    <button
      v-else
      class="icon-text-button"
      type="button"
      data-testid="add-menu-item-button"
      :disabled="isUnavailable"
      :aria-label="`加入 ${item.itemName}`"
      @click="$emit('add', item)"
    >
      {{ isUnavailable ? '售完' : '加入' }}
    </button>
  </article>
</template>

<style scoped>
.menu-item-card.unavailable {
  opacity: 0.68;
}
</style>
