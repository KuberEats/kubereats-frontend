<script setup lang="ts">
import type { Merchant } from '../api/types'
import PriceText from './ux/PriceText.vue'
import StatusBadge from './ux/StatusBadge.vue'
import { useI18n } from '../i18n'

defineProps<{
  merchant: Merchant
}>()

defineEmits<{
  select: [merchantId: number]
}>()

const { t } = useI18n()
</script>

<template>
  <button
    class="merchant-card"
    type="button"
    :data-testid="`merchant-card-${merchant.id}`"
    :data-merchant-name="merchant.name"
    :aria-label="t('merchantCard.openMenu', { name: merchant.name })"
    @click="$emit('select', merchant.id)"
  >
    <div class="merchant-image">
      {{ merchant.name.slice(0, 1) }}
    </div>

    <div class="merchant-info">
      <div class="merchant-title-row">
        <div>
          <h2>{{ merchant.name }}</h2>
          <p>{{ merchant.category }}</p>
        </div>

        <div class="merchant-badges">
          <StatusBadge
            :label="merchant.isOpen === false ? t('status.closed') : t('status.open')"
            :tone="merchant.isOpen === false ? 'warning' : 'success'"
          />
          <span
            v-if="merchant.rating"
            class="rating"
          >
            ★ {{ merchant.rating }}
          </span>
        </div>
      </div>

      <p
        v-if="merchant.description"
        class="merchant-description"
      >
        {{ merchant.description }}
      </p>

      <div class="merchant-meta">
        <span v-if="merchant.orderCount !== undefined">{{ t('merchantCard.orderCount', { count: merchant.orderCount }) }}</span>
        <span v-if="merchant.minOrder !== undefined">{{ t('merchantCard.minOrder') }} <PriceText :value="merchant.minOrder" /></span>
        <span v-if="merchant.deliveryTime">{{ merchant.deliveryTime }}</span>
        <span v-if="merchant.score !== undefined">{{ t('merchantCard.score', { score: merchant.score }) }}</span>
      </div>

      <div class="tag-list">
        <span
          v-for="tag in merchant.tags"
          :key="tag"
        >
          {{ tag }}
        </span>
      </div>

      <p
        v-if="merchant.reason"
        class="recommendation-reason"
      >
        {{ merchant.reason }}
      </p>
    </div>
  </button>
</template>

<style scoped>
.merchant-card {
  width: 100%;
  color: inherit;
  text-align: left;
}

.merchant-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.merchant-description {
  margin-top: 8px;
  color: var(--color-muted);
}
</style>
