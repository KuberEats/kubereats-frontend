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
const helperText = computed(() => {
  if (props.action === 'approve') return '設定合作期間後，商家即可開始上架菜單與接單。'
  if (props.action === 'suspend') return '停權後商家暫時無法提供服務，原因會保留在審核紀錄。'
  return '拒絕後此申請不會進入合作商家清單。'
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
        <div class="dialog-header">
          <div>
            <p class="dialog-eyebrow">
              審核操作
            </p>
            <h2>{{ title }}</h2>
          </div>
          <button
            class="dialog-close"
            type="button"
            :disabled="loading"
            aria-label="關閉"
            @click="$emit('cancel')"
          >
            ×
          </button>
        </div>

        <div class="merchant-context">
          <span>商家</span>
          <strong>{{ merchant.merchantName }}</strong>
          <small>{{ merchant.campus }} / {{ merchant.category }}</small>
        </div>

        <p class="dialog-helper">
          {{ helperText }}
        </p>

        <div
          v-if="action === 'approve'"
          class="field-grid"
        >
          <label class="form-field">
            <span>合作開始日</span>
            <input
              v-model="startDate"
              type="date"
              required
            >
          </label>
          <label class="form-field">
            <span>合作結束日</span>
            <input
              v-model="endDate"
              type="date"
              required
            >
          </label>
        </div>

        <label
          v-else-if="action === 'suspend'"
          class="form-field reason-field"
        >
          <span>停權原因</span>
          <textarea
            v-model="reason"
            rows="4"
            required
            minlength="5"
            placeholder="例如：食品安全文件逾期未補、重大客訴待調查"
          />
        </label>

        <div
          v-else
          class="confirm-box"
        >
          確定要拒絕這筆商家申請嗎？
        </div>

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
  background: rgba(17, 24, 39, 0.52);
  padding: 20px;
}

.dialog-panel {
  display: grid;
  gap: 16px;
  width: min(500px, 100%);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(17, 24, 39, 0.26);
  padding: 22px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dialog-eyebrow {
  color: #c2410c;
  font-size: 12px;
  font-weight: 900;
}

.dialog-header h2 {
  margin-top: 4px;
  color: #111827;
  font-size: 24px;
  line-height: 1.2;
}

.dialog-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  font-size: 24px;
  line-height: 1;
}

.merchant-context {
  display: grid;
  gap: 3px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 12px 14px;
}

.merchant-context span,
.merchant-context small,
.dialog-helper {
  color: #6b7280;
}

.merchant-context span {
  font-size: 12px;
  font-weight: 800;
}

.merchant-context strong {
  color: #111827;
  font-size: 18px;
}

.merchant-context small,
.dialog-helper {
  font-size: 14px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-field {
  display: grid;
  gap: 7px;
  color: #374151;
  font-weight: 900;
}

.form-field input,
.form-field textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  padding: 11px 12px;
  font: inherit;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: #f97316;
  outline: 3px solid #fed7aa;
}

.reason-field textarea {
  resize: vertical;
}

.confirm-box {
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
  padding: 12px 14px;
  font-weight: 800;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.dialog-cancel,
.dialog-confirm {
  min-height: 42px;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 900;
}

.dialog-cancel {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
}

.dialog-confirm {
  border: 1px solid transparent;
  color: #ffffff;
}

.dialog-confirm.primary {
  background: #f97316;
}

.dialog-confirm.danger {
  background: #dc2626;
}

@media (max-width: 520px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
