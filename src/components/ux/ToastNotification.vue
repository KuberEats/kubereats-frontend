<script setup lang="ts">
import { useI18n } from '../../i18n'

withDefaults(defineProps<{
  message: string
  tone?: 'success' | 'error' | 'info'
}>(), {
  tone: 'info',
})

const { t } = useI18n()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    class="toast"
    :class="`tone-${tone}`"
    role="status"
  >
    <span>{{ message }}</span>
    <button
      type="button"
      :aria-label="t('state.closeNotification')"
      @click="$emit('close')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  right: 18px;
  bottom: 88px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(420px, calc(100vw - 32px));
  border-radius: var(--radius-md);
  padding: 12px 14px;
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.18);
  font-weight: 700;
}

.toast button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 20px;
  line-height: 1;
}

.tone-success {
  background: #ecfdf5;
  color: #047857;
}

.tone-error {
  background: #fef2f2;
  color: #b91c1c;
}

.tone-info {
  background: #eff6ff;
  color: #1d4ed8;
}
</style>
