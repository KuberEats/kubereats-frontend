<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
}>(), {
  confirmLabel: '確認',
  cancelLabel: '取消',
  tone: 'primary',
  loading: false,
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog-backdrop"
      role="presentation"
      @click.self="$emit('cancel')"
    >
      <section
        class="dialog-panel"
        data-testid="confirm-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${title}-title`"
      >
        <h2 :id="`${title}-title`">
          {{ title }}
        </h2>
        <p>{{ message }}</p>

        <div class="dialog-actions">
          <button
            class="dialog-cancel"
            data-testid="confirm-dialog-cancel-button"
            type="button"
            :disabled="loading"
            @click="$emit('cancel')"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="dialog-confirm"
            :class="tone"
            data-testid="confirm-dialog-confirm-button"
            type="button"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? '處理中...' : confirmLabel }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 20px;
}

.dialog-panel {
  width: min(420px, 100%);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(17, 24, 39, 0.24);
  padding: 22px;
}

.dialog-panel h2 {
  color: #111827;
  font-size: 20px;
}

.dialog-panel p {
  margin-top: 10px;
  color: #4b5563;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.dialog-cancel,
.dialog-confirm {
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 800;
}

.dialog-cancel {
  background: #f3f4f6;
  color: #374151;
}

.dialog-confirm.primary {
  background: #f97316;
  color: #ffffff;
}

.dialog-confirm.danger {
  background: #dc2626;
  color: #ffffff;
}

@media (max-width: 520px) {
  .dialog-actions {
    flex-direction: column-reverse;
  }
}
</style>
