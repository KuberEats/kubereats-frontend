import { computed, ref } from 'vue'

export type RouteName =
  | 'login'
  | 'merchant-apply'
  | 'merchant-dashboard'
  | 'merchant-orders'
  | 'merchant-finance'
  | 'committee-review'
  | 'profile-onboarding'
  | 'merchant-list'
  | 'merchant-detail'
  | 'checkout'
  | 'order-history'
  | 'order-detail'
  | 'reservation-status'
  | 'staff-expenses'

interface AppRoute {
  name: RouteName
  params: {
    merchantId?: number
    orderId?: number
    orderToken?: string
  }
}

function normalizePath(path: string) {
  const [routePath, query = ''] = path.split('?')
  const normalizedRoute = routePath.length > 1 && routePath.endsWith('/')
    ? routePath.slice(0, -1)
    : routePath
  if (query) {
    return `${normalizedRoute}?${query}`
  }
  return normalizedRoute
}

function routeOnly(path: string) {
  return path.split('?')[0]
}

function getHashPath() {
  if (window.location.hash === '#') {
    return '/'
  }
  if (!window.location.hash.startsWith('#/')) {
    return null
  }
  return window.location.hash.slice(1) || '/'
}

function getCurrentPath() {
  return normalizePath(getHashPath() ?? window.location.pathname)
}

function toHashUrl(path: string) {
  const normalizedPath = normalizePath(path)
  // GCS static website hosting cannot rewrite SPA routes to index.html with a 200.
  return normalizedPath === '/' ? '/#/' : `/#${normalizedPath}`
}

const currentPath = ref(getCurrentPath())

function replaceLegacyPathWithHashRoute() {
  if (window.location.pathname === '/' || getHashPath()) {
    return
  }

  window.history.replaceState({}, '', toHashUrl(window.location.pathname))
  currentPath.value = getCurrentPath()
}

function parseRoute(path: string): AppRoute {
  path = routeOnly(normalizePath(path))

  if (path === '/' || path === '/login') {
    return { name: 'login', params: {} }
  }

  // 你的路由
  if (path === '/merchant/apply') {
    return { name: 'merchant-apply', params: {} }
  }
  if (path === '/merchant/dashboard') {
    return { name: 'merchant-dashboard', params: {} }
  }
  if (path === '/merchant/orders') {
    return { name: 'merchant-orders', params: {} }
  }
  if (path === '/merchant/finance') {
    return { name: 'merchant-finance', params: {} }
  }
  if (path === '/committee/review') {
    return { name: 'committee-review', params: {} }
  }
  if (path === '/staff/expenses') {
    return { name: 'staff-expenses', params: {} }
  }
  if (path === '/profile/onboarding') {
    return { name: 'profile-onboarding', params: {} }
  }

  // 組員的路由
  const merchantDetailMatch = path.match(/^\/merchants\/(\d+)$/)
  if (merchantDetailMatch) {
    return {
      name: 'merchant-detail',
      params: { merchantId: Number(merchantDetailMatch[1]) },
    }
  }

  const orderDetailMatch = path.match(/^\/orders\/(\d+)$/)
  if (orderDetailMatch) {
    return {
      name: 'order-detail',
      params: { orderId: Number(orderDetailMatch[1]) },
    }
  }

  const reservationStatusMatch = path.match(/^\/reservation-status\/([^/]+)$/)
  if (reservationStatusMatch) {
    return {
      name: 'reservation-status',
      params: { orderToken: decodeURIComponent(reservationStatusMatch[1]) },
    }
  }

  if (path === '/merchants') {
    return { name: 'merchant-list', params: {} }
  }
  if (path === '/checkout') {
    return { name: 'checkout', params: {} }
  }
  if (path === '/orders') {
    return { name: 'order-history', params: {} }
  }

  // 預設回登入頁
  return { name: 'login', params: {} }
}

export const currentRoute = computed(() => parseRoute(currentPath.value))

export function navigateTo(path: string) {
  const normalizedPath = normalizePath(path)
  window.history.pushState({}, '', toHashUrl(normalizedPath))
  currentPath.value = normalizedPath
}

replaceLegacyPathWithHashRoute()

window.addEventListener('popstate', () => {
  currentPath.value = getCurrentPath()
})

window.addEventListener('hashchange', () => {
  currentPath.value = getCurrentPath()
})
