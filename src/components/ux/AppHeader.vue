<script setup lang="ts">
import type { RouteName } from '../../router'

defineProps<{
  activeRoute: RouteName
  userRole: string | null
}>()

defineEmits<{
  navigate: [path: string]
  logout: []
}>()

function isActive(activeRoute: RouteName, routes: RouteName[]) {
  return routes.includes(activeRoute)
}
</script>

<template>
  <header class="app-header">
    <button
      class="brand-button"
      type="button"
      aria-label="回到首頁"
      @click="$emit('navigate', '/merchants')"
    >
      KuberEats
    </button>

    <nav
      class="desktop-nav"
      aria-label="主要導覽"
    >
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: isActive(activeRoute, ['merchant-list', 'merchant-detail']) }"
        @click="$emit('navigate', '/merchants')"
      >
        商家
      </button>
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: isActive(activeRoute, ['order-history', 'order-detail', 'reservation-status']) }"
        @click="$emit('navigate', '/orders')"
      >
        訂單
      </button>
      <button
        v-if="userRole === 'employee'"
        type="button"
        :class="{ active: activeRoute === 'staff-expenses' }"
        @click="$emit('navigate', '/staff/expenses')"
      >
        支出
      </button>
      <button
        v-if="userRole === 'merchant'"
        type="button"
        :class="{ active: activeRoute === 'merchant-dashboard' }"
        @click="$emit('navigate', '/merchant/dashboard')"
      >
        商家後台
      </button>
      <button
        v-if="userRole === 'merchant'"
        type="button"
        :class="{ active: activeRoute === 'merchant-orders' }"
        @click="$emit('navigate', '/merchant/orders')"
      >
        今日訂單
      </button>
      <button
        v-if="userRole === 'committee'"
        type="button"
        :class="{ active: activeRoute === 'committee-review' }"
        @click="$emit('navigate', '/committee/review')"
      >
        商家審核
      </button>
    </nav>

    <button
      class="logout-button"
      type="button"
      @click="$emit('logout')"
    >
      登出
    </button>
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

@media (max-width: 760px) {
  .app-header {
    padding: 12px 16px;
  }

  .desktop-nav {
    display: none;
  }
}
</style>
