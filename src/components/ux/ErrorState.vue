<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../i18n'

const props = withDefaults(defineProps<{
  title?: string
  message: string
  retryLabel?: string
  homeLabel?: string
  showHome?: boolean
}>(), {
  title: undefined,
  retryLabel: undefined,
  homeLabel: undefined,
  showHome: false,
})

const { t } = useI18n()
const resolvedTitle = computed(() => props.title || t('state.errorTitle'))
const resolvedRetryLabel = computed(() => props.retryLabel || t('state.retry'))
const resolvedHomeLabel = computed(() => props.homeLabel || t('state.home'))

defineEmits<{
  retry: []
  home: []
}>()
</script>

<template>
  <section
    class="error-state-panel"
    role="alert"
  >
    <div
      class="error-icon"
      aria-hidden="true"
    >
      !
    </div>
    <div>
      <h2>{{ resolvedTitle }}</h2>
      <p>{{ message }}</p>
    </div>
    <div class="error-actions">
      <button
        class="primary-button"
        type="button"
        @click="$emit('retry')"
      >
        {{ resolvedRetryLabel }}
      </button>
      <button
        v-if="showHome"
        class="ghost-button"
        type="button"
        @click="$emit('home')"
      >
        {{ resolvedHomeLabel }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.error-state-panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 28px 18px;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  background: #fef2f2;
  text-align: center;
}

.error-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 900;
}

.error-state-panel p {
  color: #7f1d1d;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
