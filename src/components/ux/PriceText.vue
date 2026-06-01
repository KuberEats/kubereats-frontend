<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '../../utils/formatters'

const props = defineProps<{
  value?: number | null
}>()

const text = computed(() => formatMoney(props.value))
</script>

<template>
  <span class="price-text">{{ text }}</span>
</template>

<style scoped>
.price-text {
  color: var(--color-accent-strong);
  font-weight: 800;
  white-space: nowrap;
}
</style>
