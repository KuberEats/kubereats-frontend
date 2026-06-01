<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  actionLabel?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <section class="empty-state-panel">
    <div
      v-if="icon"
      class="empty-icon"
      aria-hidden="true"
    >
      {{ icon }}
    </div>
    <h2>{{ title }}</h2>
    <p v-if="description">
      {{ description }}
    </p>
    <button
      v-if="actionLabel"
      class="primary-button"
      type="button"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </section>
</template>

<style scoped>
.empty-state-panel {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 32px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-weight: 900;
}

.empty-state-panel p {
  color: var(--color-muted);
}
</style>
