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

const dietaryLabels: Record<string, string> = {
  MEAT: '葷食',
  VEGAN: '全素',
  OVO_LACTO: '蛋奶素',
  OVO: '蛋素',
  LACTO: '奶素',
  PESCATARIAN: '海鮮素',
}

const dietaryLabel = computed(() =>
  dietaryLabels[props.item.dietaryType || 'MEAT'] || props.item.dietaryType || '葷食',
)

const complianceBadges = computed(() => [
  dietaryLabel.value,
  ...(props.item.allergens ?? []).map(allergen => `含${allergen}`),
  ...(props.item.certifications ?? []),
])

const nutritionFacts = computed(() => [
  props.item.caloriesKcal != null ? `${props.item.caloriesKcal} kcal` : '',
  props.item.proteinG != null ? `蛋白質 ${props.item.proteinG}g` : '',
  props.item.carbsG != null ? `碳水 ${props.item.carbsG}g` : '',
  props.item.fatG != null ? `脂肪 ${props.item.fatG}g` : '',
].filter(Boolean))

const imageAlt = computed(() => `${props.item.itemName} 圖片`)
</script>

<template>
  <article
    class="menu-item-card"
    :class="{ unavailable: isUnavailable }"
    :data-testid="`menu-item-${item.id}`"
    :data-menu-item-name="item.itemName"
  >
    <img
      v-if="item.imageUrl"
      class="menu-item-image"
      :src="item.imageUrl"
      :alt="imageAlt"
      loading="lazy"
      decoding="async"
    >
    <div class="menu-item-body">
      <h3>{{ item.itemName }}</h3>
      <p v-if="item.description">
        {{ item.description }}
      </p>
      <p>{{ t('menu.dailyLimit', { count: item.maxDailyQuantity }) }}</p>
      <div class="menu-badges">
        <span
          v-for="badge in complianceBadges"
          :key="badge"
        >
          {{ badge }}
        </span>
      </div>
      <div
        v-if="nutritionFacts.length"
        class="nutrition-row"
      >
        <span
          v-for="fact in nutritionFacts"
          :key="fact"
        >
          {{ fact }}
        </span>
      </div>
      <p
        v-if="item.servingSize || item.ingredients"
        class="meal-extra"
      >
        {{ [item.servingSize, item.ingredients].filter(Boolean).join(' · ') }}
      </p>
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
.menu-item-image {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.menu-item-body {
  min-width: 0;
}

.menu-item-card.unavailable {
  opacity: 0.68;
}

.menu-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.menu-badges span {
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-muted);
  padding: 4px 7px;
  font-size: 12px;
  font-weight: 800;
}

.nutrition-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 800;
}

.meal-extra {
  color: var(--color-muted);
  font-size: 13px;
}

@media (max-width: 640px) {
  .menu-item-image {
    width: 72px;
    height: 72px;
  }
}
</style>
