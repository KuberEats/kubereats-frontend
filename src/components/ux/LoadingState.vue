<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'card' | 'list' | 'skeleton'
  rows?: number
  label?: string
}>(), {
  variant: 'card',
  rows: 3,
  label: '載入中',
})
</script>

<template>
  <section
    class="loading-state"
    :class="`variant-${variant}`"
    role="status"
    :aria-label="label"
  >
    <div
      v-for="row in rows"
      :key="row"
      class="loading-row"
    >
      <span class="loading-thumb" />
      <span class="loading-lines">
        <span />
        <span />
      </span>
    </div>
  </section>
</template>

<style scoped>
.loading-state {
  display: grid;
  gap: 12px;
}

.loading-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.loading-thumb,
.loading-lines span {
  display: block;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}

.loading-thumb {
  height: 72px;
}

.loading-lines {
  display: grid;
  align-content: center;
  gap: 12px;
}

.loading-lines span {
  height: 14px;
}

.loading-lines span:last-child {
  width: 62%;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (max-width: 520px) {
  .loading-row {
    grid-template-columns: 54px 1fr;
  }

  .loading-thumb {
    height: 54px;
  }
}
</style>
