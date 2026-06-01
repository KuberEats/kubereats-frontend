import { computed, ref } from 'vue'

export interface CustomerProfile {
  displayName: string
  phone: string
  department: string
  dietaryRestrictions: string
  commonNotes: string[]
  onboardingCompleted: boolean
}

const DEFAULT_PROFILE: CustomerProfile = {
  displayName: '',
  phone: '',
  department: '',
  dietaryRestrictions: '',
  commonNotes: [],
  onboardingCompleted: false,
}

const profile = ref<CustomerProfile>({ ...DEFAULT_PROFILE })
const activeUserId = ref<number | null>(null)

function profileKey(userId: number) {
  return `kubereatsCustomerProfile:${userId}`
}

function normalizeProfile(value: Partial<CustomerProfile> | null | undefined): CustomerProfile {
  return {
    ...DEFAULT_PROFILE,
    ...value,
    commonNotes: Array.isArray(value?.commonNotes)
      ? value.commonNotes.filter(note => note.trim()).slice(0, 8)
      : [],
  }
}

export function readCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: number }
    return user.id || 0
  } catch {
    return 0
  }
}

export function hasCompletedCustomerProfile(userId: number) {
  if (!userId) return false

  try {
    const stored = localStorage.getItem(profileKey(userId))
    if (!stored) return false
    const parsed = JSON.parse(stored) as Partial<CustomerProfile>
    return Boolean(parsed.onboardingCompleted)
  } catch {
    return false
  }
}

export function useCustomerProfile() {
  const isComplete = computed(() => profile.value.onboardingCompleted)

  function load(userId = readCurrentUserId()) {
    activeUserId.value = userId || null
    if (!userId) {
      profile.value = { ...DEFAULT_PROFILE }
      return
    }

    try {
      profile.value = normalizeProfile(JSON.parse(localStorage.getItem(profileKey(userId)) || 'null'))
    } catch {
      profile.value = { ...DEFAULT_PROFILE }
    }
  }

  function save(nextProfile: CustomerProfile) {
    if (!activeUserId.value) {
      activeUserId.value = readCurrentUserId() || null
    }
    profile.value = normalizeProfile(nextProfile)
    if (activeUserId.value) {
      localStorage.setItem(profileKey(activeUserId.value), JSON.stringify(profile.value))
    }
  }

  function complete(nextProfile: CustomerProfile) {
    save({
      ...nextProfile,
      onboardingCompleted: true,
    })
  }

  return {
    isComplete,
    load,
    profile,
    save,
    complete,
  }
}
