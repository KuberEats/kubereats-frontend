<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { CustomerProfile } from '../../composables/useCustomerProfile'
import FormField from '../ux/FormField.vue'

const props = defineProps<{
  profile: CustomerProfile
  submitLabel: string
}>()

const emit = defineEmits<{
  submit: [profile: CustomerProfile]
}>()

const form = reactive({
  displayName: props.profile.displayName,
  phone: props.profile.phone,
  department: props.profile.department,
  dietaryRestrictions: props.profile.dietaryRestrictions,
  commonNotesText: props.profile.commonNotes.join('\n'),
})

watch(
  () => props.profile,
  nextProfile => {
    form.displayName = nextProfile.displayName
    form.phone = nextProfile.phone
    form.department = nextProfile.department
    form.dietaryRestrictions = nextProfile.dietaryRestrictions
    form.commonNotesText = nextProfile.commonNotes.join('\n')
  },
)

const normalizedNotes = computed(() =>
  form.commonNotesText
    .split('\n')
    .map(note => note.trim())
    .filter(Boolean)
    .slice(0, 8),
)

const canSubmit = computed(() =>
  form.displayName.trim().length > 0 &&
  form.phone.trim().length > 0,
)

function handleSubmit() {
  if (!canSubmit.value) return

  emit('submit', {
    displayName: form.displayName.trim(),
    phone: form.phone.trim(),
    department: form.department.trim(),
    dietaryRestrictions: form.dietaryRestrictions.trim(),
    commonNotes: normalizedNotes.value,
    onboardingCompleted: true,
  })
}
</script>

<template>
  <form
    class="profile-form"
    @submit.prevent="handleSubmit"
  >
    <div class="profile-grid">
      <FormField label="姓名">
        <input
          v-model="form.displayName"
          autocomplete="name"
          required
          placeholder="例如：王小明"
        >
      </FormField>

      <FormField label="電話">
        <input
          v-model="form.phone"
          autocomplete="tel"
          required
          placeholder="例如：0912345678"
        >
      </FormField>
    </div>

    <FormField label="部門 / 工號">
      <input
        v-model="form.department"
        placeholder="例如：A 廠製程部"
      >
    </FormField>

    <FormField label="飲食禁忌">
      <textarea
        v-model="form.dietaryRestrictions"
        rows="3"
        placeholder="例如：不吃牛、花生過敏、避免辛辣"
      />
    </FormField>

    <FormField label="常用備註">
      <textarea
        v-model="form.commonNotesText"
        rows="5"
        placeholder="每行一則，例如：&#10;少飯&#10;不要香菜&#10;餐點分開裝"
      />
    </FormField>

    <div
      v-if="normalizedNotes.length"
      class="note-preview"
    >
      <span
        v-for="note in normalizedNotes"
        :key="note"
      >
        {{ note }}
      </span>
    </div>

    <button
      class="primary-button full-width"
      type="submit"
      :disabled="!canSubmit"
    >
      {{ submitLabel }}
    </button>
  </form>
</template>

<style scoped>
.profile-form {
  display: grid;
  gap: 16px;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.note-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.note-preview span {
  border-radius: var(--radius-sm);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 620px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
