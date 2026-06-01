<script setup lang="ts">
import type { Merchant } from '../api/types'

defineProps<{
  merchant: Merchant
}>()

defineEmits<{
  select: [merchantId: number]
}>()
</script>

<template>
  <article
    class="merchant-card"
    :data-testid="`merchant-card-${merchant.id}`"
    :data-merchant-name="merchant.name"
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

        <span class="rating">★ {{ merchant.rating }}</span>
      </div>

      <div class="merchant-meta">
        <span>{{ merchant.orderCount }} 人訂過</span>
        <span v-if="merchant.minOrder !== undefined">低消 ${{ merchant.minOrder }}</span>
        <span>{{ merchant.deliveryTime }}</span>
        <span v-if="merchant.score !== undefined">推薦分數 {{ merchant.score }}</span>
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
  </article>
</template>
