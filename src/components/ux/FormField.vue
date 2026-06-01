<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
  error?: string
  required?: boolean
}>()
</script>

<template>
  <label class="form-field">
    <span>
      {{ label }}
      <strong v-if="required">*</strong>
    </span>
    <slot />
    <small v-if="hint">{{ hint }}</small>
    <small
      v-if="error"
      class="field-error"
      role="alert"
    >
      {{ error }}
    </small>
  </label>
</template>

<style>
.form-field {
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 9px 12px;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  border-color: var(--color-accent);
  outline: 3px solid var(--color-accent-soft);
}

.form-field strong,
.field-error {
  color: #b91c1c;
}

.form-field small {
  color: var(--color-muted);
  font-weight: 500;
}
</style>
