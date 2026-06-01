<script setup lang="ts">
import type { RouteName } from '../../router'

const props = defineProps<{
  activeRoute: RouteName
  userRole: string | null
}>()

defineEmits<{
  navigate: [path: string]
}>()

const employeeItems = [
  { label: '商家', path: '/merchants', routes: ['merchant-list', 'merchant-detail'] },
  { label: '訂單', path: '/orders', routes: ['order-history', 'order-detail', 'reservation-status'] },
  { label: '支出', path: '/staff/expenses', routes: ['staff-expenses'] },
]

function items() {
  if (props.userRole === 'merchant') {
    return [
      { label: '後台', path: '/merchant/dashboard', routes: ['merchant-dashboard'] },
      { label: '訂單', path: '/merchant/orders', routes: ['merchant-orders'] },
    ]
  }
  if (props.userRole === 'committee') {
    return [{ label: '審核', path: '/committee/review', routes: ['committee-review'] }]
  }
  return employeeItems
}
</script>

<template>
  <nav
    class="bottom-nav"
    aria-label="手機主要導覽"
  >
    <button
      v-for="item in items()"
      :key="item.path"
      type="button"
      :class="{ active: item.routes.includes(activeRoute) }"
      @click="$emit('navigate', item.path)"
    >
      {{ item.label }}
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
