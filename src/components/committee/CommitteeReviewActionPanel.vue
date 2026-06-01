<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { MerchantInfo } from '../../api/types'

const props = defineProps<{
  merchant: MerchantInfo | null
  action: 'approve' | 'reject' | 'suspend' | null
  loading?: boolean
}>()

const emit = defineEmits<{
  approve: [payload: { cooperationStartDate: string; cooperationEndDate: string }]
  reject: []
  suspend: [reason: string]
  cancel: []
}>()

const startDate = shallowRef('')
const endDate = shallowRef('')
const reason = shallowRef('')

const title = computed(() => {
  if (props.action === 'approve') return '通過商家申請'
  if (props.action === 'suspend') return '停權商家'
  return '拒絕商家申請'
})

const canSubmit = computed(() => {
  if (props.action === 'approve') return Boolean(startDate.value && endDate.value)
  if (props.action === 'suspend') return reason.value.trim().length >= 5
  return true
})

watch(
  () => props.merchant,
  merchant => {
    const today = new Date()
    const nextYear = new Date(today)
    nextYear.setFullYear(today.getFullYear() + 1)
    startDate.value = merchant?.cooperationStartDate ?? today.toISOString().slice(0, 10)
    endDate.value = merchant?.cooperationEndDate ?? nextYear.toISOString().slice(0, 10)
    reason.value = ''
  },
)

function submit() {
  if (!canSubmit.value || !props.action) return
  if (props.action === 'approve') {
    emit('approve', {
      cooperationStartDate: startDate.value,
      cooperationEndDate: endDate.value,
    })
    return
  }
  if (props.action === 'suspend') {
    emit('suspend', reason.value.trim())
    return
  }
  emit('reject')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="merchant && action"
      class="dialog-backdrop"
      role="presentation"
      @click.self="$emit('cancel')"
    >
      <form
        class="dialog-panel"
        data-testid="committee-review-action-panel"
        role="dialog"
        aria-modal="true"
        @submit.prevent="submit"
      >
        <h2>{{ title }}</h2>
        <p>商家：{{ merchant.merchantName }}</p>

        <div
          v-if="action === 'approve'"
          class="field-grid"
        >
          <label>
            合作開始日
            <input
              v-model="startDate"
              type="date"
              required
            >
          </label>
          <label>
            合作結束日
            <input
              v-model="endDate"
              type="date"
              required
            >
          </label>
        </div>

        <label
          v-else-if="action === 'suspend'"
          class="reason-field"
        >
          停權原因
          <textarea
            v-model="reason"
            rows="4"
            required
            minlength="5"
            placeholder="例如：食品安全文件逾期未補、重大客訴待調查"
          />
        </label>

        <p v-else>
          確定要拒絕這筆商家申請嗎？
        </p>

        <div class="dialog-actions">
          <button
            class="dialog-cancel"
            type="button"
            :disabled="loading"
            @click="$emit('cancel')"
          >
            取消
          </button>
          <button
            class="dialog-confirm"
            :class="action === 'approve' ? 'primary' : 'danger'"
            type="submit"
            :disabled="loading || !canSubmit"
          >
            {{ loading ? '處理中...' : title.replace('商家', '') }}
          </button>
        </div>
      </form>
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
  width: min(460px, 100%);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(17, 24, 39, 0.24);
  display: grid;
  gap: 14px;
  padding: 22px;
}

.dialog-panel h2,
.dialog-panel p {
  margin: 0;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field-grid label,
.reason-field {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 800;
}

.field-grid input,
.reason-field textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px;
  font: inherit;
}

.reason-field textarea {
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  .field-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }
}
</style>
