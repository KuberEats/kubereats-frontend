<script setup lang="ts">
import type { RouteName } from '../../router'
import { useI18n, type MessageKey } from '../../i18n'

const props = defineProps<{
  activeRoute: RouteName
  userRole: string | null
}>()

defineEmits<{
  navigate: [path: string]
}>()

const { t } = useI18n()

const employeeItems = [
  { labelKey: 'app.nav.merchants', path: '/merchants', routes: ['merchant-list', 'merchant-detail'] },
  { labelKey: 'app.nav.orders', path: '/orders', routes: ['order-history', 'order-detail', 'reservation-status'] },
  { labelKey: 'app.nav.expenses', path: '/staff/expenses', routes: ['staff-expenses'] },
] satisfies { labelKey: MessageKey; path: string; routes: RouteName[] }[]

const merchantItems = [
  { labelKey: 'app.nav.merchantDashboard', path: '/merchant/dashboard', routes: ['merchant-dashboard'] },
  { labelKey: 'app.nav.todayOrders', path: '/merchant/orders', routes: ['merchant-orders'] },
] satisfies { labelKey: MessageKey; path: string; routes: RouteName[] }[]

const committeeItems = [
  { labelKey: 'app.nav.review', path: '/committee/review', routes: ['committee-review'] },
] satisfies { labelKey: MessageKey; path: string; routes: RouteName[] }[]

function items(): { labelKey: MessageKey; path: string; routes: RouteName[] }[] {
  if (props.userRole === 'merchant') return merchantItems
  if (props.userRole === 'committee') return committeeItems
  return employeeItems
}
</script>

<template>
  <nav
    class="bottom-nav"
    :aria-label="t('app.mobileNav')"
  >
    <button
      v-for="item in items()"
      :key="item.path"
      type="button"
      :class="{ active: item.routes.includes(activeRoute) }"
      @click="$emit('navigate', item.path)"
    >
      {{ t(item.labelKey) }}
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: none;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.98);
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
}

.bottom-nav button {
  min-height: 42px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.bottom-nav button.active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

@media (max-width: 760px) {
  .bottom-nav {
    display: grid;
  }
}
</style>
