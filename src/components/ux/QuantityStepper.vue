<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../i18n'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  disabled?: boolean
  label?: string
}>(), {
  min: 0,
  max: Number.POSITIVE_INFINITY,
  disabled: false,
  label: undefined,
})

const { t } = useI18n()
const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const resolvedLabel = computed(() => props.label || t('quantity.label'))
const canDecrease = computed(() => !props.disabled && props.modelValue > props.min)
const canIncrease = computed(() => !props.disabled && props.modelValue < props.max)

function update(value: number) {
  const nextValue = Math.min(props.max, Math.max(props.min, value))
  emit('update:modelValue', nextValue)
}
</script>

<template>
  <div
    class="quantity-stepper"
    :aria-label="resolvedLabel"
  >
    <button
      type="button"
      :aria-label="t('quantity.decrease', { label: resolvedLabel })"
      :disabled="!canDecrease"
      @click="update(modelValue - 1)"
    >
      -
    </button>
    <output aria-live="polite">{{ modelValue }}</output>
    <button
      type="button"
      :aria-label="t('quantity.increase', { label: resolvedLabel })"
      :disabled="!canIncrease"
      @click="update(modelValue + 1)"
    >
      +
    </button>
  </div>
</template>

<style scoped>
.quantity-stepper {
  display: inline-grid;
  grid-template-columns: 34px minmax(28px, auto) 34px;
  align-items: center;
  gap: 6px;
}

.quantity-stepper button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 800;
}

.quantity-stepper output {
  min-width: 28px;
  text-align: center;
  font-weight: 800;
}
</style>
