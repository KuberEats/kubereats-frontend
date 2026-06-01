<script setup lang="ts">
import type { RouteName } from '../../router'
import AppHeader from './AppHeader.vue'
import BottomNav from './BottomNav.vue'

defineProps<{
  activeRoute: RouteName
  userRole: string | null
}>()

defineEmits<{
  navigate: [path: string]
  logout: []
}>()
</script>

<template>
  <div class="app-shell-layout">
    <AppHeader
      :active-route="activeRoute"
      :user-role="userRole"
      @navigate="$emit('navigate', $event)"
      @logout="$emit('logout')"
    />
    <main class="app-shell-main">
      <slot />
    </main>
    <BottomNav
      :active-route="activeRoute"
      :user-role="userRole"
      @navigate="$emit('navigate', $event)"
    />
  </div>
</template>

<style scoped>
.app-shell-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.app-shell-main {
  min-height: calc(100vh - 58px);
}

@media (max-width: 760px) {
  .app-shell-main {
    padding-bottom: 72px;
  }
}
</style>
