<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '../api/types'
import PriceText from './ux/PriceText.vue'
import QuantityStepper from './ux/QuantityStepper.vue'
import { useI18n } from '../i18n'

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

const { t } = useI18n()

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
      <p>{{ t('menu.dailyLimit', { count: item.maxDailyQuantity }) }}</p>
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
      :aria-label="t('menu.addItem', { name: item.itemName })"
      @click="$emit('add', item)"
    >
      {{ isUnavailable ? t('menu.soldOut') : t('menu.add') }}
    </button>
  </article>
</template>

<style scoped>
.menu-item-card.unavailable {
  opacity: 0.68;
}
</style>
