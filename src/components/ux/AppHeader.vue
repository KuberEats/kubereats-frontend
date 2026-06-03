<script setup lang="ts">
import type { RouteName } from '../../router'
import { useI18n, type Locale } from '../../i18n'

const props = defineProps<{
  activeRoute: RouteName
  userRole: string | null
}>()

defineEmits<{
  navigate: [path: string]
  logout: []
}>()

const { locale, setLocale, t } = useI18n()

function isActive(activeRoute: RouteName, routes: RouteName[]) {
  return routes.includes(activeRoute)
}

function homePath() {
  if (props.userRole === 'merchant') return '/merchant/dashboard'
  if (props.userRole === 'committee') return '/committee/review'
  return '/merchants'
}

function handleLocaleChange(event: Event) {
  const nextLocale = (event.target as HTMLSelectElement).value as Locale
  setLocale(nextLocale)
}
</script>

<template>
  <header class="app-header">
    <button
      class="brand-button"
      type="button"
      :aria-label="t('app.home')"
      @click="$emit('navigate', homePath())"
    >
      {{ t('app.brand') }}
    </button>

    <nav
      class="desktop-nav"
      :aria-label="t('app.primaryNav')"
    >
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: isActive(activeRoute, ['merchant-list', 'merchant-detail']) }"
        @click="$emit('navigate', '/merchants')"
      >
        {{ t('app.nav.merchants') }}
      </button>
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: isActive(activeRoute, ['order-history', 'order-detail', 'reservation-status']) }"
        @click="$emit('navigate', '/orders')"
      >
        {{ t('app.nav.orders') }}
      </button>
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: activeRoute === 'staff-expenses' }"
        @click="$emit('navigate', '/staff/expenses')"
      >
        {{ t('app.nav.expenses') }}
      </button>
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: activeRoute === 'profile-onboarding' }"
        @click="$emit('navigate', '/profile/onboarding')"
      >
        {{ t('app.nav.profile') }}
      </button>
      <button
        v-if="userRole === 'merchant'"
        type="button"
        :class="{ active: activeRoute === 'merchant-dashboard' }"
        @click="$emit('navigate', '/merchant/dashboard')"
      >
        {{ t('app.nav.merchantDashboard') }}
      </button>
      <button
        v-if="userRole === 'merchant'"
        type="button"
        :class="{ active: activeRoute === 'merchant-orders' }"
        @click="$emit('navigate', '/merchant/orders')"
      >
        {{ t('app.nav.todayOrders') }}
      </button>
      <button
        v-if="userRole === 'committee'"
        type="button"
        :class="{ active: activeRoute === 'committee-review' }"
        @click="$emit('navigate', '/committee/review')"
      >
        {{ t('app.nav.review') }}
      </button>
    </nav>

    <div class="header-actions">
      <label class="language-select">
        <span class="sr-only">{{ t('app.language') }}</span>
        <select
          :value="locale"
          :aria-label="t('app.language')"
          @change="handleLocaleChange"
        >
          <option value="zh-TW">
            中文
          </option>
          <option value="en">
            English
          </option>
        </select>
      </label>

      <button
        class="logout-button"
        type="button"
        @click="$emit('logout')"
      >
        {{ t('app.logout') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.96);
  padding: 12px 24px;
  backdrop-filter: blur(10px);
}

.brand-button,
.desktop-nav button,
.logout-button {
  border: 0;
  background: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-button {
  color: var(--color-accent-strong);
  font-size: 20px;
  font-weight: 900;
}

.desktop-nav {
  display: flex;
  gap: 8px;
}

.desktop-nav button,
.logout-button {
  border-radius: 999px;
  padding: 8px 12px;
  color: var(--color-muted);
  font-weight: 800;
}

.desktop-nav button.active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.logout-button {
  color: #b91c1c;
}

.language-select select {
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 6px 10px;
  font-weight: 800;
}

@media (max-width: 760px) {
  .app-header {
    padding: 12px 16px;
  }

  .desktop-nav {
    display: none;
  }
}
</style>
