<script setup lang="ts">
defineProps<{
  notes: string[]
  disabled?: boolean
}>()

defineEmits<{
  select: [note: string]
}>()
</script>

<template>
  <div
    v-if="notes.length"
    class="preset-notes"
  >
    <button
      v-for="note in notes"
      :key="note"
      type="button"
      :disabled="disabled"
      @click="$emit('select', note)"
    >
      {{ note }}
    </button>
  </div>
</template>

<style scoped>
.preset-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-notes button {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 800;
}

.preset-notes button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent-strong);
}
</style>
