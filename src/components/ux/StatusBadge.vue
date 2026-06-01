<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}>(), {
  tone: 'neutral',
})
</script>

<template>
  <span
    class="status-badge-ui"
    :class="`tone-${tone}`"
  >
    {{ label }}
  </span>
</template>

<style scoped>
.status-badge-ui {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.tone-success {
  background: #ecfdf5;
  color: #047857;
}

.tone-warning {
  background: #fff7ed;
  color: #c2410c;
}

.tone-danger {
  background: #fef2f2;
  color: #b91c1c;
}

.tone-neutral {
  background: #f3f4f6;
  color: #374151;
}
</style>
