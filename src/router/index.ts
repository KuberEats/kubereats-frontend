import { computed, ref } from 'vue'

export type RouteName =
  | 'login'
  | 'merchant-apply'
  | 'merchant-dashboard'
  | 'merchant-orders'
  | 'committee-review'

interface AppRoute {
  name: RouteName
  params: Record<string, unknown>
}

const currentPath = ref(window.location.pathname)

function parseRoute(path: string): AppRoute {
  if (path === '/merchant/apply') {
    return { name: 'merchant-apply', params: {} }
  }
  if (path === '/merchant/dashboard') {
    return { name: 'merchant-dashboard', params: {} }
  }
  if (path === '/merchant/orders') {
    return { name: 'merchant-orders', params: {} }
  }
  if (path === '/committee/review') {
    return { name: 'committee-review', params: {} }
  }
  return { name: 'login', params: {} }
}

export const currentRoute = computed(() => parseRoute(currentPath.value))

export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  currentPath.value = path
}

window.addEventListener('popstate', () => {
  currentPath.value = window.location.pathname
})
