<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="page-heading">
    <div>
      <p
        v-if="eyebrow"
        class="eyebrow"
      >
        {{ eyebrow }}
      </p>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">
        {{ subtitle }}
      </p>
    </div>
    <div
      v-if="$slots.action"
      class="page-heading-action"
    >
      <slot name="action" />
    </div>
  </header>
</template>

<style scoped>
.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-heading p:last-child {
  margin-top: 6px;
  color: var(--color-muted);
}

.page-heading-action {
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
