<script setup lang="ts">
import type { MenuItem } from '../api/types'

defineProps<{
  item: MenuItem
}>()

defineEmits<{
  add: [item: MenuItem]
}>()
</script>

<template>
  <article
    class="menu-item-card"
    :data-testid="`menu-item-${item.id}`"
    :data-menu-item-name="item.itemName"
  >
    <div>
      <h3>{{ item.itemName }}</h3>
      <p>每日限量 {{ item.maxDailyQuantity }} 份</p>
      <strong>${{ item.price }}</strong>
    </div>

    <button
      class="icon-text-button"
      type="button"
      data-testid="add-menu-item-button"
      @click="$emit('add', item)"
    >
      加入
    </button>
  </article>
</template>
